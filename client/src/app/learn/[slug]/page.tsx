'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getCompletedLessons, isCourseCompleted } from '@/lib/courseProgress';
import { BookOpen, Play, Clock, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

const FALLBACK_SLUGS: Record<string, {title: string; description: string; difficulty: string; tags: string[]; lessons: {_id: string; title: string; order: number; duration: number}[]}> = {
  'python-for-beginners': { 
    title: 'Python for Beginners', 
    description: 'Learn Python from scratch — variables, control flow, functions, data structures, and file I/O.', 
    difficulty: 'Beginner', 
    tags: ['Python', 'Language'], 
    lessons: [
      { _id: 'l1', title: 'Variables & Data Types', order: 1, duration: 10 }, 
      { _id: 'l2', title: 'Control Flow', order: 2, duration: 12 }, 
      { _id: 'l3', title: 'Functions & Scope', order: 3, duration: 10 },
      { _id: 'l4', title: 'Lists, Tuples & Dictionaries', order: 4, duration: 15 },
      { _id: 'l5', title: 'File I/O & Error Handling', order: 5, duration: 12 },
    ] 
  },
  'javascript-essentials': { 
    title: 'JavaScript Essentials', 
    description: 'Master JavaScript fundamentals — DOM manipulation, async programming, and modern ES6+ features.', 
    difficulty: 'Beginner', 
    tags: ['JavaScript', 'Language'], 
    lessons: [
      { _id: 'l1', title: 'Variables & the DOM', order: 1, duration: 10 }, 
      { _id: 'l2', title: 'Functions & Events', order: 2, duration: 12 }, 
      { _id: 'l3', title: 'Arrays & Objects', order: 3, duration: 12 },
      { _id: 'l4', title: 'Async JavaScript & Promises', order: 4, duration: 15 },
      { _id: 'l5', title: 'ES6+ Modern Features', order: 5, duration: 10 },
    ] 
  },
  'java-fundamentals': { 
    title: 'Java Fundamentals', 
    description: 'OOP, collections, exception handling, and streams — everything you need to code in Java.', 
    difficulty: 'Beginner', 
    tags: ['Java', 'Language'], 
    lessons: [
      { _id: 'l1', title: 'Hello World & Primitive Types', order: 1, duration: 8 }, 
      { _id: 'l2', title: 'Object-Oriented Programming', order: 2, duration: 15 }, 
      { _id: 'l3', title: 'Collections Framework', order: 3, duration: 12 },
      { _id: 'l4', title: 'Exception Handling', order: 4, duration: 10 },
      { _id: 'l5', title: 'Streams & Lambda Expressions', order: 5, duration: 12 },
    ] 
  },
  'cpp-crash-course': { 
    title: 'C++ Crash Course', 
    description: 'From Hello World to STL and OOP. The fastest path to C++ fluency.', 
    difficulty: 'Beginner', 
    tags: ['C++', 'Language'], 
    lessons: [
      { _id: 'l1', title: 'Syntax & I/O', order: 1, duration: 10 }, 
      { _id: 'l2', title: 'Pointers & References', order: 2, duration: 15 }, 
      { _id: 'l3', title: 'STL Containers & Iterators', order: 3, duration: 12 },
      { _id: 'l4', title: 'OOP in C++', order: 4, duration: 12 },
    ] 
  },
  'data-structures-mastery': { 
    title: 'Data Structures Mastery', 
    description: 'Arrays, linked lists, stacks, queues, trees, and hash tables — master them all.', 
    difficulty: 'Intermediate', 
    tags: ['Data Structures', 'Fundamentals'], 
    lessons: [
      { _id: 'l1', title: 'Arrays & Strings', order: 1, duration: 12 }, 
      { _id: 'l2', title: 'Linked Lists', order: 2, duration: 15 }, 
      { _id: 'l3', title: 'Stacks & Queues', order: 3, duration: 10 },
      { _id: 'l4', title: 'Trees & BSTs', order: 4, duration: 15 },
      { _id: 'l5', title: 'Hash Tables', order: 5, duration: 12 },
    ] 
  },
  'algorithm-fundamentals': { 
    title: 'Algorithm Fundamentals', 
    description: 'Big-O notation, sorting, searching, recursion, and dynamic programming explained clearly.', 
    difficulty: 'Intermediate', 
    tags: ['Algorithms', 'Fundamentals'], 
    lessons: [
      { _id: 'l1', title: 'Big-O Notation', order: 1, duration: 10 }, 
      { _id: 'l2', title: 'Sorting Algorithms', order: 2, duration: 15 }, 
      { _id: 'l3', title: 'Searching Algorithms', order: 3, duration: 10 },
      { _id: 'l4', title: 'Recursion & Backtracking', order: 4, duration: 15 },
      { _id: 'l5', title: 'Greedy vs Dynamic Programming', order: 5, duration: 15 },
    ] 
  },
  'web-development-basics': { 
    title: 'Web Development Basics', 
    description: 'HTML, CSS, and JavaScript for the web — build your first interactive project.', 
    difficulty: 'Beginner', 
    tags: ['Web', 'HTML', 'CSS', 'JavaScript'], 
    lessons: [
      { _id: 'l1', title: 'HTML Foundations', order: 1, duration: 10 }, 
      { _id: 'l2', title: 'CSS Styling & Layout', order: 2, duration: 12 }, 
      { _id: 'l3', title: 'JavaScript for the Web', order: 3, duration: 12 },
      { _id: 'l4', title: 'Building Your First Project', order: 4, duration: 15 },
    ] 
  },
  'competitive-programming-guide': { 
    title: 'Competitive Programming Guide', 
    description: 'Advanced techniques for contest success — fast I/O, graph algorithms, and DP patterns.', 
    difficulty: 'Advanced', 
    tags: ['Competitive Programming', 'Advanced'], 
    lessons: [
      { _id: 'l1', title: 'Fast I/O & Time Tricks', order: 1, duration: 10 }, 
      { _id: 'l2', title: 'Common Patterns', order: 2, duration: 15 }, 
      { _id: 'l3', title: 'Graph Algorithms', order: 3, duration: 15 },
      { _id: 'l4', title: 'DP Techniques', order: 4, duration: 15 },
    ] 
  },
};

export default function CourseOverviewPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [course, setCourse] = useState<typeof FALLBACK_SLUGS[string] | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [courseComplete, setCourseComplete] = useState(false);

  useEffect(() => {
    api.get(`/learn/${slug}`).then(({ data }) => { setCourse(data); setLoading(false); })
      .catch(() => {
        const fb = FALLBACK_SLUGS[slug];
        if (fb) { setCourse(fb); setLoading(false); }
        else { router.push('/learn'); }
      });
  }, [slug, router]);

  useEffect(() => {
    setCompletedLessonIds(getCompletedLessons(slug));
    setCourseComplete(isCourseCompleted(slug));
  }, [slug]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}><div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} /></div>;
  if (!course) return null;

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);
  const totalDuration = sortedLessons.reduce((a, l) => a + l.duration, 0);
  const completedCount = completedLessonIds.length;

  // Find the next uncompleted lesson to resume from
  const nextLesson = sortedLessons.find(l => !completedLessonIds.includes(l._id)) || sortedLessons[0];

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/learn" className={styles.back}>
          <ArrowLeft size={14} style={{ marginRight: '6px' }} />
          Back to Learning Hub
        </Link>

        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge badge-${course.difficulty === 'Beginner' ? 'easy' : course.difficulty === 'Intermediate' ? 'medium' : 'hard'}`}>{course.difficulty}</span>
              {courseComplete && (
                <span className={`badge badge-easy`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Completed
                </span>
              )}
            </div>
            <h1 className={styles.title}>{course.title}</h1>
            <p className={styles.desc}>{course.description}</p>
            <div className={styles.tags}>{course.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.statsBox}>
              <div className={styles.stat}>
                <div className={styles.statVal}>{sortedLessons.length}</div>
                <div className={styles.statKey}>Lessons</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statVal}>{totalDuration}m</div>
                <div className={styles.statKey}>Total Time</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statVal} style={{ color: courseComplete ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                  {completedCount}/{sortedLessons.length}
                </div>
                <div className={styles.statKey}>Done</div>
              </div>
            </div>
            <Link href={`/learn/${slug}/${nextLesson?._id}`} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              {courseComplete ? (
                <><CheckCircle2 size={16} /> Review Course</>
              ) : completedCount > 0 ? (
                <><Play size={16} fill="currentColor" /> Continue Learning</>
              ) : (
                <><Play size={16} fill="currentColor" /> Start Learning</>
              )}
            </Link>
          </div>
        </div>

        <div className={styles.lessonListSection}>
          <h2 className={styles.sectionTitle}>Course Content</h2>
          <div className={styles.lessonCards}>
            {sortedLessons.map((l, i) => {
              const isDone = completedLessonIds.includes(l._id);
              return (
                <Link key={l._id} href={`/learn/${slug}/${l._id}`} className={`${styles.lessonCard} ${isDone ? styles.lessonCardDone : ''}`}>
                  <div className={`${styles.lessonNum} ${isDone ? styles.lessonNumDone : ''}`}>
                    {isDone ? <CheckCircle2 size={16} /> : i + 1}
                  </div>
                  <div className={styles.lessonInfo}>
                    <div className={styles.lessonTitle}>{l.title}</div>
                    <div className={styles.lessonDuration}>
                      <Clock size={12} style={{ marginRight: '4px' }} />
                      {l.duration} min
                    </div>
                  </div>
                  <div className={styles.lessonArrow}>
                    {isDone ? <CheckCircle2 size={16} color="var(--accent-green)" /> : <ArrowRight size={16} />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
