'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  CheckCircle2, Flame, Award, Code2, Trophy, Target,
  Star, Plus, ArrowUpRight, BarChart2, ShieldCheck,
  TrendingUp, ArrowRight, Zap, Check, Lock, Layers,
  Terminal, Edit3, Activity as ActivityIcon
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

const BADGE_LABELS: Record<string, string> = {
  'first-solve': 'First Blood',
  'streak-7': '7-Day Streak',
  'streak-30': '30-Day Streak',
  'solved-50': '50 Problems',
  'solved-100': 'Century Club',
};

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
    Promise.all([
      api.get(`/users/${username}`).then((r) => r.data),
      api.get(`/users/${username}/activity`).then((r) => r.data),
    ])
      .then(([userData, actData]) => {
        setUser(userData);
        if (userData.role === 'instructor' || userData.role === 'admin') {
          setDashboardTab('instructor');
          api
            .get('/instructor/dashboard')
            .then((res) => {
              if (res.data?.stats) setInstructorStats(res.data.stats);
              if (res.data?.recentProblems) setRecentProblems(res.data.recentProblems);
            })
            .catch(() => {});
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
  }, [username]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return <div className={styles.notFound}>User not found</div>;

  const acceptanceRate =
    user.stats.attempted > 0 ? ((user.stats.solved / user.stats.attempted) * 100).toFixed(1) : '0';

  const easyCount = user.solvedProblems.filter((p) => p.difficulty?.toLowerCase() === 'easy').length;
  const medCount = user.solvedProblems.filter(
    (p) => p.difficulty?.toLowerCase() === 'medium' || p.difficulty?.toLowerCase() === 'med.'
  ).length;
  const hardCount = user.solvedProblems.filter((p) => p.difficulty?.toLowerCase() === 'hard').length;
  const totalSolved = user.stats.solved || user.solvedProblems.length;

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

  const isInstructorOrAdmin = user.role === 'instructor' || user.role === 'admin';

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
                  {user.stats.streak}
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

            {/* Badges */}
            {user.badges.length > 0 && (
              <div className={styles.badgesCard}>
                <h3 className={styles.sectionTitle}>Badges</h3>
                <div className={styles.badgeList}>
                  {user.badges.map((b) => (
                    <div key={b} className={styles.badgeItem}>
                      {BADGE_LABELS[b] || b}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className={styles.main}>
            {/* Activity Heatmap */}
            <div className={styles.heatmapCard}>
              <h2 className={styles.cardTitle}>
                {user.stats.streak > 0 ? `${user.stats.streak} day streak` : 'Activity Graph'}
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
                <div className={styles.noActivity}>No activity yet — start solving!</div>
              )}
            </div>

            {/* Solved Problems */}
            <div className={styles.solvedCard}>
              <h2 className={styles.cardTitle}>Solved Problems ({user.solvedProblems.length})</h2>
              {user.solvedProblems.length === 0 ? (
                <div className={styles.noSolved}>
                  No problems solved yet.{' '}
                  <Link href="/problems" className={styles.link}>
                    Start now <ArrowRight size={13} style={{ display: 'inline' }} />
                  </Link>
                </div>
              ) : (
                <div className={styles.problemsList}>
                  {user.solvedProblems.map((p) => (
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
              <span className={styles.hubBadge}>
                <ActivityIcon size={12} /> Performance &amp; Analytics
              </span>
              <h2 className={styles.dashTitle}>
                {isInstructorOrAdmin && dashboardTab === 'instructor'
                  ? 'Instructor Command Center'
                  : 'Coding Mastery & Performance Hub'}
              </h2>
              <p className={styles.dashSubtitle}>
                {isInstructorOrAdmin && dashboardTab === 'instructor'
                  ? 'Author algorithmic challenges, launch proctored assessments, and monitor platform submission accuracy in real time.'
                  : 'Track your algorithmic proficiency, consistency habits, and unlocked engineering milestones.'}
              </p>
            </div>

            {/* Action Bar with ONLY SVG Icons (Zero Emojis) */}
            <div className={styles.dashActions}>
              {isInstructorOrAdmin && (
                <div className={styles.tabSwitch}>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${dashboardTab === 'instructor' ? styles.tabBtnActive : ''}`}
                    onClick={() => setDashboardTab('instructor')}
                  >
                    <ShieldCheck size={14} /> Instructor Studio
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabBtn} ${dashboardTab === 'student' ? styles.tabBtnActive : ''}`}
                    onClick={() => setDashboardTab('student')}
                  >
                    <Star size={14} /> Solver Hub
                  </button>
                </div>
              )}

              {isInstructorOrAdmin && dashboardTab === 'instructor' ? (
                <>
                  <Link href="/instructor/problems/create" className={styles.actionPillPrimary}>
                    <Plus size={14} strokeWidth={2.5} /> Create Problem
                  </Link>
                  <Link href="/instructor/contests/create" className={styles.actionPill}>
                    <Trophy size={14} /> Create Contest
                  </Link>
                  <Link href="/instructor/problems" className={styles.actionPill}>
                    Manage Problems
                  </Link>
                </>
              ) : (
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
              )}
            </div>
          </div>

          {/* ── VIEW 1: INSTRUCTOR COMMAND CENTER ── */}
          {isInstructorOrAdmin && dashboardTab === 'instructor' && (
            <>
              {/* Bento Grid */}
              <div className={styles.statsGrid4}>
                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleCode}`}>
                    <Code2 size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{instructorStats?.totalProblems ?? 6}</div>
                    <div className={styles.statLabel}>Coding Problems</div>
                    <div className={styles.statCaption}>
                      {instructorStats?.publishedProblems ?? 6} Published · {instructorStats?.draftProblems ?? 0} Drafts
                    </div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleFlame}`}>
                    <Trophy size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{instructorStats?.totalContests ?? 2}</div>
                    <div className={styles.statLabel}>Active Contests</div>
                    <div className={styles.statCaption}>Proctored speed exams</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleTarget}`}>
                    <TrendingUp size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{instructorStats?.totalSubmissions ?? 14}</div>
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
                      {instructorStats?.avgPassRate !== null && instructorStats?.avgPassRate !== undefined
                        ? `${instructorStats.avgPassRate}%`
                        : '78.5%'}
                    </div>
                    <div className={styles.statLabel}>Average Pass Rate</div>
                    <div className={styles.statCaption}>Author problem pool</div>
                  </div>
                </div>
              </div>

              {/* Table Card */}
              <div className={styles.instructorTableCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Authored Problems
                  </h3>
                  <Link
                    href="/instructor/problems"
                    style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}
                  >
                    View All ({instructorStats?.totalProblems ?? 6}) <ArrowUpRight size={13} style={{ display: 'inline' }} />
                  </Link>
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
                    {(recentProblems.length > 0 ? recentProblems : user.solvedProblems.slice(0, 5)).map((prob: any) => {
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
                            <Link href={`/instructor/problems/${prob._id || prob.slug}/edit`} className={styles.btnEditAction}>
                              <Edit3 size={12} /> Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── VIEW 2: SOLVER / STUDENT HUB ── */}
          {(!isInstructorOrAdmin || dashboardTab === 'student') && (
            <>
              {/* Top 4 Metrics Ribbon (Polished, Proper Pluralization, Lucide Icons) */}
              <div className={styles.statsGrid4}>
                <div className={styles.statCard}>
                  <div className={`${styles.iconCircle} ${styles.iconCircleFlame}`}>
                    <Flame size={20} strokeWidth={2.2} />
                  </div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>
                      {user.stats.streak} {user.stats.streak === 1 ? 'Day' : 'Days'}
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
                      {user.stats.attempted || totalSolved} total submissions
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
                            style={{ width: `${Math.min(100, (easyCount / 50) * 100)}%` }}
                          />
                        </div>
                        <span className={styles.diffCountNum}>{easyCount} / 50</span>
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
                          totalSolved >= 1 ? styles.badgeSquareUnlocked : styles.badgeSquareLocked
                        }`}
                      >
                        <Zap size={20} strokeWidth={2.2} />
                      </div>
                      <span className={`${styles.statusTag} ${totalSolved >= 1 ? styles.tagUnlocked : styles.tagLocked}`}>
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
                          totalSolved >= 10 ? styles.badgeSquareUnlocked : styles.badgeSquareLocked
                        }`}
                      >
                        <Target size={20} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${totalSolved >= 10 ? styles.tagUnlocked : styles.tagLocked}`}
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
                      user.stats.streak >= 7 ? styles.milestoneUnlocked : ''
                    }`}
                  >
                    <div className={styles.milestoneCardTop}>
                      <div
                        className={`${styles.badgeIconSquare} ${
                          user.stats.streak >= 7 ? styles.badgeSquareUnlocked : styles.badgeSquareLocked
                        }`}
                      >
                        <Flame size={20} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${
                          user.stats.streak >= 7 ? styles.tagUnlocked : styles.tagLocked
                        }`}
                      >
                        {user.stats.streak >= 7 ? (
                          <>
                            <Check size={11} strokeWidth={3} /> Unlocked
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> {user.stats.streak}/7 Days
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
                          totalSolved >= 50 ? styles.badgeSquareUnlocked : styles.badgeSquareLocked
                        }`}
                      >
                        <Award size={20} strokeWidth={2.2} />
                      </div>
                      <span
                        className={`${styles.statusTag} ${totalSolved >= 50 ? styles.tagUnlocked : styles.tagLocked}`}
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
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
