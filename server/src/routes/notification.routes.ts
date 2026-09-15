import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  getUserNotifications,
  markNotificationAsRead,
} from '../controllers/notification.controller';

const router = Router();

router.use(requireAuth);
router.get('/', getUserNotifications);
router.patch('/:id/read', markNotificationAsRead);

export default router;
