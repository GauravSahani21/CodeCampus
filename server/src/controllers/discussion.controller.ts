import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Discussion from '../models/Discussion.model';
import Problem from '../models/Problem.model';

// ─── GET /api/discussions/problem/:problemIdOrSlug ───────────────────────────
export const getProblemDiscussions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problemIdOrSlug = String(req.params.problemIdOrSlug);
    let problemId = problemIdOrSlug;

    // Resolve slug if needed
    if (!problemId.match(/^[0-9a-fA-F]{24}$/)) {
      const p = await Problem.findOne({ slug: problemIdOrSlug });
      if (!p) {
        res.status(404).json({ error: 'Problem not found' });
        return;
      }
      problemId = p._id.toString();
    }

    const { category, sort } = req.query;
    const filter: Record<string, any> = { problemId };
    if (category && ['question', 'approach', 'edge-case', 'bug'].includes(category as string)) {
      filter.category = category;
    }

    const sortOption: Record<string, any> =
      sort === 'top' ? { upvotes: -1, createdAt: -1 } : { createdAt: -1 };

    const discussions = await Discussion.find(filter)
      .sort(sortOption)
      .populate('authorId', 'username avatar role')
      .populate('replies.authorId', 'username avatar role');

    res.json(discussions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch discussions' });
  }
};

// ─── POST /api/discussions ───────────────────────────────────────────────────
export const createDiscussion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemIdOrSlug, title, content, category } = req.body;
    let problemId = problemIdOrSlug;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    if (!problemId.match(/^[0-9a-fA-F]{24}$/)) {
      const p = await Problem.findOne({ slug: problemIdOrSlug });
      if (!p) {
        res.status(404).json({ error: 'Problem not found' });
        return;
      }
      problemId = p._id.toString();
    }

    const discussion = await Discussion.create({
      problemId,
      authorId: req.user!.id,
      title: title.trim(),
      content: content.trim(),
      category: category || 'question',
      upvotes: [],
      replies: [],
    });

    const populated = await Discussion.findById(discussion._id).populate('authorId', 'username avatar role');
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create discussion thread' });
  }
};

// ─── POST /api/discussions/:id/reply ─────────────────────────────────────────
export const addReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Reply content cannot be empty' });
      return;
    }

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      res.status(404).json({ error: 'Discussion not found' });
      return;
    }

    discussion.replies.push({
      authorId: req.user!.id as any,
      content: content.trim(),
      upvotes: [],
      isAccepted: false,
      createdAt: new Date(),
    } as any);

    await discussion.save();

    const updated = await Discussion.findById(id)
      .populate('authorId', 'username avatar role')
      .populate('replies.authorId', 'username avatar role');

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to post reply' });
  }
};

// ─── POST /api/discussions/:id/upvote ────────────────────────────────────────
export const toggleUpvoteDiscussion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      res.status(404).json({ error: 'Discussion not found' });
      return;
    }

    const idx = discussion.upvotes.findIndex((u) => u.toString() === userId);
    if (idx > -1) {
      discussion.upvotes.splice(idx, 1);
    } else {
      discussion.upvotes.push(userId as any);
    }

    await discussion.save();
    res.json({ upvotesCount: discussion.upvotes.length, hasUpvoted: idx === -1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle upvote' });
  }
};

// ─── POST /api/discussions/:id/reply/:replyId/accept ─────────────────────────
export const markAcceptedReply = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, replyId } = req.params;
    const userId = req.user!.id;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      res.status(404).json({ error: 'Discussion not found' });
      return;
    }

    // Only thread author or instructor/admin can mark accepted explanation
    if (discussion.authorId.toString() !== userId && req.user!.role !== 'admin' && req.user!.role !== 'instructor') {
      res.status(403).json({ error: 'Only the thread author or instructors can accept answers' });
      return;
    }

    const reply = discussion.replies.find((r) => r._id.toString() === replyId);
    if (!reply) {
      res.status(404).json({ error: 'Reply not found' });
      return;
    }

    // Toggle acceptance
    reply.isAccepted = !reply.isAccepted;
    discussion.isSolved = discussion.replies.some((r) => r.isAccepted);
    await discussion.save();

    const updated = await Discussion.findById(id)
      .populate('authorId', 'username avatar role')
      .populate('replies.authorId', 'username avatar role');

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to accept reply' });
  }
};
