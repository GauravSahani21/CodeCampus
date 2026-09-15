/**
 * Course progress tracking utility.
 * Stores lesson/course completion in localStorage, keyed by user ID.
 *
 * Shape of stored data:
 * cf_course_progress = {
 *   [userId]: {
 *     [courseSlug]: {
 *       completedLessons: string[],  // array of lesson IDs
 *       completedAt?: string          // ISO date when ALL lessons done
 *     }
 *   }
 * }
 */

interface CourseProgress {
  completedLessons: string[];
  completedAt?: string;
}

type UserProgress = Record<string, CourseProgress>;
type AllProgress = Record<string, UserProgress>;

const STORAGE_KEY = 'cf_course_progress';

function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = sessionStorage.getItem('cf_user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user.id || null;
  } catch {
    return null;
  }
}

function loadAll(): AllProgress {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: AllProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getUserProgress(): UserProgress {
  const userId = getUserId();
  if (!userId) return {};
  const all = loadAll();
  return all[userId] || {};
}

function saveUserProgress(progress: UserProgress): void {
  const userId = getUserId();
  if (!userId) return;
  const all = loadAll();
  all[userId] = progress;
  saveAll(all);
}

/** Mark a lesson as completed for a course */
export function markLessonCompleted(courseSlug: string, lessonId: string, totalLessons: number): void {
  const progress = getUserProgress();
  const course = progress[courseSlug] || { completedLessons: [] };

  if (!course.completedLessons.includes(lessonId)) {
    course.completedLessons.push(lessonId);
  }

  // If all lessons are completed, mark the course as completed
  if (course.completedLessons.length >= totalLessons && !course.completedAt) {
    course.completedAt = new Date().toISOString();
  }

  progress[courseSlug] = course;
  saveUserProgress(progress);
}

/** Check if a specific lesson is completed */
export function isLessonCompleted(courseSlug: string, lessonId: string): boolean {
  const progress = getUserProgress();
  return progress[courseSlug]?.completedLessons.includes(lessonId) ?? false;
}

/** Get list of completed lesson IDs for a course */
export function getCompletedLessons(courseSlug: string): string[] {
  const progress = getUserProgress();
  return progress[courseSlug]?.completedLessons || [];
}

/** Check if an entire course is completed */
export function isCourseCompleted(courseSlug: string): boolean {
  const progress = getUserProgress();
  return !!progress[courseSlug]?.completedAt;
}

/** Get the completion date for a course (or null) */
export function getCourseCompletedAt(courseSlug: string): string | null {
  const progress = getUserProgress();
  return progress[courseSlug]?.completedAt || null;
}

/** Get count of completed lessons for a course */
export function getCompletedCount(courseSlug: string): number {
  const progress = getUserProgress();
  return progress[courseSlug]?.completedLessons.length || 0;
}

/** Get all courses with any progress */
export function getAllCourseProgress(): Record<string, CourseProgress> {
  return getUserProgress();
}
