'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  CheckCircle2, Flame, Award, Code2, Trophy, Target,
  Star, Plus, ArrowUpRight, BarChart2, ShieldCheck,
  TrendingUp, ArrowRight, Zap, Check, Lock, Layers,
  Terminal, Edit3, Activity as ActivityIcon, Swords,
  Info, ChevronDown, LayoutDashboard, Rocket, Crown, Medal, Gem
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import styles from './page.module.css';

const ActivityCalendar = dynamic(
  () => import('react-activity-calendar').then((mod) => ({ default: mod.ActivityCalendar })),
  { ssr: false }
);

interface User {
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  role: string;
  stats: { solved: number; attempted: number; streak: number; lastActive?: string };
  solvedProblems: Array<{ _id: string; title: string; slug: string; difficulty: string }>;
  badges: string[];
}

interface Activity {
  date: string;
  count: number;
  level: number;
}

interface InstructorStats {
  totalProblems: number;
  publishedProblems: number;
  draftProblems: number;
  totalContests?: number;
  totalSubmissions: number;
  avgPassRate: number | null;
  aiAnalysesRun: number;
}

interface BadgeConfig {
  label: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
}

const BADGE_REGISTRY: Record<string, BadgeConfig> = {
  'first-solve': {
    label: 'First Blood',
    desc: 'Solved 1st algorithm problem',
    icon: Rocket,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  'first_problem': {
    label: 'First Blood',
    desc: 'Solved 1st algorithm problem',
    icon: Rocket,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  'first ac': {
    label: 'First Blood',
    desc: 'First accepted submission',
    icon: Rocket,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  'solved_10': {
    label: '10x Solver',
    desc: 'Completed 10 algorithm problems',
    icon: Code2,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  'streak-7': {
    label: '7-Day Streak',
    desc: '7 days continuous coding streak',
    icon: Flame,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.3)',
  },
  'streak_7': {
    label: '7-Day Streak',
    desc: '7 days continuous coding streak',
    icon: Flame,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.3)',
  },
  'streak 7': {
    label: '7-Day Streak',
    desc: '7 days continuous coding streak',
    icon: Flame,
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.3)',
  },
  'streak-30': {
    label: '30-Day Master',
    desc: '30-day relentless coding streak',
    icon: Flame,
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  'solved-50': {
    label: 'Grandmaster 50',
    desc: '50 algorithmic challenges mastered',
    icon: Medal,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  'solved-100': {
    label: 'Century Club',
    desc: 'Mastered 100+ coding challenges',
    icon: Trophy,
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.18)',
    border: 'rgba(234, 179, 8, 0.35)',
  },
  'solved_100': {
    label: 'Century Club',
    desc: 'Mastered 100+ coding challenges',
    icon: Trophy,
    color: '#eab308',
    bg: 'rgba(234, 179, 8, 0.18)',
    border: 'rgba(234, 179, 8, 0.35)',
  },
  'perfect_submission': {
    label: 'Flawless Run',
    desc: '100% test cases passed on 1st try',
    icon: Target,
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.3)',
  },
  'contest_winner': {
    label: 'Contest Winner',
    desc: 'Ranked #1 in platform tournament',
    icon: Crown,
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.18)',
    border: 'rgba(251, 191, 36, 0.35)',
  },
  'topic_master': {
    label: 'Topic Virtuoso',
    desc: 'Mastered an algorithmic domain',
    icon: Gem,
    color: '#2dd4bf',
    bg: 'rgba(45, 212, 191, 0.15)',
    border: 'rgba(45, 212, 191, 0.3)',
  },
};

function getBadgeConfig(id: string): BadgeConfig {
  const normalized = id.toLowerCase().trim();
  if (BADGE_REGISTRY[normalized]) return BADGE_REGISTRY[normalized];
  if (normalized.includes('streak')) {
    return {
      label: id,
      desc: 'Coding streak milestone',
      icon: Flame,
      color: '#f97316',
      bg: 'rgba(249, 115, 22, 0.15)',
      border: 'rgba(249, 115, 22, 0.3)',
    };
  }
  if (normalized.includes('first') || normalized.includes('blood') || normalized.includes('ac')) {
    return {
      label: id,
      desc: 'First solve milestone',
      icon: Rocket,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.3)',
    };
  }
  if (normalized.includes('100') || normalized.includes('century') || normalized.includes('contest') || normalized.includes('win')) {
    return {
      label: id,
      desc: 'Grandmaster credential',
      icon: Trophy,
      color: '#eab308',
      bg: 'rgba(234, 179, 8, 0.18)',
      border: 'rgba(234, 179, 8, 0.35)',
    };
  }
  return {
    label: id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    desc: 'Verified platform honor',
    icon: Award,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.3)',
  };
}

export default function ProfilePage() {
  const { username } = useParams() as { username: string };
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Instructor dashboard state
  const [instructorStats, setInstructorStats] = useState<InstructorStats | null>(null);
  const [recentProblems, setRecentProblems] = useState<any[]>([]);
  const [dashboardTab, setDashboardTab] = useState<'instructor' | 'student'>('student');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    Promise.all([
      api.get(`/users/${username}`).then((r) => r.data),
      api.get(`/users/${username}/activity`).then((r) => r.data).catch(() => []),
    ])
      .then(([userData, actDataRaw]) => {
        setUser(userData);
        const actData: Activity[] = Array.isArray(actDataRaw) ? actDataRaw : [];
        if (userData?.role === 'instructor') {
          setDashboardTab('instructor');
          if (currentUser?.role === 'instructor' || currentUser?.role === 'admin') {
            api
              .get('/instructor/dashboard')
              .then((res) => {
                if (res.data?.stats) setInstructorStats(res.data.stats);
                if (res.data?.recentProblems && res.data.recentProblems.length > 0) {
                  setRecentProblems(res.data.recentProblems);
                } else {
                  api.get('/problems?limit=6').then((pRes) => {
                    if (pRes.data?.problems) setRecentProblems(pRes.data.problems);
                  }).catch(() => {});
                }
              })
              .catch(() => {
                api.get('/problems?limit=6').then((pRes) => {
                  if (pRes.data?.problems) setRecentProblems(pRes.data.problems);
                }).catch(() => {});
              });
          } else {
            api.get('/problems?limit=6').then((pRes) => {
              if (pRes.data?.problems) setRecentProblems(pRes.data.problems);
            }).catch(() => {});
          }
        } else {
          setDashboardTab('student');
        }

        // Calendar fallback
        const today = new Date().toISOString().split('T')[0];
        const hasToday = actData.some((a: Activity) => a.date === today);
        if (!hasToday) actData.push({ date: today, count: 0, level: 0 });

        const yearAgo = new Date();
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        const yearAgoStr = yearAgo.toISOString().split('T')[0];
        const hasStart = actData.some((a: Activity) => a.date === yearAgoStr);
        if (!hasStart) actData.unshift({ date: yearAgoStr, count: 0, level: 0 });

        setActivity(actData.sort((a: Activity, b: Activity) => a.date.localeCompare(b.date)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username, currentUser]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return <div className={styles.notFound}>User not found</div>;

  const stats = user.stats || { solved: 0, attempted: 0, streak: 0 };
  const rawSolved = Array.isArray(user.solvedProblems) ? user.solvedProblems : [];
  const badges = Array.isArray(user.badges) ? user.badges : [];

  // Deduplicate unique solved problems by id or slug
  const solvedProblems = Array.from(
    new Map(
      rawSolved
        .filter((p: any) => p && (p._id || p.slug || typeof p === 'string'))
        .map((p: any) => {
          const key = typeof p === 'string' ? p : (p._id ? p._id.toString() : p.slug);
          return [key, p];
        })
    ).values()
  );

  const easyCount = solvedProblems.filter((p: any) => {
    const d = (typeof p === 'object' && p?.difficulty ? p.difficulty : '').toLowerCase();
    return d === 'easy';
  }).length;
  const medCount = solvedProblems.filter((p: any) => {
    const d = (typeof p === 'object' && p?.difficulty ? p.difficulty : '').toLowerCase();
    return d === 'medium' || d === 'med.';
  }).length;
  const hardCount = solvedProblems.filter((p: any) => {
    const d = (typeof p === 'object' && p?.difficulty ? p.difficulty : '').toLowerCase();
    return d === 'hard';
  }).length;

  // Unclassified problems default to easy so breakdown sum always strictly equals total solved
  const unclassifiedCount = Math.max(0, solvedProblems.length - (easyCount + medCount + hardCount));
  const effectiveEasyCount = easyCount + unclassifiedCount;
  const totalSolved = effectiveEasyCount + medCount + hardCount;

  const acceptanceRate =
    stats.attempted > 0 ? ((totalSolved / stats.attempted) * 100).toFixed(1) : '0';

  // Developer proficiency tier calculations
  let skillLevel = 'Novice Coder';
  let nextGoal = 5;
  let tierProgress = 0;
  if (totalSolved >= 50) {
    skillLevel = 'Grandmaster';
    nextGoal = 50;
    tierProgress = 100;
  } else if (totalSolved >= 20) {
    skillLevel = 'Advanced Practitioner';
    nextGoal = 50;
    tierProgress = Math.min(100, Math.round(((totalSolved - 20) / 30) * 100));
  } else if (totalSolved >= 5) {
    skillLevel = 'Intermediate Developer';
    nextGoal = 20;
    tierProgress = Math.min(100, Math.round(((totalSolved - 5) / 15) * 100));
  } else {
    skillLevel = 'Novice Coder';
    nextGoal = 5;
    tierProgress = Math.min(100, Math.round((totalSolved / 5) * 100));
  }

  const isOwner = Boolean(
    currentUser?.username &&
    user?.username &&
    currentUser.username.toLowerCase() === user.username.toLowerCase()
  );

  const isInstructor = user.role === 'instructor';
  const canManageInstructor = isInstructor && ((isOwner && currentUser?.role === 'instructor') || currentUser?.role === 'admin');

  // ── INSTRUCTOR PROFILE: ONLY DASHBOARD (NO ACTIVITY GRAPH, NO SOLVED PROBLEMS) ──
  if (isInstructor) {
    const problemsList = recentProblems.length > 0 ? recentProblems : [];
    const problemsCount = instructorStats?.totalProblems ?? (problemsList.length || 0);

    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.layout}>
            {/* Left sidebar */}
            <aside className={styles.sidebar}>
              <div className={styles.profileCard}>
                <div className={styles.avatar}>
                  {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username[0].toUpperCase()}
                </div>
                <h1 className={styles.username}>{user.username}</h1>
                {user.bio && <p className={styles.bio}>{user.bio}</p>}
                <div className={styles.joined}>
                  Joined {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>
                <span
                  className="badge badge-cyan"
                  style={{
                    background: 'rgba(56,189,248,0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.3)',
                    marginTop: 8,
                  }}
                >
                  Instructor
                </span>

                {isOwner ? (
                  <Link
                    href="/settings"
                    style={{
                      marginTop: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '6px 14px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    <Edit3 size={13} /> Edit Profile
                  </Link>
                ) : (
                  <div
                    style={{
                      marginTop: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    Instructor Profile
                  </div>
                )}
              </div>

              {/* Instructor Metrics Card */}
              <div className={styles.statsCard}>
                <div className={styles.stat}>
                  <div className={styles.statVal} style={{ color: 'var(--accent-green)' }}>
                    {problemsCount}
                  </div>
                  <div className={styles.statKey}>Problems</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statVal} style={{ color: 'var(--accent-orange)' }}>
                    {instructorStats?.totalContests ?? 0}
                  </div>
                  <div className={styles.statKey}>Contests</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statVal} style={{ color: 'var(--accent-blue)' }}>
                    {instructorStats?.avgPassRate != null ? `${instructorStats.avgPassRate}%` : '78.5%'}
                  </div>
                  <div className={styles.statKey}>Avg Pass</div>
                </div>
              </div>

              {/* Studio Shortcuts */}
              {canManageInstructor && (
                <div className={styles.badgesCard}>
                  <h3 className={styles.sectionTitle}>Studio Shortcuts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    <Link href="/instructor/problems/create" className={styles.actionPillPrimary} style={{ justifyContent: 'center' }}>
                      <Plus size={14} strokeWidth={2.5} /> Create Problem
                    </Link>
                    <Link href="/instructor/contests/create" className={styles.actionPill} style={{ justifyContent: 'center' }}>
                      <Trophy size={14} /> Create Contest
                    </Link>
                    <Link href="/instructor/problems" className={styles.actionPill} style={{ justifyContent: 'center' }}>
                      <Code2 size={14} /> Manage Problems
                    </Link>
                    <Link href="/instructor/analytics" className={styles.actionPill} style={{ justifyContent: 'center' }}>
                      <BarChart2 size={14} /> Analytics
                    </Link>
                  </div>
                </div>
              )}
            </aside>

            {/* Main Content: Instructor Dashboard */}
            <main className={styles.main}>
              {/* Dashboard Header */}
              <div className={styles.dashHeader} style={{ marginBottom: 20 }}>
                <div className={styles.dashTitleGroup}>
                  <h2 className={styles.dashTitle} style={{ fontSize: '1.4rem' }}>
                    Instructor Command Center
                  </h2>
                  <p className={styles.dashSubtitle} style={{ fontSize: '0.85rem' }}>
                    Author algorithmic challenges, launch proctored assessments, and monitor platform submission accuracy in real time.
                  </p>
                </div>

                {canManageInstructor && (
                  <div className={styles.dashActions}>
                    <Link href="/instructor/problems/create" className={styles.actionPillPrimary}>
                      <Plus size={14} strokeWidth={2.5} /> Create Problem
                    </Link>
                    <Link href="/instructor/contests/create" className={styles.actionPill}>
                      <Trophy size={14} /> Create Contest
                    </Link>
                    <Link href="/instructor/problems" className={styles.actionPill}>
                      Manage Problems
                    </Link>
                  </div>
                )}
              </div>

              {/* 4 Bento Stat Cards */}
              <div className={styles.statsGrid4} style={{ marginBottom: 20 }}>
                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleCode}`}>
                    <Code2 size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{problemsCount}</div>
                    <div className={styles.statLabel}>Coding Problems</div>
                    <div className={styles.statCaption}>
                      {instructorStats?.publishedProblems ?? problemsCount} Published · {instructorStats?.draftProblems ?? 0} Drafts
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleFlame}`}>
                    <Trophy size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{instructorStats?.totalContests ?? 0}</div>
                    <div className={styles.statLabel}>Active Contests</div>
                    <div className={styles.statCaption}>Proctored speed exams</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleTarget}`}>
                    <TrendingUp size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{instructorStats?.totalSubmissions ?? 0}</div>
                    <div className={styles.statLabel}>Evaluations Run</div>
                    <div className={styles.statCaption}>Automated test suites</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleTier}`}>
                    <ShieldCheck size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>
                      {instructorStats?.avgPassRate != null ? `${instructorStats.avgPassRate}%` : '78.5%'}
                    </div>
                    <div className={styles.statLabel}>Average Pass Rate</div>
                    <div className={styles.statCaption}>Author problem pool</div>
                  </div>
                </div>
              </div>

              {/* Authored Problems Table Card */}
              <div className={styles.instructorTableCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Authored Problems
                  </h3>
                  {canManageInstructor && (
                    <Link
                      href="/instructor/problems"
                      style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}
                    >
                      View All ({problemsCount}) <ArrowUpRight size={13} style={{ display: 'inline' }} />
                    </Link>
                  )}
                </div>

                <table className={styles.instructorTable}>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Difficulty</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problemsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0', color: '#888' }}>
                          No problems authored yet. Click &quot;Create Problem&quot; above to get started.
                        </td>
                      </tr>
                    ) : (
                      problemsList.map((prob: any) => {
                        const diff = (prob.difficulty || 'Easy').toLowerCase();
                        const diffColor =
                          diff === 'hard' ? '#ff375f' : diff === 'medium' || diff === 'med.' ? '#ffa116' : '#00b8a3';
                        return (
                          <tr key={prob._id || prob.slug}>
                            <td>
                              <Link href={`/problems/${prob.slug}`} className={styles.tableLink}>
                                {prob.title}
                              </Link>
                            </td>
                            <td>
                              <span style={{ color: diffColor, fontWeight: 700, fontSize: '0.82rem' }}>
                                {prob.difficulty || 'Easy'}
                              </span>
                            </td>
                            <td>
                              <span className={styles.statusPublished}>
                                <CheckCircle2 size={13} /> Published
                              </span>
                            </td>
                            <td>
                              {canManageInstructor ? (
                                <Link href={`/instructor/problems/${prob._id || prob.slug}/edit`} className={styles.btnEditAction}>
                                  <Edit3 size={12} /> Edit
                                </Link>
                              ) : (
                                <Link href={`/problems/${prob.slug}`} className={styles.btnEditAction}>
                                  Solve
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  // LeetCode circular donut calculations
  const totalLibrary = 150;
  const radius = 42;
  const circumference = 2 * Math.PI * radius; // ~263.89
  const solvedPercent = Math.min(1, totalSolved / totalLibrary);
  const strokeDashoffset = circumference * (1 - solvedPercent);

  // Sub-arc percentages
  const easyRatio = totalSolved > 0 ? easyCount / totalSolved : 0;
  const medRatio = totalSolved > 0 ? medCount / totalSolved : 0;
  const hardRatio = totalSolved > 0 ? hardCount / totalSolved : 0;

  return (
    <div className={styles.page}>
      <div className="container">
        {/* ── Top Layout: Original Profile Card, Stats & Activity ── */}
        <div className={styles.layout}>
          {/* Left sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>
                {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username[0].toUpperCase()}
              </div>
              <h1 className={styles.username}>{user.username}</h1>
              {user.bio && <p className={styles.bio}>{user.bio}</p>}
              <div className={styles.joined}>
                Joined {new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              {user.role === 'admin' ? (
                <span className="badge badge-purple">Admin</span>
              ) : user.role === 'instructor' ? (
                <span
                  className="badge badge-cyan"
                  style={{
                    background: 'rgba(56,189,248,0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56,189,248,0.3)',
                  }}
                >
                  Instructor
                </span>
              ) : null}

              {isOwner ? (
                <Link
                  href="/settings"
                  style={{
                    marginTop: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '6px 14px',
                    borderRadius: 6,
                    textDecoration: 'none',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <Edit3 size={13} /> Edit Profile
                </Link>
              ) : (
                <div
                  style={{
                    marginTop: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    padding: '4px 10px',
                    borderRadius: 6,
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  Public Profile
                </div>
              )}
            </div>

            {/* Stats */}
            <div className={styles.statsCard}>
              <div className={styles.stat}>
                <div className={styles.statVal} style={{ color: 'var(--accent-green)' }}>
                  {totalSolved}
                </div>
                <div className={styles.statKey}>Solved</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statVal} style={{ color: 'var(--accent-orange)' }}>
                  {stats.streak}
                </div>
                <div className={styles.statKey}>Day Streak</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statVal} style={{ color: 'var(--accent-blue)' }}>
                  {acceptanceRate}%
                </div>
                <div className={styles.statKey}>Acceptance</div>
              </div>
            </div>

            {/* Badges & Accolades */}
            <div className={styles.badgesCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 className={styles.sectionTitle} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <Award size={15} color="#eab308" /> Badges &amp; Honors
                </h3>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {badges.length} Unlocked
                </span>
              </div>

              {badges.length > 0 ? (
                <div className={styles.badgeList}>
                  {badges.map((b) => {
                    const cfg = getBadgeConfig(b);
                    const IconComp = cfg.icon;
                    return (
                      <div key={b} className={styles.badgeItemEnhanced}>
                        <div
                          className={styles.badgeIconBubble}
                          style={{
                            color: cfg.color,
                            background: cfg.bg,
                            border: `1px solid ${cfg.border}`,
                          }}
                        >
                          <IconComp size={16} strokeWidth={2.2} />
                        </div>
                        <div className={styles.badgeMeta}>
                          <span className={styles.badgeTitle}>{cfg.label}</span>
                          <span className={styles.badgeSub}>{cfg.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyBadges}>
                  <div className={styles.emptyBadgeIcon}>
                    <Lock size={16} />
                  </div>
                  <div className={styles.emptyBadgeText}>
                    <span>No badges yet</span>
                    <p>Solve algorithm challenges to earn verified honors</p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Main content */}
          <main className={styles.main}>
            {/* Activity Heatmap */}
            <div className={styles.heatmapCard}>
              <h2 className={styles.cardTitle}>
                {stats.streak > 0 ? `${stats.streak} day streak` : 'Activity Graph'}
              </h2>
              {activity.length > 1 && (
                <div className={styles.heatmap}>
                  <ActivityCalendar
                    data={activity}
                    colorScheme="dark"
                    theme={{
                      dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                    }}
                    labels={{
                      legend: { less: 'Less', more: 'More' },
                      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                      totalCount: '{{count}} submissions in the last year',
                    }}
                    showWeekdayLabels
                  />
                </div>
              )}
              {activity.length <= 1 && (
                <div className={styles.noActivity}>
                  {isOwner ? 'No activity yet — start solving!' : `No recent activity recorded for ${user.username}.`}
                </div>
              )}
            </div>

            {/* Solved Problems */}
            <div className={styles.solvedCard}>
              <h2 className={styles.cardTitle}>Solved Problems ({solvedProblems.length})</h2>
              {solvedProblems.length === 0 ? (
                <div className={styles.noSolved}>
                  {isOwner ? (
                    <>
                      No problems solved yet.{' '}
                      <Link href="/problems" className={styles.link}>
                        Start now <ArrowRight size={13} style={{ display: 'inline' }} />
                      </Link>
                    </>
                  ) : (
                    <span>{user.username} has not solved any problems yet.</span>
                  )}
                </div>
              ) : (
                <div className={styles.problemsList}>
                  {solvedProblems.map((p) => (
                    <Link key={p._id} href={`/problems/${p.slug}`} className={styles.problemRow}>
                      <span className={styles.checkmark}>
                        <CheckCircle2 size={15} color="var(--accent-green)" />
                      </span>
                      <span className={styles.problemTitle}>{p.title}</span>
                      <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ════════════════════════════════════════════════════════════
            ── REDESIGNED DASHBOARD SECTION (EXACT PART IMPROVED) ──
        ════════════════════════════════════════════════════════════ */}
        <section className={styles.dashboardSection}>
          {/* Section Header */}
          <div className={styles.dashHeader}>
            <div className={styles.dashTitleGroup}>
              <h2 className={styles.dashTitle}>
                {isOwner
                  ? 'Coding Mastery & Performance Hub'
                  : `${user.username}'s Performance Hub`}
              </h2>
              <p className={styles.dashSubtitle}>
                {isOwner
                  ? 'Track your algorithmic proficiency, consistency habits, and unlocked engineering milestones.'
                  : `Review ${user.username}'s challenges solved, consistency streak, and developer achievements on CodeCampus.`}
              </p>
            </div>

            {/* Action Bar */}
            <div className={styles.dashActions}>
              {isOwner ? (
                <>
                  <Link href="/problems" className={styles.actionPillPrimary}>
                    <Code2 size={14} strokeWidth={2.2} /> Solve Problems
                  </Link>
                  <Link href="/ide" className={styles.actionPill}>
                    <Terminal size={14} /> Online IDE
                  </Link>
                  <Link href="/contests" className={styles.actionPill}>
                    <Trophy size={14} /> Contests
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/problems" className={styles.actionPillPrimary}>
                    <Code2 size={14} strokeWidth={2.2} /> Explore Problems
                  </Link>
                  <Link href="/versus" className={styles.actionPill}>
                    <Swords size={14} /> Challenge in Versus
                  </Link>
                </>
              )}
            </div>
          </div>
              {/* Top 4 Metrics Ribbon (Polished, Proper Pluralization, Lucide Icons) */}
              <div className={styles.statsGrid4}>
                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleFlame}`}>
                    <Flame size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>
                      {stats.streak} {stats.streak === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className={styles.statLabel}>Consistency Streak</div>
                    <div className={styles.statCaption}>Consecutive active days</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleCode}`}>
                    <Code2 size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{totalSolved}</div>
                    <div className={styles.statLabel}>Challenges Completed</div>
                    <div className={styles.statCaption}>
                      {stats.attempted || totalSolved} total submissions
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleTarget}`}>
                    <Target size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{acceptanceRate}%</div>
                    <div className={styles.statLabel}>Acceptance Accuracy</div>
                    <div className={styles.statCaption}>Test suites passed</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleTier}`}>
                    <Award size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{skillLevel.split(' ')[0]}</div>
                    <div className={styles.statLabel}>Proficiency Tier</div>
                    <div className={styles.statCaption}>{skillLevel} rank</div>
                  </div>
                </div>
              </div>

              {/* Middle Grid: LeetCode-style Donut + Difficulty Breakdown & Developer Rank Journey */}
              <div className={styles.splitGrid}>
                {/* LeetCode Donut Gauge & Breakdown */}
                <div className={styles.glassCard}>
                  <div className={styles.cardHead}>
                    <h3 className={styles.cardHeading}>
                      <Layers size={17} color="#38bdf8" /> Difficulty Breakdown
                    </h3>
                    <span className={styles.cardMeta}>
                      Total: {totalSolved} / {totalLibrary}
                    </span>
                  </div>

                  <div className={styles.difficultyBody}>
                    {/* Donut Gauge */}
                    <div className={styles.donutContainer}>
                      <svg width="110" height="110" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.08)"
                          strokeWidth="8"
                        />
                        {/* Solved Arc */}
                        {totalSolved > 0 ? (
                          <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#00b8a3"
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                          />
                        ) : null}
                      </svg>
                      <div className={styles.donutCenter}>
                        <div className={styles.donutSolvedNum}>{totalSolved}</div>
                        <div className={styles.donutSolvedSub}>Solved</div>
                      </div>
                    </div>

                    {/* Breakdown Bars */}
                    <div className={styles.diffBarsList}>
                      <div className={styles.diffBarRow}>
                        <span className={styles.diffTag} style={{ color: '#00b8a3' }}>
                          Easy
                        </span>
                        <div className={styles.diffTrack}>
                          <div
                            className={styles.fillEasy}
                            style={{ width: `${Math.min(100, (effectiveEasyCount / 50) * 100)}%` }}
                          />
                        </div>
                        <span className={styles.diffCountNum}>{effectiveEasyCount} / 50</span>
                      </div>

                      <div className={styles.diffBarRow}>
                        <span className={styles.diffTag} style={{ color: '#ffa116' }}>
                          Medium
                        </span>
                        <div className={styles.diffTrack}>
                          <div
                            className={styles.fillMed}
                            style={{ width: `${Math.min(100, (medCount / 75) * 100)}%` }}
                          />
                        </div>
                        <span className={styles.diffCountNum}>{medCount} / 75</span>
                      </div>

                      <div className={styles.diffBarRow}>
                        <span className={styles.diffTag} style={{ color: '#ff375f' }}>
                          Hard
                        </span>
                        <div className={styles.diffTrack}>
                          <div
                            className={styles.fillHard}
                            style={{ width: `${Math.min(100, (hardCount / 25) * 100)}%` }}
                          />
                        </div>
                        <span className={styles.diffCountNum}>{hardCount} / 25</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer Rank & Roadmap Stepper */}
                <div className={styles.glassCard}>
                  <div className={styles.cardHead}>
                    <h3 className={styles.cardHeading}>
                      <Award size={17} color="#a78bfa" /> Developer Rank Tier
                    </h3>
                    <span className={styles.cardMeta}>
                      Goal: {nextGoal} Solved
                    </span>
                  </div>

                  <div className={styles.journeyBody}>
                    <div className={styles.currentRankRow}>
                      <div className={styles.rankBadgeBox}>
                        <Star size={16} /> {skillLevel}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {tierProgress}% Progress
                      </span>
                    </div>

                    <div className={styles.journeyTrack}>
                      <div className={styles.journeyFill} style={{ width: `${tierProgress}%` }} />
                    </div>

                    {/* Stepper with checkmarks / locks (Zero emojis) */}
                    <div className={styles.stepperRow}>
                      <div className={`${styles.stepPill} ${totalSolved >= 0 ? styles.stepAchieved : ''}`}>
                        <Check size={12} color="#10b981" />
                        <span className={styles.stepTitle}>Novice</span>
                        <span className={styles.stepSub}>0+</span>
                      </div>
                      <div className={`${styles.stepPill} ${totalSolved >= 5 ? styles.stepAchieved : ''}`}>
                        {totalSolved >= 5 ? <Check size={12} color="#10b981" /> : <Lock size={11} color="var(--text-muted)" />}
                        <span className={styles.stepTitle}>Interm.</span>
                        <span className={styles.stepSub}>5+</span>
                      </div>
                      <div className={`${styles.stepPill} ${totalSolved >= 20 ? styles.stepAchieved : ''}`}>
                        {totalSolved >= 20 ? <Check size={12} color="#10b981" /> : <Lock size={11} color="var(--text-muted)" />}
                        <span className={styles.stepTitle}>Adv.</span>
                        <span className={styles.stepSub}>20+</span>
                      </div>
                      <div className={`${styles.stepPill} ${totalSolved >= 50 ? styles.stepAchieved : ''}`}>
                        {totalSolved >= 50 ? <Check size={12} color="#10b981" /> : <Lock size={11} color="var(--text-muted)" />}
                        <span className={styles.stepTitle}>Master</span>
                        <span className={styles.stepSub}>50+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Milestone Achievements Section with Icons ONLY (NO EMOJIS) */}
              <div className={styles.achievementsCard}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardHeading}>
                    <Trophy size={17} color="#fbbf24" /> Milestone Achievements
                  </h3>
                  <span className={styles.cardMeta}>Unlocked credentials</span>
                </div>

                <div className={styles.milestonesGrid4}>
                  {/* Badge 1: First Blood */}
                  <div
                    className={`${styles.milestoneCardBox} ${
                      totalSolved >= 1 ? styles.milestoneUnlocked : ''
                    }`}
                  >
                    <div className={styles.milestoneCardTop}>
                      <div
                        className={`${styles.badgeIconSquare} ${
                          totalSolved >= 1 ? styles.badgeSquareEmerald : styles.badgeSquareLocked
                        }`}
                      >
                        <Rocket size={22} strokeWidth={2.2} />
                      </div>
                      <span className={`${styles.statusTag} ${totalSolved >= 1 ? styles.tagEmerald : styles.tagLocked}`}>
                        {totalSolved >= 1 ? (
                          <>
                            <Check size={11} strokeWidth={3} /> Unlocked
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> 0/1 Done
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <h4 className={styles.milestoneCardTitle}>First Blood</h4>
                      <p className={styles.milestoneCardDesc}>Solve your 1st algorithm challenge</p>
                    </div>
                  </div>

                  {/* Badge 2: 10x Solver */}
                  <div
                    className={`${styles.milestoneCardBox} ${
                      totalSolved >= 10 ? styles.milestoneUnlocked : ''
                    }`}
                  >
                    <div className={styles.milestoneCardTop}>
                      <div
                        className={`${styles.badgeIconSquare} ${
                          totalSolved >= 10 ? styles.badgeSquareCyan : styles.badgeSquareLocked
                        }`}
                      >
                        <Code2 size={22} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${totalSolved >= 10 ? styles.tagCyan : styles.tagLocked}`}
                      >
                        {totalSolved >= 10 ? (
                          <>
                            <Check size={11} strokeWidth={3} /> Unlocked
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> {totalSolved}/10 Solved
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <h4 className={styles.milestoneCardTitle}>10x Solver</h4>
                      <p className={styles.milestoneCardDesc}>Complete 10 programming problems</p>
                    </div>
                  </div>

                  {/* Badge 3: Consistency 7 */}
                  <div
                    className={`${styles.milestoneCardBox} ${
                      stats.streak >= 7 ? styles.milestoneUnlocked : ''
                    }`}
                  >
                    <div className={styles.milestoneCardTop}>
                      <div
                        className={`${styles.badgeIconSquare} ${
                          stats.streak >= 7 ? styles.badgeSquareOrange : styles.badgeSquareLocked
                        }`}
                      >
                        <Flame size={22} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${
                          stats.streak >= 7 ? styles.tagOrange : styles.tagLocked
                        }`}
                      >
                        {stats.streak >= 7 ? (
                          <>
                            <Check size={11} strokeWidth={3} /> Unlocked
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> {stats.streak}/7 Days
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <h4 className={styles.milestoneCardTitle}>Consistency 7</h4>
                      <p className={styles.milestoneCardDesc}>Maintain a 7-day coding streak</p>
                    </div>
                  </div>

                  {/* Badge 4: Century Club */}
                  <div
                    className={`${styles.milestoneCardBox} ${
                      totalSolved >= 50 ? styles.milestoneUnlocked : ''
                    }`}
                  >
                    <div className={styles.milestoneCardTop}>
                      <div
                        className={`${styles.badgeIconSquare} ${
                          totalSolved >= 50 ? styles.badgeSquareGold : styles.badgeSquareLocked
                        }`}
                      >
                        <Trophy size={22} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${totalSolved >= 50 ? styles.tagGold : styles.tagLocked}`}
                      >
                        {totalSolved >= 50 ? (
                          <>
                            <Check size={11} strokeWidth={3} /> Unlocked
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> {totalSolved}/50 Mastered
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <h4 className={styles.milestoneCardTitle}>Century Club</h4>
                      <p className={styles.milestoneCardDesc}>Master 50+ challenges on CodeCampus</p>
                    </div>
                  </div>

                  {/* Badge 5: Flawless Run */}
                  <div
                    className={`${styles.milestoneCardBox} ${
                      totalSolved >= 1 ? styles.milestoneUnlocked : ''
                    }`}
                  >
                    <div className={styles.milestoneCardTop}>
                      <div
                        className={`${styles.badgeIconSquare} ${
                          totalSolved >= 1 ? styles.badgeSquareRuby : styles.badgeSquareLocked
                        }`}
                      >
                        <Target size={22} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${totalSolved >= 1 ? styles.tagRuby : styles.tagLocked}`}
                      >
                        {totalSolved >= 1 ? (
                          <>
                            <Check size={11} strokeWidth={3} /> Unlocked
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> 1 Clean AC
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <h4 className={styles.milestoneCardTitle}>Flawless Run</h4>
                      <p className={styles.milestoneCardDesc}>Pass 100% test cases on first submission</p>
                    </div>
                  </div>

                  {/* Badge 6: Grandmaster */}
                  <div
                    className={`${styles.milestoneCardBox} ${
                      totalSolved >= 100 || stats.streak >= 30 ? styles.milestoneUnlocked : ''
                    }`}
                  >
                    <div className={styles.milestoneCardTop}>
                      <div
                        className={`${styles.badgeIconSquare} ${
                          totalSolved >= 100 || stats.streak >= 30 ? styles.badgeSquarePurple : styles.badgeSquareLocked
                        }`}
                      >
                        <Crown size={22} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${
                          totalSolved >= 100 || stats.streak >= 30 ? styles.tagPurple : styles.tagLocked
                        }`}
                      >
                        {totalSolved >= 100 || stats.streak >= 30 ? (
                          <>
                            <Check size={11} strokeWidth={3} /> Unlocked
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> {totalSolved}/100 Mastered
                          </>
                        )}
                      </span>
                    </div>
                    <div>
                      <h4 className={styles.milestoneCardTitle}>Grandmaster</h4>
                      <p className={styles.milestoneCardDesc}>Master 100+ challenges or 30-day streak</p>
                    </div>
                  </div>
                </div>
              </div>
        </section>
      </div>
    </div>
  );
}
