import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Notification from '../models/Notification.model';

// ─── GET /api/notifications ──────────────────────────────────────────────────
export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch notifications' });
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (id === 'all') {
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
      res.json({ message: 'All notifications marked as read' });
      return;
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ notification });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to mark notification read' });
  }
};
