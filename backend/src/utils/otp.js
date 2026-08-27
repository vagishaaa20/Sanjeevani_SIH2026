const crypto = require('crypto');

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
const getOtpExpiry = (minutes = 5) => new Date(Date.now() + minutes * 60 * 1000);
const isOtpValid = (otp, expectedOtp, expiresAt) => Boolean(otp && expectedOtp && otp === expectedOtp && expiresAt && Date.now() < new Date(expiresAt).getTime());

module.exports = { generateOtp, getOtpExpiry, isOtpValid };