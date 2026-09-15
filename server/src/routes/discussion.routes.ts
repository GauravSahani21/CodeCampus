import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import {
  getProblemDiscussions,
  createDiscussion,
  addReply,
  toggleUpvoteDiscussion,
  markAcceptedReply,
} from '../controllers/discussion.controller';

const router = Router();

router.get('/problem/:problemIdOrSlug', optionalAuth, getProblemDiscussions);
router.post('/', requireAuth, createDiscussion);
router.post('/:id/reply', requireAuth, addReply);
router.post('/:id/upvote', requireAuth, toggleUpvoteDiscussion);
router.post('/:id/reply/:replyId/accept', requireAuth, markAcceptedReply);

export default router;
