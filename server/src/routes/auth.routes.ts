import { Router } from 'express';
import { signup, login, getMe, forgotPassword, verifyOtp, resetPassword, updateProfile, updatePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later.' },
});

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, updatePassword);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/reset-password', otpLimiter, resetPassword);

export default router;

