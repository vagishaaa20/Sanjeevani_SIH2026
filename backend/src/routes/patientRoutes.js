const express = require('express');
const router = express.Router();

router.get('/me', (req, res) => res.json({ message: 'Patient profile data placeholder' }));

module.exports = router;
