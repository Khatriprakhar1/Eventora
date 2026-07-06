const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, removeAvatar } = require('../controllers/profileController');
const { protect, verified } = require('../middleware/auth');

router.get('/', protect, verified, getProfile);
router.put('/', protect, verified, updateProfile);
router.delete('/avatar', protect, verified, removeAvatar);

module.exports = router;
