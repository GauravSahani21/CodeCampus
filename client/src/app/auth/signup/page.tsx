'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from '../login/auth.module.css';

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signup, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be 8+ characters'); return; }
    try {
      await signup(username, email, password);
      toast.success('Account created! Welcome to CodeCampus');
      router.push('/problems');
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Signup failed');
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
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.sub}>Start your coding journey today</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className="label" htmlFor="signup-username">Username</label>
            <input id="signup-username" className="input" placeholder="coolcoder42"
              value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus
              minLength={3} maxLength={30} pattern="^[a-zA-Z0-9_]+" title="Letters, numbers, underscores only" />
          </div>
          <div className={styles.field}>
            <label className="label" htmlFor="signup-email">Email</label>
            <input id="signup-email" type="email" className="input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className="label" htmlFor="signup-password">Password</label>
            <div style={{ position: 'relative' }}>
              <input id="signup-password" type={showPassword ? 'text' : 'password'} className="input" placeholder="8+ characters"
                value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ paddingRight: '2.5rem' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button id="signup-submit" type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isLoading}>
            {isLoading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Creating...</> : 'Create Account'}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>
        <p className={styles.switchAuth}>
          Already have an account? <Link href="/auth/login" className={styles.authLink}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
