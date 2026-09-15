import { Router } from 'express';
import { getCourses, getCourseBySlug, getLessonById, createCourse } from '../controllers/learn.controller';
import { authenticate, requireInstructor } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getCourses);
router.get('/:slug', getCourseBySlug);
router.get('/:slug/lessons/:lessonId', getLessonById);
router.post('/', authenticate, requireInstructor, createCourse);

export default router;
