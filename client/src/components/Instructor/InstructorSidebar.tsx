'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Code2,
  BookOpen,
  Users,
  BarChart2,
  ChevronRight,
  Trophy,
  ClipboardList,
} from 'lucide-react';
import styles from './InstructorSidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  soon?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/instructor/problems', label: 'Problems', icon: Code2 },
      { href: '/instructor/contests', label: 'Contests', icon: Trophy },
    ],
  },
  {
    label: 'Students',
    items: [
      { href: '/instructor/students',  label: 'Students',  icon: Users },
      { href: '/instructor/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
];

export default function InstructorSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className={styles.section}>
            <div className={styles.sectionLabel}>{section.label}</div>
            {section.items.map(({ href, label, icon: Icon, soon }) => {
              const active = pathname === href || (href !== '/instructor/dashboard' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={soon ? '#' : href}
                  className={`${styles.navItem} ${active ? styles.navItemActive : ''} ${soon ? styles.navItemSoon : ''}`}
                  onClick={(e) => soon && e.preventDefault()}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{label}</span>
                  {soon && <span className={styles.soonBadge}>Soon</span>}
                  {active && !soon && <ChevronRight size={12} className={styles.activeArrow} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
