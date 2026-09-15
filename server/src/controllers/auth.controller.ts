import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import User from '../models/User.model';
import { sendOtpEmail } from '../services/email.service';

const signToken = (id: string, role: string, username: string) =>
  jwt.sign({ id, role, username }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);

const signupSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'instructor']).optional(),
  bio: z.string().optional(),
  expertiseAreas: z.array(z.string()).optional(),
  qualifications: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

// Generate a 6-digit numeric OTP
const generateOtp = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// Hash OTP before storing
const hashOtp = (otp: string): string => crypto.createHash('sha256').update(otp).digest('hex');

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role, bio, expertiseAreas, qualifications } = signupSchema.parse(req.body);

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(409).json({ error: existingUser.email === email ? 'Email already in use' : 'Username taken' });
      return;
    }

    const isInstructor = role === 'instructor';
    const user = await User.create({
      username,
      email,
      passwordHash: password,
      role: isInstructor ? 'instructor' : 'user',
      bio: bio || '',
      instructorApplication: isInstructor
        ? {
            bio: bio || '',
            expertiseAreas: expertiseAreas || [],
            qualifications: qualifications || '',
            status: 'pending',
            appliedAt: new Date(),
          }
        : undefined,
    });
    const token = signToken(user.id, user.role, user.username);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        stats: user.stats,
        instructorApplication: user.instructorApplication,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    res.status(500).json({ error: 'Signup failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken(user.id, user.role, user.username);
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, stats: user.stats },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = forgotSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry +resetOtpAttempts');

    if (!user) {
      res.json({ message: 'If an account with that email exists, an OTP has been sent.' });
      return;
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (user.resetOtpExpiry && user.resetOtpExpiry > tenMinutesAgo && (user.resetOtpAttempts ?? 0) >= 5) {
      res.status(429).json({ error: 'Too many OTP requests. Please wait 10 minutes before trying again.' });
      return;
    }

    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      resetOtp: hashOtp(otp),
      resetOtpExpiry: expiry,
      $inc: { resetOtpAttempts: 1 },
    });

    sendOtpEmail(email, otp, user.username).catch((err) => {
      console.error('Background sendOtpEmail error:', err);
    });

    res.json({ message: 'If an account with that email exists, an OTP has been sent.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    console.error('forgotPassword error:', err);
    res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
  }
};

// POST /api/auth/verify-otp
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry');
    if (!user) {
      res.status(400).json({ error: 'Invalid or expired OTP.' });
      return;
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    if (!user.resetOtp || user.resetOtp !== hashOtp(otp)) {
      res.status(400).json({ error: 'Invalid OTP. Please check your email and try again.' });
      return;
    }

    res.json({ success: true, message: 'OTP verified successfully!' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, newPassword } = resetSchema.parse(req.body);

    const user = await User.findOne({ email }).select('+resetOtp +resetOtpExpiry +resetOtpAttempts +passwordHash');
    if (!user) {
      res.status(400).json({ error: 'Invalid or expired OTP.' });
      return;
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      return;
    }

    if (!user.resetOtp || user.resetOtp !== hashOtp(otp)) {
      res.status(400).json({ error: 'Invalid OTP. Please check your email and try again.' });
      return;
    }

    user.passwordHash = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    console.error('resetPassword error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

export const updateProfile = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const { username } = req.body;
    if (!username || username.length < 3 || username.length > 30) {
      res.status(400).json({ error: 'Username must be between 3 and 30 characters' });
      return;
    }
    const existing = await User.findOne({ username, _id: { $ne: req.user?.id } });
    if (existing) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }
    const user = await User.findByIdAndUpdate(
      req.user?.id,
      { username },
      { new: true }
    ).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const token = signToken(user.id, user.role, user.username);
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, stats: user.stats },
    });
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updatePassword = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }
    const user = await User.findById(req.user?.id).select('+passwordHash');
    if (!user || !(await user.comparePassword(currentPassword))) {
      res.status(401).json({ error: 'Incorrect current password' });
      return;
    }
    user.passwordHash = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to update password' });
  }
};
