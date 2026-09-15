import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import {
  getDeletionRequests,
  approveDeletionRequest,
  rejectDeletionRequest,
  getAdminTelemetry,
  getInstructorApplications,
  reviewInstructorApplication,
  getCourseApprovalQueue,
  reviewCourseApproval,
  getPlatformReports,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

router.get('/telemetry', getAdminTelemetry);
router.get('/reports', getPlatformReports);

router.get('/deletion-requests', getDeletionRequests);
router.post('/deletion-requests/:id/approve', approveDeletionRequest);
router.post('/deletion-requests/:id/reject', rejectDeletionRequest);

router.get('/instructor-applications', getInstructorApplications);
router.post('/instructor-applications/:userId/review', reviewInstructorApplication);

router.get('/course-approvals', getCourseApprovalQueue);
router.post('/course-approvals/:courseId/review', reviewCourseApproval);

export default router;
