const jwt = require('jsonwebtoken');
const env = require('../config/env');

function requireSecret(secret, name) {
  if (!secret) throw new Error(`${name} is not configured`);
  return secret;
}

const generateAccessToken = (payload) => jwt.sign(payload, requireSecret(env.jwt.accessSecret, 'JWT_ACCESS_SECRET'), { expiresIn: env.jwt.accessExpiresIn });
const generateRefreshToken = (payload) => jwt.sign(payload, requireSecret(env.jwt.refreshSecret, 'JWT_REFRESH_SECRET'), { expiresIn: env.jwt.refreshExpiresIn });
const verifyAccessToken = (token) => jwt.verify(token, requireSecret(env.jwt.accessSecret, 'JWT_ACCESS_SECRET'));
const verifyRefreshToken = (token) => jwt.verify(token, requireSecret(env.jwt.refreshSecret, 'JWT_REFRESH_SECRET'));

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };