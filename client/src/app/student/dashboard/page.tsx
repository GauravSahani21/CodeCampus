'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  BookOpen, Play, CheckCircle2, Flame, Award,
  Sparkles, ArrowRight, Code2, Trophy, Clock,
  ChevronRight, BrainCircuit, Target, Star
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [continueLearning, setContinueLearning] = useState<any>(null);
  const [totalActive, setTotalActive] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const { data } = await api.get('/enrollments/my');
        setEnrollments(data.enrollments || []);
        setContinueLearning(data.continueLearning || null);
        setTotalActive(data.totalActive || 0);
        setTotalCompleted(data.totalCompleted || 0);
      } catch {
        // Not logged in or error
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [user]);

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

  const earnedBadges = (user as any)?.earnedBadges || [];

  return (
    <div className={styles.page}>
      {/* Hero Welcome Banner */}
      <div className={styles.heroBanner}>
        <div>
          <h1 className={styles.welcomeTitle}>
          Welcome back, {user?.username || 'Student'}!
          </h1>
          <p className={styles.welcomeSubtitle}>
            Track your self-paced course progress, algorithmic streak, and earned badges across your learning journey.
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

      {/* Continue Learning Card */}
      {continueLearning && continueLearning.courseId && (
        <div>
          <div className={styles.sectionTitle}>
            <Play size={18} color="#38bdf8" /> Continue Learning
          </div>
          <div className={styles.continueCard}>
            <div className={styles.continueLeft}>
              <div className={styles.continueBadge}>
                {continueLearning.courseId.difficulty || 'Beginner'} Course
              </div>
              <h2 className={styles.continueTitle}>{continueLearning.courseId.title}</h2>
              <p className={styles.continueDesc}>{continueLearning.courseId.description}</p>
              
              <div className={styles.progressBarContainer}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${continueLearning.progressPercent || 0}%` }}
                />
              </div>
              <div className={styles.progressText}>
                {continueLearning.progressPercent || 0}% completed • {continueLearning.completedLessons?.length || 0} of {continueLearning.courseId.lessons?.length || 0} lessons done
              </div>
            </div>

            <div>
              <Link
                href={`/learn/${continueLearning.courseId.slug}`}
                className={styles.resumeBtn}
              >
                Resume Course <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: My Courses vs Badges & Recommendations */}
      <div className={styles.dashboardGrid}>
        {/* Left Column: Courses & Assignments */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className={`btn btn-sm ${activeTab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('active')}
              >
                In Progress ({totalActive})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('completed')}
              >
                Completed ({totalCompleted})
              </button>
            </div>

            <Link href="/learn" style={{ fontSize: '0.82rem', color: '#58a6ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Browse Catalog <ChevronRight size={14} />
            </Link>
          </div>

          {enrollments.filter(e => e.status === activeTab).length === 0 ? (
            <div style={{ background: '#161b22', border: '1px dashed #30363d', borderRadius: 12, padding: 36, textAlign: 'center', marginBottom: 32 }}>
              <BookOpen size={36} color="#8b949e" style={{ marginBottom: 12 }} />
              <h3 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: 6 }}>
                {activeTab === 'active' ? 'No active courses in progress' : 'No completed courses yet'}
              </h3>
              <p style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: 18 }}>
                Explore our comprehensive curriculum covering Python, Java, C++, DSA, and Web Foundations.
              </p>
              <Link href="/learn" className="btn btn-primary btn-sm">
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className={styles.coursesGrid}>
              {enrollments
                .filter(e => e.status === activeTab)
                .map((enr) => {
                  const c = enr.courseId;
                  if (!c) return null;
                  return (
                    <Link key={enr._id} href={`/learn/${c.slug}`} className={styles.courseCard}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                          {c.category || 'Programming'}
                        </span>
                        <h4 className={styles.courseCardTitle}>{c.title}</h4>
                        <p className={styles.courseCardDesc}>{c.description}</p>
                      </div>

                      <div>
                        <div className={styles.progressBarContainer} style={{ marginBottom: 6 }}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${enr.progressPercent}%` }}
                          />
                        </div>
                        <div className={styles.courseCardMeta}>
                          <span>{enr.progressPercent}% done</span>
                          <span>{c.lessons?.length || 0} Lessons</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          )}

          {/* Quick Problem Solving Card */}
          <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 20, marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  Daily Algorithm Practice
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#8b949e' }}>
                  Keep your coding streak active! Jump directly into competitive problem solving.
                </p>
              </div>
              <Link href="/problems" className="btn btn-secondary btn-sm">
                Solve Problems
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

            <Link href="/learn/data-structures-mastery" className={styles.recommendItem}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Course: Data Structures Mastery</div>
                <div style={{ fontSize: '0.72rem', color: '#8b949e' }}>Arrays, Linked Lists, Trees</div>
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
