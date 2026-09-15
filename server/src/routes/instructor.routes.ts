import { Router } from 'express';
import { authenticate, requireInstructor } from '../middleware/auth.middleware';
import {
  getDashboard,
  getMyProblems,
  getMyProblem,
  createProblem,
  updateProblem,
  togglePublish,
  deleteProblem,
  requestProblemDeletion,
  requestCourseDeletion,
  cancelDeletionRequest,
  getStudents,
} from '../controllers/instructor.controller';
import {
  createContest,
  getMyContests,
  getMyContest,
  updateContest,
  togglePublishContest,
  deleteContest,
} from '../controllers/instructorContest.controller';

const router = Router();

// Protect all instructor routes
router.use(authenticate, requireInstructor);

// Dashboard
router.get('/dashboard', getDashboard);

// Students
router.get('/students', getStudents);

// Problems CRUD & Deletion Request
router.get('/problems', getMyProblems);
router.post('/problems', createProblem);
router.get('/problems/:id', getMyProblem);
router.patch('/problems/:id', updateProblem);
router.patch('/problems/:id/publish', togglePublish);
router.delete('/problems/:id', deleteProblem);
router.post('/problems/:id/request-delete', requestProblemDeletion);

// Courses Deletion Request
router.post('/courses/:id/request-delete', requestCourseDeletion);

// Cancel Deletion Request
router.delete('/deletion-requests/:targetId/cancel', cancelDeletionRequest);

// Contests CRUD
router.get('/contests', getMyContests);
router.post('/contests', createContest);
router.get('/contests/:id', getMyContest);
router.patch('/contests/:id', updateContest);
router.patch('/contests/:id/publish', togglePublishContest);
router.delete('/contests/:id', deleteContest);

export default router;

