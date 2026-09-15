import { Router } from 'express';
import { getUserProfile, getUserActivity, getLeaderboard } from '../controllers/user.controller';

const router = Router();
router.get('/leaderboard', getLeaderboard);
router.get('/:username', getUserProfile);
router.get('/:username/activity', getUserActivity);

export default router;
