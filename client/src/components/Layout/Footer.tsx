'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Terminal, BookOpen, Trophy, Swords, Target, Award } from 'lucide-react';
import styles from './Footer.module.css';

const LINKS = {
  Platform: [
    { href: '/problems',    label: 'Problem Bank',     icon: Code2 },
    { href: '/contests',    label: 'Contest Arena',    icon: Trophy },
    { href: '/versus',      label: '1v1 Versus',       icon: Swords },
    { href: '/ide',         label: 'Web IDE Sandbox',  icon: Terminal },
    { href: '/leaderboard', label: 'Leaderboard',      icon: Award },
  ],
  Learning: [
    { href: '/learn',          label: 'Study Plans',      icon: BookOpen },
    { href: '/student/browse', label: 'Explore Modules',  icon: Target },
  ],
  Account: [
    { href: '/auth/signup', label: 'Create Account', icon: null },
    { href: '/auth/login',  label: 'Sign In',        icon: null },
  ],
};

export default function Footer() {
  const pathname = usePathname();
  
  if (pathname?.startsWith('/problems') || pathname?.startsWith('/versus') || pathname?.startsWith('/ide')) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4.5l-4 15" stroke="url(#fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="fg" x1="3" y1="4.5" x2="21" y2="19.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#39d353"/><stop offset="1" stopColor="#58a6ff"/>
                </linearGradient>
              </defs>
            </svg>
            <span>CodeCampus</span>
          </div>
          <p className={styles.tagline}>
            Code. Learn. Conquer.<br/>
            High-performance algorithmic practice with rule-based diagnostics and real-time duels.
          </p>
        </div>

        <div className={styles.links}>
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section} className={styles.linkGroup}>
              <div className={styles.groupTitle}>{section}</div>
              {items.map(({ href, label, icon: Icon }) => (
                <Link key={label} href={href} className={styles.link}>
                  {Icon && <Icon size={13} strokeWidth={2} style={{ marginRight: 6, opacity: 0.8 }} />}
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.bottom}>
        <div className="container">
          <div className={styles.bottomInner}>
            <span className={styles.copy}>© {new Date().getFullYear()} CodeCampus. All rights reserved.</span>
            <div className={styles.bottomLinks}>
              <span className={styles.powered}>
                <span style={{ color: 'var(--accent-green)' }}>Deterministic Diagnostics</span>
                {' · '}
                <span style={{ color: 'var(--accent-blue)' }}>13+ Language Sandbox</span>
                {' · '}
                <span style={{ color: 'var(--accent-purple)' }}>Live 1v1 Duels</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
