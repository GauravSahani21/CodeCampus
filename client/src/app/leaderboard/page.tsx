'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Trophy, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './page.module.css';

interface LeaderboardUser {
  _id: string; username: string; avatar?: string;
  stats: { solved: number; streak: number };
}

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api.get('/users/leaderboard')
      .then(({ data }) => {
        // Sort client-side by solved desc, then streak desc for tie-breaking
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) =>
              b.stats.solved - a.stats.solved || b.stats.streak - a.stats.streak
            )
          : [];
        setUsers(sorted);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load leaderboard. Please try again.');
        setLoading(false);
      });
  }, []);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} color="#FFD700" style={{ fill: 'rgba(255, 215, 0, 0.2)' }} />;
    if (rank === 2) return <Trophy size={18} color="#C0C0C0" style={{ fill: 'rgba(192, 192, 192, 0.2)' }} />;
    if (rank === 3) return <Trophy size={18} color="#CD7F32" style={{ fill: 'rgba(205, 127, 50, 0.2)' }} />;
    return `#${rank}`;
  };

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const topSolved = users[0]?.stats?.solved || 1;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Trophy size={36} color="var(--accent-orange)" style={{ marginRight: '12px' }} />
            Leaderboard
          </h1>
          <p className={styles.subtitle}>Top coders ranked by problems solved</p>
        </div>

        <div className={styles.tableCard}>
          {loading ? (
            <div className={styles.loading}><div className="spinner" style={{width:32,height:32,borderWidth:3}}/></div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--accent-red, #ef4444)' }}>{error}</div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>No users found.</div>
          ) : (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Rank</th><th>Developer</th><th>Problems Solved</th><th>Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((u, i) => {
                    const globalRank = (page - 1) * PAGE_SIZE + i + 1;
                    return (
                      <tr key={u._id} className={`${styles.row} ${globalRank <= 3 ? styles.topRow : ''}`}>
                        <td className={styles.rank}>
                          <span className={globalRank <= 3 ? styles.medal : styles.rankNum}>{getMedalIcon(globalRank)}</span>
                        </td>
                        <td>
                          <Link href={`/profile/${u.username}`} className={styles.userCell}>
                            <div className={styles.avatar}>{u.avatar ? <img src={u.avatar} alt={u.username}/> : (u.username?.[0] ?? '?').toUpperCase()}</div>
                            <span className={styles.username}>{u.username}</span>
                          </Link>
                        </td>
                        <td>
                          <div className={styles.solvedCell}>
                            <div className={styles.solvedBarContainer}>
                              <div className={styles.solvedBar} style={{ width: `${Math.min(100, ((u.stats?.solved ?? 0) / topSolved) * 100)}%` }} />
                            </div>
                            <span className={styles.solvedNum}>{u.stats?.solved ?? 0}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.streak}>
                            <Flame size={14} color="var(--accent-orange)" style={{ marginRight: '4px' }} />
                            {u.stats?.streak ?? 0} days
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '16px 0' }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', opacity: page === 1 ? 0.4 : 1 }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', opacity: page === totalPages ? 0.4 : 1 }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
