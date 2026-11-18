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

  // Problems used in the new DS-themed contests
  const pReverseLL  = await Problem.findOne({ slug: 'reverse-linked-list' });
  const pBinarySearch = await Problem.findOne({ slug: 'binary-search' });
  const pIslands    = await Problem.findOne({ slug: 'number-of-islands' });
  const pClimbing   = await Problem.findOne({ slug: 'climbing-stairs' });

  // 1. Remove ALL existing contests and their submissions
  await Contest.deleteMany({});
  await ContestSubmission.deleteMany({});
  console.log('Cleared all existing contests and contest submissions.');

  const now = new Date();
  const startTime = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // started yesterday
  const endTime   = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // runs 14 days from now

  // ── Contest 1: Standard (proctored, no live execution) ────────────────────
  const standardContest = await Contest.create({
    title: 'Data Structures Fundamentals Exam',
    slug: 'data-structures-fundamentals-exam',
    description:
      'A proctored exam covering core Data Structures concepts — Linked Lists and Binary Search. ' +
      'Write clean, efficient solutions in the plain-text editor without live code execution.',
    instructions:
      'Write your solution in the plain editor. You cannot run your code before submitting. ' +
      'Focus on correctness, edge cases, and time/space complexity. ' +
      'Your submission will be evaluated against the full hidden test suite and reviewed with AI feedback.',
    contestType: 'standard',
    allowCodeExecution: false,
    startTime,
    endTime,
    durationMinutes: 60,
    problems: [
      { problemId: pReverseLL?._id,    points: 100, order: 1 },
      { problemId: pBinarySearch?._id, points: 100, order: 2 },
    ],
    mcqQuestions: [],
    allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
    aiEvaluationEnabled: true,
    isPublished: true,
    totalPoints: 200,
    createdBy: instructor._id,
  });

  // ── Contest 2: Interactive / Superset (live runner + MCQs) ────────────────
  const interactiveContest = await Contest.create({
    title: 'Data Structures Deep Dive Assessment',
    slug: 'data-structures-deep-dive-assessment',
    description:
      'A comprehensive dual-section assessment covering Trees, Graphs and Recursion-based Data Structures. ' +
      'Includes live test-runner coding problems and conceptual MCQs to test both implementation and theory.',
    instructions:
      'Welcome to the Data Structures Deep Dive Assessment! ' +
      'You may run your code against sample test cases in real-time before submitting. ' +
      'Complete ALL coding problems and ALL Multiple-Choice Questions before making your final submission.',
    contestType: 'superset',
    allowCodeExecution: true,
    startTime,
    endTime,
    durationMinutes: 90,
    problems: [
      { problemId: pClimbing?._id, points: 75,  order: 1 },
      { problemId: pIslands?._id,  points: 100, order: 2 },
    ],
    mcqQuestions: [
      {
        question: 'What is the time complexity of inserting a node at the head of a Singly Linked List?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctOption: 0,
        points: 25,
        order: 1,
        explanation:
          'Inserting at the head only requires updating the head pointer — no traversal needed, so it is O(1).',
      },
      {
        question: 'Which traversal of a Binary Search Tree (BST) visits nodes in ascending sorted order?',
        options: ['In-order (Left → Root → Right)', 'Pre-order (Root → Left → Right)', 'Post-order (Left → Right → Root)', 'Level-order (BFS)'],
        correctOption: 0,
        points: 25,
        order: 2,
        explanation:
          'In-order traversal of a BST produces values in non-decreasing order because left subtree < root < right subtree.',
      },
      {
        question: 'What data structure is used internally by BFS (Breadth-First Search)?',
        options: ['Queue', 'Stack', 'Heap', 'Hash Map'],
        correctOption: 0,
        points: 25,
        order: 3,
        explanation:
          'BFS uses a Queue (FIFO) to explore nodes level by level, ensuring the shortest path is found first in unweighted graphs.',
      },
    ],
    allowedLanguages: ['python', 'javascript', 'cpp', 'java'],
    aiEvaluationEnabled: true,
    isPublished: true,
    totalPoints: 250,
    createdBy: instructor._id,
  });

  console.log('Successfully created 2 new Data Structures contests:');
  console.log(`  1. Standard:     ${standardContest.title}    (${standardContest.slug})`);
  console.log(`  2. Interactive:  ${interactiveContest.title} (${interactiveContest.slug})`);

  await mongoose.disconnect();
}

seedContests().catch((err) => {
  console.error('Seed contests error:', err);
  process.exit(1);
});
