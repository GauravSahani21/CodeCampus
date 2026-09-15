import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  enrollInCourse,
  getMyEnrollments,
  updateLessonProgress,
} from '../controllers/enrollment.controller';

const router = Router();

router.use(requireAuth);
router.get('/my', getMyEnrollments);
router.post('/:courseId/enroll', enrollInCourse);
router.post('/:courseId/progress', updateLessonProgress);

export default router;
