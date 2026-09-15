import { Router } from 'express';
import { submitCode, getUserSubmissions } from '../controllers/submission.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.post('/', authenticate, submitCode);
router.get('/', authenticate, getUserSubmissions);

export default router;
