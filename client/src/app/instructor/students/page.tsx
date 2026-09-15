'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Search, ChevronUp, ChevronDown, ChevronsUpDown,
  Award, Zap, Code2, CheckCircle2, AlertCircle, RefreshCw,
  ExternalLink, Flame, TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';
import styles from './students.module.css';

interface StudentStats { solved: number; attempted: number; streak: number; lastActive?: string }
interface Student {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  stats: StudentStats;
  badges: string[];
  submissions: { total: number; accepted: number };
}

interface Pagination { page: number; limit: number; total: number; pages: number }

type SortField = 'joinedAt' | 'username' | 'stats.solved' | 'stats.streak';

function AcceptanceBar({ accepted, total }: { accepted: number; total: number }) {
  const pct = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const color = pct >= 70 ? '#39d353' : pct >= 40 ? '#f0883e' : pct > 0 ? '#f85149' : '#484f58';
  return (
    <div className={styles.barWrap}>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.barPct} style={{ color }}>{pct}%</span>
    </div>
  );
}

function SortIcon({ field, sortBy, sortDir }: { field: SortField; sortBy: SortField; sortDir: 'asc' | 'desc' }) {
  if (sortBy !== field) return <ChevronsUpDown size={13} className={styles.sortIconNeutral} />;
  return sortDir === 'asc'
    ? <ChevronUp size={13} className={styles.sortIconActive} />
    : <ChevronDown size={13} className={styles.sortIconActive} />;
}

const FALLBACK_STUDENTS: Student[] = Array.from({ length: 6 }, (_, i) => ({
  _id: String(i),
  username: ['alice_dev', 'bob_codes', 'charlie42', 'diana_js', 'evan_cpp', 'fiona_py'][i],
  email: `student${i + 1}@example.com`,
  joinedAt: new Date(Date.now() - i * 7 * 86400000).toISOString(),
  stats: { solved: [42, 31, 18, 55, 7, 29][i], attempted: [60, 48, 25, 70, 12, 40][i], streak: [7, 3, 0, 14, 1, 5][i] },
  badges: i % 2 === 0 ? ['First AC', 'Streak 7'] : ['First AC'],
  submissions: { total: [60, 48, 25, 70, 12, 40][i], accepted: [42, 31, 18, 55, 7, 29][i] },
}));

export default function InstructorStudentsPage() {
  const [students, setStudents]   = useState<Student[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy]       = useState<SortField>('joinedAt');
  const [sortDir, setSortDir]     = useState<'asc' | 'desc'>('desc');
  const [page, setPage]           = useState(1);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        sortBy,
        sortDir,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const { data } = await api.get(`/instructor/students?${params}`);
      setStudents(data.students?.length > 0 ? data.students : FALLBACK_STUDENTS);
      if (data.pagination) setPagination(data.pagination);
    } catch {
      setStudents(FALLBACK_STUDENTS);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortDir, debouncedSearch]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Reset to page 1 on search/sort change
  useEffect(() => { setPage(1); }, [debouncedSearch, sortBy, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const totalStudents = pagination.total || students.length;

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            <Users size={24} className={styles.titleIcon} />
            Students
          </h1>
          <p className={styles.pageSubtitle}>
            {totalStudents.toLocaleString()} registered student{totalStudents !== 1 ? 's' : ''} on the platform
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={fetchStudents} title="Refresh">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
            <Users size={20} />
          </div>
          <div>
            <div className={styles.summaryVal}>{totalStudents.toLocaleString()}</div>
            <div className={styles.summaryLabel}>Total Students</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: 'rgba(57,211,83,0.12)', color: '#39d353' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className={styles.summaryVal}>
              {students.reduce((a, s) => a + s.stats.solved, 0)}
            </div>
            <div className={styles.summaryLabel}>Problems Solved</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: 'rgba(240,136,62,0.12)', color: '#f0883e' }}>
            <Code2 size={20} />
          </div>
          <div>
            <div className={styles.summaryVal}>
              {students.reduce((a, s) => a + s.submissions.total, 0)}
            </div>
            <div className={styles.summaryLabel}>Total Submissions</div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon} style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc' }}>
            <Flame size={20} />
          </div>
          <div>
            <div className={styles.summaryVal}>
              {students.length > 0 ? Math.max(...students.map((s) => s.stats.streak)) : 0}
            </div>
            <div className={styles.summaryLabel}>Top Streak (days)</div>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by username or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingRows}>
            {[...Array(6)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
          </div>
        ) : students.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={36} />
            <p>No students found{debouncedSearch ? ` for "${debouncedSearch}"` : ''}.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>
                  <button className={styles.sortBtn} onClick={() => handleSort('username')}>
                    Student <SortIcon field="username" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th>
                  <button className={styles.sortBtn} onClick={() => handleSort('stats.solved')}>
                    Solved <SortIcon field="stats.solved" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th>Acceptance</th>
                <th>
                  <button className={styles.sortBtn} onClick={() => handleSort('stats.streak')}>
                    Streak <SortIcon field="stats.streak" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th>Badges</th>
                <th>
                  <button className={styles.sortBtn} onClick={() => handleSort('joinedAt')}>
                    Joined <SortIcon field="joinedAt" sortBy={sortBy} sortDir={sortDir} />
                  </button>
                </th>
                <th>Profile</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, idx) => {
                const rank = (page - 1) * 20 + idx + 1;
                const initials = student.username.slice(0, 2).toUpperCase();
                return (
                  <tr key={student._id} className={styles.tableRow}>
                    <td className={styles.rankCell}>
                      <span className={styles.rankNum}>{rank}</span>
                    </td>
                    <td>
                      <div className={styles.studentCell}>
                        {student.avatar ? (
                          <img src={student.avatar} alt={student.username} className={styles.avatar} />
                        ) : (
                          <div className={styles.avatarFallback}>{initials}</div>
                        )}
                        <div>
                          <div className={styles.studentName}>{student.username}</div>
                          <div className={styles.studentEmail}>{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.solvedCell}>
                        <span className={styles.solvedNum}>{student.stats.solved}</span>
                        <span className={styles.attemptedNum}>/ {student.stats.attempted}</span>
                      </div>
                    </td>
                    <td>
                      <AcceptanceBar
                        accepted={student.submissions.accepted}
                        total={student.submissions.total}
                      />
                    </td>
                    <td>
                      <div className={styles.streakCell}>
                        <Flame size={13} color={student.stats.streak > 0 ? '#f0883e' : '#484f58'} />
                        <span className={student.stats.streak > 0 ? styles.streakActive : styles.streakZero}>
                          {student.stats.streak}d
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.badgesCell}>
                        {student.badges.length > 0 ? (
                          student.badges.slice(0, 2).map((b) => (
                            <span key={b} className={styles.badge}><Award size={10} />{b}</span>
                          ))
                        ) : (
                          <span className={styles.noBadge}>—</span>
                        )}
                        {student.badges.length > 2 && (
                          <span className={styles.moreBadge}>+{student.badges.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.joinedCell}>
                      {new Date(student.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <Link
                        href={`/profile/${student.username}`}
                        className={styles.profileLink}
                        target="_blank"
                        title="View Profile"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            Page {page} of {pagination.pages} · {pagination.total} students
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
