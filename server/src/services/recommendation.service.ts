import mongoose from 'mongoose';
import SkillProfile, { ISkillProfile } from '../models/SkillProfile.model';
import Problem from '../models/Problem.model';
import Course from '../models/Course.model';
import User from '../models/User.model';
import Recommendation, {
  IRecommendationDoc,
  ITopicRecommendation,
  IRecommendedCourseSummary,
  IRecommendedProblemSummary,
} from '../models/Recommendation.model';
import { syncUserSkillProfile } from './skillAnalysis.service';

// ─── Topic to Keywords/Course Mapping Helper ─────────────────────────────────
const TOPIC_COURSE_MAPPING: Record<string, { preferredCourseSlug?: string; searchTerms: string[] }> = {
  Arrays: {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['Array', 'Arrays & Strings', 'Lists', 'Data Structures Mastery'],
  },
  Hashing: {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['Hash', 'Hash Tables', 'Collections Framework', 'Hash Maps'],
  },
  Strings: {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['String', 'Arrays & Strings', 'Data Structures'],
  },
  'Two Pointers': {
    preferredCourseSlug: 'competitive-programming-guide',
    searchTerms: ['Two Pointers', 'Sliding Window', 'Competitive Programming Guide'],
  },
  'Sliding Window': {
    preferredCourseSlug: 'competitive-programming-guide',
    searchTerms: ['Sliding Window', 'Two Pointers', 'Competitive Programming Guide'],
  },
  'Linked Lists': {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['Linked Lists', 'Data Structures Mastery'],
  },
  Trees: {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['Trees', 'Binary Search Tree', 'Data Structures Mastery'],
  },
  Stacks: {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['Stacks & Queues', 'Stack', 'Data Structures Mastery'],
  },
  Queues: {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['Stacks & Queues', 'Queue', 'Data Structures Mastery'],
  },
  'Binary Search': {
    preferredCourseSlug: 'algorithm-fundamentals',
    searchTerms: ['Searching Algorithms', 'Binary Search', 'Algorithm Fundamentals'],
  },
  'Heap & Priority Queue': {
    preferredCourseSlug: 'data-structures-mastery',
    searchTerms: ['Heap', 'Priority Queue', 'Data Structures'],
  },
  Backtracking: {
    preferredCourseSlug: 'algorithm-fundamentals',
    searchTerms: ['Recursion & Backtracking', 'Recursion', 'Algorithm Fundamentals'],
  },
  Graphs: {
    preferredCourseSlug: 'competitive-programming-guide',
    searchTerms: ['Graph Algorithms', 'BFS', 'DFS', 'Competitive Programming Guide'],
  },
  'Dynamic Programming': {
    preferredCourseSlug: 'competitive-programming-guide',
    searchTerms: ['Dynamic Programming', 'DP', 'Competitive Programming Guide', 'Greedy'],
  },
  Greedy: {
    preferredCourseSlug: 'algorithm-fundamentals',
    searchTerms: ['Greedy Algorithms', 'Algorithm Fundamentals'],
  },
  'Bit Manipulation': {
    preferredCourseSlug: 'competitive-programming-guide',
    searchTerms: ['Competitive Programming Guide', 'C++ Crash Course'],
  },
  Math: {
    preferredCourseSlug: 'algorithm-fundamentals',
    searchTerms: ['Algorithm Fundamentals', 'Python for Beginners'],
  },
};

// ─── Generate Explainable Rule-Based Reason ──────────────────────────────────
function generateExplainableReason(profile: ISkillProfile): string {
  const { topic, failedAttempts, totalAttempts, consecutiveFailures, errorBreakdown, weaknessScore } = profile;

  // Specific error type dominance
  if (errorBreakdown.runtimeError >= 2) {
    return `Frequent Runtime Errors detected in ${topic} (${errorBreakdown.runtimeError} times). Review array boundary checks and pointer safety.`;
  }
  if (errorBreakdown.timeLimitExceeded >= 2) {
    return `Time Limit Exceeded in multiple ${topic} submissions. Learn optimal time complexity patterns to avoid O(N²) timeouts.`;
  }
  if (errorBreakdown.compileError >= 2) {
    return `Multiple compilation or syntax issues occurred when solving ${topic} problems.`;
  }

  // Consecutive failure streak
  if (consecutiveFailures >= 3) {
    return `You have failed ${consecutiveFailures} consecutive ${topic} challenges. A quick lesson review is recommended before retrying.`;
  }

  // High weakness percentage
  if (weaknessScore >= 60) {
    return `You struggled with ${failedAttempts} out of ${totalAttempts} recent ${topic} attempts (${weaknessScore}% weakness score).`;
  }

  return `Identified recurring difficulty in ${topic} based on ${failedAttempts} failed attempts across your submission history.`;
}

// ─── Find Best Matching Course for a Topic ───────────────────────────────────
async function findMatchingCourse(topic: string): Promise<IRecommendedCourseSummary | undefined> {
  const mapping = TOPIC_COURSE_MAPPING[topic] || { searchTerms: [topic] };

  // 1. Try finding by preferred slug first
  if (mapping.preferredCourseSlug) {
    const course = await Course.findOne({ slug: mapping.preferredCourseSlug, isPublished: true }).lean();
    if (course) {
      // Find matching lesson if any
      const matchingLesson = course.lessons?.find((l) =>
        mapping.searchTerms.some((term) =>
          l.title.toLowerCase().includes(term.toLowerCase()) ||
          l.content.toLowerCase().includes(term.toLowerCase())
        )
      );

      return {
        courseId: course._id as mongoose.Types.ObjectId,
        title: course.title,
        slug: course.slug,
        difficulty: course.difficulty,
        description: matchingLesson
          ? `Recommended module: "${matchingLesson.title}" to master ${topic} fundamentals.`
          : course.description,
        concepts: mapping.searchTerms,
        url: `/learn/${course.slug}`,
      };
    }
  }

  // 2. Query Course with regex match
  const searchRegexes = mapping.searchTerms.map((t) => new RegExp(t, 'i'));
  const matched = await Course.findOne({
    isPublished: true,
    $or: [
      { tags: { $in: searchRegexes } },
      { title: { $in: searchRegexes } },
      { description: { $in: searchRegexes } },
    ],
  }).lean();

  if (matched) {
    return {
      courseId: matched._id as mongoose.Types.ObjectId,
      title: matched.title,
      slug: matched.slug,
      difficulty: matched.difficulty,
      description: matched.description,
      concepts: matched.tags,
      url: `/learn/${matched.slug}`,
    };
  }

  // 3. Fallback to foundational course
  const fallback = await Course.findOne({ isPublished: true }).lean();
  if (fallback) {
    return {
      courseId: fallback._id as mongoose.Types.ObjectId,
      title: fallback.title,
      slug: fallback.slug,
      difficulty: fallback.difficulty,
      description: fallback.description,
      concepts: fallback.tags,
      url: `/learn/${fallback.slug}`,
    };
  }

  return undefined;
}

// ─── Find Targeted Practice Problems for a Topic ──────────────────────────────
async function findTargetedProblems(
  topic: string,
  weaknessScore: number,
  solvedProblemIds: mongoose.Types.ObjectId[]
): Promise<IRecommendedProblemSummary[]> {
  // Map canonical topic name to regex terms matching problem tags
  const searchTerms = [topic];
  if (topic === 'Arrays') searchTerms.push('Array');
  if (topic === 'Hashing') searchTerms.push('Hash Table', 'Hash');
  if (topic === 'Trees') searchTerms.push('Tree', 'Binary Tree');
  if (topic === 'Dynamic Programming') searchTerms.push('DP');
  if (topic === 'Graphs') searchTerms.push('Graph', 'BFS', 'DFS');
  if (topic === 'Strings') searchTerms.push('String');

  const tagRegexes = searchTerms.map((t) => new RegExp(`^${t}$`, 'i'));

  // Adaptive difficulty selection based on weakness score:
  // High weakness (>= 60): Start with Easy problems to build confidence
  // Medium weakness (30 - 59): Mix of Easy and Medium
  // Low weakness (< 30): Medium and Hard problems
  let difficultyFilter: any = {};
  if (weaknessScore >= 60) {
    difficultyFilter = { difficulty: { $in: ['Easy', 'Medium'] } };
  } else if (weaknessScore >= 30) {
    difficultyFilter = { difficulty: { $in: ['Easy', 'Medium', 'Hard'] } };
  } else {
    difficultyFilter = { difficulty: { $in: ['Medium', 'Hard'] } };
  }

  const query: any = {
    isPublished: true,
    tags: { $in: tagRegexes },
    _id: { $nin: solvedProblemIds },
    ...difficultyFilter,
  };

  const problems = await Problem.find(query)
    .select('title slug difficulty tags')
    .sort({ difficulty: 1, totalSubmissions: -1 })
    .limit(4)
    .lean();

  return problems.map((p) => ({
    problemId: p._id as mongoose.Types.ObjectId,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    tags: p.tags,
  }));
}

// ─── Main Rule-Based Recommendation Generator ─────────────────────────────────
export async function generateRecommendationsForUser(
  userId: string | mongoose.Types.ObjectId
): Promise<IRecommendationDoc> {
  const user = await User.findById(userId).select('solvedProblems').lean();
  const solvedProblems = (user?.solvedProblems || []) as mongoose.Types.ObjectId[];

  // Fetch or sync skill profiles
  let profiles = await SkillProfile.find({ userId }).sort({ weaknessScore: -1, failedAttempts: -1 });

  if (profiles.length === 0) {
    profiles = await syncUserSkillProfile(userId);
  }

  // Filter topics with activity
  const strugglingProfiles = profiles.filter((p) => p.failedAttempts > 0 && p.weaknessScore >= 25);
  const masteredProfiles = profiles.filter((p) => p.weaknessScore < 25 && p.solvedAttempts > 0);

  const recommendations: ITopicRecommendation[] = [];

  // Pick top struggling topics (up to 4 topics)
  const targetProfiles = strugglingProfiles.length > 0 ? strugglingProfiles.slice(0, 4) : profiles.slice(0, 2);

  for (const profile of targetProfiles) {
    const reason = generateExplainableReason(profile);
    const recommendedCourse = await findMatchingCourse(profile.topic);
    const practiceProblems = await findTargetedProblems(profile.topic, profile.weaknessScore, solvedProblems);

    // Dominant error
    const errors = profile.errorBreakdown;
    let dominantError = 'Logic Error';
    if (errors.runtimeError > errors.wrongAnswer) dominantError = 'Runtime Error';
    else if (errors.timeLimitExceeded > errors.wrongAnswer) dominantError = 'Time Limit Exceeded';
    else if (errors.compileError > errors.wrongAnswer) dominantError = 'Compilation Error';

    recommendations.push({
      topic: profile.topic,
      weaknessScore: profile.weaknessScore,
      totalAttempts: profile.totalAttempts,
      failedAttempts: profile.failedAttempts,
      solvedAttempts: profile.solvedAttempts,
      dominantError,
      reason,
      recommendedCourse,
      practiceProblems,
    });
  }

  // Top weakness topic name
  const topWeakness = strugglingProfiles.length > 0 ? strugglingProfiles[0].topic : undefined;

  const doc = await Recommendation.findOneAndUpdate(
    { userId },
    {
      userId,
      summary: {
        totalTopicsTracked: profiles.length,
        strugglingTopicsCount: strugglingProfiles.length,
        masteredTopicsCount: masteredProfiles.length,
        topWeakness,
      },
      recommendations,
      generatedAt: new Date(),
    },
    { upsert: true, returnDocument: 'after' }
  );

  return doc!;
}
