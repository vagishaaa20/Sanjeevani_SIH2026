const express = require('express');
const controller = require('../controllers/authController');

const router = express.Router();
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', controller.logout);
router.post('/verify-otp', controller.verifyOtp);

module.exports = router;