'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState, useRef } from 'react';
import {
  Code2,
  Terminal,
  Trophy,
  Swords,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Award,
  Bell,
  BookOpen,
} from 'lucide-react';
import api from '@/lib/api';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/problems',    label: 'Problems',   icon: Code2 },
  { href: '/contests',    label: 'Contests',   icon: Award },
  { href: '/learn',       label: 'Learn',      icon: BookOpen },
  { href: '/versus',      label: 'Versus',     icon: Swords },
  { href: '/ide',         label: 'IDE',        icon: Terminal },
  { href: '/leaderboard', label: 'Rankings',   icon: Trophy },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loadFromStorage } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      if (data.notifications) setNotifications(data.notifications);
      if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/all/read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  useEffect(() => { loadFromStorage(); }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('cf_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo" onClick={() => setMobileOpen(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4.5l-4 15" stroke="url(#logoGrad)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="logoGrad" x1="3" y1="4.5" x2="21" y2="19.5" gradientUnits="userSpaceOnUse">
                <stop stopColor="#39d353"/><stop offset="1" stopColor="#58a6ff"/>
              </linearGradient>
            </defs>
          </svg>
          CodeCampus
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`navbar-link${pathname.startsWith(href) ? ' active' : ''}`}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
              {href === '/versus' && (
                <span className={styles.newBadge}>New</span>
              )}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Notification Bell */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  type="button"
                  className={styles.notifBtn}
                  onClick={() => setNotifOpen(!notifOpen)}
                  title="Notifications"
                >
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className={styles.notifBadge}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className={styles.notifDropdown}>
                    <div className={styles.notifHeader}>
                      <span className={styles.notifTitle}>Notifications</span>
                      {unreadCount > 0 && (
                        <button className={styles.notifClearBtn} onClick={markAllRead}>
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className={styles.notifList}>
                      {notifications.length === 0 ? (
                        <div className={styles.notifEmpty}>No notifications yet</div>
                      ) : (
                        notifications.map((n) => (
                          <Link
                            key={n._id}
                            href={n.link || '#'}
                            className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}
                            onClick={() => {
                              setNotifOpen(false);
                              if (!n.isRead) {
                                api.patch(`/notifications/${n._id}/read`).catch(() => {});
                              }
                            }}
                          >
                            <span className={styles.notifItemTitle}>{n.title}</span>
                            <span className={styles.notifItemMsg}>{n.message}</span>
                            <span className={styles.notifItemTime}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className={styles.userDropdownContainer} ref={dropdownRef}>
                <button
                  type="button"
                  className={styles.avatarBtn}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <div className={styles.avatar}>
                    {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username[0].toUpperCase()}
                  </div>
                  <span className={styles.username}>{user.username}</span>
                  <ChevronDown size={12} strokeWidth={2} style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />
                </button>

                {dropdownOpen && (
                  <div className={styles.userDropdownMenu}>
                    <div className={styles.dropdownHeader}>
                      <span className={styles.dropdownUsername}>{user.username}</span>
                      <span className={styles.dropdownEmail}>{user.email}</span>
                    </div>

                    <Link
                      href={`/profile/${user.username}`}
                      className={styles.dropdownItem}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={15} />
                      Profile & Dashboard
                    </Link>

                  <Link
                    href="/settings"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={15} />
                    Settings
                  </Link>

                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className={styles.dropdownItem}
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings size={15} color="var(--accent-orange)" />
                      Admin Dashboard
                    </Link>
                  )}

                  <div className={styles.dropdownDivider} />

                  <button
                    type="button"
                    className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/auth/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.mobileLink}${pathname.startsWith(href) ? ` ${styles.mobileLinkActive}` : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
              {href === '/versus' && <span className={styles.newBadge}>New</span>}
            </Link>
          ))}
          <div className={styles.mobileDivider} />
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className={styles.mobileLink}
                  style={{ color: 'var(--accent-orange)', fontWeight: 600 }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings size={16} color="var(--accent-orange)" />
                  Admin Dashboard
                </Link>
              )}
              <Link href={`/profile/${user.username}`} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                <div className={styles.avatarSmall}>{user.username[0].toUpperCase()}</div>
                Profile & Dashboard
              </Link>
              <Link href="/settings" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>
                <Settings size={16} />
                Settings
              </Link>
              <button className={`${styles.mobileLink} ${styles.mobileLinkDanger}`} onClick={handleLogout}>
                <LogOut size={16} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Sign in</Link>
              <Link href="/auth/signup" className={`${styles.mobileLink} ${styles.mobileLinkPrimary}`} onClick={() => setMobileOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
