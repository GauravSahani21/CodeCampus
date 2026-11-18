import { Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import Problem from '../models/Problem.model';
import User from '../models/User.model';
import Submission from '../models/Submission.model';
import { cleanStarterTemplate } from '../services/driverWrapper.service';

const problemSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  tags: z.array(z.string()),
  description: z.string().min(10),
  constraints: z.string().optional(),
  examples: z.array(z.object({ input: z.string(), output: z.string(), explanation: z.string().optional() })),
  testCases: z.array(z.object({ input: z.string(), expectedOutput: z.string(), isHidden: z.boolean().default(false) })),
  starterTemplates: z.record(z.string(), z.string()).optional(),
  hints: z.array(z.string()).optional(),
  questionId: z.number().optional(),
});

export const getProblems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { difficulty, tag, search, page = '1', limit = '50', all } = req.query;
    const filter: Record<string, unknown> = all === 'true' ? {} : { isPublished: true };

    if (difficulty && difficulty !== 'All') filter.difficulty = difficulty;
    if (tag) filter.tags = { $in: [tag] };
    if (search) filter.title = { $regex: search, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select('title slug difficulty tags acceptanceRate totalSubmissions isPublished questionId')
        .sort({ questionId: 1, createdAt: 1 })
        .skip(skip)
        .limit(limitNum),
      Problem.countDocuments(filter),
    ]);

    // Check optional authenticated user to return live status ('solved' | 'attempted' | 'unsolved')
    const userSolvedSet = new Set<string>();
    const userAttemptedSet = new Set<string>();

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { id: string };
        if (decoded && decoded.id) {
          const userDoc = await User.findById(decoded.id).select('solvedProblems');
          if (userDoc?.solvedProblems) {
            userDoc.solvedProblems.forEach((id: any) => userSolvedSet.add(id.toString()));
          }
          const subs = await Submission.find({ userId: decoded.id }).select('problemId status');
          for (const s of subs) {
            const pid = s.problemId?.toString();
            if (!pid) continue;
            if (s.status === 'Accepted') {
              userSolvedSet.add(pid);
            } else if (!userSolvedSet.has(pid)) {
              userAttemptedSet.add(pid);
            }
          }
        }
      } catch {}
    }

    const mapped = problems.map((p, idx) => {
      const pid = p._id.toString();
      let status: 'solved' | 'attempted' | 'unsolved' = 'unsolved';
      if (userSolvedSet.has(pid)) status = 'solved';
      else if (userAttemptedSet.has(pid)) status = 'attempted';
      return {
        ...p.toObject(),
        questionId: p.questionId || (skip + idx + 1),
        status,
      };
    });

    res.json({ problems: mapped, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};

export const getProblemBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug, isPublished: true })
      .select('-testCases.isHidden');
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    const cleanedTemplates: Record<string, string> = {};
    for (const [lang, tpl] of Object.entries(problem.starterTemplates || {})) {
      cleanedTemplates[lang] = cleanStarterTemplate(lang, tpl as string);
    }

    // Only send non-hidden test cases and clean templates
    const sanitized = {
      ...problem.toObject(),
      starterTemplates: cleanedTemplates,
      rawTemplates: problem.starterTemplates,
      testCases: problem.testCases.filter((tc) => !tc.isHidden),
    };
    res.json(sanitized);
  } catch {
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
};

export const createProblem = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const data = problemSchema.parse(req.body);
    let questionId = data.questionId;
    if (!questionId) {
      const last = await Problem.findOne({ questionId: { $exists: true, $ne: null } })
        .sort({ questionId: -1 })
        .select('questionId')
        .lean();
      questionId = (last?.questionId && last.questionId > 0) ? last.questionId + 1 : 1;
    }
    const problem = await Problem.create({ ...data, questionId, createdBy: req.user!.id } as any);
    res.status(201).json(problem);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.issues[0].message }); return; }
    res.status(500).json({ error: 'Failed to create problem' });
  }
};

export const publishProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }
    problem.isPublished = !problem.isPublished;
    await problem.save();
    res.json(problem);
  } catch {
    res.status(500).json({ error: 'Failed to toggle problem publish status' });
  }
};

export const updateProblem = async (req: Request, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }
    res.json(problem);
  } catch {
    res.status(500).json({ error: 'Failed to update problem' });
  }
};
