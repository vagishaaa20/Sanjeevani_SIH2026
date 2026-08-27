const bcrypt = require('bcryptjs');

const hashPassword = (password) => bcrypt.hash(password, 12);
const comparePassword = (password, passwordHash) => bcrypt.compare(password, passwordHash);

module.exports = { hashPassword, comparePassword };