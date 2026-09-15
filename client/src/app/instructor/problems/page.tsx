'use client';
import Link from 'next/link';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus, Search, MoreHorizontal, Edit3, Trash2,
  Eye, CheckCircle2, Clock, AlertCircle, Code2, Globe, FileEdit, Zap, X
} from 'lucide-react';
import DeleteReasonModal from '@/components/Instructor/DeleteReasonModal';
import styles from './problems.module.css';

// ── Types ──────────────────────────────────────────────────────────
interface InstructorProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  testCaseCount: number;
  totalSubmissions?: number;
  submissions?: number;
  passRate: number | null;
  isPublished: boolean;
  status: 'published' | 'draft';
  createdAt: string;
  aiEnabled: boolean;
  deletionStatus?: 'none' | 'pending' | 'rejected';
  deletionReason?: string;
}

export default function InstructorProblemsPage() {
  const [problems, setProblems] = useState<InstructorProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard' | 'draft' | 'published'>('All');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<{ id: string; title: string } | null>(null);

  const loadProblems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/instructor/problems');
      if (data.problems) {
        setProblems(
          data.problems.map((p: any) => ({
            ...p,
            status: p.isPublished ? 'published' : 'draft',
            submissions: p.totalSubmissions || 0,
            createdAt: new Date(p.createdAt).toLocaleDateString(),
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, []);

  const handleRequestDelete = async (reason: string) => {
    if (!deleteModalTarget) return;
    try {
      await api.post(`/instructor/problems/${deleteModalTarget.id}/request-delete`, { reason });
      setProblems((prev) =>
        prev.map((p) =>
          p._id === deleteModalTarget.id
            ? { ...p, deletionStatus: 'pending', deletionReason: reason }
            : p
        )
      );
      toast.success('Deletion request submitted to admin for approval');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit deletion request');
      throw err;
    }
  };

  const handleCancelDelete = async (id: string) => {
    try {
      await api.delete(`/instructor/deletion-requests/${id}/cancel`);
      setProblems((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, deletionStatus: 'none', deletionReason: '' }
            : p
        )
      );
      toast.success('Deletion request cancelled');
      setMenuOpen(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel deletion request');
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      const { data } = await api.patch(`/instructor/problems/${id}/publish`);
      setProblems((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, isPublished: data.isPublished, status: data.isPublished ? 'published' : 'draft' }
            : p
        )
      );
      setMenuOpen(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update publish status');
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.actions}`)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const filtered = problems.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'All' ? true :
      filter === 'draft' || filter === 'published' ? p.status === filter :
      p.difficulty === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Problems</h1>
          <p className={styles.subtitle}>Create and manage coding problems. Students will submit solutions and receive AI-powered feedback.</p>
        </div>
        <Link href="/instructor/problems/create" className={styles.createBtn}>
          <Plus size={15} strokeWidth={2.5} />
          Create Problem
        </Link>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          {(['All', 'Easy', 'Medium', 'Hard', 'published', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`${styles.filterBtn} ${filter === f ? styles.filterBtnActive : ''}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><Code2 size={36} strokeWidth={1.2} /></div>
          <h3>No problems yet</h3>
          <p>Create your first coding problem. You can add a description, examples, test cases, starter code, and enable AI-powered analysis for student submissions.</p>
          <Link href="/instructor/problems/create" className={styles.emptyBtn}>
            <Plus size={15} />
            Create First Problem
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th>Test Cases</th>
                <th>Submissions</th>
                <th>Pass Rate</th>
                <th>AI</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, index) => {
                const isNearBottom = index > 0 && index >= filtered.length - 2 && filtered.length >= 2;
                return (
                <tr key={p._id} className={styles.row}>
                  <td>
                    <Link href={`/instructor/problems/${p._id}/edit`} className={styles.problemTitle}>
                      {p.title}
                    </Link>
                    <div className={styles.problemDate}>{p.createdAt}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                  </td>
                  <td>
                    <div className={styles.tags}>
                      {p.tags.slice(0, 2).map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                  </td>
                  <td className={styles.numCell}>{p.testCaseCount}</td>
                  <td className={styles.numCell}>{(p.submissions ?? 0).toLocaleString()}</td>
                  <td className={styles.numCell}>
                    {p.passRate === null ? (
                      <span className={styles.noData}>—</span>
                    ) : (
                      <span className={p.passRate >= 50 ? styles.passGood : styles.passBad}>
                        {p.passRate}%
                      </span>
                    )}
                  </td>
                  <td>
                    {p.aiEnabled ? (
                      <span className={styles.aiOn} title="AI analysis enabled" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={13} />
                      </span>
                    ) : (
                      <span className={styles.aiOff} title="AI analysis disabled">—</span>
                    )}
                  </td>
                  <td>
                    {p.deletionStatus === 'pending' ? (
                      <span
                        style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#f59e0b',
                          padding: '3px 8px',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        title={`Reason: ${p.deletionReason || 'Pending administrator review'}`}
                      >
                        <Clock size={11} /> Deletion Pending
                      </span>
                    ) : (
                      <span className={`${styles.statusBadge} ${styles['status_' + p.status]}`}>
                        {p.status === 'published' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                        {p.status}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actions} style={{ position: 'relative' }}>
                      <button
                        className={`${styles.menuBtn} ${menuOpen === p._id ? styles.menuBtnActive : ''}`}
                        onClick={() => setMenuOpen(menuOpen === p._id ? null : p._id)}
                        title="Actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen === p._id && (
                        <div className={`${styles.dropdown} ${isNearBottom ? styles.dropdownUp : ''}`}>
                          <Link href={`/problems/${p.slug}`} className={styles.dropdownItem} target="_blank">
                            <Eye size={14} /> Preview
                          </Link>
                          <button
                            className={styles.dropdownItem}
                            onClick={() => handleTogglePublish(p._id)}
                            disabled={p.deletionStatus === 'pending'}
                          >
                            <Globe size={14} /> {p.isPublished ? 'Unpublish (Draft)' : 'Publish'}
                          </button>
                          {p.deletionStatus === 'pending' ? (
                            <button
                              className={styles.dropdownItem}
                              onClick={() => handleCancelDelete(p._id)}
                              style={{ color: '#f59e0b' }}
                            >
                              <X size={14} /> Cancel Deletion Request
                            </button>
                          ) : (
                            <button
                              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                              onClick={() => {
                                setDeleteModalTarget({ id: p._id, title: p.title });
                                setMenuOpen(null);
                              }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Deletion Request Modal */}
      <DeleteReasonModal
        isOpen={!!deleteModalTarget}
        onClose={() => setDeleteModalTarget(null)}
        onSubmit={handleRequestDelete}
        itemType="problem"
        itemTitle={deleteModalTarget?.title || ''}
      />
    </div>
  );
}
