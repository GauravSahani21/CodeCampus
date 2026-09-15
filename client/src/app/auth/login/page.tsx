'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'instructor' || user.role === 'admin') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/problems');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loggedUser = await login(email, password);
      toast.success('Welcome back!');
      if (loggedUser?.role === 'instructor' || loggedUser?.role === 'admin') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/problems');
      }
    } catch (err: unknown) {
      toast.error((err as Error).message || 'Login failed');
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
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.sub}>Continue your coding journey</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className="label" htmlFor="login-email">Email</label>
            <input id="login-email" type="email" className="input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className={styles.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="label" htmlFor="login-password">Password</label>
              <Link href="/auth/forgot-password" className={styles.authLink} style={{ fontSize: '0.8rem' }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input id="login-password" type={showPassword ? 'text' : 'password'} className="input" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: '2.5rem' }} />
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
          <button id="login-submit" type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={isLoading}>
            {isLoading ? <><span className="spinner" style={{width:16,height:16,borderWidth:2}}/> Signing in...</> : 'Sign in'}
          </button>
        </form>

        <div className={styles.divider}><span>or</span></div>
        <p className={styles.switchAuth}>
          Don&apos;t have an account? <Link href="/auth/signup" className={styles.authLink}>Create one free</Link>
        </p>
      </div>
    </div>
  );
}
