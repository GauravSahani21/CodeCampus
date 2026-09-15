'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Trophy, Flame } from 'lucide-react';
import styles from './page.module.css';

interface LeaderboardUser {
  _id: string; username: string; avatar?: string;
  stats: { solved: number; streak: number };
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/leaderboard').then(({ data }) => { setUsers(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} color="#FFD700" style={{ fill: 'rgba(255, 215, 0, 0.2)' }} />;
    if (rank === 2) return <Trophy size={18} color="#C0C0C0" style={{ fill: 'rgba(192, 192, 192, 0.2)' }} />;
    if (rank === 3) return <Trophy size={18} color="#CD7F32" style={{ fill: 'rgba(205, 127, 50, 0.2)' }} />;
    return `#${rank}`;
  };

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
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rank</th><th>Developer</th><th>Problems Solved</th><th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u._id} className={`${styles.row} ${i < 3 ? styles.topRow : ''}`}>
                    <td className={styles.rank}>
                      <span className={i < 3 ? styles.medal : styles.rankNum}>{getMedalIcon(i + 1)}</span>
                    </td>
                    <td>
                      <Link href={`/profile/${u.username}`} className={styles.userCell}>
                        <div className={styles.avatar}>{u.avatar ? <img src={u.avatar} alt={u.username}/> : u.username[0].toUpperCase()}</div>
                        <span className={styles.username}>{u.username}</span>
                      </Link>
                    </td>
                    <td>
                      <div className={styles.solvedCell}>
                        <div className={styles.solvedBarContainer}>
                          <div className={styles.solvedBar} style={{ width: `${Math.min(100, (u.stats.solved / (users[0]?.stats.solved || 1)) * 100)}%` }} />
                        </div>
                        <span className={styles.solvedNum}>{u.stats.solved}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.streak}>
                        <Flame size={14} color="var(--accent-orange)" style={{ marginRight: '4px' }} />
                        {u.stats.streak} days
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
