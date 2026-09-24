import { Request, Response } from 'express';
import { z } from 'zod';
import Contest from '../models/Contest.model';
import ContestSubmission from '../models/ContestSubmission.model';
import Problem from '../models/Problem.model';
import { executeCode } from '../services/piston.service';
import { evaluateContestSubmission } from '../services/aiEvaluation.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { wrapCodeWithDriver, cleanStarterTemplate } from '../services/driverWrapper.service';

// ── Output comparison helper ─────────────────────────────────────────────────
function compareOutputs(actual: string, expected: string): boolean {
  const normActual = actual.trim();
  const normExpected = expected.trim();
  if (normActual === normExpected) return true;

  if (normActual.toLowerCase() === normExpected.toLowerCase()) return true;

  try {
    const actJson = JSON.parse(normActual);
    const expJson = JSON.parse(normExpected);
    if (JSON.stringify(actJson) === JSON.stringify(expJson)) return true;
  } catch {}

  const actLines = normActual.split('\n').map((l) => l.trim());
  const expLines = normExpected.split('\n').map((l) => l.trim());
  if (actLines.length === expLines.length) {
    const allMatch = actLines.every((l, idx) => {
      if (l === expLines[idx]) return true;
      return l.replace(/\s+/g, '') === expLines[idx].replace(/\s+/g, '');
    });
    if (allMatch) return true;
  }

  return false;
}

// ── GET /api/contests ────────────────────────────────────────────────────────
export const getContests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;
    const now = new Date();
    const filter: Record<string, unknown> = { isPublished: true };

    if (search) {
      filter.title = { $regex: search as string, $options: 'i' };
    }

    if (status === 'live') {
      filter.startTime = { $lte: now };
      filter.endTime = { $gte: now };
    } else if (status === 'upcoming') {
      filter.startTime = { $gt: now };
    } else if (status === 'past') {
      filter.endTime = { $lt: now };
    }

    const contests = await Contest.find(filter)
      .populate('createdBy', 'username avatar')
      .populate('problems.problemId', 'title difficulty tags')
      .sort({ startTime: -1 });

    const submissionCounts = await ContestSubmission.aggregate([
      { $group: { _id: '$contestId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(submissionCounts.map((s) => [String(s._id), s.count]));

    // Query user's attended submissions if logged in
    const userSubmissionsMap = new Map<string, any>();
    if (req.user?.id) {
      const userSubmissions = await ContestSubmission.find({ userId: req.user.id });
      userSubmissions.forEach((s) => userSubmissionsMap.set(String(s.contestId), s));
    }

    const enriched = contests.map((c) => {
      const isLive = c.startTime <= now && c.endTime >= now;
      const isUpcoming = c.startTime > now;
      const userSub = userSubmissionsMap.get(String(c._id));
      const hasAttended = !!userSub;

      return {
        ...c.toObject(),
        statusText: hasAttended ? 'Completed' : isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Past',
        hasAttended,
        userSubmissionId: userSub?._id || null,
        userScore: userSub?.totalScore ?? null,
        userPercentage: userSub?.percentage ?? null,
        participantCount: countMap.get(String(c._id)) || 0,
        problemCount: c.problems.length,
        mcqCount: c.mcqQuestions?.length || 0,
      };
    });

    res.json({ contests: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
};

// ── GET /api/contests/:id ────────────────────────────────────────────────────
export const getContestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isObjectId = typeof idParam === 'string' && /^[0-9a-fA-F]{24}$/.test(idParam);

    const contest = await Contest.findOne({
      $or: [{ _id: isObjectId ? idParam : null }, { slug: idParam }],
      isPublished: true,
    })
      .populate('createdBy', 'username avatar')
      .populate({
        path: 'problems.problemId',
        select: 'title slug difficulty tags description inputFormat outputFormat constraints starterTemplates timeLimitMs memoryLimitMb examples testCases',
      });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    const contestObj = contest.toObject();

    // Sanitize problems: only keep example test cases and clean user-facing templates
    contestObj.problems = contestObj.problems.map((item: any) => {
      if (item.problemId) {
        if (item.problemId.testCases) {
          const visibleCases = item.problemId.testCases.filter((tc: any) => tc.isExample || !tc.isHidden);
          item.problemId.exampleTestCases = visibleCases.length > 0 ? visibleCases : item.problemId.testCases.slice(0, 2);
          delete item.problemId.testCases; // Strip test cases with hidden answers
        }
        if (item.problemId.starterTemplates) {
          const cleaned: Record<string, string> = {};
          for (const [lang, tpl] of Object.entries(item.problemId.starterTemplates)) {
            cleaned[lang] = cleanStarterTemplate(lang, tpl as string);
          }
          item.problemId.starterTemplates = cleaned;
        }
      }
      return item;
    });

    // Sanitize MCQs: strip correctOption and explanation to prevent cheating
    if (Array.isArray(contestObj.mcqQuestions)) {
      (contestObj as any).mcqQuestions = contestObj.mcqQuestions.map((q: any) => ({
        question: q.question,
        options: q.options,
        points: q.points,
        order: q.order,
      }));
    }

    res.json(contestObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contest details' });
  }
};

const submitContestSchema = z.object({
  timeSpentSeconds: z.number().default(0),
  solutions: z
    .array(
      z.object({
        problemId: z.string(),
        language: z.string(),
        code: z.string().default(''),
      })
    )
    .optional()
    .default([]),
  mcqAnswers: z
    .array(
      z.object({
        questionIndex: z.number(),
        selectedOption: z.number(),
      })
    )
    .optional()
    .default([]),
  proctoringData: z
    .object({
      tabSwitches: z.number().default(0),
      fullscreenExits: z.number().default(0),
      copyPasteAttempts: z.number().default(0),
      violationsCount: z.number().default(0),
      violationLogs: z
        .array(
          z.object({
            type: z.string(),
            timestamp: z.string().or(z.date()).optional(),
            detail: z.string().optional(),
          })
        )
        .optional()
        .default([]),
    })
    .optional(),
});

// ── POST /api/contests/:id/run ──────────────────────────────────────────────
export const runContestCode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { problemId, language, code, customInput } = req.body;
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isObjectId = typeof idParam === 'string' && /^[0-9a-fA-F]{24}$/.test(idParam);

    const contest = await Contest.findOne({
      $or: [{ _id: isObjectId ? idParam : null }, { slug: idParam }],
      isPublished: true,
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    if (contest.contestType !== 'superset' || contest.allowCodeExecution === false) {
      res.status(403).json({ error: 'Pre-submission code execution is disabled for Standard Blank Editor contests.' });
      return;
    }

    if (!problemId || !language || code === undefined) {
      res.status(400).json({ error: 'problemId, language, and code are required' });
      return;
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const effectiveCode = wrapCodeWithDriver(language, code, problem);

    // If customInput provided, run with custom input
    if (customInput !== undefined && customInput.trim().length > 0) {
      const start = Date.now();
      const exec = await executeCode(language, effectiveCode, customInput);
      const duration = Date.now() - start;
      res.json({
        custom: true,
        input: customInput,
        output: (exec.stdout || '').trim(),
        error: exec.stderr || (exec.exitCode !== 0 ? 'Execution failed' : undefined),
        exitCode: exec.exitCode,
        executionTimeMs: duration,
      });
      return;
    }

    // Otherwise run against example test cases
    const testCasesToRun = (problem.testCases || []).filter((tc) => tc.isExample);
    const effectiveTestCases = testCasesToRun.length > 0 ? testCasesToRun : (problem.testCases || []).slice(0, 2);

    const testResults: any[] = [];
    for (let i = 0; i < effectiveTestCases.length; i++) {
      const tc = effectiveTestCases[i];
      try {
        const start = Date.now();
        const execResult = await executeCode(language, effectiveCode, tc.input);
        const duration = Date.now() - start;
        const output = (execResult.stdout || '').trim();
        const hasError = execResult.exitCode !== 0 || Boolean(execResult.stderr && execResult.stderr.trim());
        const isPassed = !hasError && compareOutputs(output, tc.expectedOutput);

        testResults.push({
          caseNumber: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: output,
          passed: isPassed,
          error: hasError ? execResult.stderr || 'Execution failed' : undefined,
          executionTimeMs: duration,
        });
      } catch (err: any) {
        testResults.push({
          caseNumber: i + 1,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: '',
          passed: false,
          error: err.message,
          executionTimeMs: 0,
        });
      }
    }

    res.json({
      custom: false,
      testResults,
      allPassed: testResults.every((t) => t.passed),
    });
  } catch (err: any) {
    console.error('Error running contest code:', err);
    res.status(500).json({ error: err.message || 'Failed to run code' });
  }
};

export const submitContest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { timeSpentSeconds, solutions, mcqAnswers, proctoringData } = submitContestSchema.parse(req.body);
    const userId = req.user!.id;

    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isObjectId = typeof idParam === 'string' && /^[0-9a-fA-F]{24}$/.test(idParam);

    const contest = await Contest.findOne({
      $or: [{ _id: isObjectId ? idParam : null }, { slug: idParam }],
      isPublished: true,
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    // Existing submission check: we allow re-taking or updating solutions
    const existingSubmission = await ContestSubmission.findOne({
      contestId: contest._id,
      userId,
    });

    let codingScore = 0;
    let maxCodingScore = 0;
    const problemSubmissions: any[] = [];
    const evaluationInputs: any[] = [];

    // Evaluate each problem in the contest
    if (Array.isArray(contest.problems)) {
      for (const cp of contest.problems) {
        maxCodingScore += cp.points;
        const userSolution = (solutions || []).find((s) => String(s.problemId) === String(cp.problemId));
        const problem = await Problem.findById(cp.problemId);

        if (!problem) continue;

        const code = userSolution?.code || '';
        const language = userSolution?.language || 'python';

        // Execute test cases
        const testResults: any[] = [];
        let passedCount = 0;

        if (code.trim().length > 0 && problem.testCases && problem.testCases.length > 0) {
          const effectiveCode = wrapCodeWithDriver(language, code, problem);
          for (const tc of problem.testCases) {
            try {
              const start = Date.now();
              const execResult = await executeCode(language, effectiveCode, tc.input);
              const duration = Date.now() - start;

              const output = (execResult.stdout || '').trim();
              const hasError = execResult.exitCode !== 0 || Boolean(execResult.stderr && execResult.stderr.trim());
              const isPassed = !hasError && compareOutputs(output, tc.expectedOutput);
              if (isPassed) passedCount++;

              testResults.push({
                input: tc.isExample ? tc.input : '[Hidden Test Case]',
                expectedOutput: tc.isExample ? tc.expectedOutput : '[Hidden]',
                actualOutput: tc.isExample ? output : isPassed ? '[Passed]' : '[Failed]',
                passed: isPassed,
                error: hasError ? execResult.stderr || 'Execution failed' : undefined,
                executionTimeMs: duration,
              });
            } catch (err: any) {
              testResults.push({
                input: tc.isExample ? tc.input : '[Hidden Test Case]',
                expectedOutput: tc.isExample ? tc.expectedOutput : '[Hidden]',
                actualOutput: '',
                passed: false,
                error: err.message,
              });
            }
          }
        }

        const totalCases = problem.testCases.length || 1;
        const problemScore = Math.round((passedCount / totalCases) * cp.points);
        codingScore += problemScore;

        const status = passedCount === totalCases ? 'Passed' : passedCount > 0 ? 'Partial' : 'Failed';

        problemSubmissions.push({
          problemId: problem._id,
          problemTitle: problem.title,
          language,
          code,
          passedTestCases: passedCount,
          totalTestCases: totalCases,
          score: problemScore,
          maxPoints: cp.points,
          status,
          testResults,
        });

        // Prepare input for AI Diagnostic Engine
        evaluationInputs.push({
          problemTitle: problem.title,
          problemDescription: problem.description,
          tags: problem.tags,
          language,
          code,
          passedTestCases: passedCount,
          totalTestCases: totalCases,
          testResults,
        });
      }
    }

    // Evaluate MCQs
    let mcqScore = 0;
    let maxMCQScore = 0;
    const mcqSubmissions: any[] = [];

    if (Array.isArray(contest.mcqQuestions) && contest.mcqQuestions.length > 0) {
      for (let i = 0; i < contest.mcqQuestions.length; i++) {
        const q = contest.mcqQuestions[i];
        const qPoints = q.points || 10;
        maxMCQScore += qPoints;

        const userAns = (mcqAnswers || []).find((a) => a.questionIndex === i);
        const selected = typeof userAns?.selectedOption === 'number' ? userAns.selectedOption : -1;
        const isCorrect = selected === q.correctOption;
        const pointsAwarded = isCorrect ? qPoints : 0;
        mcqScore += pointsAwarded;

        mcqSubmissions.push({
          questionIndex: i,
          questionText: q.question,
          options: q.options || [],
          selectedOption: selected,
          correctOption: q.correctOption,
          isCorrect,
          pointsAwarded,
          maxPoints: qPoints,
          explanation: q.explanation || '',
        });
      }
    }

    const totalScore = codingScore + mcqScore;
    const maxScore = maxCodingScore + maxMCQScore;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Run AI Evaluation
    const aiReport = evaluationInputs.length > 0
      ? await evaluateContestSubmission(evaluationInputs)
      : { summary: 'Assessment completed.', mistakes: [], conceptsToFocus: [], recommendedCourses: [], evaluatedAt: new Date() };

    // Save or update submission
    let submission: any;
    if (existingSubmission) {
      existingSubmission.contestType = contest.contestType || 'standard';
      existingSubmission.problemSubmissions = problemSubmissions;
      existingSubmission.mcqSubmissions = mcqSubmissions;
      existingSubmission.codingScore = codingScore;
      existingSubmission.mcqScore = mcqScore;
      existingSubmission.totalScore = totalScore;
      existingSubmission.maxScore = maxScore;
      existingSubmission.percentage = percentage;
      existingSubmission.status = 'Completed';
      existingSubmission.aiReport = aiReport;
      existingSubmission.proctoringData = proctoringData as any;
      existingSubmission.timeSpentSeconds = timeSpentSeconds;
      existingSubmission.submittedAt = new Date();
      await existingSubmission.save();
      submission = existingSubmission;
    } else {
      submission = await ContestSubmission.create({
        contestId: contest._id,
        userId,
        contestType: contest.contestType || 'standard',
        problemSubmissions,
        mcqSubmissions,
        codingScore,
        mcqScore,
        totalScore,
        maxScore,
        percentage,
        status: 'Completed',
        aiReport,
        proctoringData: proctoringData as any,
        timeSpentSeconds,
        submittedAt: new Date(),
      });
    }

    res.status(201).json({
      submissionId: submission._id,
      totalScore,
      maxScore,
      percentage,
      codingScore,
      mcqScore,
      problemSubmissions,
      mcqSubmissions,
      aiReport,
      proctoringData: submission.proctoringData,
      submittedAt: submission.submittedAt,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    console.error('Error in submitContest:', err);
    res.status(500).json({ error: 'Failed to evaluate and submit contest' });
  }
};

// ── GET /api/contests/:id/my-submission ─────────────────────────────────────
export const getMyContestSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isObjectId = typeof idParam === 'string' && /^[0-9a-fA-F]{24}$/.test(idParam);

    const contest = await Contest.findOne({
      $or: [{ _id: isObjectId ? idParam : null }, { slug: idParam }],
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    const submission = await ContestSubmission.findOne({
      contestId: contest._id,
      userId: req.user!.id,
    })
      .populate('problemSubmissions.problemId', 'title slug difficulty tags')
      .sort({ submittedAt: -1 });

    res.json({ submission });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

// ── GET /api/contests/:id/leaderboard ───────────────────────────────────────
export const getContestLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const isObjectId = typeof idParam === 'string' && /^[0-9a-fA-F]{24}$/.test(idParam);

    const contest = await Contest.findOne({
      $or: [{ _id: isObjectId ? idParam : null }, { slug: idParam }],
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    const leaderboard = await ContestSubmission.find({ contestId: contest._id })
      .populate('userId', 'username avatar stats')
      .sort({ totalScore: -1, timeSpentSeconds: 1 })
      .limit(50);

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};
