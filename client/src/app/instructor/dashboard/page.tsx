'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Code2, Users, TrendingUp, CheckCircle2, Clock,
  ChevronRight, Plus, AlertCircle, Zap, Trophy,
  BookOpen, Sparkles, ArrowUpRight, ShieldCheck, Layers, FileText,
  Activity, Cpu, ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import styles from './dashboard.module.css';

interface DashboardStats {
  totalProblems: number;
  publishedProblems: number;
  draftProblems: number;
  totalContests?: number;
  totalCourses?: number;
  totalSubmissions: number;
  avgPassRate: number | null;
  aiAnalysesRun: number;
}

export default function InstructorDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalProblems: 0,
    publishedProblems: 0,
    draftProblems: 0,
    totalContests: 0,
    totalCourses: 0,
    totalSubmissions: 0,
    avgPassRate: null,
    aiAnalysesRun: 0,
  });
  const [recentProblems, setRecentProblems] = useState<any[]>([]);
  const [recentContests, setRecentContests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'problems' | 'contests'>('problems');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/instructor/dashboard');
        if (data.stats) setStats(data.stats);
        if (data.recentProblems) setRecentProblems(data.recentProblems);
        if (data.recentContests) setRecentContests(data.recentContests);
      } catch (err) {
        console.error('Failed to load instructor dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className={styles.page}>
      {/* ── Hero Banner with Aura ── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Welcome back, {user?.username || 'Instructor'}
          </h1>
          <p className={styles.heroSubtitle}>
            Author algorithmic challenges, launch proctored coding assessments, and track automated AI evaluations in real time.
          </p>
        </div>

        <div className={styles.heroButtons}>
          <Link href="/instructor/problems/create" className={styles.btnEmerald}>
            <Plus size={16} strokeWidth={2.5} />
            Create Problem
          </Link>
          <Link href="/instructor/contests/create" className={styles.btnCyan}>
            <Trophy size={16} strokeWidth={2} />
            Create Contest
          </Link>
        </div>
      </div>

      {/* ── Bento-Grid Modern Metrics ── */}
      <div className={styles.statsGrid}>
        {/* Metric 1: Problems */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.icon_cyan}`}>
              <Code2 size={20} strokeWidth={2} />
            </div>
            <Link href="/instructor/problems" className={styles.viewAll} title="View All Problems">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className={styles.statValue}>{stats.totalProblems}</div>
          <div className={styles.statLabel}>Coding Problems</div>
          <div className={styles.statSub}>
            {stats.publishedProblems} Published · {stats.draftProblems} Drafts
          </div>
        </div>

        {/* Metric 2: Contests */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.icon_amber}`}>
              <Trophy size={20} strokeWidth={2} />
            </div>
            <Link href="/instructor/contests" className={styles.viewAll} title="View All Contests">
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className={styles.statValue}>{stats.totalContests ?? 0}</div>
          <div className={styles.statLabel}>Contests &amp; Exams</div>
          <div className={styles.statSub}>Proctored assessments active</div>
        </div>


        {/* Metric 4: AI & Submissions */}
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <div className={`${styles.statIcon} ${styles.icon_emerald}`}>
              <Activity size={20} strokeWidth={2} />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-green)' }}>
              {stats.avgPassRate !== null ? `${stats.avgPassRate}% Pass` : 'Active'}
            </span>
          </div>
          <div className={styles.statValue}>{stats.totalSubmissions}</div>
          <div className={styles.statLabel}>Student Submissions</div>
          <div className={styles.statSub}>
            {stats.aiAnalysesRun} AI analyses completed
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className={styles.columns}>
        {/* Left Column: Recent Problems & Contests */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setActiveTab('problems')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: activeTab === 'problems' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'problems' ? '2px solid var(--accent-green)' : '2px solid transparent',
                  paddingBottom: '4px',
                  transition: 'all 0.2s',
                }}
              >
                Recent Problems
              </button>
              <button
                onClick={() => setActiveTab('contests')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: activeTab === 'contests' ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  borderBottom: activeTab === 'contests' ? '2px solid var(--accent-green)' : '2px solid transparent',
                  paddingBottom: '4px',
                  transition: 'all 0.2s',
                }}
              >
                Active Contests
              </button>
            </div>

            <Link
              href={activeTab === 'problems' ? '/instructor/problems' : '/instructor/contests'}
              className={styles.viewAll}
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {activeTab === 'problems' ? (
            recentProblems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No problems created yet</p>
                <p style={{ fontSize: '0.82rem', margin: '4px 0 16px' }}>Author your first algorithmic problem for students.</p>
                <Link href="/instructor/problems/create" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Create Problem
                </Link>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Problem Name</th>
                    <th>Difficulty</th>
                    <th>Submissions</th>
                    <th>Pass Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProblems.map((p: any) => (
                    <tr key={p._id}>
                      <td>
                        <Link href={`/problems/${p.slug}`} className={styles.problemTitleLink}>
                          {p.title}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={
                            p.difficulty === 'Easy'
                              ? styles.badgeEasy
                              : p.difficulty === 'Medium'
                              ? styles.badgeMedium
                              : styles.badgeHard
                          }
                        >
                          {p.difficulty}
                        </span>
                      </td>
                      <td style={{ color: '#c9d1d9', fontWeight: 600 }}>{p.totalSubmissions || 0}</td>
                      <td>
                        {p.acceptanceRate ? (
                          <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                            {Math.round(p.acceptanceRate)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={p.isPublished ? styles.statusPublished : styles.statusDraft}>
                          {p.isPublished ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {p.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            recentContests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                <Trophy size={32} style={{ margin: '0 auto 10px', color: 'var(--text-muted)' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No contests scheduled yet</p>
                <p style={{ fontSize: '0.82rem', margin: '4px 0 16px' }}>Schedule a proctored assessment for candidates.</p>
                <Link href="/instructor/contests/create" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Create Contest
                </Link>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Contest Title</th>
                    <th>Duration</th>
                    <th>Questions</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentContests.map((c: any) => (
                    <tr key={c._id}>
                      <td>
                        <Link href={`/contests/${c._id}`} className={styles.problemTitleLink}>
                          {c.title}
                        </Link>
                      </td>
                      <td style={{ color: '#c9d1d9' }}>{c.durationMinutes || 60} mins</td>
                      <td style={{ color: '#c9d1d9' }}>{c.problems?.length || 0} Questions</td>
                      <td>
                        <span className={c.isPublished ? styles.statusPublished : styles.statusDraft}>
                          {c.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/contests/${c._id}`}
                          style={{ color: 'var(--accent-green)', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          Launch Exam <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Right Column: Creator Studio & AI Assistant */}
        <div>
          {/* Creator Studio Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <Layers size={16} style={{ color: 'var(--accent-green)' }} />
                Content Studio Hub
              </div>
            </div>

            <div className={styles.studioList}>
              <Link href="/instructor/problems/create" className={styles.studioItem}>
                <div className={styles.studioIcon} style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  <Code2 size={18} />
                </div>
                <div className={styles.studioText}>
                  <div className={styles.studioTitle}>Problem Authoring</div>
                  <div className={styles.studioDesc}>Create challenges with test cases &amp; starter code</div>
                </div>
                <ChevronRight size={14} className={styles.studioArrow} />
              </Link>

              <Link href="/instructor/contests/create" className={styles.studioItem}>
                <div className={styles.studioIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                  <Trophy size={18} />
                </div>
                <div className={styles.studioText}>
                  <div className={styles.studioTitle}>Contest Orchestrator</div>
                  <div className={styles.studioDesc}>Schedule proctored assessments &amp; exam windows</div>
                </div>
                <ChevronRight size={14} className={styles.studioArrow} />
              </Link>

            </div>
          </div>

          {/* AI Academic Insights */}
          <div className={styles.aiInsightBox}>
            <div className={styles.aiInsightHeader}>
              <Cpu size={16} />
              Automated AI Evaluation Engine
            </div>
            <p className={styles.aiInsightText}>
              Every student submission is dynamically benchmarked against edge cases. When candidates struggle with conceptual hurdles (e.g. recursion, dynamic programming), AI generates tailored course recommendations instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
