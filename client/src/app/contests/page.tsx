'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Trophy, Sparkles, Clock, Search, ArrowRight,
  User, Layers, Plus, CheckCircle2
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
  problemCount?: number;
  contestType?: 'standard' | 'superset';
  mcqCount?: number;
  mcqQuestions?: any[];
  problems?: any[];
  totalPoints: number;
  aiEvaluationEnabled: boolean;
  hasAttended?: boolean;
  userScore?: number | null;
  userPercentage?: number | null;
  createdBy: {
    username: string;
    avatar?: string;
  };
}

export default function ContestsPage() {
  const { user } = useAuthStore();
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const res = await api.get('/contests');
        if (res.data?.contests) {
          setContests(res.data.contests);
        }
      } catch (err) {
        console.error('Failed to load contests:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  const getTimingStatus = (startStr: string, endStr: string, hasAttended?: boolean) => {
    if (hasAttended) {
      return { label: 'Completed', type: 'past', class: styles.statusCompleted, isCompleted: true };
    }
    const now = new Date().getTime();
    const s = new Date(startStr).getTime();
    const e = new Date(endStr).getTime();
    if (now < s) return { label: 'Upcoming', type: 'upcoming', class: styles.statusUpcoming, isCompleted: false };
    if (now >= s && now <= e) return { label: 'Live Now', type: 'live', class: styles.statusLive, isCompleted: false };
    return { label: 'Ended', type: 'past', class: styles.statusEnded, isCompleted: false };
  };

  const filteredContests = contests.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    const status = getTimingStatus(c.startTime, c.endTime, c.hasAttended).type;
    return status === activeTab;
  });

  return (
    <main className={styles.container}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>
            Compete, Test Your Skills, <span className={styles.heroGrad}>Learn with AI</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Solve algorithm assessments in exam conditions using a focused plain editor. When submitted, our AI evaluates your mistakes in-depth to diagnose failure test cases and level up your mastery.
          </p>
        </section>

        {/* Toolbar & Filter Tabs */}
        <div className={styles.toolbar}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Contests
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'live' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('live')}
            >
              Live Now
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'upcoming' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'past' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Exams
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search contests by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {(user?.role === 'instructor' || user?.role === 'admin') && (
              <Link
                href="/instructor/contests/create"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '9px 16px' }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Create Contest
              </Link>
            )}
          </div>
        </div>

        {/* Contests Grid */}
        {loading ? (
          <div className={styles.emptyState}>
            <Clock size={36} className="animate-spin text-muted" />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Loading available contests...
            </p>
          </div>
        ) : filteredContests.length === 0 ? (
          <div className={styles.emptyState}>
            <Trophy size={40} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              No Contests Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '440px' }}>
              {search
                ? 'No contests match your search term. Try a different query.'
                : 'There are currently no contests in this category. Check back soon or browse other categories!'}
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredContests.map((contest) => {
              const statusInfo = getTimingStatus(contest.startTime, contest.endTime, contest.hasAttended);
              return (
                <div key={contest._id} className={styles.contestCard}>
                  <div>
                    <div className={styles.cardHeader}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`${styles.statusPill} ${statusInfo.class}`}>
                          {statusInfo.isCompleted && <CheckCircle2 size={12} />}
                          {statusInfo.label}
                        </span>
                        {contest.contestType === 'superset' ? (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(88,166,255,0.15)', color: 'var(--accent-blue)', fontSize: '0.72rem', fontWeight: 600, border: '1px solid rgba(88,166,255,0.25)' }}>
                            Interactive Mode
                          </span>
                        ) : (
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}>
                            Standard Exam
                          </span>
                        )}
                        {contest.hasAttended && contest.userScore !== null && contest.userScore !== undefined && (
                          <span style={{ fontSize: '0.74rem', color: 'var(--accent-green)', fontWeight: 700 }}>
                            Score: {contest.userScore} ({contest.userPercentage}%)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {new Date(contest.startTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h2 className={styles.cardTitle}>{contest.title}</h2>
                    <p className={styles.cardDesc}>
                      {contest.description || 'Test your algorithmic thinking and problem-solving skills across competitive challenges.'}
                    </p>

                    <div className={styles.metaGrid}>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Duration</span>
                        <span className={styles.metaValue}>
                          <Clock size={13} style={{ color: 'var(--accent-green)' }} />
                          {contest.durationMinutes} Mins
                        </span>
                      </div>
                      <div className={styles.metaItem}>
                        <span className={styles.metaLabel}>Weight &amp; Questions</span>
                        <span className={styles.metaValue}>
                          <Layers size={13} style={{ color: 'var(--accent-blue)' }} />
                          {(contest.problemCount || contest.problemsCount || contest.problems?.length || 0)} Coding
                          {(contest.mcqCount || contest.mcqQuestions?.length || 0) > 0 ? ` + ${contest.mcqCount || contest.mcqQuestions?.length} MCQs` : ''} · {contest.totalPoints} Pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardAuthor}>
                      <User size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>{contest.createdBy?.username || 'Instructor'}</span>
                    </div>
                    {contest.hasAttended ? (
                      <Link href={`/contests/${contest.slug}/results`} className={styles.viewResultsBtn}>
                        <CheckCircle2 size={14} /> View Results
                      </Link>
                    ) : statusInfo.type === 'past' ? (
                      <Link href={`/contests/${contest.slug}/results`} className={styles.viewResultsBtn}>
                        View Overview
                      </Link>
                    ) : (
                      <Link href={`/contests/${contest.slug}`} className={styles.enterBtn}>
                        Enter Contest <ArrowRight size={14} />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </main>
  );
}
