import { Router } from 'express';
import {
  getRecommendations,
  getSkillProfile,
  recalculateProfile,
} from '../controllers/recommendation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getRecommendations);
router.get('/skill-profile', authenticate, getSkillProfile);
router.post('/recalculate', authenticate, recalculateProfile);

export default router;
