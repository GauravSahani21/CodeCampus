'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  FileCheck2, Clock, Calendar, CheckCircle2,
  AlertCircle, ChevronRight, Code2, ArrowRight,
  Sparkles, MessageSquare, Send, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './assignments.module.css';

export default function StudentAssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');

  // Modal for submitting assignment
  const [selectedAssign, setSelectedAssign] = useState<any | null>(null);
  const [textSubmission, setTextSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(data || []);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssign) return;
    setSubmitting(true);
    try {
      await api.post(`/assignments/${selectedAssign._id}/submit`, {
        textSubmission,
      });
      toast.success('Assignment submitted successfully!');
      setSelectedAssign(null);
      setTextSubmission('');
      fetchAssignments();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assignments.filter((a) => {
    const sub = a.mySubmission;
    if (filter === 'all') return true;
    if (filter === 'pending') return !sub || sub.status === 'pending';
    if (filter === 'submitted') return sub && (sub.status === 'submitted' || sub.status === 'late');
    if (filter === 'graded') return sub && sub.status === 'graded';
    return true;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          <FileCheck2 size={24} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: '#38bdf8' }} />
          My Coursework & Assignments
        </h1>
        <p className={styles.subtitle}>
          Complete assigned coding problem sets, review instructions, and track your evaluation scores.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filtersRow}>
        {(['all', 'pending', 'submitted', 'graded'] as const).map((tab) => (
          <button
            key={tab}
            className={`${styles.filterBtn} ${filter === tab ? styles.filterBtnActive : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Assignment List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: '#161b22', border: '1px dashed #30363d', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <FileCheck2 size={40} color="#8b949e" style={{ marginBottom: 12 }} />
          <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: 6 }}>No assignments found</h3>
          <p style={{ color: '#8b949e', fontSize: '0.85rem' }}>
            There are currently no assignments matching the selected filter.
          </p>
        </div>
      ) : (
        <div className={styles.assignmentsList}>
          {filtered.map((a) => {
            const sub = a.mySubmission;
            const dueDate = new Date(a.dueDate);
            const isOverdue = new Date() > dueDate;
            let statusLabel = 'Pending';
            let statusClass = styles.statusPending;

            if (sub) {
              if (sub.status === 'graded') {
                statusLabel = 'Graded';
                statusClass = styles.statusGraded;
              } else {
                statusLabel = sub.status === 'late' ? 'Submitted Late' : 'Submitted';
                statusClass = styles.statusSubmitted;
              }
            } else if (isOverdue) {
              statusLabel = 'Overdue';
            }

            return (
              <div key={a._id} className={styles.assignmentCard}>
                <div className={styles.cardLeft}>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.statusBadge} ${statusClass}`}>{statusLabel}</span>
                    <span style={{ fontSize: '0.75rem', color: '#8b949e', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> Due {dueDate.toLocaleDateString()}
                    </span>
                    {a.instructorId && (
                      <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                        • Assigned by <strong style={{ color: '#c9d1d9' }}>{a.instructorId.username}</strong>
                      </span>
                    )}
                  </div>

                  <h2 className={styles.cardTitle}>{a.title}</h2>
                  <p className={styles.cardDesc}>{a.description}</p>

                  {/* Attached problems */}
                  {a.problemIds && a.problemIds.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: 6, fontWeight: 600 }}>
                        Required Problem Set:
                      </div>
                      <div className={styles.problemPills}>
                        {a.problemIds.map((prob: any) => (
                          <Link key={prob._id} href={`/problems/${prob.slug}`} className={styles.problemPill}>
                            <Code2 size={13} />
                            <span>{prob.title}</span>
                            <span style={{ fontSize: '0.68rem', color: '#8b949e' }}>({prob.difficulty})</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructor Feedback */}
                  {sub && sub.instructorFeedback && (
                    <div style={{ marginTop: 14, background: 'rgba(57, 211, 83, 0.06)', border: '1px solid rgba(57, 211, 83, 0.25)', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#39d353', marginBottom: 2 }}>
                        Instructor Feedback:
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#e6edf3' }}>
                        {sub.instructorFeedback}
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.cardRight}>
                  <div className={styles.scoreBox}>
                    <div className={styles.scoreValue}>
                      {sub ? `${sub.score}/${sub.maxScore || a.maxScore}` : `— / ${a.maxScore}`}
                    </div>
                    <div className={styles.scoreLabel}>Evaluation Score</div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSelectedAssign(a);
                      setTextSubmission(sub?.textSubmission || '');
                    }}
                  >
                    {sub ? 'View / Resubmit' : 'Open Submission'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedAssign && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #30363d', paddingBottom: 12 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Submit Assignment: {selectedAssign.title}
              </h3>
              <button
                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                onClick={() => setSelectedAssign(null)}
              >
                <X size={18} />
              </button>
            </div>

            {selectedAssign.instructions && (
              <div style={{ background: '#0d1117', border: '1px solid #21262d', padding: 14, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, marginBottom: 4 }}>
                  INSTRUCTIONS & SUBMISSION GUIDELINES
                </div>
                <div style={{ fontSize: '0.82rem', color: '#8b949e', lineHeight: 1.45 }}>
                  {selectedAssign.instructions}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitAssignment}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#fff', fontWeight: 600, marginBottom: 6 }}>
                Written Solution / Algorithmic Reflection / Source Repository:
              </label>
              <textarea
                rows={6}
                value={textSubmission}
                onChange={(e) => setTextSubmission(e.target.value)}
                placeholder="Explain your approach, any edge cases considered, or paste your solution notes here..."
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#0d1117',
                  border: '1px solid #30363d',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: '0.85rem',
                  marginBottom: 16,
                  resize: 'vertical',
                }}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedAssign(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={submitting}
                >
                  <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
