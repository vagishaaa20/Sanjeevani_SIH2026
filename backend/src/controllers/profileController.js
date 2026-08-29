const { User, PatientProfile, DoctorProfile, ReviewerProfile, AdminProfile } = require('../models');
const { ROLES, PATIENT_STATUS } = require('../config/roles');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns the role-specific profile for a user.
 * Returns null if no profile exists yet.
 */
async function fetchProfile(user) {
  switch (user.role) {
    case ROLES.PATIENT:
      return PatientProfile.findOne({ where: { userId: user.id } });
    case ROLES.DOCTOR:
      return DoctorProfile.findOne({ where: { userId: user.id } });
    case ROLES.HITL_REVIEWER:
      return ReviewerProfile.findOne({ where: { userId: user.id } });
    case ROLES.ADMIN:
      return AdminProfile.findOne({ where: { userId: user.id } });
    default:
      return null;
  }
}

/**
 * Derives the patient's accountStatus based on how many health-profile fields
 * are filled. Updates the DB record if the status has changed.
 */
async function refreshPatientStatus(profile) {
  const healthFieldsFilled =
    (profile.medicalConditions && profile.medicalConditions.length > 0) ||
    (profile.allergies && profile.allergies.length > 0) ||
    (profile.currentMedications && profile.currentMedications.length > 0) ||
    profile.pastMedicalHistory ||
    profile.familyMedicalHistory ||
    (profile.lifestyle && Object.keys(profile.lifestyle).length > 0) ||
    profile.emergencyContact;

  const newStatus = healthFieldsFilled ? PATIENT_STATUS.PROFILE_COMPLETE : PATIENT_STATUS.PROFILE_INCOMPLETE;

  if (profile.accountStatus !== newStatus) {
    await profile.update({ accountStatus: newStatus });
  }
  return profile;
}

// ── GET /api/profile/me ───────────────────────────────────────────────────────

/**
 * Returns the authenticated user's base record + role-specific profile.
 * Does NOT expose passwordHash or internal storageKeys.
 */
async function getMyProfile(req, res) {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'email', 'phone', 'role', 'isVerified', 'createdAt'],
  });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const profile = await fetchProfile(user);
  return res.json({ user, profile: profile || null });
}

// ── PATCH /api/profile/patient ────────────────────────────────────────────────

/**
 * Update the authenticated patient's profile.
 * Accepted fields:
 *   Basic:  fullName, dateOfBirth, sex, preferredLanguage, region
 *   ABHA:   abhaNumber, abhaLinked, abhaConsentStatus
 *   Health: medicalConditions, allergies, currentMedications,
 *           pastMedicalHistory, familyMedicalHistory, lifestyle, emergencyContact
 */
async function updatePatientProfile(req, res) {
  if (req.user.role !== ROLES.PATIENT)
    return res.status(403).json({ error: 'Only patient accounts can update the patient profile' });

  const ALLOWED = [
    'fullName', 'dateOfBirth', 'sex', 'preferredLanguage', 'region', 'bloodGroup',
    'abhaNumber', 'abhaLinked', 'abhaConsentStatus',
    'medicalConditions', 'allergies', 'currentMedications',
    'pastMedicalHistory', 'familyMedicalHistory', 'lifestyle', 'emergencyContact',
  ];

  const updates = {};
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: 'No valid fields provided for update' });

  let profile = await PatientProfile.findOne({ where: { userId: req.user.id } });
  if (!profile) {
    profile = await PatientProfile.create({
      userId: req.user.id,
      ...updates,
      accountStatus: PATIENT_STATUS.PROFILE_COMPLETE,
    });
  } else {
    await profile.update(updates);
    profile = await refreshPatientStatus(profile);
  }

  return res.json({ message: 'Profile updated successfully', profile });
}

// ── PATCH /api/profile/doctor ─────────────────────────────────────────────────

/**
 * Update the authenticated doctor's professional profile.
 * Accepted fields cover the professional info section from the schema.
 * Verification-related fields (verificationStatus, verifiedBy, etc.) are
 * NOT updatable here — those are admin-only via PATCH /api/admin/verify/:userId.
 */
async function updateDoctorProfile(req, res) {
  if (req.user.role !== ROLES.DOCTOR)
    return res.status(403).json({ error: 'Only doctor accounts can update the doctor profile' });

  const ALLOWED = [
    'fullName', 'city',
    'medicalRegistrationNumber', 'stateMedicalCouncil', 'registrationDate',
    'primaryMedicalQualification', 'medicalCollege', 'graduationYear',
    'specialization', 'subSpecialization', 'yearsOfExperience', 'consultationFee',
    'languages', 'regionsServed', 'clinicOrHospital', 'bio', 'availability',
  ];

  const updates = {};
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: 'No valid fields provided for update' });

  const profile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

  await profile.update(updates);
  return res.json({ message: 'Profile updated', profile });
}

// ── PATCH /api/profile/reviewer ───────────────────────────────────────────────

/**
 * Update the authenticated HITL reviewer's professional profile.
 * Scope and supervision fields are NOT self-updatable; admin sets those on verification.
 */
async function updateReviewerProfile(req, res) {
  if (req.user.role !== ROLES.HITL_REVIEWER)
    return res.status(403).json({ error: 'Only HITL reviewer accounts can update the reviewer profile' });

  const ALLOWED = [
    'fullName', 'city', 'professionalCategory',
    'medicalRegistrationNumber', 'stateMedicalCouncil', 'registrationDate',
    'primaryQualification', 'medicalCollege', 'specialization',
    'institution', 'pgSpecialization', 'pgYear', 'supervisingInstitution',
    'internshipStart', 'internshipEnd',
  ];

  const updates = {};
  for (const key of ALLOWED) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0)
    return res.status(400).json({ error: 'No valid fields provided for update' });

  const profile = await ReviewerProfile.findOne({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ error: 'Reviewer profile not found' });

  await profile.update(updates);
  return res.json({ message: 'Profile updated', profile });
}

/**
 * Developer helper to auto-verify a doctor's account in dev/local environments.
 * Sets verificationStatus to VERIFIED and user.isVerified to true.
 */
async function devVerifyDoctor(req, res) {
  if (req.user.role !== ROLES.DOCTOR) {
    return res.status(403).json({ error: 'Only doctor accounts can request dev-verification' });
  }

  const t = await User.sequelize.transaction();
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isVerified = true;
    await user.save({ transaction: t });

    const profile = await DoctorProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Doctor profile not found' });

    profile.verificationStatus = 'VERIFIED';
    await profile.save({ transaction: t });

    await t.commit();
    return res.json({ message: 'Doctor profile auto-verified successfully in development mode.', profile });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({ error: err.message || 'Auto-verification failed' });
  }
}

module.exports = { getMyProfile, updatePatientProfile, updateDoctorProfile, updateReviewerProfile, devVerifyDoctor };
