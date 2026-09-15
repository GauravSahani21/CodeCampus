'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import styles from '../login/auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: 'email' | Step 2: 'otp' | Step 3: 'password'
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email address!');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP first before unlocking password fields
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified successfully! Now set your new password.');
      setStep('password');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password once OTP is verified
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4.5l-4 15" />
            </svg>
          </div>
          <div className={styles.logoText}>CodeCampus</div>
        </div>

        {/* Step Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '16px 0 24px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700,
            background: step === 'email' ? 'var(--accent-blue)' : 'var(--accent-green)',
            color: '#fff'
          }}>
            {step !== 'email' ? <CheckCircle2 size={16} /> : '1'}
          </div>
          <div style={{ width: 30, height: 2, background: step === 'email' ? 'var(--border)' : 'var(--accent-green)' }} />
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700,
            background: step === 'otp' ? 'var(--accent-blue)' : step === 'password' ? 'var(--accent-green)' : 'var(--bg-secondary)',
            color: step === 'email' ? 'var(--text-muted)' : '#fff',
            border: step === 'email' ? '1px solid var(--border)' : 'none'
          }}>
            {step === 'password' ? <CheckCircle2 size={16} /> : '2'}
          </div>
          <div style={{ width: 30, height: 2, background: step === 'password' ? 'var(--accent-green)' : 'var(--border)' }} />
          <div style={{
            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700,
            background: step === 'password' ? 'var(--accent-blue)' : 'var(--bg-secondary)',
            color: step === 'password' ? '#fff' : 'var(--text-muted)',
            border: step === 'password' ? 'none' : '1px solid var(--border)'
          }}>
            3
          </div>
        </div>

        <h1 className={styles.title}>
          {step === 'email' && 'Forgot Password'}
          {step === 'otp' && 'Verify OTP'}
          {step === 'password' && 'Set New Password'}
        </h1>
        <p className={styles.sub}>
          {step === 'email' && 'Enter your registered email address to receive a 6-digit OTP'}
          {step === 'otp' && `Enter the 6-digit OTP sent to ${email}`}
          {step === 'password' && 'OTP verified! Enter your new password below'}
        </p>

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <form onSubmit={handleSendOtp} className={styles.form}>
            <div className={styles.field}>
              <label className="label" htmlFor="forgot-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="forgot-email" 
                  type="email" 
                  className="input" 
                  placeholder="you@example.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  autoFocus 
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
              </div>
            </div>
            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isLoading}>
              {isLoading ? 'Sending OTP...' : 'Send Reset OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification Only */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className={styles.form}>
            <div className={styles.field}>
              <label className="label" htmlFor="reset-otp">6-Digit OTP</label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="reset-otp" 
                  type="text" 
                  className="input" 
                  placeholder="123456"
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  maxLength={6}
                  required 
                  autoFocus 
                  style={{ paddingLeft: '2.5rem', letterSpacing: '4px', fontWeight: 'bold' }}
                />
                <KeyRound size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#8b949e' }} />
              </div>
            </div>
            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isLoading}>
              {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => setStep('email')}
              >
                ← Change Email
              </button>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={handleSendOtp}
                disabled={isLoading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Password Entry & Reset */}
        {step === 'password' && (
          <form onSubmit={handleResetPassword} className={styles.form}>
            <div className={styles.field}>
              <label className="label" htmlFor="new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="new-password" 
                  type={showNewPassword ? 'text' : 'password'} 
                  className="input" 
                  placeholder="8+ characters"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  minLength={8}
                  autoFocus
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                  }}
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label className="label" htmlFor="confirm-password">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  id="confirm-password" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  className="input" 
                  placeholder="Repeat new password"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={8}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                  }}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isLoading}>
              {isLoading ? 'Resetting Password...' : 'Reset Password & Login'}
            </button>
          </form>
        )}

        <div className={styles.divider}><span>or</span></div>
        <p className={styles.switchAuth}>
          Remember your password? <Link href="/auth/login" className={styles.authLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
