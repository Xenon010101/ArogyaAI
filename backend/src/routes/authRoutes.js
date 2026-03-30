const { protect } = require('../middlewares/auth');

const authController = require('../controllers/authController');
const { validateRequest } = require('../middlewares/validation');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} = require('../validators/authValidator');

const express = require('express');
const router = express.Router();

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), authController.forgotPassword);
router.patch('/reset-password/:token', validateRequest(resetPasswordSchema), authController.resetPassword);
router.patch('/update-password', protect, validateRequest(updatePasswordSchema), authController.updatePassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/refresh-token', authController.refreshToken);
router.get('/me', protect, authController.me);

module.exports = router;
