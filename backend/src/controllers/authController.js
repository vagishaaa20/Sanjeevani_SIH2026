const sequelize = require('../config/db');
const { User, PatientProfile, DoctorProfile, ReviewerProfile } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOtp, getOtpExpiry, isOtpValid } = require('../utils/otp');
const { ROLES, PATIENT_STATUS, VERIFICATION_STATUS } = require('../config/roles');

/**
 * In-memory OTP store — good enough for dev/MVP.
 * Replace with Redis or a DB table for production.
 * Map key: String(userId)  →  { otp, expiresAt }
 */
const pendingOtps = new Map();

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokensFor(user) {
  const payload = { id: user.id, role: user.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

function safeUser(user) {
  return { id: user.id, email: user.email, phone: user.phone, role: user.role, isVerified: user.isVerified };
}

// ── Patient registration ──────────────────────────────────────────────────────

/**
 * POST /api/auth/register/patient
 * Body: { phone*, fullName*, dateOfBirth*, sex*, preferredLanguage, region, abhaNumber }
 *
 * Patient auth is phone → OTP (no password per schema).
 * We store a random placeholder hash so the DB NOT NULL constraint is satisfied,
 * and the isVerified flag is set to true only after OTP confirmation.
 */
async function registerPatient(req, res) {
  const { phone, fullName, dateOfBirth, sex, preferredLanguage, region, abhaNumber } = req.body;

  if (!phone) return res.status(400).json({ error: 'Phone number is required for patient registration' });
  if (!fullName || !dateOfBirth || !sex)
    return res.status(400).json({ error: 'fullName, dateOfBirth, and sex are required' });

  const t = await sequelize.transaction();
  try {
    // Placeholder hash — patient accounts are not password-protected; login uses OTP.
    const placeholderHash = await hashPassword(`__otp_only_${phone}_${Date.now()}`);

    const user = await User.create(
      { phone, passwordHash: placeholderHash, role: ROLES.PATIENT, isVerified: false },
      { transaction: t }
    );

    await PatientProfile.create(
      {
        userId: user.id,
        fullName,
        dateOfBirth,
        sex,
        preferredLanguage: preferredLanguage || null,
        region: region || null,
        abhaNumber: abhaNumber || null,
        accountStatus: PATIENT_STATUS.REGISTERED,
      },
      { transaction: t }
    );

    await t.commit();

    const otp = generateOtp();
    pendingOtps.set(String(user.id), { otp, expiresAt: getOtpExpiry() });

    // In development, return the OTP in the response for easy testing.
    // Remove the `otp` field before going to production and integrate an SMS provider.
    const response = {
      message: 'Patient registered. Verify your phone with the OTP to activate your account.',
      user: safeUser(user),
    };
    if (process.env.NODE_ENV !== 'production') response.devOtp = otp;

    return res.status(201).json(response);
  } catch (err) {
    await t.rollback();
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'A user with this phone number already exists' });
    throw err;
  }
}

// ── Doctor registration ───────────────────────────────────────────────────────

/**
 * POST /api/auth/register/doctor
 * Body: { fullName*, email*, phone, password*, city }
 *
 * Doctor signup is email + password. Account is created with
 * verificationStatus = PENDING_VERIFICATION. Actual verification
 * happens through the admin panel after document submission.
 */
async function registerDoctor(req, res) {
  const { fullName, email, phone, password, city, specialization, subSpecialization, yearsOfExperience, clinicOrHospital } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (!fullName) return res.status(400).json({ error: 'fullName is required' });
  if (!city) return res.status(400).json({ error: 'city/region is required for doctor registration' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const t = await sequelize.transaction();
  try {
    const user = await User.create(
      { email, phone: phone || null, passwordHash: await hashPassword(password), role: ROLES.DOCTOR, isVerified: false },
      { transaction: t }
    );

    await DoctorProfile.create(
      {
        userId: user.id,
        fullName,
        city: city || null,
        specialization: specialization || 'General Physician',
        subSpecialization: subSpecialization || null,
        yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience, 10) : 1,
        clinicOrHospital: clinicOrHospital || null,
        verificationStatus: VERIFICATION_STATUS.PENDING_VERIFICATION,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      message:
        'Doctor account created. Your account is pending verification. Submit your professional documents to proceed.',
      user: safeUser(user),
      verificationStatus: VERIFICATION_STATUS.PENDING_VERIFICATION,
    });
  } catch (err) {
    await t.rollback();
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'A user with this email or phone already exists' });
    throw err;
  }
}

// ── HITL Reviewer registration ────────────────────────────────────────────────

/**
 * POST /api/auth/register/hitl
 * Body: { fullName*, email*, phone, password*, city, professionalCategory }
 *
 * Same flow as doctor — email + password, pending verification.
 * professionalCategory is set here if known; can be updated via PATCH /profile/reviewer.
 */
async function registerHitl(req, res) {
  const { fullName, email, phone, password, city, professionalCategory } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (!fullName) return res.status(400).json({ error: 'fullName is required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const t = await sequelize.transaction();
  try {
    const user = await User.create(
      {
        email,
        phone: phone || null,
        passwordHash: await hashPassword(password),
        role: ROLES.HITL_REVIEWER,
        isVerified: false,
      },
      { transaction: t }
    );

    await ReviewerProfile.create(
      {
        userId: user.id,
        fullName,
        city: city || null,
        professionalCategory: professionalCategory || null,
        verificationStatus: VERIFICATION_STATUS.PENDING_VERIFICATION,
        supervisionRequired: true, // conservative default; admin adjusts on verification
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      message:
        'HITL Reviewer account created. Your account is pending verification. Submit your professional documents to proceed.',
      user: safeUser(user),
      verificationStatus: VERIFICATION_STATUS.PENDING_VERIFICATION,
    });
  } catch (err) {
    await t.rollback();
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'A user with this email or phone already exists' });
    throw err;
  }
}

// ── Login (all roles) ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Body: { email | phone, password }
 *
 * Works for doctor, hitl_reviewer, and admin accounts.
 * Patients use OTP-based login (see sendOtp + verifyOtp).
 */
async function login(req, res) {
  const { email, phone, password } = req.body;
  if (!email && !phone) return res.status(400).json({ error: 'Email or phone is required' });

  const user = await User.findOne({ where: email ? { email } : { phone } });
  if (!user || !(await comparePassword(password || '', user.passwordHash)))
    return res.status(401).json({ error: 'Invalid credentials' });

  return res.json({ user: safeUser(user), ...tokensFor(user) });
}

// ── Patient OTP login ─────────────────────────────────────────────────────────

/**
 * POST /api/auth/otp/send
 * Body: { phone* }
 *
 * Generates a new OTP for an existing verified patient or for one mid-registration.
 */
async function sendOtp(req, res) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required' });

  const user = await User.findOne({ where: { phone } });
  if (!user) return res.status(404).json({ error: 'No account found with this phone number' });
  if (user.role !== ROLES.PATIENT)
    return res.status(400).json({ error: 'OTP login is only available for patient accounts' });

  const otp = generateOtp();
  pendingOtps.set(String(user.id), { otp, expiresAt: getOtpExpiry() });

  // Production: send via SMS provider. Dev: return in response.
  const response = { message: 'OTP sent to your registered phone number', userId: user.id };
  if (process.env.NODE_ENV !== 'production') response.devOtp = otp;

  return res.json(response);
}

/**
 * POST /api/auth/otp/verify
 * Body: { userId*, otp* }
 *
 * Verifies the OTP, marks user as verified, returns JWT tokens.
 */
async function verifyOtp(req, res) {
  const { userId, otp } = req.body;
  if (!userId || !otp) return res.status(400).json({ error: 'userId and otp are required' });

  const entry = pendingOtps.get(String(userId));
  if (!entry || !isOtpValid(otp, entry.otp, entry.expiresAt))
    return res.status(400).json({ error: 'Invalid or expired OTP' });

  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  await user.update({ isVerified: true });
  pendingOtps.delete(String(user.id));

  return res.json({ message: 'OTP verified successfully', user: safeUser(user), ...tokensFor(user) });
}

// ── Token refresh ─────────────────────────────────────────────────────────────

function refreshToken(req, res) {
  const token = req.body && req.body.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token is required' });
  try {
    const payload = verifyRefreshToken(token);
    return res.json({ accessToken: generateAccessToken({ id: payload.id, role: payload.role }) });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────

function logout(req, res) {
  // Stateless JWT: client discards tokens.
  // If you add a token blocklist (Redis), invalidate here.
  return res.status(204).send();
}

module.exports = {
  registerPatient,
  registerDoctor,
  registerHitl,
  login,
  sendOtp,
  verifyOtp,
  refreshToken,
  logout,
};