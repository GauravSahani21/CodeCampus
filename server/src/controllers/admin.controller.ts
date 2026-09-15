import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import DeletionRequest from '../models/DeletionRequest.model';
import Problem from '../models/Problem.model';
import Course from '../models/Course.model';

// ─── GET /api/admin/deletion-requests ─────────────────────────────────────────
export const getDeletionRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const filter: Record<string, any> = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      filter.status = status;
    }

    const requests = await DeletionRequest.find(filter)
      .sort({ createdAt: -1 });

    const pendingCount = await DeletionRequest.countDocuments({ status: 'pending' });

    res.json({
      requests,
      pendingCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch deletion requests' });
  }
};

// ─── POST /api/admin/deletion-requests/:id/approve ────────────────────────────
export const approveDeletionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const delReq = await DeletionRequest.findById(id);
    if (!delReq) {
      res.status(404).json({ error: 'Deletion request not found' });
      return;
    }

    if (delReq.status !== 'pending') {
      res.status(400).json({ error: `Request has already been ${delReq.status}` });
      return;
    }

    // Permanently remove target item
    if (delReq.targetType === 'problem') {
      await Problem.findByIdAndDelete(delReq.targetId);
    } else if (delReq.targetType === 'course') {
      await Course.findByIdAndDelete(delReq.targetId);
    }

    delReq.status = 'approved';
    delReq.adminNote = note || '';
    delReq.reviewedBy = req.user!.id as any;
    delReq.reviewedAt = new Date();
    await delReq.save();

    res.json({
      message: `${delReq.targetType === 'problem' ? 'Problem' : 'Course'} deletion approved and permanently deleted.`,
      request: delReq,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to approve deletion request' });
  }
};

// ─── POST /api/admin/deletion-requests/:id/reject ─────────────────────────────
export const rejectDeletionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const delReq = await DeletionRequest.findById(id);
    if (!delReq) {
      res.status(404).json({ error: 'Deletion request not found' });
      return;
    }

    if (delReq.status !== 'pending') {
      res.status(400).json({ error: `Request has already been ${delReq.status}` });
      return;
    }

    // Restore target item to active status
    if (delReq.targetType === 'problem') {
      await Problem.findByIdAndUpdate(delReq.targetId, {
        deletionStatus: 'none',
        deletionReason: '',
      });
    } else if (delReq.targetType === 'course') {
      await Course.findByIdAndUpdate(delReq.targetId, {
        deletionStatus: 'none',
        deletionReason: '',
      });
    }

    delReq.status = 'rejected';
    delReq.adminNote = note || '';
    delReq.reviewedBy = req.user!.id as any;
    delReq.reviewedAt = new Date();
    await delReq.save();

    res.json({
      message: 'Deletion request rejected. Item restored to normal status.',
      request: delReq,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reject deletion request' });
  }
};

// ─── GET /api/admin/telemetry ────────────────────────────────────────────────
export const getAdminTelemetry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const User = (await import('../models/User.model')).default;
    const Problem = (await import('../models/Problem.model')).default;
    const Course = (await import('../models/Course.model')).default;
    const Submission = (await import('../models/Submission.model')).default;
    const DeletionRequest = (await import('../models/DeletionRequest.model')).default;

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      pendingCourses,
      totalProblems,
      totalSubmissions,
      pendingDeletions,
      pendingInstructors,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'instructor' }),
      Course.countDocuments(),
      Course.countDocuments({ approvalStatus: 'published' }),
      Course.countDocuments({ approvalStatus: 'pending_approval' }),
      Problem.countDocuments(),
      Submission.countDocuments(),
      DeletionRequest.countDocuments({ status: 'pending' }),
      User.countDocuments({ 'instructorApplication.status': 'pending' }),
    ]);

    res.json({
      telemetry: {
        totalUsers,
        totalStudents,
        totalInstructors,
        totalCourses,
        publishedCourses,
        pendingCourses,
        totalProblems,
        totalSubmissions,
        pendingDeletions,
        pendingInstructors,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin telemetry' });
  }
};

// ─── GET /api/admin/instructor-applications ──────────────────────────────────
export const getInstructorApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const User = (await import('../models/User.model')).default;
    const { status } = req.query;
    const filter: Record<string, any> = { 'instructorApplication.status': { $in: ['pending', 'approved', 'rejected'] } };
    if (status && typeof status === 'string') {
      filter['instructorApplication.status'] = status;
    }

    const applications = await User.find(filter)
      .select('username email avatar instructorApplication createdAt')
      .sort({ 'instructorApplication.appliedAt': -1 });

    const pendingCount = await User.countDocuments({ 'instructorApplication.status': 'pending' });

    res.json({ applications, pendingCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch instructor applications' });
  }
};

// ─── POST /api/admin/instructor-applications/:userId/review ───────────────────
export const reviewInstructorApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { action, note } = req.body; // action: 'approve' | 'reject'
    const User = (await import('../models/User.model')).default;
    const Notification = (await import('../models/Notification.model')).default;

    const user = await User.findById(userId);
    if (!user || !user.instructorApplication) {
      res.status(404).json({ error: 'Instructor application not found' });
      return;
    }

    const isApprove = action === 'approve';
    user.instructorApplication.status = isApprove ? 'approved' : 'rejected';
    user.instructorApplication.adminNote = note || '';
    user.instructorApplication.reviewedAt = new Date();

    if (isApprove) {
      user.role = 'instructor';
    }

    await user.save();

    // Send notification
    await Notification.create({
      userId: user._id,
      type: 'system',
      title: isApprove ? 'Instructor Application Approved!' : 'Instructor Application Update',
      message: isApprove
        ? 'Congratulations! You now have instructor privileges to author courses, assignments, and problem sets.'
        : `Your application was reviewed: ${note || 'Application rejected by platform admin.'}`,
      link: isApprove ? '/instructor/dashboard' : '/profile/' + user.username,
    });

    res.json({
      message: `Application ${isApprove ? 'approved' : 'rejected'} successfully`,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to review application' });
  }
};

// ─── GET /api/admin/course-approvals ──────────────────────────────────────────
export const getCourseApprovalQueue = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const Course = (await import('../models/Course.model')).default;
    const { status } = req.query;
    const filter: Record<string, any> = {};
    if (status && typeof status === 'string') {
      filter.approvalStatus = status;
    } else {
      filter.approvalStatus = { $in: ['pending_approval', 'draft', 'rejected'] };
    }

    const courses = await Course.find(filter)
      .populate('createdBy', 'username email avatar')
      .sort({ updatedAt: -1 });

    const pendingCount = await Course.countDocuments({ approvalStatus: 'pending_approval' });

    res.json({ courses, pendingCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch course approval queue' });
  }
};

// ─── POST /api/admin/course-approvals/:courseId/review ────────────────────────
export const reviewCourseApproval = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { action, feedback } = req.body; // action: 'approve' | 'reject'
    const Course = (await import('../models/Course.model')).default;
    const Notification = (await import('../models/Notification.model')).default;

    const course = await Course.findById(courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const isApprove = action === 'approve';
    course.approvalStatus = isApprove ? 'published' : 'rejected';
    course.isPublished = isApprove;
    course.approvalFeedback = feedback || '';
    await course.save();

    if (course.createdBy) {
      await Notification.create({
        userId: course.createdBy,
        type: 'announcement',
        title: isApprove ? `Course Approved & Published: ${course.title}` : `Course Review Feedback: ${course.title}`,
        message: isApprove
          ? 'Your course syllabus has been verified and published to the student catalog!'
          : `Admin review feedback: ${feedback || 'Please update content quality and resubmit.'}`,
        link: `/learn/${course.slug}`,
      });
    }

    res.json({
      message: `Course ${isApprove ? 'approved and published' : 'rejected with feedback'}`,
      course,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to review course' });
  }
};

// ─── GET /api/admin/reports ──────────────────────────────────────────────────
export const getPlatformReports = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const Enrollment = (await import('../models/Enrollment.model')).default;
    const Course = (await import('../models/Course.model')).default;
    const Submission = (await import('../models/Submission.model')).default;

    const totalEnrollments = await Enrollment.countDocuments();
    const completedEnrollments = await Enrollment.countDocuments({ status: 'completed' });
    const completionRate =
      totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const topCourses = await Course.find({ approvalStatus: 'published' })
      .sort({ enrolledCount: -1 })
      .limit(10)
      .select('title slug enrolledCount difficulty category');

    const recentSubmissions = await Submission.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'username')
      .populate('problemId', 'title slug');

    res.json({
      reports: {
        totalEnrollments,
        completedEnrollments,
        completionRate,
        topCourses,
        recentSubmissions,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate platform reports' });
  }
};

