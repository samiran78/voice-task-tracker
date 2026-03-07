const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../Controller/authController');

// We'll import to protect route later
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

module.exports = router;
