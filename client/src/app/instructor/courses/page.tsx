'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Layers, Users, Clock, ExternalLink,
  ChevronRight, Sparkles, Loader2, Trash2, X
} from 'lucide-react';
import DeleteReasonModal from '@/components/Instructor/DeleteReasonModal';
import styles from './courses.module.css';

interface CourseItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: string;
  tags: string[];
  enrolledCount: number;
  lessons: any[];
  isPublished: boolean;
  deletionStatus?: 'none' | 'pending' | 'rejected';
  deletionReason?: string;
}

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalTarget, setDeleteModalTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/learn');
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load instructor courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRequestDelete = async (reason: string) => {
    if (!deleteModalTarget) return;
    try {
      await api.post(`/instructor/courses/${deleteModalTarget.id}/request-delete`, { reason });
      setCourses((prev) =>
        prev.map((c) =>
          c._id === deleteModalTarget.id
            ? { ...c, deletionStatus: 'pending', deletionReason: reason }
            : c
        )
      );
      toast.success('Course deletion request submitted to admin for approval');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit course deletion request');
      throw err;
    }
  };

  const handleCancelDelete = async (id: string) => {
    try {
      await api.delete(`/instructor/deletion-requests/${id}/cancel`);
      setCourses((prev) =>
        prev.map((c) =>
          c._id === id
            ? { ...c, deletionStatus: 'none', deletionReason: '' }
            : c
        )
      );
      toast.success('Course deletion request cancelled');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel deletion request');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Courses &amp; Curriculum</h1>
          <p className={styles.subtitle}>
            Manage and author structured courses, video lessons, and interactive programming curricula.
          </p>
        </div>

        <Link href="/instructor/courses/create" className={styles.createBtn}>
          <Plus size={16} strokeWidth={2.5} />
          Create Course
        </Link>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Loader2 size={32} className="animate-spin text-green" style={{ margin: '0 auto 12px', color: 'var(--accent-green)' }} />
          <p>Loading your courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <BookOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
          <h3>No Courses Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Start authoring your first curriculum to help students master coding concepts.
          </p>
          <Link href="/instructor/courses/create" className={styles.createBtn}>
            <Plus size={16} /> Create Course
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {courses.map((course) => (
            <div key={course._id} className={styles.courseCard}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(57, 211, 83, 0.1)',
                      color: 'var(--accent-green)',
                      border: '1px solid rgba(57, 211, 83, 0.25)',
                    }}
                  >
                    {course.difficulty}
                  </span>
                  {course.deletionStatus === 'pending' ? (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#f59e0b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title={`Reason: ${course.deletionReason || 'Pending administrator review'}`}
                    >
                      <Clock size={11} /> Deletion Pending
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {course.isPublished ? '● Published' : '○ Draft'}
                    </span>
                  )}
                </div>

                <h3 className={styles.courseTitle}>{course.title}</h3>
                <p className={styles.courseDesc}>{course.description}</p>
              </div>

              <div>
                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <Layers size={13} />
                    <span>{course.lessons?.length || 0} Lessons</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Users size={13} />
                    <span>{course.enrolledCount || 0} Enrolled</span>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    /{course.slug}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {course.deletionStatus === 'pending' ? (
                      <button
                        onClick={() => handleCancelDelete(course._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f59e0b',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 6px',
                        }}
                      >
                        <X size={12} /> Cancel Request
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteModalTarget({ id: course._id, title: course.title })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff7b72',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 6px',
                        }}
                        title="Request deletion"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                    <Link href={`/learn/${course.slug}`} className={styles.viewBtn}>
                      View Course <ExternalLink size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Deletion Request Modal */}
      <DeleteReasonModal
        isOpen={!!deleteModalTarget}
        onClose={() => setDeleteModalTarget(null)}
        onSubmit={handleRequestDelete}
        itemType="course"
        itemTitle={deleteModalTarget?.title || ''}
      />
    </div>
  );
}
