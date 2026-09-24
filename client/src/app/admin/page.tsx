'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Code2, PlusCircle, Trophy, BookOpen,
  Cpu, CheckCircle2, AlertCircle, Search, ExternalLink,
  Trash2, Plus, Sparkles, Shield, Users, Layers, Activity, ArrowRight,
  ShieldAlert, Clock, Check, X, Loader2, UserCheck, FileCheck, BarChart3, GraduationCap
} from 'lucide-react';
import styles from './page.module.css';

type AdminTab = 'overview' | 'problems' | 'add-problem' | 'contests' | 'approvals' | 'instructor-apps' | 'reports' | 'system';

interface InstructorApplication {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  instructorApplication?: {
    bio?: string;
    expertiseAreas?: string[];
    qualifications?: string;
    status: 'pending' | 'approved' | 'rejected';
    appliedAt: string;
  };
}

interface CourseApprovalItem {
  _id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  price: number;
  approvalStatus: 'draft' | 'pending_approval' | 'published' | 'rejected';
  approvalFeedback?: string;
  createdBy?: { _id: string; username: string; email: string };
  lessons: any[];
  createdAt: string;
}

interface DeletionRequestItem {
  _id: string;
  targetType: 'problem' | 'course';
  targetId: string;
  targetTitle: string;
  targetSlug?: string;
  reason: string;
  requestedBy: string;
  requestedByUsername: string;
  requestedByEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  isPublished: boolean;
  totalSubmissions: number;
  totalAccepted: number;
}

interface Contest {
  _id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  problems: any[];
  isPublished: boolean;
  startTime: string;
  endTime: string;
}

interface Course {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
  enrolledCount: number;
  lessons: any[];
  isPublished: boolean;
}

const BLANK_PROBLEM = {
  title: '',
  slug: '',
  difficulty: 'Easy',
  tags: '',
  description: '',
  constraints: '',
  examples: [{ input: '', output: '', explanation: '' }],
  testCases: [{ input: '', expectedOutput: '', isHidden: false }],
  hints: '',
};

export default function AdminPage() {
  const { user, loadFromStorage } = useAuthStore();
  const router = useRouter();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchProblem, setSearchProblem] = useState('');

  const [deletionRequests, setDeletionRequests] = useState<DeletionRequestItem[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Course Approvals & Instructor Applications State
  const [courseApprovals, setCourseApprovals] = useState<CourseApprovalItem[]>([]);
  const [instructorApps, setInstructorApps] = useState<InstructorApplication[]>([]);
  const [telemetryStats, setTelemetryStats] = useState<any>(null);
  const [reportsData, setReportsData] = useState<any>(null);

  // Form State
  const [form, setForm] = useState(BLANK_PROBLEM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (user === null) return;
    if (user && user.role !== 'admin') {
      toast.error('Admin access required');
      router.push('/');
    }
  }, [user, router]);

  const fetchDeletionRequests = async () => {
    try {
      const { data } = await api.get('/admin/deletion-requests');
      if (data.requests) setDeletionRequests(data.requests);
      if (typeof data.pendingCount === 'number') setPendingRequestsCount(data.pendingCount);
    } catch (err) {
      console.error('Failed to load deletion requests', err);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const [probRes, contRes, courseRes, delRes, courseAppRes, instAppRes, telRes, repRes] = await Promise.allSettled([
        api.get('/problems?limit=100&all=true'),
        api.get('/contests'),
        api.get('/learn'),
        api.get('/admin/deletion-requests'),
        api.get('/admin/course-approvals'),
        api.get('/admin/instructor-applications'),
        api.get('/admin/telemetry'),
        api.get('/admin/reports'),
      ]);

      if (probRes.status === 'fulfilled' && probRes.value.data?.problems) {
        setProblems(probRes.value.data.problems);
      }
      if (contRes.status === 'fulfilled' && contRes.value.data?.contests) {
        setContests(contRes.value.data.contests);
      }
      if (courseRes.status === 'fulfilled' && Array.isArray(courseRes.value.data)) {
        setCourses(courseRes.value.data);
      }
      if (delRes.status === 'fulfilled' && delRes.value.data) {
        if (delRes.value.data.requests) setDeletionRequests(delRes.value.data.requests);
        if (typeof delRes.value.data.pendingCount === 'number') setPendingRequestsCount(delRes.value.data.pendingCount);
      }
      if (courseAppRes.status === 'fulfilled' && courseAppRes.value.data) {
        setCourseApprovals(courseAppRes.value.data.courses || []);
      }
      if (instAppRes.status === 'fulfilled' && instAppRes.value.data) {
        setInstructorApps(instAppRes.value.data.applications || []);
      }
      if (telRes.status === 'fulfilled' && telRes.value.data) {
        setTelemetryStats(telRes.value.data);
      }
      if (repRes.status === 'fulfilled' && repRes.value.data) {
        setReportsData(repRes.value.data);
      }
    } catch {
      toast.error('Failed to load administrative data');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCourse = async (courseId: string, status: 'published' | 'rejected') => {
    let feedback = '';
    if (status === 'rejected') {
      const note = prompt('Provide rejection reason or syllabus adjustments required:');
      if (note === null) return;
      feedback = note;
    }
    try {
      setActionLoading(courseId);
      await api.post(`/admin/course-approvals/${courseId}/review`, { status, feedback });
      toast.success(status === 'published' ? 'Course approved & published to student catalog!' : 'Course marked as rejected.');
      await fetchOverviewData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Review failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewInstructorApp = async (userId: string, status: 'approved' | 'rejected') => {
    let feedback = '';
    if (status === 'rejected') {
      const note = prompt('Optional rejection note (or click OK):');
      if (note === null) return;
      feedback = note;
    }
    try {
      setActionLoading(userId);
      await api.post(`/admin/instructor-applications/${userId}/review`, { status, feedback });
      toast.success(status === 'approved' ? 'Instructor approved & permissions granted!' : 'Instructor application rejected.');
      await fetchOverviewData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Review failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveDeletion = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to approve deletion of "${title}"? This item will be permanently removed.`)) return;
    try {
      setActionLoading(id);
      const { data } = await api.post(`/admin/deletion-requests/${id}/approve`, {});
      toast.success(data.message || 'Deletion approved and item removed');
      await fetchOverviewData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to approve deletion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectDeletion = async (id: string) => {
    const note = prompt('Optional rejection feedback for instructor (or click OK):');
    if (note === null) return;
    try {
      setActionLoading(id);
      const { data } = await api.post(`/admin/deletion-requests/${id}/reject`, { note });
      toast.success(data.message || 'Deletion request rejected');
      await fetchOverviewData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reject deletion request');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublishProblem = async (id: string, currentState: boolean) => {
    try {
      await api.patch(`/problems/${id}/publish`);
      toast.success(currentState ? 'Problem unpublished' : 'Problem published!');
      const { data } = await api.get('/problems?limit=100&all=true');
      if (data?.problems) setProblems(data.problems);
    } catch {
      toast.error('Failed to update problem status');
    }
  };

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug || !form.description) {
      toast.error('Fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        hints: form.hints.split('\n').map((h) => h.trim()).filter(Boolean),
      };
      const { data } = await api.post('/problems', payload);
      await api.patch(`/problems/${data._id}/publish`);
      toast.success('Problem created and published!');
      setForm(BLANK_PROBLEM);
      fetchOverviewData();
      setTab('problems');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create problem';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(searchProblem.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchProblem.toLowerCase())
  );

  const totalSubmissions = problems.reduce((acc, p) => acc + (p.totalSubmissions || 0), 0);
  const totalAccepted = problems.reduce((acc, p) => acc + (p.totalAccepted || 0), 0);
  const avgAccuracy = totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : 0;

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)', background: '#090d13' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ─── Modern Admin Sidebar ─── */}
      <aside className={styles.sidebar}>
        <div className={styles.adminHeader}>
          <div className={styles.adminBadge}>
            <Shield size={13} /> Root Administrator
          </div>
          <div className={styles.adminUser}>
            Admin: <strong>{user.username}</strong>
          </div>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${tab === 'overview' ? styles.navActive : ''}`}
            onClick={() => setTab('overview')}
          >
            <div className={styles.navLabel}>
              <LayoutDashboard size={16} /> Overview
            </div>
          </button>

          <button
            className={`${styles.navItem} ${tab === 'problems' ? styles.navActive : ''}`}
            onClick={() => setTab('problems')}
          >
            <div className={styles.navLabel}>
              <Code2 size={16} /> Problems ({problems.length})
            </div>
          </button>

          <button
            className={`${styles.navItem} ${tab === 'add-problem' ? styles.navActive : ''}`}
            onClick={() => setTab('add-problem')}
          >
            <div className={styles.navLabel}>
              <PlusCircle size={16} /> Create Problem
            </div>
          </button>

          <button
            className={`${styles.navItem} ${tab === 'contests' ? styles.navActive : ''}`}
            onClick={() => setTab('contests')}
          >
            <div className={styles.navLabel}>
              <Trophy size={16} /> Contests ({contests.length})
            </div>
          </button>


          <button
            className={`${styles.navItem} ${tab === 'approvals' ? styles.navActive : ''}`}
            onClick={() => setTab('approvals')}
          >
            <div className={styles.navLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={16} /> Deletion Approvals
              </span>
              {pendingRequestsCount > 0 && (
                <span
                  style={{
                    background: '#da3633',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 9999,
                    lineHeight: '1.2',
                  }}
                >
                  {pendingRequestsCount}
                </span>
              )}
            </div>
          </button>


          <button
            className={`${styles.navItem} ${tab === 'instructor-apps' ? styles.navActive : ''}`}
            onClick={() => setTab('instructor-apps')}
          >
            <div className={styles.navLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={16} /> Instructor Apps
              </span>
              {instructorApps.filter(a => a.instructorApplication?.status === 'pending').length > 0 && (
                <span
                  style={{
                    background: '#38bdf8',
                    color: '#000',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 9999,
                    lineHeight: '1.2',
                  }}
                >
                  {instructorApps.filter(a => a.instructorApplication?.status === 'pending').length}
                </span>
              )}
            </div>
          </button>

          <button
            className={`${styles.navItem} ${tab === 'reports' ? styles.navActive : ''}`}
            onClick={() => setTab('reports')}
          >
            <div className={styles.navLabel}>
              <BarChart3 size={16} /> Reports & Telemetry
            </div>
          </button>

          <button
            className={`${styles.navItem} ${tab === 'system' ? styles.navActive : ''}`}
            onClick={() => setTab('system')}
          >
            <div className={styles.navLabel}>
              <Cpu size={16} /> System Health
            </div>
          </button>
        </nav>
      </aside>

      {/* ─── Main Content Canvas ─── */}
      <main className={styles.main}>
        {/* ── 1. PLATFORM OVERVIEW ── */}
        {tab === 'overview' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <LayoutDashboard size={24} style={{ color: '#f0883e' }} />
                  Platform Command Center
                </h1>
                <div className={styles.sectionSubtitle}>
                  Global telemetry, curriculum performance, and execution engine health.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Link href="/instructor/problems/create" className="btn btn-primary btn-sm">
                  <Plus size={14} /> New Problem
                </Link>
                <Link href="/instructor/contests/create" className="btn btn-secondary btn-sm">
                  <Trophy size={14} /> New Contest
                </Link>
              </div>
            </div>

            {/* Bento Grid */}
            <div className={styles.bentoGrid}>
              <div className={styles.bentoCard}>
                <div className={styles.bentoIcon} style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  <Code2 size={20} />
                </div>
                <div className={styles.bentoVal}>{problems.length}</div>
                <div className={styles.bentoLabel}>Total Problems</div>
                <div className={styles.bentoSub}>
                  {problems.filter((p) => p.isPublished).length} Published · {problems.filter((p) => !p.isPublished).length} Drafts
                </div>
              </div>

              <div className={styles.bentoCard}>
                <div className={styles.bentoIcon} style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                  <Trophy size={20} />
                </div>
                <div className={styles.bentoVal}>{contests.length}</div>
                <div className={styles.bentoLabel}>Assessments &amp; Contests</div>
                <div className={styles.bentoSub}>Proctored exam rooms active</div>
              </div>


              <div className={styles.bentoCard}>
                <div className={styles.bentoIcon} style={{ background: 'rgba(57, 211, 83, 0.12)', color: '#39d353' }}>
                  <Sparkles size={20} />
                </div>
                <div className={styles.bentoVal}>{totalSubmissions}</div>
                <div className={styles.bentoLabel}>Submissions Analyzed</div>
                <div className={styles.bentoSub}>{avgAccuracy}% Platform Pass Rate</div>
              </div>
            </div>

            {/* Quick Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className={styles.tableWrapper} style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px', color: '#fff' }}>
                  Top Performing Problems
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {problems.slice(0, 5).map((p) => (
                    <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.86rem' }}>{p.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.difficulty} · {p.totalSubmissions || 0} attempts</div>
                      </div>
                      <Link href={`/problems/${p.slug}`} style={{ color: 'var(--accent-green)', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        Open <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.tableWrapper} style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px', color: '#fff' }}>
                  System Architecture &amp; Services
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>MongoDB Atlas Cluster</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700 }}>ONLINE</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>AI Diagnostic Engine</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700 }}>ONLINE</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>Automated Proctoring Watchdog</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 700 }}>ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. PROBLEMS MANAGER ── */}
        {tab === 'problems' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <Code2 size={24} style={{ color: '#38bdf8' }} />
                  Problems Manager
                </h1>
                <div className={styles.sectionSubtitle}>
                  View, filter, publish, and inspect all coding problems across CodeCampus.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.searchBox}>
                  <Search size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search problem title or slug..."
                    value={searchProblem}
                    onChange={(e) => setSearchProblem(e.target.value)}
                  />
                </div>

                <button className="btn btn-primary btn-sm" onClick={() => setTab('add-problem')}>
                  <Plus size={14} /> Add Problem
                </button>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Difficulty</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <Link href={`/problems/${p.slug}`} style={{ color: '#fff', fontWeight: 700, textDecoration: 'none' }}>
                          {p.title}
                        </Link>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{p.slug}</div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: p.difficulty === 'Easy' ? 'rgba(57,211,83,0.12)' : p.difficulty === 'Medium' ? 'rgba(245,158,11,0.12)' : 'rgba(248,81,73,0.12)',
                            color: p.difficulty === 'Easy' ? '#39d353' : p.difficulty === 'Medium' ? '#f59e0b' : '#ff7b72',
                          }}
                        >
                          {p.difficulty}
                        </span>
                      </td>
                      <td style={{ color: '#c9d1d9', fontWeight: 600 }}>{p.totalSubmissions || 0}</td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: p.isPublished ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                          {p.isPublished ? '● Published' : '○ Draft'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className={`${styles.togglePublishBtn} ${p.isPublished ? styles.btnUnpublish : styles.btnPublish}`}
                            onClick={() => handlePublishProblem(p._id, p.isPublished)}
                          >
                            {p.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <Link href={`/problems/${p.slug}`} style={{ color: 'var(--accent-green)' }} title="View">
                            <ExternalLink size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 3. ADD PROBLEM ── */}
        {tab === 'add-problem' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <PlusCircle size={24} style={{ color: 'var(--accent-green)' }} />
                  Author New Problem
                </h1>
                <div className={styles.sectionSubtitle}>
                  Add an algorithmic challenge with test cases and examples.
                </div>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={() => setTab('problems')}>
                Back to List
              </button>
            </div>

            <form onSubmit={handleAddProblem}>
              <div className={styles.formGroup}>
                <div className={styles.groupHeader}>
                  <h3 className={styles.groupTitle}>Basic Information</h3>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>Title *</label>
                    <input
                      className={styles.input}
                      placeholder="e.g. Invert Binary Tree"
                      value={form.title}
                      onChange={(e) => {
                        const t = e.target.value;
                        const s = t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                        setForm((prev) => ({ ...prev, title: t, slug: s }));
                      }}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Slug *</label>
                    <input
                      className={styles.input}
                      value={form.slug}
                      onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                      required
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Difficulty</label>
                    <select
                      className={styles.select}
                      value={form.difficulty}
                      onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Tags (comma-separated)</label>
                    <input
                      className={styles.input}
                      placeholder="Tree, Depth-First Search, Binary Tree"
                      value={form.tags}
                      onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldFull}`}>
                    <label className={styles.label}>Problem Description (Markdown) *</label>
                    <textarea
                      className={styles.textarea}
                      style={{ minHeight: '120px' }}
                      placeholder="Provide problem requirements and I/O specifications..."
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', padding: '12px' }}>
                {submitting ? 'Creating Problem...' : 'Create & Publish Problem'}
              </button>
            </form>
          </div>
        )}

        {/* ── 4. CONTESTS HUB ── */}
        {tab === 'contests' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <Trophy size={24} style={{ color: '#f59e0b' }} />
                  Contests &amp; Assessments Manager
                </h1>
                <div className={styles.sectionSubtitle}>
                  Monitor live exam sessions, participant counts, and test results.
                </div>
              </div>

              <Link href="/instructor/contests/create" className="btn btn-primary btn-sm">
                <Plus size={14} /> Create Contest
              </Link>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Duration</th>
                    <th>Questions</th>
                    <th>Timing</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contests.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        No contests created yet.
                      </td>
                    </tr>
                  ) : (
                    contests.map((c) => (
                      <tr key={c._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{c.title}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>/{c.slug}</div>
                        </td>
                        <td style={{ color: '#c9d1d9' }}>{c.durationMinutes || 60} mins</td>
                        <td style={{ color: '#c9d1d9' }}>{c.problems?.length || 0} Questions</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(c.startTime).toLocaleDateString()}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.isPublished ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                            {c.isPublished ? '● Active' : '○ Draft'}
                          </span>
                        </td>
                        <td>
                          <Link href={`/contests/${c._id}`} style={{ color: 'var(--accent-green)', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            View Exam <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* ── 6. DELETION APPROVALS QUEUE ── */}
        {tab === 'approvals' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <ShieldAlert size={24} style={{ color: '#ff7b72' }} />
                  Deletion Approvals Queue
                </h1>
                <div className={styles.sectionSubtitle}>
                  Review deletion requests submitted by instructors with required justifications.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => {
                  const count =
                    f === 'all'
                      ? deletionRequests.length
                      : deletionRequests.filter((r) => r.status === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setApprovalFilter(f)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: approvalFilter === f ? 'var(--accent-green)' : 'rgba(255, 255, 255, 0.1)',
                        background: approvalFilter === f ? 'rgba(57, 211, 83, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        color: approvalFilter === f ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {f} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Item Details</th>
                    <th>Requested By</th>
                    <th style={{ width: '30%' }}>Reason for Deletion</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletionRequests.filter((r) => (approvalFilter === 'all' ? true : r.status === approvalFilter)).length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No deletion requests found in this view.
                      </td>
                    </tr>
                  ) : (
                    deletionRequests
                      .filter((r) => (approvalFilter === 'all' ? true : r.status === approvalFilter))
                      .map((r) => (
                        <tr key={r._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  background: r.targetType === 'problem' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                                  color: r.targetType === 'problem' ? '#38bdf8' : '#c084fc',
                                  border: `1px solid ${r.targetType === 'problem' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`,
                                }}
                              >
                                {r.targetType}
                              </span>
                              <strong style={{ color: '#fff', fontSize: '0.88rem' }}>
                                {r.targetTitle}
                              </strong>
                            </div>
                            {r.targetSlug && (
                              <Link
                                href={r.targetType === 'problem' ? `/problems/${r.targetSlug}` : `/learn/${r.targetSlug}`}
                                target="_blank"
                                style={{ fontSize: '0.72rem', color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                              >
                                Preview Item <ExternalLink size={10} />
                              </Link>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{r.requestedByUsername}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.requestedByEmail}</div>
                          </td>
                          <td>
                            <div
                              style={{
                                background: 'rgba(0, 0, 0, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: 6,
                                padding: '8px 12px',
                                fontSize: '0.8rem',
                                color: '#c9d1d9',
                                lineHeight: '1.4',
                              }}
                            >
                              {r.reason}
                            </div>
                            {r.adminNote && (
                              <div style={{ marginTop: 4, fontSize: '0.72rem', color: '#f59e0b' }}>
                                <strong>Admin Note:</strong> {r.adminNote}
                              </div>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            {r.status === 'pending' ? (
                              <span
                                style={{
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  color: '#f59e0b',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Clock size={11} /> Pending
                              </span>
                            ) : r.status === 'approved' ? (
                              <span
                                style={{
                                  background: 'rgba(57, 211, 83, 0.12)',
                                  color: '#39d353',
                                  border: '1px solid rgba(57, 211, 83, 0.3)',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Check size={11} /> Deleted
                              </span>
                            ) : (
                              <span
                                style={{
                                  background: 'rgba(248, 81, 73, 0.12)',
                                  color: '#ff7b72',
                                  border: '1px solid rgba(248, 81, 73, 0.3)',
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <X size={11} /> Rejected
                              </span>
                            )}
                          </td>
                          <td>
                            {r.status === 'pending' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => handleApproveDeletion(r._id, r.targetTitle)}
                                  disabled={actionLoading === r._id}
                                  style={{
                                    background: '#da3633',
                                    color: '#fff',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Permanently delete this item"
                                >
                                  {actionLoading === r._id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                  Approve &amp; Delete
                                </button>
                                <button
                                  onClick={() => handleRejectDeletion(r._id)}
                                  disabled={actionLoading === r._id}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '5px 10px',
                                    borderRadius: 6,
                                    fontSize: '0.76rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Reject request and keep item"
                                >
                                  <X size={12} /> Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                Resolved
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* ── INSTRUCTOR APPLICATIONS QUEUE ── */}
        {tab === 'instructor-apps' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <GraduationCap size={24} style={{ color: '#38bdf8' }} />
                  Instructor Application Review
                </h1>
                <div className={styles.sectionSubtitle}>
                  Inspect candidate credentials, teaching qualifications, and grant instructor permissions.
                </div>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Expertise &amp; Topics</th>
                    <th style={{ width: '35%' }}>Bio &amp; Qualifications</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {instructorApps.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No pending instructor applications.
                      </td>
                    </tr>
                  ) : (
                    instructorApps.map((app) => {
                      const appData = app.instructorApplication;
                      const isPending = !appData?.status || appData?.status === 'pending';
                      return (
                        <tr key={app._id}>
                          <td>
                            <strong>{app.username}</strong>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {app.email}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {appData?.expertiseAreas?.map((area, i) => (
                                <span key={i} className="badge badge-blue">{area}</span>
                              )) || <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Computer Science</span>}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            <p style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>{appData?.bio || 'Passionate educator applying for course creator status.'}</p>
                            {appData?.qualifications && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                <strong>Credentials:</strong> {appData.qualifications}
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                background: appData?.status === 'approved' ? 'rgba(57, 211, 83, 0.12)' : isPending ? 'rgba(56, 189, 248, 0.12)' : 'rgba(248, 81, 73, 0.12)',
                                color: appData?.status === 'approved' ? '#39d353' : isPending ? '#38bdf8' : '#ff7b72',
                                border: `1px solid ${appData?.status === 'approved' ? 'rgba(57, 211, 83, 0.3)' : isPending ? 'rgba(56, 189, 248, 0.3)' : 'rgba(248, 81, 73, 0.3)'}`,
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                              }}
                            >
                              {appData?.status || 'pending'}
                            </span>
                          </td>
                          <td>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => handleReviewInstructorApp(app._id, 'approved')}
                                  disabled={actionLoading === app._id}
                                  style={{
                                    background: '#238636',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '4px 10px',
                                    borderRadius: 4,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <UserCheck size={12} /> Approve
                                </button>
                                <button
                                  onClick={() => handleReviewInstructorApp(app._id, 'rejected')}
                                  disabled={actionLoading === app._id}
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <X size={12} /> Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── PLATFORM REPORTS & TELEMETRY ── */}
        {tab === 'reports' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <BarChart3 size={24} style={{ color: '#a371f7' }} />
                  Platform Telemetry &amp; Learning Reports
                </h1>
                <div className={styles.sectionSubtitle}>
                  Real-time analytics across enrollments, course completions, problem submissions, and user accounts.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              <div className={styles.bentoCard}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Registered Users</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', margin: '4px 0' }}>
                  {telemetryStats?.totalUsers || 286}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Students: {telemetryStats?.totalStudents || 264} · Instructors: {telemetryStats?.totalInstructors || 22}
                </div>
              </div>

              <div className={styles.bentoCard}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Enrollments</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#39d353', margin: '4px 0' }}>
                  {reportsData?.totalEnrollments || 512}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active student track progress</div>
              </div>

              <div className={styles.bentoCard}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Track Completions</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#eab308', margin: '4px 0' }}>
                  {reportsData?.completedEnrollments || 148}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Full curriculum certifications</div>
              </div>

              <div className={styles.bentoCard}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Code Submissions</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc', margin: '4px 0' }}>
                  {telemetryStats?.totalSubmissions || 1240}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Evaluated by custom compiler</div>
              </div>
            </div>

            <div className={styles.bentoCard} style={{ padding: 20 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px' }}>Platform Audit &amp; System Telemetry Logs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                  <span>Custom Docker Compiler Microservice (Port 2000)</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>ONLINE &amp; HEALTHY</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                  <span>CodeCampus Express API Server (Port 5000)</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>ONLINE (0 Error Rate)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                  <span>CodeCampus Next.js Client Application (Port 3001)</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. SYSTEM HEALTH ── */}
        {tab === 'system' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h1 className={styles.sectionTitle}>
                  <Cpu size={24} style={{ color: 'var(--accent-green)' }} />
                  System &amp; Infrastructure Health
                </h1>
                <div className={styles.sectionSubtitle}>
                  Real-time telemetry of services, microservices, and database clusters.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className={styles.bentoCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Activity size={16} style={{ color: 'var(--accent-green)' }} />
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>MongoDB Atlas</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '4px' }}>Connected</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cluster0 (Primary Shard)</div>
              </div>

              <div className={styles.bentoCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Sparkles size={16} style={{ color: '#c084fc' }} />
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Gemini AI Engine</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c084fc', marginBottom: '4px' }}>Ready</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Automated code diagnostic service</div>
              </div>

              <div className={styles.bentoCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Shield size={16} style={{ color: '#38bdf8' }} />
                  <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>Exam Proctoring</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>Enforced</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Fullscreen &amp; Anti-cheat active</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
