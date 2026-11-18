'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Trophy, Plus, Search, MoreHorizontal, Trash2, Eye,
  CheckCircle2, Clock, Calendar, Users, ExternalLink, AlertCircle
} from 'lucide-react';
import styles from './contests.module.css';

interface ContestItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  problemsCount: number;
  participantCount: number;
  totalPoints: number;
  aiEvaluationEnabled: boolean;
  isPublished: boolean;
  createdAt: string;
}

export default function InstructorContestsPage() {
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Live' | 'Upcoming' | 'Ended'>('All');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const loadContests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/instructor/contests');
      if (data.contests) {
        setContests(data.contests);
      }
    } catch (err) {
      console.error('Failed to load contests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  const getContestTimingStatus = (startStr: string, endStr: string) => {
    const now = new Date().getTime();
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    if (now < s) return { label: 'Upcoming', class: styles.statusUpcoming };
    if (now >= s && now <= e) return { label: 'Live Now', class: styles.statusLive };
    return { label: 'Ended', class: styles.statusEnded };
  };

  const handleTogglePublish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data } = await api.patch(`/instructor/contests/${id}/publish`);
      setContests((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isPublished: data.isPublished } : c))
      );
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contest and its submissions?')) return;
    try {
      await api.delete(`/instructor/contests/${id}`);
      setContests((prev) => prev.filter((c) => c._id !== id));
      setMenuOpen(null);
    } catch (err) {
      console.error('Failed to delete contest:', err);
      alert('Failed to delete contest');
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.actionCell}`)) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const filtered = contests.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;

    if (filter === 'All') return true;
    const st = getContestTimingStatus(c.startTime, c.endTime).label;
    if (filter === 'Live') return st === 'Live Now';
    if (filter === 'Upcoming') return st === 'Upcoming';
    if (filter === 'Ended') return st === 'Ended';
    return true;
  });

  const liveCount = contests.filter(
    (c) => getContestTimingStatus(c.startTime, c.endTime).label === 'Live Now'
  ).length;
  const totalParticipants = contests.reduce((acc, c) => acc + (c.participantCount || 0), 0);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Coding Contests & Tests</h1>
          <p className={styles.subtitle}>
            Organize coding contests and exams. Students code in a focused plain editor and receive automated test evaluations and rankings.
          </p>
        </div>
        <Link href="/instructor/contests/create" className={styles.createBtn}>
          <Plus size={16} strokeWidth={2.5} />
          Create Contest
        </Link>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statVal}>{contests.length}</span>
          <span className={styles.statLabel}>Total Contests</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statVal} style={{ color: 'var(--accent-green)' }}>
            {liveCount}
          </span>
          <span className={styles.statLabel}>Live Now</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statVal} style={{ color: 'var(--accent-blue)' }}>
            {totalParticipants}
          </span>
          <span className={styles.statLabel}>Total Submissions</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search contests by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          {(['All', 'Live', 'Upcoming', 'Ended'] as const).map((tab) => (
            <button
              key={tab}
              className={`${styles.filterBtn} ${filter === tab ? styles.active : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>
            <Clock size={32} className="animate-spin text-muted" />
            <p className={styles.emptyDesc}>Loading your contests...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Trophy size={28} />
            </div>
            <div className={styles.emptyTitle}>No Contests Found</div>
            <p className={styles.emptyDesc}>
              {search
                ? 'No contests match your search query.'
                : 'You have not created any contests yet. Launch your first exam with question selection and scoring.'}
            </p>
            {!search && (
              <Link href="/instructor/contests/create" className={styles.createBtn}>
                <Plus size={15} /> Create First Contest
              </Link>
            )}
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Contest Details</th>
                <th>Timing & Status</th>
                <th>Problems & Pts</th>
                <th>Submissions</th>
                <th>Visibility</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contest, index) => {
                const statusInfo = getContestTimingStatus(contest.startTime, contest.endTime);
                const isNearBottom = index > 0 && index >= filtered.length - 2 && filtered.length >= 2;
                return (
                  <tr key={contest._id}>
                    <td>
                      <div className={styles.contestTitleWrap}>
                        <Link href={`/contests/${contest.slug}`} className={styles.contestTitle}>
                          {contest.title}
                          <ExternalLink size={12} style={{ opacity: 0.6 }} />
                        </Link>
                        <div className={styles.contestMeta}>
                          <span className={styles.metaItem}>
                            <Clock size={11} /> {contest.durationMinutes} mins
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`${styles.statusBadge} ${statusInfo.class}`}>
                          {statusInfo.label}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(contest.startTime).toLocaleDateString()} –{' '}
                          {new Date(contest.endTime).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.84rem' }}>
                        {contest.problemsCount} Problems
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {contest.totalPoints} Total Pts
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                          {contest.participantCount}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        className={styles.publishBadge}
                        onClick={(e) => handleTogglePublish(contest._id, e)}
                        title="Click to toggle publish status"
                      >
                        {contest.isPublished ? (
                          <>
                            <CheckCircle2 size={13} className={styles.published} />
                            <span className={styles.published}>Published</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={13} className={styles.draft} />
                            <span className={styles.draft}>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        className={`${styles.actionBtn} ${menuOpen === contest._id ? styles.actionBtnActive : ''}`}
                        onClick={() => setMenuOpen(menuOpen === contest._id ? null : contest._id)}
                        title="Actions"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                      {menuOpen === contest._id && (
                        <div className={`${styles.menuDropdown} ${isNearBottom ? styles.menuDropdownUp : ''}`}>
                          <Link href={`/contests/${contest.slug}`} className={styles.menuItem}>
                            <Eye size={13} /> View Exam
                          </Link>
                          <button
                            className={`${styles.menuItem} ${styles.menuItemDanger}`}
                            onClick={() => handleDelete(contest._id)}
                          >
                            <Trash2 size={13} /> Delete Contest
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
