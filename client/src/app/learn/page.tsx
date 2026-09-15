'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { isCourseCompleted, getCompletedCount } from '@/lib/courseProgress';
import { BookOpen, Users, CheckCircle2, Plus } from 'lucide-react';
import styles from './page.module.css';

interface Course {
  _id: string; title: string; slug: string; description: string;
  category?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[]; thumbnail?: string; enrolledCount: number;
  lessons: Array<{ _id: string }>;
  createdBy?: { username: string; avatar?: string };
}

const DIFF_COLORS = { Beginner: 'easy', Intermediate: 'medium', Advanced: 'hard' };

const FALLBACK_COURSES: Course[] = [
  { _id: '1', title: 'Python for Beginners', slug: 'python-for-beginners', description: 'Learn Python from scratch — variables, control flow, functions, data structures, and file I/O.', difficulty: 'Beginner', category: 'Programming Languages', tags: ['Python', 'Language'], enrolledCount: 2340, lessons: Array(5).fill({}) },
  { _id: '2', title: 'JavaScript Essentials', slug: 'javascript-essentials', description: 'Master JavaScript fundamentals — DOM manipulation, async programming, and modern ES6+ features.', difficulty: 'Beginner', category: 'Programming Languages', tags: ['JavaScript', 'Language'], enrolledCount: 1890, lessons: Array(5).fill({}) },
  { _id: '3', title: 'Java Fundamentals', slug: 'java-fundamentals', description: 'OOP, collections, exception handling, and streams — everything you need to code in Java.', difficulty: 'Beginner', category: 'Programming Languages', tags: ['Java', 'Language'], enrolledCount: 1540, lessons: Array(5).fill({}) },
  { _id: '4', title: 'C++ Crash Course', slug: 'cpp-crash-course', description: 'From Hello World to STL and OOP. The fastest path to C++ fluency for competitive coding.', difficulty: 'Beginner', category: 'Programming Languages', tags: ['C++', 'Language'], enrolledCount: 960, lessons: Array(4).fill({}) },
  { _id: '5', title: 'Data Structures Mastery', slug: 'data-structures-mastery', description: 'Arrays, linked lists, stacks, queues, trees, and hash tables — master them all with code.', difficulty: 'Intermediate', category: 'Algorithms & DSA', tags: ['Data Structures', 'Fundamentals'], enrolledCount: 1290, lessons: Array(5).fill({}) },
  { _id: '6', title: 'Algorithm Fundamentals', slug: 'algorithm-fundamentals', description: 'Big-O notation, sorting, searching, recursion, and dynamic programming explained clearly.', difficulty: 'Intermediate', category: 'Algorithms & DSA', tags: ['Algorithms', 'Fundamentals'], enrolledCount: 1150, lessons: Array(5).fill({}) },
  { _id: '7', title: 'Web Development Basics', slug: 'web-development-basics', description: 'HTML, CSS, and JavaScript for the web — build your first interactive project from scratch.', difficulty: 'Beginner', category: 'Web Development', tags: ['Web', 'HTML', 'CSS', 'JavaScript'], enrolledCount: 1780, lessons: Array(4).fill({}) },
  { _id: '8', title: 'Competitive Programming Guide', slug: 'competitive-programming-guide', description: 'Advanced techniques for contest success — fast I/O, graph algorithms, and DP patterns.', difficulty: 'Advanced', category: 'Competitive Programming', tags: ['Competitive Programming', 'Advanced'], enrolledCount: 432, lessons: Array(4).fill({}) },
];

export default function LearnPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [diffFilter, setDiffFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Progress' | 'Completed'>('All');
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState<Record<string, { completed: boolean; count: number }>>({});

  useEffect(() => {
    api.get('/learn').then(({ data }) => {
      setCourses(data.length > 0 ? data : FALLBACK_COURSES);
      setLoading(false);
    }).catch(() => { setCourses(FALLBACK_COURSES); setLoading(false); });
  }, []);

  // Load progress from localStorage after courses are loaded
  useEffect(() => {
    if (courses.length === 0) return;
    const map: Record<string, { completed: boolean; count: number }> = {};
    courses.forEach((c) => {
      map[c.slug] = {
        completed: isCourseCompleted(c.slug),
        count: getCompletedCount(c.slug),
      };
    });
    setProgressMap(map);
  }, [courses]);

  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const categories = ['All', 'Algorithms & DSA', 'Programming Languages', 'Web Development', 'Competitive Programming'];

  const filtered = courses.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchDesc = c.description.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }
    if (diffFilter !== 'All' && c.difficulty !== diffFilter) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'All') {
      const p = progressMap[c.slug];
      if (statusFilter === 'Completed' && !p?.completed) return false;
      if (statusFilter === 'In Progress' && (p?.completed || (p?.count || 0) === 0)) return false;
    }
    return true;
  });

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Learning Hub</h1>
            <p className={styles.subtitle}>Structured courses from absolute zero to competitive level</p>
          </div>
          {(user?.role === 'instructor' || user?.role === 'admin') && (
            <Link
              href="/instructor/courses/create"
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '9px 18px' }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Create Course
            </Link>
          )}
        </div>

        {/* Search & Multi-Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search courses by title, topic, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                minWidth: 260,
                padding: '10px 16px',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.88rem',
              }}
            />

            <select
              value={diffFilter}
              onChange={(e) => setDiffFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              {difficulties.map((d) => (
                <option key={d} value={d}>{d === 'All' ? 'All Difficulties' : d}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 14px',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 8,
                color: '#fff',
                fontSize: '0.85rem',
              }}
            >
              <option value="All">All Progress States</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: '1px solid #30363d',
                  background: categoryFilter === cat ? '#38bdf8' : '#161b22',
                  color: categoryFilter === cat ? '#000' : '#8b949e',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.skeletonGrid}>
            {[...Array(6)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map((course) => {
              const progress = progressMap[course.slug];
              const isComplete = progress?.completed;
              const doneCount = progress?.count || 0;
              const totalLessons = course.lessons.length;
              const hasProgress = doneCount > 0 && !isComplete;

              return (
                <Link key={course._id} href={`/learn/${course.slug}`} className={`${styles.courseCard} ${isComplete ? styles.courseCardCompleted : ''}`}>
                  <div className={styles.cardTop}>
                    <span className={`badge badge-${DIFF_COLORS[course.difficulty]}`}>{course.difficulty}</span>
                    {isComplete ? (
                      <div className={styles.completedBadge}>
                        <CheckCircle2 size={14} />
                        Completed
                      </div>
                    ) : (
                      <span className={styles.lessonCount}>
                        <BookOpen size={12} style={{ marginRight: '4px' }} />
                        {course.lessons.length} lessons
                      </span>
                    )}
                  </div>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                  <p className={styles.courseDesc}>{course.description}</p>

                  {/* Progress bar */}
                  {(hasProgress || isComplete) && (
                    <div className={styles.progressSection}>
                      <div className={styles.progressBar}>
                        <div
                          className={`${styles.progressFill} ${isComplete ? styles.progressComplete : ''}`}
                          style={{ width: `${(doneCount / totalLessons) * 100}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>
                        {isComplete ? 'All lessons done' : `${doneCount}/${totalLessons} lessons`}
                      </span>
                    </div>
                  )}

                  <div className={styles.cardBottom}>
                    <div className={styles.tags}>
                      {course.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <span className={styles.enrolled}>
                      <Users size={12} style={{ marginRight: '4px' }} />
                      {course.enrolledCount.toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.startBtn}>
                    {isComplete ? 'Review Course' : hasProgress ? 'Continue Learning →' : 'Start Learning →'}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
