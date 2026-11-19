import { Request, Response } from 'express';
import { z } from 'zod';
import Problem from '../models/Problem.model';
import Submission from '../models/Submission.model';
import User from '../models/User.model';
import { runWithJudge0, isJudge0Supported } from '../services/judge0.service';
import { executeWithDockerCompiler } from '../services/dockerCompiler.service';
import { executeLocally } from '../services/piston.service';
import { evaluateUserBadges } from '../services/badge.service';
import { wrapCodeWithDriver } from '../services/driverWrapper.service';
import { recordSubmission } from '../services/skillAnalysis.service';

// ─── Priority execution: Judge0 → Docker → Local ──────────────────────────────
async function executeCode(language: string, sourceCode: string, stdin: string) {
  if (isJudge0Supported(language)) {
    try {
      return await runWithJudge0(language, sourceCode, stdin);
    } catch (err) {
      console.warn('[Judge0] Submission fallback to docker:', (err as Error).message);
    }
  }
  try {
    return await executeWithDockerCompiler(language, sourceCode, stdin);
  } catch {
    return executeLocally(language, sourceCode, stdin);
  }
}


const submitSchema = z.object({
  problemId: z.string(),
  language: z.string(),
  sourceCode: z.string().min(1).max(50000),
});

// Helper: update user's activity heatmap and streaks
async function updateUserActivity(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const user = await User.findById(userId);
  if (!user) return;

  const existing = user.activityLog.find((a) => a.date === today);
  if (existing) {
    existing.count += 1;
    existing.level = Math.min(4, Math.ceil(existing.count / 3));
  } else {
    user.activityLog.push({ date: today, count: 1, level: 1 });
  }

  // Update streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const hadActivityYesterday = user.activityLog.some((a) => a.date === yesterdayStr);
  const currentStreak = hadActivityYesterday ? (user.stats.streak || 0) + 1 : 1;
  user.stats.streak = currentStreak;
  if (!user.stats.longestStreak || currentStreak > user.stats.longestStreak) {
    user.stats.longestStreak = currentStreak;
  }
  user.stats.lastActive = new Date();

  await user.save();
}

// Helper: robust comparison for outputs
function compareOutputs(actual: string, expected: string): boolean {
  const normActual = actual.trim();
  const normExpected = expected.trim();
  if (normActual === normExpected) return true;

  // Case-insensitive comparison for boolean (true/false)
  if (normActual.toLowerCase() === normExpected.toLowerCase()) return true;

  // Try JSON comparison (handles [0, 1] vs [0,1], {a: 1} vs { a: 1 })
  try {
    const actJson = JSON.parse(normActual);
    const expJson = JSON.parse(normExpected);
    if (JSON.stringify(actJson) === JSON.stringify(expJson)) return true;
  } catch {}

  // Try line-by-line whitespace-trimmed and array-bracket comparison
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

export const submitCode = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const { problemId, language, sourceCode } = submitSchema.parse(req.body);
    const userId = req.user!.id;

    const problem = await Problem.findById(problemId);
    if (!problem) { res.status(404).json({ error: 'Problem not found' }); return; }

    if (!problem.testCases || problem.testCases.length === 0) {
      res.status(400).json({ error: 'This problem has no test cases configured yet.' });
      return;
    }

    // Create submission in pending state
    const submission = await Submission.create({
      userId,
      problemId,
      language,
      sourceCode,
      status: 'Running',
      passedCount: 0,
      totalCount: problem.testCases.length,
    });

    // Wrap solution with driver harness if needed
    const effectiveSourceCode = wrapCodeWithDriver(language, sourceCode, problem);

    // Run all test cases in parallel for speed
    const results = await Promise.all(
      problem.testCases.map(async (tc) => {
        const result = await executeCode(language, effectiveSourceCode, tc.input);
        const passed = compareOutputs(result.stdout, tc.expectedOutput) && result.exitCode === 0;
        
        return {
          passed,
          result,
          tc
        };
      })
    );

    const testResults = [];
    let passedCount = 0;
    let allPassed = true;
    let totalRuntime = 0;
    let globalStderr = '';

    for (const { passed, result, tc } of results) {
      if (!passed) allPassed = false;
      if (passed) passedCount++;
      totalRuntime += result.runtime;
      if (result.stderr) globalStderr = result.stderr;

      testResults.push({
        passed,
        input: tc.isHidden ? '(hidden)' : tc.input,
        expected: tc.isHidden ? '(hidden)' : tc.expectedOutput,
        actual: tc.isHidden ? (passed ? '(correct)' : '(wrong answer)') : (result.stdout || result.stderr || '(no output)'),
        isHidden: tc.isHidden,
        runtime: result.runtime,
      });
    }

    // Determine final status
    let finalStatus = allPassed ? 'Accepted' : 'Wrong Answer';
    if (!allPassed) {
      // Check for Time Limit Exceeded first (exitCode 124 = timeout from local/docker execution)
      const tleResult = results.find(r => r.result.exitCode === 124);
      if (tleResult) {
        finalStatus = 'Time Limit Exceeded';
      } else {
        const executionError = results.find(r => r.result.stderr && r.result.exitCode !== 0);
        if (executionError) {
          const errText = executionError.result.stderr.toLowerCase();
          if (errText.includes('syntax') || errText.includes('compile') || errText.includes('error:')) {
            finalStatus = 'Compile Error';
          } else {
            finalStatus = 'Runtime Error';
          }
        }
      }
    }

    const avgRuntime = Math.round(totalRuntime / problem.testCases.length);

    await submission.updateOne({
      status: finalStatus,
      testResults,
      runtime: avgRuntime,
      stderr: globalStderr || undefined,
      passedCount,
      totalCount: problem.testCases.length,
    });

    // Update problem stats
    await problem.updateOne({
      $inc: { totalSubmissions: 1, ...(allPassed ? { totalAccepted: 1 } : {}) },
    });

    // Update user stats
    let newBadges: any[] = [];
    if (allPassed) {
      // Check if this was user's first attempt on this problem
      const previousAttempts = await Submission.countDocuments({
        userId,
        problemId,
        _id: { $ne: submission._id },
      });
      const isFirstTrySuccess = previousAttempts === 0;

      // Check if user has already solved this problem previously
      const currentUser = await User.findById(userId).select('solvedProblems');
      const alreadySolved = currentUser?.solvedProblems?.some(
        (id: any) => id.toString() === problemId.toString()
      );

      if (!alreadySolved) {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { solvedProblems: problemId },
          $inc: { 'stats.solved': 1 },
        });
      } else {
        await User.findByIdAndUpdate(userId, {
          $addToSet: { solvedProblems: problemId },
        });
      }

      newBadges = await evaluateUserBadges(userId, {
        isFirstTrySuccess,
        problemTag: problem.tags?.[0],
      });
    }
    await User.findByIdAndUpdate(userId, { $inc: { 'stats.attempted': 1 } });
    await updateUserActivity(userId);

    // Update student's deterministic skill profile & topic weakness tracking
    recordSubmission(userId, problem, {
      _id: submission._id,
      status: finalStatus,
      language,
      stderr: globalStderr,
      submittedAt: new Date(),
    }).catch((err) => console.error('[SkillAnalysis] Error:', err));

    res.json({
      submissionId: submission.id,
      status: finalStatus,
      testResults,
      runtime: avgRuntime,
      stderr: globalStderr || undefined,
      passedCount,
      totalCount: problem.testCases.length,
      newBadges,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Submission failed' });
  }
};

export const getUserSubmissions = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const { problemId } = req.query;
    const query: Record<string, string> = { userId: req.user!.id };
    if (problemId) query.problemId = problemId as string;

    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(20)
      .populate('problemId', 'title slug difficulty');

    res.json(submissions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};
