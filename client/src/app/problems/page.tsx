'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Search, SearchX, Plus, Check, Circle } from 'lucide-react';
import styles from './page.module.css';

interface Problem {
  _id: string; 
  title: string; 
  slug: string;
  questionId?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[]; 
  acceptanceRate: number; 
  totalSubmissions: number;
  status?: 'solved' | 'attempted' | 'unsolved';
}

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const POPULAR_TAGS = ['Array', 'String', 'Tree', 'Graph', 'DP', 'Math', 'Sorting', 'Binary Search', 'Stack', 'Greedy'];

export default function ProblemsPage() {
  const { user } = useAuthStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [difficulty, setDifficulty] = useState('All');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '50' });
    if (difficulty !== 'All') params.append('difficulty', difficulty);
    if (tag) params.append('tag', tag);
    if (search) params.append('search', search);
    
    api.get(`/problems?${params}`).then(({ data }) => {
      const sorted = [...data.problems].sort((a: Problem, b: Problem) => {
        const numA = a.questionId || parseInt(a.title.split('.')[0], 10) || 0;
        const numB = b.questionId || parseInt(b.title.split('.')[0], 10) || 0;
        return numA - numB;
      });
      setProblems(sorted);
      setTotal(data.total);
      setPages(data.pages);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, difficulty, tag, search]);

  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
    }, 400);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setSearch(searchInput);
    setPage(1);
  };

  const formatDifficulty = (diff: string) => {
    if (diff === 'Medium') return 'Med.';
    return diff;
  };

  const getDifficultyClass = (diff: string) => {
    if (diff === 'Easy') return styles.diffEasy;
    if (diff === 'Medium' || diff === 'Med.') return styles.diffMedium;
    if (diff === 'Hard') return styles.diffHard;
    return '';
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Problems</h1>
            <p className={styles.subtitle}>{total} challenges — write complete programs, not just function stubs</p>
          </div>
          <div className={styles.headerActions}>
            <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
              <div className={styles.searchIconWrapper}>
                <Search size={16} className={styles.searchIcon} />
              </div>
              <input
                id="problem-search"
                className={`input ${styles.searchInput}`}
                placeholder="Search problems by name or ID..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </form>
            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <Link
                href="/instructor/problems/create"
                className={styles.createBtn}
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Problem
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.diffFilters}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                className={`btn btn-sm ${difficulty === d ? (d === 'Easy' ? styles.btnFilterActiveEasy : d === 'Medium' ? styles.btnFilterActiveMedium : d === 'Hard' ? styles.btnFilterActiveHard : styles.btnFilterActiveAll) : styles.btnFilterInactive}`}
                onClick={() => { setDifficulty(d); setPage(1); }}
              >
                {d}
              </button>
            ))}
          </div>
          <div className={styles.tagFilters}>
            {POPULAR_TAGS.map((t) => (
              <button key={t} className={`tag ${tag === t ? styles.tagActive : ''}`} onClick={() => { setTag(tag === t ? '' : t); setPage(1); }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingRow}>
              {[...Array(8)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : problems.length === 0 ? (
            <div className={styles.empty}>
              <SearchX size={32} style={{ marginBottom: 16, opacity: 0.5 }} />
              <div>No problems found matching "{search}". Try adjusting your filters.</div>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thStatus}>Status</th>
                  <th className={styles.thTitle}>Title</th>
                  <th className={styles.thDifficulty}>Difficulty</th>
                  <th className={styles.thAcceptance}>Acceptance</th>
                  <th className={styles.thTags}>Tags</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, i) => {
                  const qNum = p.questionId || (page - 1) * 50 + i + 1;
                  const displayTitle = /^\d+\./.test(p.title) ? p.title : `${qNum}. ${p.title}`;
                  const isEven = i % 2 === 1;

                  // Check status
                  const isSolved = p.status === 'solved' || user?.solvedProblems?.some((id: any) => (id._id || id).toString() === p._id);
                  const isAttempted = p.status === 'attempted';

                  return (
                    <tr key={p._id} className={`${styles.row} ${isEven ? styles.rowEven : styles.rowOdd}`}>
                      <td className={styles.tdStatus}>
                        {isSolved ? (
                          <span title="Solved" className={styles.statusSolved}>
                            <Check size={16} strokeWidth={2.8} />
                          </span>
                        ) : isAttempted ? (
                          <span title="Attempted" className={styles.statusAttempted}>
                            <Circle size={14} strokeWidth={2} />
                          </span>
                        ) : (
                          <span className={styles.statusEmpty} />
                        )}
                      </td>
                      <td className={styles.tdTitle}>
                        <Link href={`/problems/${p.slug}`} className={styles.problemLink}>
                          {displayTitle}
                        </Link>
                      </td>
                      <td className={styles.tdDifficulty}>
                        <span className={getDifficultyClass(p.difficulty)}>
                          {formatDifficulty(p.difficulty)}
                        </span>
                      </td>
                      <td className={styles.tdAcceptance}>
                        {p.totalSubmissions > 0 ? `${((p.acceptanceRate || 0) * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className={styles.tdTags}>
                        <div className={styles.tags}>
                          {p.tags.slice(0, 2).map((t) => <span key={t} className={styles.tagPill}>{t}</span>)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className={styles.pagination}>
            <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <span className={styles.pageInfo}>Page {page} of {pages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page === pages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
