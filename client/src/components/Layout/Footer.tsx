'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Terminal, BookOpen, Trophy, Swords, GitBranch, MessageCircle, Zap } from 'lucide-react';
import styles from './Footer.module.css';

const LINKS = {
  Platform: [
    { href: '/problems',    label: 'Problems',   icon: Code2 },
    { href: '/contests',    label: 'Contests',   icon: Trophy },
    { href: '/versus',      label: 'Versus',     icon: Swords },
    { href: '/ide',         label: 'Online IDE', icon: Terminal },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
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
          <p className={styles.tagline}>Code. Learn. Conquer.<br/>The platform that makes you type every character.</p>

        </div>

        <div className={styles.links}>
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section} className={styles.linkGroup}>
              <div className={styles.groupTitle}>{section}</div>
              {items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={styles.link}>
                  {Icon && <Icon size={12} strokeWidth={2} />}
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
            <span className={styles.copy}>© {new Date().getFullYear()} CodeCampus. Built for coders who care.</span>
            <div className={styles.bottomLinks}>
              <span className={styles.powered}>
                Powered by <span style={{color:'var(--accent-green)'}}>Piston API</span> · <span style={{color:'var(--accent-blue)'}}>Monaco Editor</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
