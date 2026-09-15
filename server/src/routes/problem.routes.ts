import { Router } from 'express';
import { getProblems, getProblemBySlug, createProblem, publishProblem, updateProblem } from '../controllers/problem.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();
router.get('/', getProblems);
router.get('/:slug', getProblemBySlug);
router.post('/', authenticate, requireAdmin, createProblem);
router.patch('/:id/publish', authenticate, requireAdmin, publishProblem);
router.patch('/:id', authenticate, requireAdmin, updateProblem);

export default router;
