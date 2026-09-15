import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Enrollment from '../models/Enrollment.model';
import Course from '../models/Course.model';

// ─── POST /api/enrollments/:courseId/enroll (One-click enrollment) ────────────
export const enrollInCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.courseId);
    const userId = req.user!.id;

    const course = mongoose.isValidObjectId(identifier)
      ? await Course.findById(identifier)
      : await Course.findOne({ slug: identifier });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const courseId = course._id;
    let enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        userId,
        courseId,
        completedLessons: [],
        progressPercent: 0,
        status: 'active',
        lastAccessedAt: new Date(),
      });

      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
    }

    res.json({ message: 'Enrolled successfully', enrollment });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to enroll in course' });
  }
};

// ─── GET /api/enrollments/my (Student enrolled courses & dashboard data) ───────
export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const enrollments = await Enrollment.find({ userId })
      .sort({ lastAccessedAt: -1 })
      .populate({
        path: 'courseId',
        select: 'title slug description difficulty category thumbnail lessons enrolledCount createdBy',
        populate: { path: 'createdBy', select: 'username avatar' },
      });

    // Compute Continue Learning course (the active course accessed most recently)
    const activeEnrollments = enrollments.filter((e) => e.status === 'active' && e.courseId);
    const completedEnrollments = enrollments.filter((e) => e.status === 'completed' && e.courseId);

    const continueLearning = activeEnrollments.length > 0 ? activeEnrollments[0] : null;

    res.json({
      enrollments,
      continueLearning,
      totalActive: activeEnrollments.length,
      totalCompleted: completedEnrollments.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch enrollments' });
  }
};

// ─── POST /api/enrollments/:courseId/progress (Update lesson progress) ────────
export const updateLessonProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const identifier = String(req.params.courseId);
    const { lessonId } = req.body;
    const userId = req.user!.id;

    const course = mongoose.isValidObjectId(identifier)
      ? await Course.findById(identifier)
      : await Course.findOne({ slug: identifier });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const courseId = course._id;
    let enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      // Auto-enroll if not enrolled yet
      enrollment = await Enrollment.create({
        userId,
        courseId,
        completedLessons: [],
        progressPercent: 0,
        status: 'active',
      });
      await Course.findByIdAndUpdate(courseId, { $inc: { enrolledCount: 1 } });
    }

    if (lessonId && !enrollment.completedLessons.includes(lessonId)) {
      enrollment.completedLessons.push(lessonId);
    }

    const totalLessons = course.lessons.length || 1;
    const progressPercent = Math.min(
      100,
      Math.round((enrollment.completedLessons.length / totalLessons) * 100)
    );

    enrollment.progressPercent = progressPercent;
    enrollment.lastAccessedAt = new Date();

    if (progressPercent === 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    }

    await enrollment.save();

    res.json({
      message: 'Progress recorded',
      enrollment,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update lesson progress' });
  }
};
