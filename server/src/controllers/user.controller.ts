import { Request, Response } from 'express';
import User from '../models/User.model';
import Submission from '../models/Submission.model';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-passwordHash')
      .populate('solvedProblems', 'title slug difficulty');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }

    // Filter out null/deleted problem references and deduplicate unique problems
    if (Array.isArray(user.solvedProblems)) {
      const seen = new Set<string>();
      const validDeduped: any[] = [];
      for (const p of user.solvedProblems) {
        if (!p) continue;
        const idStr = (p._id ? p._id.toString() : (p.toString ? p.toString() : ''));
        if (idStr && !seen.has(idStr)) {
          seen.add(idStr);
          validDeduped.push(p);
        }
      }
      user.solvedProblems = validDeduped;

      if (user.stats && user.stats.solved !== validDeduped.length) {
        user.stats.solved = validDeduped.length;
        await User.updateOne(
          { _id: user._id },
          { $set: { 'stats.solved': validDeduped.length, solvedProblems: validDeduped.map((p: any) => p._id) } }
        );
      }
    }

    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const getUserActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('activityLog');
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    // Return last 12 months of activity
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const filtered = user.activityLog.filter((a) => new Date(a.date) >= oneYearAgo);
    res.json(filtered);
  } catch {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

export const getLeaderboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({})
      .select('username avatar stats.solved stats.streak')
      .sort({ 'stats.solved': -1 })
      .limit(50);
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
