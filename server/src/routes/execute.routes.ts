import { Router } from 'express';
import { runCode, getSupportedLanguages } from '../controllers/execute.controller';

const router = Router();
router.post('/', runCode);
router.get('/languages', getSupportedLanguages);

export default router;
