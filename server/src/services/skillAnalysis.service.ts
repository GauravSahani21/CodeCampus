import mongoose from 'mongoose';
import SkillProfile, { ISkillProfile, IRecentAttempt } from '../models/SkillProfile.model';
import Submission, { ISubmission } from '../models/Submission.model';
import Problem, { IProblem } from '../models/Problem.model';

// ─── Topic Normalization Dictionary ──────────────────────────────────────────
export function normalizeTopic(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === 'array' || t === 'arrays') return 'Arrays';
  if (t === 'hash table' || t === 'hashing' || t === 'hash map' || t === 'hashtable') return 'Hashing';
  if (t === 'string' || t === 'strings') return 'Strings';
  if (t === 'two pointers' || t === 'two pointer') return 'Two Pointers';
  if (t === 'sliding window') return 'Sliding Window';
  if (t === 'linked list' || t === 'linked lists') return 'Linked Lists';
  if (t === 'tree' || t === 'trees' || t === 'binary tree' || t === 'binary search tree' || t === 'bst') return 'Trees';
  if (t === 'stack' || t === 'stacks') return 'Stacks';
  if (t === 'queue' || t === 'queues') return 'Queues';
  if (t === 'binary search') return 'Binary Search';
  if (t === 'heap' || t === 'priority queue') return 'Heap & Priority Queue';
  if (t === 'backtracking') return 'Backtracking';
  if (t === 'trie' || t === 'tries') return 'Trie';
  if (t === 'graph' || t === 'graphs' || t === 'bfs' || t === 'dfs') return 'Graphs';
  if (t === 'dynamic programming' || t === 'dp') return 'Dynamic Programming';
  if (t === 'greedy') return 'Greedy';
  if (t === 'bit manipulation' || t === 'bits') return 'Bit Manipulation';
  if (t === 'math' || t === 'geometry') return 'Math';
  if (t === 'intervals') return 'Intervals';
  if (t === 'recursion') return 'Recursion';
  if (t === 'sorting' || t === 'searching') return 'Sorting & Searching';
  // Capitalize first letter of each word fallback
  return raw
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ─── Deterministic Weakness Score Calculation ────────────────────────────────
export function calculateWeaknessScore(profile: {
  totalAttempts: number;
  failedAttempts: number;
  solvedAttempts: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  recentAttempts?: IRecentAttempt[];
}): number {
  if (profile.totalAttempts === 0) return 0;
  if (profile.failedAttempts === 0 && profile.solvedAttempts > 0) return 0;

  // 1. Base Failure Ratio (0 - 100)
  const baseRatio = (profile.failedAttempts / profile.totalAttempts) * 100;

  // 2. Recency Penalty: analyze the last 5 attempts
  let recencyModifier = 0;
  const recent = profile.recentAttempts || [];
  if (recent.length > 0) {
    const lastWindow = recent.slice(-5);
    const recentFails = lastWindow.filter((a) => a.status !== 'Accepted').length;
    const recentFailRatio = recentFails / lastWindow.length;

    if (recentFailRatio >= 0.8) {
      recencyModifier = 15; // Recent intense struggle
    } else if (recentFailRatio >= 0.6) {
      recencyModifier = 8;
    } else if (recentFailRatio === 0) {
      recencyModifier = -15; // Fully recovered recently
    }
  }

  // 3. Consecutive Streaks Modifier
  const streakFailurePenalty = Math.min(20, profile.consecutiveFailures * 5);
  const streakSuccessDiscount = Math.min(30, profile.consecutiveSuccesses * 8);

  const rawScore = baseRatio + recencyModifier + streakFailurePenalty - streakSuccessDiscount;

  // Clamp strictly between 0 and 100
  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

// ─── Record a Single Submission in Real-Time ──────────────────────────────────
export async function recordSubmission(
  userId: string | mongoose.Types.ObjectId,
  problem: { _id: any; tags?: string[]; title?: string },
  submission: {
    _id: any;
    status: string;
    language: string;
    stderr?: string;
    submittedAt?: Date;
  }
): Promise<void> {
  try {
    const rawTags = (problem.tags && problem.tags.length > 0) ? problem.tags : ['General Algorithms'];
    const topics: string[] = Array.from(new Set<string>(rawTags.map(normalizeTopic)));

    const isSuccess = submission.status === 'Accepted';
    const status = submission.status;

    for (const topic of topics) {
      let profile = await SkillProfile.findOne({ userId, topic });

      if (!profile) {
        profile = new SkillProfile({
          userId,
          topic,
          totalAttempts: 0,
          failedAttempts: 0,
          solvedAttempts: 0,
          weaknessScore: 0,
          errorBreakdown: {
            wrongAnswer: 0,
            runtimeError: 0,
            compileError: 0,
            timeLimitExceeded: 0,
            memoryLimitExceeded: 0,
          },
          recentAttempts: [],
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
        });
      }

      // Update counters
      profile.totalAttempts += 1;
      profile.lastAttemptAt = submission.submittedAt || new Date();
      profile.lastUpdated = new Date();

      if (isSuccess) {
        profile.solvedAttempts += 1;
        profile.consecutiveSuccesses += 1;
        profile.consecutiveFailures = 0;
      } else {
        profile.failedAttempts += 1;
        profile.consecutiveFailures += 1;
        profile.consecutiveSuccesses = 0;

        // Categorize error type
        if (status === 'Wrong Answer') {
          profile.errorBreakdown.wrongAnswer += 1;
        } else if (status === 'Runtime Error') {
          profile.errorBreakdown.runtimeError += 1;
        } else if (status === 'Compile Error') {
          profile.errorBreakdown.compileError += 1;
        } else if (status === 'Time Limit Exceeded') {
          profile.errorBreakdown.timeLimitExceeded += 1;
        } else if (status === 'Memory Limit Exceeded') {
          profile.errorBreakdown.memoryLimitExceeded += 1;
        }
      }

      // Maintain sliding window of last 10 attempts
      profile.recentAttempts.push({
        problemId: problem._id,
        status,
        language: submission.language,
        errorType: isSuccess ? undefined : status,
        submittedAt: submission.submittedAt || new Date(),
      });
      if (profile.recentAttempts.length > 10) {
        profile.recentAttempts = profile.recentAttempts.slice(-10);
      }

      // Recalculate deterministic weakness score
      profile.weaknessScore = calculateWeaknessScore(profile);

      await profile.save();
    }
  } catch (err) {
    console.error('[SkillAnalysis] Failed to record submission:', err);
  }
}

// ─── Sync All Historical Submissions for a User ──────────────────────────────
export async function syncUserSkillProfile(
  userId: string | mongoose.Types.ObjectId
) {
  // Fetch all historical submissions ordered by date ascending
  const submissions = await Submission.find({ userId })
    .populate('problemId', 'title tags difficulty')
    .sort({ submittedAt: 1 })
    .lean();

  // Clear existing skill profiles for a clean, deterministic rebuild
  await SkillProfile.deleteMany({ userId });

  const topicMap: Record<
    string,
    {
      topic: string;
      totalAttempts: number;
      failedAttempts: number;
      solvedAttempts: number;
      consecutiveFailures: number;
      consecutiveSuccesses: number;
      errorBreakdown: {
        wrongAnswer: number;
        runtimeError: number;
        compileError: number;
        timeLimitExceeded: number;
        memoryLimitExceeded: number;
      };
      recentAttempts: IRecentAttempt[];
      lastAttemptAt?: Date;
    }
  > = {};

  for (const sub of submissions) {
    const problem = sub.problemId as any;
    if (!problem) continue;

    const rawTags = (problem.tags && problem.tags.length > 0) ? problem.tags : ['General Algorithms'];
    const topics: string[] = Array.from(new Set<string>(rawTags.map(normalizeTopic)));

    const isSuccess = sub.status === 'Accepted';
    const status = sub.status;

    for (const topic of topics) {
      if (!topicMap[topic]) {
        topicMap[topic] = {
          topic,
          totalAttempts: 0,
          failedAttempts: 0,
          solvedAttempts: 0,
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          errorBreakdown: {
            wrongAnswer: 0,
            runtimeError: 0,
            compileError: 0,
            timeLimitExceeded: 0,
            memoryLimitExceeded: 0,
          },
          recentAttempts: [],
        };
      }

      const t = topicMap[topic];
      t.totalAttempts += 1;
      t.lastAttemptAt = sub.submittedAt;

      if (isSuccess) {
        t.solvedAttempts += 1;
        t.consecutiveSuccesses += 1;
        t.consecutiveFailures = 0;
      } else {
        t.failedAttempts += 1;
        t.consecutiveFailures += 1;
        t.consecutiveSuccesses = 0;

        if (status === 'Wrong Answer') t.errorBreakdown.wrongAnswer += 1;
        else if (status === 'Runtime Error') t.errorBreakdown.runtimeError += 1;
        else if (status === 'Compile Error') t.errorBreakdown.compileError += 1;
        else if (status === 'Time Limit Exceeded') t.errorBreakdown.timeLimitExceeded += 1;
        else if (status === 'Memory Limit Exceeded') t.errorBreakdown.memoryLimitExceeded += 1;
      }

      t.recentAttempts.push({
        problemId: problem._id,
        status,
        language: sub.language,
        errorType: isSuccess ? undefined : status,
        submittedAt: sub.submittedAt,
      });
      if (t.recentAttempts.length > 10) {
        t.recentAttempts = t.recentAttempts.slice(-10);
      }
    }
  }

  // Insert batch of calculated profiles
  const profilesToInsert = Object.values(topicMap).map((t) => {
    const weaknessScore = calculateWeaknessScore(t);
    return {
      userId,
      topic: t.topic,
      totalAttempts: t.totalAttempts,
      failedAttempts: t.failedAttempts,
      solvedAttempts: t.solvedAttempts,
      weaknessScore,
      errorBreakdown: t.errorBreakdown,
      recentAttempts: t.recentAttempts,
      consecutiveFailures: t.consecutiveFailures,
      consecutiveSuccesses: t.consecutiveSuccesses,
      lastAttemptAt: t.lastAttemptAt,
      lastUpdated: new Date(),
    };
  });

  if (profilesToInsert.length > 0) {
    await SkillProfile.insertMany(profilesToInsert);
  }

  return SkillProfile.find({ userId }).sort({ weaknessScore: -1 });
}
