const { User } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOtp, getOtpExpiry, isOtpValid } = require('../utils/otp');

const pendingOtps = new Map();

function tokensFor(user) {
  const payload = { id: user.id, role: user.role };
  return { accessToken: generateAccessToken(payload), refreshToken: generateRefreshToken(payload) };
}

async function register(req, res) {
  const { email, phone, password, role } = req.body;
  if ((!email && !phone) || !password) return res.status(400).json({ error: 'Email or phone and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const user = await User.create({ email, phone, passwordHash: await hashPassword(password), role });
  const otp = generateOtp();
  pendingOtps.set(String(user.id), { otp, expiresAt: getOtpExpiry() });
  return res.status(201).json({ user: { id: user.id, email: user.email, phone: user.phone, role: user.role }, message: 'Registration successful; verification is required' });
}

async function login(req, res) {
  const { email, phone, password } = req.body;
  const user = await User.findOne({ where: email ? { email } : { phone } });
  if (!user || !(await comparePassword(password || '', user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  return res.json({ user: { id: user.id, email: user.email, phone: user.phone, role: user.role }, ...tokensFor(user) });
}

function refreshToken(req, res) {
  const token = req.body && req.body.refreshToken;
  if (!token) return res.status(401).json({ error: 'Refresh token is required' });
  try {
    const payload = verifyRefreshToken(token);
    return res.json({ accessToken: generateAccessToken({ id: payload.id, role: payload.role }) });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
}

function logout(req, res) {
  return res.status(204).send();
}

async function verifyOtp(req, res) {
  const entry = pendingOtps.get(String(req.body.userId));
  if (!entry || !isOtpValid(req.body.otp, entry.otp, entry.expiresAt)) return res.status(400).json({ error: 'Invalid or expired OTP' });
  const user = await User.findByPk(req.body.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  await user.update({ isVerified: true });
  pendingOtps.delete(String(user.id));
  return res.json({ message: 'OTP verified successfully' });
}

module.exports = { register, login, refreshToken, logout, verifyOtp };