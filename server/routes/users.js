const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    updateUserRole,
    toggleUserStatus,
    forceVerifyUser,
    transferSuperAdmin,
    deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getAllUsers);
router.put('/:id/role', protect, admin, updateUserRole);
router.put('/:id/status', protect, admin, toggleUserStatus);
router.put('/:id/verify', protect, admin, forceVerifyUser);
router.put('/:id/superadmin', protect, admin, transferSuperAdmin);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
