import { Response } from 'express';
import { z } from 'zod';
import Problem from '../models/Problem.model';
import User from '../models/User.model';
import Contest from '../models/Contest.model';
import Course from '../models/Course.model';
import DeletionRequest from '../models/DeletionRequest.model';
import { AuthRequest } from '../middleware/auth.middleware';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Validation Schema ────────────────────────────────────────────────────────
const testCaseSchema = z.object({
  input: z.string().min(1, 'Test case input is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isHidden: z.boolean().default(false),
  isExample: z.boolean().default(false),
  explanation: z.string().optional(),
});

const createProblemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  constraints: z.string().optional().default(''),
  testCases: z.array(testCaseSchema).min(1, 'At least one test case is required').max(10),
  starterTemplates: z.object({
    python: z.string().optional().default(''),
    java: z.string().optional().default(''),
    cpp: z.string().optional().default(''),
    javascript: z.string().optional().default(''),
  }).optional().default({ python: '', java: '', cpp: '', javascript: '' }),
  timeLimitMs: z.number().int().min(500).max(10000).default(2000),
  memoryLimitMb: z.number().int().min(64).max(1024).default(256),
  aiEnabled: z.boolean().default(true),
  aiConcepts: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(false),
});

const updateProblemSchema = createProblemSchema.partial();

// ─── Helper: unique slug generation ──────────────────────────────────────────
async function generateSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 1;
  while (await Problem.exists({ slug })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

// ─── GET /api/instructor/dashboard ───────────────────────────────────────────
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const instructorId = req.user!.id;

    const [totalProblems, publishedProblems, problems, totalContests, totalCourses, contests] = await Promise.all([
      Problem.countDocuments({ createdBy: instructorId }),
      Problem.countDocuments({ createdBy: instructorId, isPublished: true }),
      Problem.find({ createdBy: instructorId })
        .select('title slug difficulty tags totalSubmissions totalAccepted acceptanceRate isPublished createdAt')
        .sort({ createdAt: -1 })
        .limit(6),
      Contest.countDocuments({ createdBy: instructorId }),
      Course.countDocuments({ createdBy: instructorId }),
      Contest.find({ createdBy: instructorId })
        .select('title slug startTime endTime durationMinutes problems isPublished')
        .sort({ createdAt: -1 })
        .limit(4),
    ]);

    const totalSubmissions = problems.reduce((acc, p) => acc + (p.totalSubmissions || 0), 0);
    const totalAccepted   = problems.reduce((acc, p) => acc + (p.totalAccepted || 0), 0);
    const avgPassRate     = totalSubmissions > 0 ? Math.round((totalAccepted / totalSubmissions) * 100) : null;

    res.json({
      stats: {
        totalProblems,
        publishedProblems,
        draftProblems: totalProblems - publishedProblems,
        totalContests,
        totalCourses,
        totalSubmissions,
        avgPassRate,
        aiAnalysesRun: Math.max(1, totalSubmissions),
      },
      recentProblems: problems,
      recentContests: contests,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// ─── GET /api/instructor/problems ────────────────────────────────────────────
export const getMyProblems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, difficulty, status, page = '1', limit = '20' } = req.query;
    const filter: Record<string, unknown> = { createdBy: req.user!.id };

    if (difficulty) filter.difficulty = difficulty;
    if (status === 'published') filter.isPublished = true;
    if (status === 'draft')     filter.isPublished = false;
    if (search)                 filter.title = { $regex: search, $options: 'i' };

    const pageNum  = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, parseInt(limit as string));
    const skip     = (pageNum - 1) * limitNum;

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select('title slug difficulty tags testCases totalSubmissions totalAccepted acceptanceRate isPublished aiEnabled createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Problem.countDocuments(filter),
    ]);

    // Compute pass rate per problem
    const enriched = problems.map((p) => ({
      ...p.toObject(),
      passRate: p.totalSubmissions > 0 ? Math.round((p.totalAccepted / p.totalSubmissions) * 100) : null,
      testCaseCount: p.testCases.length,
    }));

    res.json({ problems: enriched, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
};

// ─── GET /api/instructor/problems/:id ────────────────────────────────────────
export const getMyProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, createdBy: req.user!.id });
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }
    res.json(problem);
  } catch {
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
};

// ─── POST /api/instructor/problems ───────────────────────────────────────────
export const createProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = createProblemSchema.parse(req.body);
    const slug = await generateSlug(data.title);

    // Auto-build legacy examples array from isExample test cases
    const examples = data.testCases
      .filter((tc) => tc.isExample)
      .map((tc) => ({ input: tc.input, output: tc.expectedOutput, explanation: tc.explanation }));

    const problem = await Problem.create({
      ...data,
      slug,
      createdBy: req.user!.id,
      examples,
      starterTemplates: data.starterTemplates ?? {},
    });

    res.status(201).json(problem);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message, details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to create problem' });
  }
};

// ─── PATCH /api/instructor/problems/:id ──────────────────────────────────────
export const updateProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateProblemSchema.parse(req.body);

    // Re-derive examples if testCases changed
    const extra: Record<string, unknown> = {};
    if (data.testCases) {
      extra.examples = data.testCases
        .filter((tc) => tc.isExample)
        .map((tc) => ({ input: tc.input, output: tc.expectedOutput, explanation: tc.explanation }));
    }

    const problem = await Problem.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user!.id },
      { ...data, ...extra },
      { new: true, runValidators: true }
    );
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }
    res.json(problem);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message, details: err.issues });
      return;
    }
    res.status(500).json({ error: 'Failed to update problem' });
  }
};

// ─── PATCH /api/instructor/problems/:id/publish ──────────────────────────────
export const togglePublish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const problem = await Problem.findOne({ _id: req.params.id, createdBy: req.user!.id });
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    // Require at least 1 test case before publishing
    if (!problem.isPublished && problem.testCases.length === 0) {
      res.status(400).json({ error: 'Add at least one test case before publishing' });
      return;
    }

    problem.isPublished = !problem.isPublished;
    await problem.save();
    res.json({ isPublished: problem.isPublished, message: problem.isPublished ? 'Problem published!' : 'Problem moved to drafts' });
  } catch {
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
};

// ─── DELETE /api/instructor/problems/:id ─────────────────────────────────────
export const deleteProblem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Only administrators can directly bypass approval
    if (req.user!.role === 'admin') {
      const problem = await Problem.findByIdAndDelete(req.params.id);
      if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }
      await DeletionRequest.deleteMany({ targetId: req.params.id });
      res.json({ message: 'Problem permanently deleted by administrator' });
      return;
    }

    res.status(403).json({
      error: 'Direct deletion is disabled for instructors. Please submit a deletion request with a reason for administrator approval.',
    });
  } catch {
    res.status(500).json({ error: 'Failed to delete problem' });
  }
};

// ─── POST /api/instructor/problems/:id/request-delete ────────────────────────
export const requestProblemDeletion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      res.status(400).json({ error: 'Please provide a clear reason (at least 5 characters) for administrator approval.' });
      return;
    }

    const filter: Record<string, any> = { _id: id };
    if (req.user!.role !== 'admin') {
      filter.createdBy = req.user!.id;
    }

    const problem = await Problem.findOne(filter);
    if (!problem) {
      res.status(404).json({ error: 'Problem not found or unauthorized' });
      return;
    }

    const existing = await DeletionRequest.findOne({ targetId: problem._id, status: 'pending' });
    if (existing) {
      res.status(400).json({ error: 'A deletion request is already pending administrator approval for this challenge.' });
      return;
    }

    problem.deletionStatus = 'pending';
    problem.deletionReason = reason.trim();
    await problem.save();

    const userDoc = await User.findById(req.user!.id).select('username email');
    const request = await DeletionRequest.create({
      targetType: 'problem',
      targetId: problem._id,
      targetTitle: problem.title,
      targetSlug: problem.slug,
      reason: reason.trim(),
      requestedBy: req.user!.id,
      requestedByUsername: userDoc?.username || req.user!.username || 'Instructor',
      requestedByEmail: userDoc?.email || '',
      status: 'pending',
    });

    res.status(201).json({
      message: 'Deletion request submitted for administrator review.',
      deletionRequest: request,
      problem,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit deletion request' });
  }
};

// ─── POST /api/instructor/courses/:id/request-delete ─────────────────────────
export const requestCourseDeletion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      res.status(400).json({ error: 'Please provide a clear reason (at least 5 characters) for administrator approval.' });
      return;
    }

    const filter: Record<string, any> = { _id: id };
    if (req.user!.role !== 'admin') {
      filter.createdBy = req.user!.id;
    }

    const course = await Course.findOne(filter);
    if (!course) {
      res.status(404).json({ error: 'Course not found or unauthorized' });
      return;
    }

    const existing = await DeletionRequest.findOne({ targetId: course._id, status: 'pending' });
    if (existing) {
      res.status(400).json({ error: 'A deletion request is already pending administrator approval for this course.' });
      return;
    }

    course.deletionStatus = 'pending';
    course.deletionReason = reason.trim();
    await course.save();

    const userDoc = await User.findById(req.user!.id).select('username email');
    const request = await DeletionRequest.create({
      targetType: 'course',
      targetId: course._id,
      targetTitle: course.title,
      targetSlug: course.slug,
      reason: reason.trim(),
      requestedBy: req.user!.id,
      requestedByUsername: userDoc?.username || req.user!.username || 'Instructor',
      requestedByEmail: userDoc?.email || '',
      status: 'pending',
    });

    res.status(201).json({
      message: 'Course deletion request submitted for administrator review.',
      deletionRequest: request,
      course,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit course deletion request' });
  }
};

// ─── DELETE /api/instructor/deletion-requests/:targetId/cancel ────────────────
export const cancelDeletionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetId } = req.params;
    const filter: Record<string, any> = { targetId, status: 'pending' };
    if (req.user!.role !== 'admin') {
      filter.requestedBy = req.user!.id;
    }

    const delReq = await DeletionRequest.findOne(filter);
    if (!delReq) {
      res.status(404).json({ error: 'Pending deletion request not found' });
      return;
    }

    if (delReq.targetType === 'problem') {
      await Problem.findByIdAndUpdate(delReq.targetId, { deletionStatus: 'none', deletionReason: '' });
    } else if (delReq.targetType === 'course') {
      await Course.findByIdAndUpdate(delReq.targetId, { deletionStatus: 'none', deletionReason: '' });
    }

    await DeletionRequest.findByIdAndDelete(delReq._id);
    res.json({ message: 'Deletion request cancelled successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel deletion request' });
  }
};

// ─── GET /api/instructor/students ─────────────────────────────────────────────
import Submission from '../models/Submission.model';

export const getStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search = '', page = '1', limit = '20', sortBy = 'joinedAt', sortDir = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter: only show regular students (role === 'user')
    const filter: Record<string, unknown> = { role: 'user' };
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email:    { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder: 1 | -1 = sortDir === 'asc' ? 1 : -1;
    const allowedSort = ['joinedAt', 'username', 'stats.solved', 'stats.streak'];
    const sortField = allowedSort.includes(sortBy as string) ? (sortBy as string) : 'joinedAt';

    const [students, total] = await Promise.all([
      User.find(filter)
        .select('username email avatar joinedAt stats badges solvedProblems')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Aggregate submission counts for these students
    const studentIds = students.map((s) => s._id);
    const submissionCounts = await Submission.aggregate([
      { $match: { userId: { $in: studentIds } } },
      { $group: { _id: '$userId', total: { $sum: 1 }, accepted: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } } } },
    ]);

    const submissionMap: Record<string, { total: number; accepted: number }> = {};
    for (const sc of submissionCounts) {
      submissionMap[sc._id.toString()] = { total: sc.total, accepted: sc.accepted };
    }

    const enriched = students.map((s) => ({
      _id: s._id,
      username: s.username,
      email:    s.email,
      avatar:   s.avatar,
      joinedAt: s.joinedAt,
      stats:    s.stats,
      badges:   s.badges || [],
      submissions: submissionMap[s._id.toString()] || { total: 0, accepted: 0 },
    }));

    res.json({
      students: enriched,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load students' });
  }
};

