import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getStudentAssignments,
  getAssignmentById,
  submitAssignment,
  getInstructorAssignments,
  createAssignment,
  gradeAssignmentSubmission,
} from '../controllers/assignment.controller';

const router = Router();

router.use(requireAuth);

// Student endpoints
router.get('/', getStudentAssignments);
router.get('/:id', getAssignmentById);
router.post('/:id/submit', submitAssignment);

// Instructor endpoints
router.get('/instructor/my', getInstructorAssignments);
router.post('/instructor/create', createAssignment);
router.post('/instructor/:id/grade/:subId', gradeAssignmentSubmission);

export default router;
