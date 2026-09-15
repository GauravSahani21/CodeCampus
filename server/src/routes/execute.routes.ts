import { Router } from 'express';
import { runCode, getSupportedLanguages, reviewCode } from '../controllers/execute.controller';

const router = Router();
router.post('/', runCode);
router.post('/ai-review', reviewCode);
router.get('/languages', getSupportedLanguages);

export default router;
