import { Request, Response } from 'express';
import Contest from '../models/Contest.model';
import ContestSubmission from '../models/ContestSubmission.model';
import Problem from '../models/Problem.model';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const createContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      instructions,
      contestType,
      allowCodeExecution,
      startTime,
      endTime,
      durationMinutes,
      problems,
      mcqQuestions,
      allowedLanguages,
      aiEvaluationEnabled,
      isPublished,
    } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Contest title is required' });
      return;
    }

    // Generate unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) baseSlug = 'contest';
    let slug = baseSlug;
    let count = 1;
    while (await Contest.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    // Validate problems
    const formattedProblems: Array<{ problemId: any; points: number; order: number }> = [];
    let totalPoints = 0;

    if (Array.isArray(problems) && problems.length > 0) {
      for (let i = 0; i < problems.length; i++) {
        const item = problems[i];
        const probId = item.problemId || item._id;
        const exists = await Problem.findById(probId);
        if (exists) {
          const pts = Number(item.points) > 0 ? Number(item.points) : 100;
          formattedProblems.push({
            problemId: exists._id,
            points: pts,
            order: i + 1,
          });
          totalPoints += pts;
        }
      }
    }

    // Validate MCQs
    const formattedMCQs: Array<{
      question: string;
      options: string[];
      correctOption: number;
      points: number;
      explanation?: string;
      order: number;
    }> = [];

    if (Array.isArray(mcqQuestions) && mcqQuestions.length > 0) {
      for (let i = 0; i < mcqQuestions.length; i++) {
        const item = mcqQuestions[i];
        if (item.question && item.question.trim() && Array.isArray(item.options) && item.options.length >= 2) {
          const validOpts = item.options.map((opt: any) => String(opt).trim()).filter(Boolean);
          if (validOpts.length >= 2) {
            const correctOpt =
              typeof item.correctOption === 'number' && item.correctOption >= 0 && item.correctOption < validOpts.length
                ? item.correctOption
                : 0;
            const pts = Number(item.points) > 0 ? Number(item.points) : 10;
            formattedMCQs.push({
              question: item.question.trim(),
              options: validOpts,
              correctOption: correctOpt,
              points: pts,
              explanation: item.explanation ? String(item.explanation).trim() : '',
              order: i + 1,
            });
            totalPoints += pts;
          }
        }
      }
    }

    const mode = contestType === 'superset' ? 'superset' : 'standard';
    const executionEnabled = mode === 'superset' ? (allowCodeExecution !== false) : false;

    const contest = await Contest.create({
      title: title.trim(),
      slug,
      description: description || '',
      instructions: instructions || undefined,
      contestType: mode,
      allowCodeExecution: executionEnabled,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 60,
      problems: formattedProblems,
      mcqQuestions: formattedMCQs,
      allowedLanguages: allowedLanguages && allowedLanguages.length > 0 ? allowedLanguages : ['python', 'javascript', 'cpp', 'java'],
      aiEvaluationEnabled: aiEvaluationEnabled !== false,
      isPublished: isPublished !== false,
      totalPoints: totalPoints || 100,
      createdBy: (req as any).user.id,
    });

    res.status(201).json({ success: true, contest });
  } catch (error: any) {
    console.error('Error creating contest:', error);
    res.status(500).json({ error: error.message || 'Failed to create contest' });
  }
};

export const getMyContests = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const contests = await Contest.find({ createdBy: userId })
      .populate('problems.problemId', 'title difficulty tags')
      .sort({ createdAt: -1 })
      .lean();

    // Attach submission counts
    const contestIds = contests.map((c) => c._id);
    const submissions = await ContestSubmission.find({ contestId: { $in: contestIds } })
      .select('contestId status score')
      .lean();

    const submissionCountMap: Record<string, number> = {};
    submissions.forEach((s) => {
      const cid = s.contestId.toString();
      submissionCountMap[cid] = (submissionCountMap[cid] || 0) + 1;
    });

    const enriched = contests.map((c) => ({
      ...c,
      participantCount: submissionCountMap[c._id.toString()] || 0,
      problemsCount: c.problems?.length || 0,
    }));

    res.json({ success: true, contests: enriched });
  } catch (error: any) {
    console.error('Error fetching instructor contests:', error);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
};

export const getMyContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contest = await Contest.findOne({
      _id: id,
      createdBy: (req as any).user.id,
    }).populate('problems.problemId');

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    res.json({ success: true, contest });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch contest' });
  }
};

export const updateContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      instructions,
      contestType,
      allowCodeExecution,
      startTime,
      endTime,
      durationMinutes,
      problems,
      mcqQuestions,
      allowedLanguages,
      aiEvaluationEnabled,
      isPublished,
    } = req.body;

    const contest = await Contest.findOne({
      _id: id,
      createdBy: (req as any).user.id,
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    if (title && title.trim()) contest.title = title.trim();
    if (description !== undefined) contest.description = description;
    if (instructions !== undefined) contest.instructions = instructions;
    if (contestType !== undefined) {
      contest.contestType = contestType === 'superset' ? 'superset' : 'standard';
    }
    if (allowCodeExecution !== undefined) {
      contest.allowCodeExecution = Boolean(allowCodeExecution);
    } else if (contestType !== undefined) {
      contest.allowCodeExecution = contestType === 'superset';
    }
    if (startTime) contest.startTime = new Date(startTime);
    if (endTime) contest.endTime = new Date(endTime);
    if (durationMinutes) contest.durationMinutes = Number(durationMinutes);
    if (allowedLanguages) contest.allowedLanguages = allowedLanguages;
    if (aiEvaluationEnabled !== undefined) contest.aiEvaluationEnabled = Boolean(aiEvaluationEnabled);
    if (isPublished !== undefined) contest.isPublished = Boolean(isPublished);

    let problemPoints = 0;
    if (Array.isArray(problems)) {
      const formattedProblems: Array<{ problemId: any; points: number; order: number }> = [];
      for (let i = 0; i < problems.length; i++) {
        const item = problems[i];
        const probId = item.problemId?._id || item.problemId || item._id;
        const exists = await Problem.findById(probId);
        if (exists) {
          const pts = Number(item.points) > 0 ? Number(item.points) : 100;
          formattedProblems.push({
            problemId: exists._id,
            points: pts,
            order: i + 1,
          });
          problemPoints += pts;
        }
      }
      contest.problems = formattedProblems as any;
    } else {
      problemPoints = (contest.problems || []).reduce((sum, p) => sum + (p.points || 0), 0);
    }

    let mcqPoints = 0;
    if (Array.isArray(mcqQuestions)) {
      const formattedMCQs: Array<{
        question: string;
        options: string[];
        correctOption: number;
        points: number;
        explanation?: string;
        order: number;
      }> = [];
      for (let i = 0; i < mcqQuestions.length; i++) {
        const item = mcqQuestions[i];
        if (item.question && item.question.trim() && Array.isArray(item.options) && item.options.length >= 2) {
          const validOpts = item.options.map((opt: any) => String(opt).trim()).filter(Boolean);
          if (validOpts.length >= 2) {
            const correctOpt =
              typeof item.correctOption === 'number' && item.correctOption >= 0 && item.correctOption < validOpts.length
                ? item.correctOption
                : 0;
            const pts = Number(item.points) > 0 ? Number(item.points) : 10;
            formattedMCQs.push({
              question: item.question.trim(),
              options: validOpts,
              correctOption: correctOpt,
              points: pts,
              explanation: item.explanation ? String(item.explanation).trim() : '',
              order: i + 1,
            });
            mcqPoints += pts;
          }
        }
      }
      contest.mcqQuestions = formattedMCQs as any;
    } else {
      mcqPoints = (contest.mcqQuestions || []).reduce((sum, m) => sum + (m.points || 0), 0);
    }

    contest.totalPoints = (problemPoints + mcqPoints) || 100;

    await contest.save();
    res.json({ success: true, contest });
  } catch (error: any) {
    console.error('Error updating contest:', error);
    res.status(500).json({ error: error.message || 'Failed to update contest' });
  }
};

export const togglePublishContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contest = await Contest.findOne({
      _id: id,
      createdBy: (req as any).user.id,
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    contest.isPublished = !contest.isPublished;
    await contest.save();

    res.json({
      success: true,
      isPublished: contest.isPublished,
      message: contest.isPublished ? 'Contest published' : 'Contest unpublished',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle contest publish state' });
  }
};

export const deleteContest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const contest = await Contest.findOneAndDelete({
      _id: id,
      createdBy: (req as any).user.id,
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    // Clean up submissions
    await ContestSubmission.deleteMany({ contestId: id });

    res.json({ success: true, message: 'Contest deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete contest' });
  }
};
