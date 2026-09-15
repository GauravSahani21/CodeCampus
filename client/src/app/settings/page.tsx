'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Settings, User, Lock, Moon, Sun, Eye, EyeOff, Save } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
  const { user, setUser, loadFromStorage } = useAuthStore();

  const [username, setUsername] = useState('');
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('cf_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('cf_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    toast.success(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} mode`);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    if (user && username === user.username) {
      toast.error('Username is unchanged');
      return;
    }
    setUsernameLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { username: username.trim() });
      setUser(data.user, data.token);
      toast.success('Username updated successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update username';
      toast.error(msg);
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Enter current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      const { data } = await api.put('/auth/password', { currentPassword, newPassword });
      toast.success(data.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update password';
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}><Settings size={32} /> Account Settings</h1>
          <p className={styles.subtitle}>Sign in to manage your account and appearance settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Settings size={32} color="var(--accent-blue)" /> Account Settings
        </h1>
        <p className={styles.subtitle}>Manage your profile, credentials, and app preferences</p>
      </div>

      <div className={styles.grid}>
        {/* Appearance Settings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Sun className={styles.cardIcon} size={22} />
            <div>
              <div className={styles.cardTitle}>Appearance & Theme</div>
              <div className={styles.cardSub}>Choose your preferred interface theme</div>
            </div>
          </div>
          <div className={styles.themeSelector}>
            <div
              className={`${styles.themeCard} ${theme === 'dark' ? styles.themeCardActive : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <div className={styles.themeIcon}><Moon size={22} /></div>
              <div className={styles.themeInfo}>
                <span className={styles.themeName}>Dark Mode</span>
                <span className={styles.themeDesc}>Sleek, dark contrast for late-night coding</span>
              </div>
            </div>

            <div
              className={`${styles.themeCard} ${theme === 'light' ? styles.themeCardActive : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <div className={styles.themeIcon}><Sun size={22} /></div>
              <div className={styles.themeInfo}>
                <span className={styles.themeName}>Light Mode</span>
                <span className={styles.themeDesc}>Clean, high readability for bright environments</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <User className={styles.cardIcon} size={22} />
            <div>
              <div className={styles.cardTitle}>Profile Information</div>
              <div className={styles.cardSub}>Update your public handle and details</div>
            </div>
          </div>

          <form onSubmit={handleUpdateUsername} className={styles.form}>
            <div className={styles.field}>
              <label className="label" htmlFor="settings-username">Username</label>
              <input
                id="settings-username"
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_]+"
                required
              />
            </div>

            <div className={styles.field}>
              <label className="label" htmlFor="settings-email">Email Address (Read-only)</label>
              <input
                id="settings-email"
                type="email"
                className="input"
                value={user.email}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.saveBtn}`}
              disabled={usernameLoading}
            >
              {usernameLoading ? (
                <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</>
              ) : (
                <><Save size={16} /> Save Username</>
              )}
            </button>
          </form>
        </div>

        {/* Security / Password */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Lock className={styles.cardIcon} size={22} />
            <div>
              <div className={styles.cardTitle}>Reset & Change Password</div>
              <div className={styles.cardSub}>Ensure your account remains secure</div>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.field}>
              <label className="label" htmlFor="current-pass">Current Password</label>
              <div className={styles.inputGroup}>
                <input
                  id="current-pass"
                  type={showCurrent ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label="Toggle current password"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className="label" htmlFor="new-pass">New Password</label>
              <div className={styles.inputGroup}>
                <input
                  id="new-pass"
                  type={showNew ? 'text' : 'password'}
                  className="input"
                  placeholder="8+ characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowNew(!showNew)}
                  aria-label="Toggle new password"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className="label" htmlFor="confirm-pass">Confirm New Password</label>
              <div className={styles.inputGroup}>
                <input
                  id="confirm-pass"
                  type={showConfirm ? 'text' : 'password'}
                  className="input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.saveBtn}`}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Updating...</>
              ) : (
                <><Lock size={16} /> Update Password</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
