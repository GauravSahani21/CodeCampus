import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import {
  getContests,
  getContestById,
  submitContest,
  runContestCode,
  getMyContestSubmission,
  getContestLeaderboard,
} from '../controllers/contest.controller';

const router = Router();

// Public routes (with optional auth for personal progress tracking)
router.get('/', optionalAuthenticate, getContests);
router.get('/:id', getContestById);
router.get('/:id/leaderboard', getContestLeaderboard);

// Authenticated user routes
router.post('/:id/run', authenticate, runContestCode);
router.post('/:id/submit', authenticate, submitContest);
router.get('/:id/my-submission', authenticate, getMyContestSubmission);

export default router;
