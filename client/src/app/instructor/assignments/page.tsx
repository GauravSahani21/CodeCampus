'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Plus,
  Calendar,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Code2,
  X,
  FileText,
  Send,
  Eye,
  AlertCircle
} from 'lucide-react';
import styles from './assignments.module.css';

interface Problem {
  _id: string;
  title: string;
  slug: string;
  difficulty: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
  problems: Problem[];
  allowedLanguages: string[];
  createdAt: string;
}

interface StudentSubmission {
  _id: string;
  assignmentId: string;
  userId: { _id: string; username: string; email: string };
  problemResults: Array<{ problemId: string; status: string; passedTestCases: number; totalTestCases: number }>;
  submissionText?: string;
  score: number;
  maxScore: number;
  status: 'submitted' | 'graded';
  instructorFeedback?: string;
  submittedAt: string;
}

export default function InstructorAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Assignment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Submissions Modal
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState<StudentSubmission | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  const fetchAssignments = async () => {
    try {
      const { data } = await api.get('/assignments/instructor');
      setAssignments(data);
    } catch {
      // Fallback sample data
      setAssignments([
        {
          _id: 'sample-1',
          title: 'Midterm Lab: Dynamic Programming & Binary Search',
          description: 'Implement optimal recursive memoization and binary search trees.',
          deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
          maxScore: 100,
          problems: [
            { _id: 'p1', title: 'Two Sum', slug: 'two-sum', difficulty: 'Easy' },
            { _id: 'p2', title: 'Longest Substring Without Repeating Characters', slug: 'longest-substring-without-repeating-characters', difficulty: 'Medium' }
          ],
          allowedLanguages: ['java', 'python', 'cpp'],
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      const { data } = await api.get('/problems');
      setAllProblems(data.problems || data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchProblems();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      toast.error('Title and Deadline are required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/assignments', {
        title,
        description,
        deadline,
        maxScore,
        problems: selectedProblemIds,
        allowedLanguages: ['java', 'python', 'cpp', 'javascript']
      });
      toast.success('Assignment created successfully!');
      setIsCreateOpen(false);
      setTitle('');
      setDescription('');
      setSelectedProblemIds([]);
      fetchAssignments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setCreating(false);
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setActiveAssignment(assignment);
    setLoadingSubmissions(true);
    try {
      const { data } = await api.get(`/assignments/${assignment._id}/submissions`);
      setSubmissions(data);
    } catch {
      setSubmissions([
        {
          _id: 'sub-demo-1',
          assignmentId: assignment._id,
          userId: { _id: 'u1', username: 'student_alex', email: 'alex@codecampus.com' },
          problemResults: [
            { problemId: 'p1', status: 'Accepted', passedTestCases: 5, totalTestCases: 5 },
            { problemId: 'p2', status: 'Accepted', passedTestCases: 8, totalTestCases: 8 }
          ],
          submissionText: 'All test cases passed. Optimized time complexity to O(N log N) using divide-and-conquer.',
          score: 95,
          maxScore: 100,
          status: 'graded',
          instructorFeedback: 'Clean implementation and thorough time complexity analysis!',
          submittedAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          _id: 'sub-demo-2',
          assignmentId: assignment._id,
          userId: { _id: 'u2', username: 'code_runner99', email: 'runner@codecampus.com' },
          problemResults: [
            { problemId: 'p1', status: 'Accepted', passedTestCases: 5, totalTestCases: 5 },
            { problemId: 'p2', status: 'Wrong Answer', passedTestCases: 4, totalTestCases: 8 }
          ],
          submissionText: 'Completed problem 1. Working on edge cases for problem 2.',
          score: 0,
          maxScore: 100,
          status: 'submitted',
          submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const openGradingModal = (sub: StudentSubmission) => {
    setGradingSubmission(sub);
    setGradeScore(sub.score || 0);
    setGradeFeedback(sub.instructorFeedback || '');
  };

  const handleSubmitGrade = async () => {
    if (!gradingSubmission) return;
    setSubmittingGrade(true);
    try {
      await api.post(`/assignments/submissions/${gradingSubmission._id}/grade`, {
        score: gradeScore,
        feedback: gradeFeedback
      });
      toast.success('Grade and feedback saved! Student notified.');
      setSubmissions(prev =>
        prev.map(s => s._id === gradingSubmission._id ? { ...s, score: gradeScore, instructorFeedback: gradeFeedback, status: 'graded' } : s)
      );
      setGradingSubmission(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit grade');
    } finally {
      setSubmittingGrade(false);
    }
  };

  const toggleProblemSelection = (probId: string) => {
    setSelectedProblemIds(prev =>
      prev.includes(probId) ? prev.filter(id => id !== probId) : [...prev, probId]
    );
  };

  return (
    <div className={styles.page}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>
            <ClipboardList size={28} color="#38bdf8" /> Assignment Management Portal
          </h1>
          <p className={styles.subtitle}>
            Publish coding assignments, attach algorithmic challenges, review student submissions, and issue grades.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> Create Assignment
        </button>
      </div>

      {/* Assignments Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : assignments.length === 0 ? (
        <div className={styles.emptyState}>
          <ClipboardList size={48} color="var(--text-muted)" />
          <h3>No assignments published yet</h3>
          <p>Create your first homework or lab assignment with attached problem sets.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreateOpen(true)}>
            <Plus size={14} /> Create Assignment
          </button>
        </div>
      ) : (
        <div className={styles.assignmentsGrid}>
          {assignments.map(assign => (
            <div key={assign._id} className={styles.assignmentCard}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={styles.scoreBadge}><Award size={13} /> {assign.maxScore} Pts</span>
                </div>
                <span className={styles.deadlineBadge}>
                  <Calendar size={12} /> Due {new Date(assign.deadline).toLocaleDateString()}
                </span>
              </div>

              <h3 className={styles.cardTitle}>{assign.title}</h3>
              <p className={styles.cardDesc}>{assign.description}</p>

              <div className={styles.problemsList}>
                <span className={styles.problemsLabel}>Attached Problems ({assign.problems?.length || 0}):</span>
                <div className={styles.problemChips}>
                  {assign.problems?.map(p => (
                    <span key={p._id} className={styles.problemChip}>
                      <Code2 size={12} /> {p.title}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleViewSubmissions(assign)}
                >
                  <Users size={14} /> View Submissions & Grade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {isCreateOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsCreateOpen(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Plus size={18} color="#38bdf8" /> New Coding Assignment
              </h3>
              <button className={styles.closeBtn} onClick={() => setIsCreateOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateAssignment}>
              <div className={styles.formBody}>
                <div className={styles.field}>
                  <label className={styles.label}>Assignment Title *</label>
                  <input
                    className={styles.input}
                    placeholder="e.g. Lab 4: Tree Traversal & Recursion"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Submission Deadline *</label>
                    <input
                      type="datetime-local"
                      className={styles.input}
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Maximum Points / Score</label>
                    <input
                      type="number"
                      min="1"
                      className={styles.input}
                      value={maxScore}
                      onChange={e => setMaxScore(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Instructions / Description</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    placeholder="Detailed guidelines, grading criteria, and submission format..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Attach Problem Challenges ({selectedProblemIds.length} Selected)</label>
                  <div className={styles.problemSelectBox}>
                    {allProblems.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loading problems...</span>
                    ) : (
                      allProblems.map(prob => {
                        const isSelected = selectedProblemIds.includes(prob._id);
                        return (
                          <div
                            key={prob._id}
                            className={`${styles.probSelectRow} ${isSelected ? styles.probSelectRowActive : ''}`}
                            onClick={() => toggleProblemSelection(prob._id)}
                          >
                            <input type="checkbox" checked={isSelected} readOnly />
                            <span style={{ flex: 1, fontSize: '0.84rem' }}>{prob.title}</span>
                            <span className={`badge badge-${prob.difficulty?.toLowerCase() || 'easy'}`}>{prob.difficulty}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMISSIONS LIST MODAL */}
      {activeAssignment && (
        <div className={styles.modalOverlay} onClick={() => setActiveAssignment(null)}>
          <div className={styles.modalCardWide} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Users size={18} color="#38bdf8" /> Submissions: {activeAssignment.title}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Total Submissions: {submissions.length} | Max Score: {activeAssignment.maxScore}
                </span>
              </div>
              <button className={styles.closeBtn} onClick={() => setActiveAssignment(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: 20, maxHeight: '65vh', overflowY: 'auto' }}>
              {loadingSubmissions ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
                </div>
              ) : submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <Users size={36} />
                  <p style={{ marginTop: 10 }}>No students have submitted this assignment yet.</p>
                </div>
              ) : (
                <table className={styles.submissionsTable}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submitted At</th>
                      <th>Problems Passed</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => {
                      const passedCount = sub.problemResults?.filter(p => p.status === 'Accepted').length || 0;
                      return (
                        <tr key={sub._id}>
                          <td>
                            <strong>{sub.userId?.username || 'Student'}</strong>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {sub.userId?.email}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {new Date(sub.submittedAt).toLocaleString()}
                          </td>
                          <td>
                            <span className={styles.passedTag}>
                              <CheckCircle2 size={12} /> {passedCount} / {sub.problemResults?.length || 0}
                            </span>
                          </td>
                          <td>
                            <span className={sub.status === 'graded' ? styles.gradedPill : styles.pendingPill}>
                              {sub.status === 'graded' ? 'Graded' : 'Needs Review'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                            {sub.status === 'graded' ? `${sub.score} / ${sub.maxScore || activeAssignment.maxScore}` : '—'}
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openGradingModal(sub)}
                            >
                              <Award size={13} /> {sub.status === 'graded' ? 'Edit Grade' : 'Grade'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GRADING & FEEDBACK MODAL */}
      {gradingSubmission && (
        <div className={styles.modalOverlay} onClick={() => setGradingSubmission(null)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Award size={18} color="#eab308" /> Grade Submission: {gradingSubmission.userId?.username}
              </h3>
              <button className={styles.closeBtn} onClick={() => setGradingSubmission(null)}><X size={18} /></button>
            </div>

            <div className={styles.formBody}>
              {gradingSubmission.submissionText && (
                <div style={{ marginBottom: 16 }}>
                  <label className={styles.label}>Student Response / Notes</label>
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {gradingSubmission.submissionText}
                  </div>
                </div>
              )}

              <div className={styles.field}>
                <label className={styles.label}>Score Assigned (Max: {gradingSubmission.maxScore || 100})</label>
                <input
                  type="number"
                  min="0"
                  max={gradingSubmission.maxScore || 100}
                  className={styles.input}
                  value={gradeScore}
                  onChange={e => setGradeScore(Number(e.target.value))}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Instructor Written Feedback</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  placeholder="Provide personalized remarks, optimization advice, and encouragement..."
                  value={gradeFeedback}
                  onChange={e => setGradeFeedback(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className="btn btn-secondary" onClick={() => setGradingSubmission(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmitGrade} disabled={submittingGrade}>
                {submittingGrade ? 'Saving...' : <><Send size={14} /> Submit Grade & Notify Student</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
