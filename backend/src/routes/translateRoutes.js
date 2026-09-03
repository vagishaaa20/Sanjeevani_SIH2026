const express = require('express');
const { postTranslate } = require('../controllers/translateController');

const router = express.Router();

router.post('/', postTranslate);

module.exports = router;
