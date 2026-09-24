import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Contest from './models/Contest.model';
import Problem from './models/Problem.model';
import User from './models/User.model';
import ContestSubmission from './models/ContestSubmission.model';

async function seedContests() {
  await mongoose.connect(process.env.MONGO_URI || '');

  const instructor = await User.findOne({ role: 'instructor' });
  if (!instructor) {
    console.error('No instructor found!');
    process.exit(1);
  }

  const pTwoSum = await Problem.findOne({ slug: 'two-sum' });
  const pContainsDup = await Problem.findOne({ slug: 'contains-duplicate' });
  const pPalindrome = await Problem.findOne({ slug: 'valid-palindrome' });
  const pStock = await Problem.findOne({ slug: 'best-time-to-buy-and-sell-stock' });
  const pSubarray = await Problem.findOne({ slug: 'maximum-subarray' });

  // 1. Completely remove all existing contests and prior submissions
  await Contest.deleteMany({});
  await ContestSubmission.deleteMany({});
  console.log('Cleared all existing contests and contest submissions.');

  const now = new Date();
  const startTime = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // 2. Add Contest 1: Standard Blank Editor (Strict Proctored, No Execution Prior to Submit)
  const standardContest = await Contest.create({
    title: 'Standard Algorithmic Qualifier',
    slug: 'standard-algorithms-qualifier',
    description: 'Proctored algorithmic exam testing core array and hashing logic. Solutions are written directly in the plain-text editor with zero execution before final submission.',
    instructions: 'Write your solution in the plain editor. Focus on clean algorithmic logic, syntax correctness, and edge cases. You will not have code execution before submitting. Once submitted, your solution is graded against the full test suite and analyzed with AI feedback.',
    contestType: 'standard',
    allowCodeExecution: false,
    startTime,
    endTime,
    durationMinutes: 60,
    problems: [
      { problemId: pTwoSum?._id, points: 100, order: 1 },
      { problemId: pContainsDup?._id, points: 100, order: 2 },
    ],
    mcqQuestions: [],
    allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
    aiEvaluationEnabled: true,
    isPublished: true,
    totalPoints: 200,
    createdBy: instructor._id,
  });

  // 3. Add Contest 2: Interactive Assessment (Live Test Runner + MCQs)
  const interactiveContest = await Contest.create({
    title: 'Interactive Full-Stack DSA Assessment',
    slug: 'interactive-dsa-assessment',
    description: 'Comprehensive dual-section assessment featuring live test runner execution on coding challenges alongside conceptual multiple-choice questions.',
    instructions: 'Welcome to the Interactive Assessment. You can run and test your code against sample test cases in real-time before submitting. Ensure you also complete all Multiple Choice Questions (MCQs) in the assessment before final submission.',
    contestType: 'superset',
    allowCodeExecution: true,
    startTime,
    endTime,
    durationMinutes: 90,
    problems: [
      { problemId: pPalindrome?._id, points: 50, order: 1 },
      { problemId: pStock?._id, points: 75, order: 2 },
      { problemId: pSubarray?._id, points: 75, order: 3 },
    ],
    mcqQuestions: [
      {
        question: 'What is the average time complexity of looking up a key in a Hash Map / Dictionary?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctOption: 0,
        points: 25,
        order: 1,
        explanation: 'Hash table lookups average O(1) assuming a uniform hash distribution.',
      },
      {
        question: "Kadane's algorithm is commonly used to solve which algorithmic problem in O(n) time?",
        options: ['Maximum Subarray Sum', 'Shortest Path', 'Minimum Spanning Tree', 'String Matching'],
        correctOption: 0,
        points: 25,
        order: 2,
        explanation: "Kadane's algorithm computes the maximum contiguous subarray sum in a single linear scan O(n).",
      },
    ],
    allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
    aiEvaluationEnabled: true,
    isPublished: true,
    totalPoints: 250,
    createdBy: instructor._id,
  });

  console.log('Successfully created exactly 2 contests:');
  console.log(`1. Standard: ${standardContest.title} (${standardContest.slug})`);
  console.log(`2. Interactive: ${interactiveContest.title} (${interactiveContest.slug})`);

  await mongoose.disconnect();
}

seedContests().catch((err) => {
  console.error('Seed contests error:', err);
  process.exit(1);
});
