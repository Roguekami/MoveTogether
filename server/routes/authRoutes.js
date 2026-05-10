const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleLogin);
router.post('/logout', authMiddleware, authController.logout);

// Wrapper to handle multer errors
const uploadProfilePic = (req, res, next) => {
    const uploadSingle = upload.single('profilePicture');
    uploadSingle(req, res, function (err) {
        if (err) {
            console.error('Multer Error:', err);
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        }
        next();
    });
};

router.get('/me', authMiddleware, authController.getMe);
router.get('/user/:id', authMiddleware, authController.getUserProfile);
router.put('/profile', authMiddleware, uploadProfilePic, authController.updateProfile);
router.put('/password', authMiddleware, authController.updatePassword);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-code', authController.resendCode);

module.exports = router;