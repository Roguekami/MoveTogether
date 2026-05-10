const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const rateLimit = require('express-rate-limit');

// Strict Auth Limiter: Max 5 requests per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again after 15 minutes'
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/google', authLimiter, authController.googleLogin);
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