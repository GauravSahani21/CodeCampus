'use client';
import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import {
  Flame, CheckCircle2,
  Sparkles, ArrowRight, Code2, Trophy,
  BrainCircuit, Target, Star, Swords, Terminal
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function StudentDashboardPage() {
  const { user, loadFromStorage } = useAuthStore();

  React.useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const streak = user?.stats?.streak || 0;
  const longestStreak = (user?.stats as any)?.longestStreak || streak;
  const solvedCount = user?.stats?.solved || 0;

  // Skill tier calculation
  let skillLevel = 'Novice Coder';
  if (solvedCount >= 50) skillLevel = 'Grandmaster';
  else if (solvedCount >= 20) skillLevel = 'Advanced Practitioner';
  else if (solvedCount >= 5) skillLevel = 'Intermediate Developer';

  const BADGE_ICONS: Record<string, React.ReactNode> = {
    first_problem: <CheckCircle2 size={18} color="#4ade80" />,
    solved_10: <Code2 size={18} color="#38bdf8" />,
    streak_7: <Flame size={18} color="#f97316" />,
    perfect_submission: <Target size={18} color="#a78bfa" />,
  };

  const defaultBadges = [
    { id: 'first_problem', name: 'First Problem Solved', desc: 'Solved first coding challenge' },
    { id: 'solved_10', name: '10 Problems Solved', desc: 'Solved 10 algorithm problems' },
    { id: 'streak_7', name: '7-Day Streak', desc: 'Consistent 7-day coding habit' },
    { id: 'perfect_submission', name: 'Perfect Submission', desc: 'Passed 100% test cases on 1st try' },
  ];

  const earnedBadges = user?.badges || [];

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      {/* Hero Welcome Banner */}
      <div className={styles.heroBanner}>
        <div>
          <h1 className={styles.welcomeTitle}>
            Welcome back, {user?.username || 'Student'}!
          </h1>
          <p className={styles.welcomeSubtitle}>
            Track your algorithmic streak, solved problems, and earned badges across your competitive programming journey.
          </p>
        </div>

        <div className={styles.quickStatsRow}>
          <div className={styles.quickStatPill} style={{ borderColor: '#f97316' }}>
            <Flame size={16} color="#f97316" fill="#f97316" />
            <span>{streak} Day Streak</span>
          </div>
          <div className={styles.quickStatPill} style={{ borderColor: '#10b981' }}>
            <Code2 size={16} color="#10b981" />
            <span>{solvedCount} Problems Solved</span>
          </div>
          <div className={styles.quickStatPill} style={{ borderColor: '#38bdf8' }}>
            <Star size={16} color="#38bdf8" />
            <span>{skillLevel}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className={styles.dashboardGrid}>
        {/* Left Column: Problem Solving & Arena */}
        <div>
          {/* Daily Algorithm Practice Card */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  Daily Algorithm Practice
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#8b949e' }}>
                  Keep your coding streak alive. Tackle algorithm problems categorized by topic and difficulty.
                </p>
              </div>
              <Link href="/problems" className="btn btn-primary btn-sm">
                Explore Problems <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
              <Link
                href="/problems"
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 8,
                  padding: 16,
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Practice Hub
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  All Challenges
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: 4 }}>
                  Browse dynamic programming, trees, graphs &amp; arrays
                </div>
              </Link>

              <Link
                href="/versus"
                style={{
                  background: 'rgba(57, 211, 83, 0.08)',
                  border: '1px solid rgba(57, 211, 83, 0.25)',
                  borderRadius: 8,
                  padding: 16,
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase' }}>
                  Versus Arena
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  1v1 Code Battles
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: 4 }}>
                  Real-time multiplayer coding with countdown timers
                </div>
              </Link>

              <Link
                href="/contests"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: 8,
                  padding: 16,
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                  Contest Arena
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                  Timed Assessments
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: 4 }}>
                  Proctored competitive coding exams
                </div>
              </Link>
            </div>
          </div>

          {/* Standalone IDE banner */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', padding: 10, borderRadius: 8 }}>
                  <Terminal size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Standalone Scratchpad IDE
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#8b949e', margin: '3px 0 0' }}>
                    Multi-language Monaco editor with Wandbox code execution
                  </p>
                </div>
              </div>
              <Link href="/ide" className="btn btn-secondary btn-sm">
                Open IDE
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Badges & Streaks */}
        <div>
          {/* Streak & Consistency */}
          <div className={styles.badgesContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={16} color="#f97316" /> Streak Stats
              </span>
              <span style={{ fontSize: '0.78rem', color: '#8b949e' }}>
                Longest: <strong style={{ color: '#fff' }}>{longestStreak}d</strong>
              </span>
            </div>

            <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: 14, textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f97316' }}>{streak}</div>
              <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>Consecutive Days Active</div>
            </div>

            <div style={{ fontSize: '0.75rem', color: '#8b949e', lineHeight: 1.4 }}>
              Milestones: 7 days ({streak >= 7 ? 'Done' : 'Locked'}), 14 days ({streak >= 14 ? 'Done' : 'Locked'}), 30 days ({streak >= 30 ? 'Done' : 'Locked'})
            </div>
          </div>

          {/* Badges & Achievements */}
          <div className={styles.badgesContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trophy size={16} color="#eab308" /> Achievements ({earnedBadges.length || 0})
              </span>
            </div>

            <div className={styles.badgeList}>
              {defaultBadges.map((b) => {
                const isEarned = (user?.badges || []).includes(b.id) || earnedBadges.some((eb: any) => eb.id === b.id);
                return (
                  <div
                    key={b.id}
                    className={styles.badgeItem}
                    style={{ opacity: isEarned ? 1 : 0.45, borderColor: isEarned ? '#38bdf8' : '#21262d' }}
                  >
                    <span className={styles.badgeIcon}>{BADGE_ICONS[b.id]}</span>
                    <span className={styles.badgeName}>{b.name}</span>
                    <span className={styles.badgeDesc}>{isEarned ? 'Unlocked' : 'Locked'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Next Steps */}
          <div className={styles.recommendBox}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BrainCircuit size={16} color="#c084fc" /> Recommended Next Steps
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#8b949e', marginTop: 4 }}>
              Curated for your current skill tier ({skillLevel})
            </p>

            <Link href="/problems/two-sum" className={styles.recommendItem}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Solve: Two Sum</div>
                <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>Master Hash Map lookup patterns</div>
              </div>
              <ArrowRight size={14} color="#a78bfa" />
            </Link>

            <Link href="/versus" className={styles.recommendItem}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Versus: 1v1 Battle Arena</div>
                <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>Challenge peers in real-time coding duels</div>
              </div>
              <ArrowRight size={14} color="#a78bfa" />
            </Link>

            <Link href="/contests" className={styles.recommendItem}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Contests: Live Arena</div>
                <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>Test speed under proctored timer</div>
              </div>
              <ArrowRight size={14} color="#a78bfa" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
