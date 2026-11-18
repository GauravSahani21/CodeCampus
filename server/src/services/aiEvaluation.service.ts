import Course from '../models/Course.model';
import {
  IAIEvaluationReport,
  IAIEvaluationMistake,
  IRecommendedCourse,
} from '../models/ContestSubmission.model';

interface ProblemEvaluationInput {
  problemTitle: string;
  problemDescription: string;
  tags: string[];
  language: string;
  code: string;
  passedTestCases: number;
  totalTestCases: number;
  testResults: Array<{
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    passed: boolean;
    error?: string;
  }>;
}

// ─── Heuristic Diagnostic Engine ─────────────────────────────────────────────
function analyzeCodeMistakes(input: ProblemEvaluationInput): {
  mistakes: IAIEvaluationMistake[];
  concepts: string[];
} {
  const { problemTitle, code, language, testResults, passedTestCases, totalTestCases, tags } = input;
  const mistakes: IAIEvaluationMistake[] = [];
  const concepts = new Set<string>();

  // If all passed
  if (passedTestCases === totalTestCases && totalTestCases > 0) {
    return {
      mistakes: [],
      concepts: ['Clean Code', ...tags],
    };
  }

  // Check for runtime errors
  const failedResults = testResults.filter((t) => !t.passed);
  const runtimeError = failedResults.find((t) => t.error && t.error.trim().length > 0);

  if (runtimeError && runtimeError.error) {
    const errText = runtimeError.error;
    if (errText.includes('SyntaxError') || errText.includes('unexpected token')) {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Syntax / Parsing Error',
        explanation: `Your code failed to parse or execute: ${errText.slice(0, 180)}`,
        fixSuggestion: 'Double check punctuation, closing brackets, quotes, and variable declarations.',
      });
      concepts.add('Language Syntax');
    } else if (errText.includes('IndexError') || errText.includes('out of bounds') || errText.includes('undefined')) {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Array Index Out of Bounds',
        explanation: 'Your code attempted to access an array or list index that does not exist on certain inputs.',
        fixSuggestion: 'Check loop termination conditions (e.g. `<= length` vs `< length`) and verify bounds before accessing elements.',
      });
      concepts.add('Boundary Checking');
      concepts.add('Array');
    } else if (errText.includes('ZeroDivisionError') || errText.includes('division by zero')) {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Division by Zero',
        explanation: 'The code performed a division operation where the denominator was 0.',
        fixSuggestion: 'Add a guard clause or check if denominator is non-zero before dividing.',
      });
      concepts.add('Edge Case Handling');
    } else {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Runtime Execution Error',
        explanation: `Program exited abnormally: ${errText.slice(0, 180)}`,
        fixSuggestion: 'Ensure all variables are initialized and types match expected operations.',
      });
      concepts.add('Debugging');
    }
  }

  // Check for logical / output mismatches
  const outputMismatch = failedResults.find((t) => !t.error);
  if (outputMismatch) {
    const actual = (outputMismatch.actualOutput || '').trim();
    const expected = outputMismatch.expectedOutput.trim();

    if (!actual) {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Empty or Missing Output',
        explanation: 'The program produced no output for the test case input.',
        fixSuggestion: 'Ensure your solution prints or returns the expected value according to the problem output format.',
      });
      concepts.add('I/O Formatting');
    } else if (actual.toLowerCase() === expected.toLowerCase()) {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Output Formatting Discrepancy',
        explanation: `Expected "${expected}" but got "${actual}". The casing or whitespace differed slightly.`,
        fixSuggestion: 'Trim trailing spaces and match the exact case specified in the problem statement.',
      });
      concepts.add('Output Formatting');
    } else {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Logic / Algorithmic Error',
        explanation: `For input "${outputMismatch.input.slice(0, 40)}", expected "${expected.slice(0, 30)}" but received "${actual.slice(0, 30)}".`,
        fixSuggestion: 'Trace the algorithm step-by-step with the sample input and check your state update conditions.',
      });
      concepts.add('Algorithm Logic');
    }
  }

  // Code inspection heuristics
  if (code.includes('for') && (code.match(/for/g) || []).length >= 2) {
    if (tags.some((t) => ['Hash Table', 'Two Pointers', 'Binary Search'].includes(t))) {
      mistakes.push({
        problemTitle,
        mistakeTitle: 'Suboptimal Time Complexity (O(N²))',
        explanation: 'Using nested loops may cause timeouts or fail efficiency requirements for large inputs.',
        fixSuggestion: 'Consider using a Hash Map, Two Pointers, or Binary Search to reduce complexity to O(N) or O(N log N).',
      });
      concepts.add('Time Complexity Optimization');
      concepts.add('Hash Table');
    }
  }

  // Inherit problem tags into concepts
  tags.forEach((t) => concepts.add(t));

  return {
    mistakes,
    concepts: Array.from(concepts),
  };
}

// ─── Main Evaluation Function (100% Rule-Based & Local Heuristics) ───────────
export async function evaluateContestSubmission(
  evaluations: ProblemEvaluationInput[]
): Promise<IAIEvaluationReport> {
  const allMistakes: IAIEvaluationMistake[] = [];
  const allConcepts = new Set<string>();

  let totalPassed = 0;
  let totalCases = 0;

  for (const item of evaluations) {
    totalPassed += item.passedTestCases;
    totalCases += item.totalTestCases;

    // Fully deterministic, rule-based heuristic code diagnostics
    const result = analyzeCodeMistakes(item);

    allMistakes.push(...result.mistakes);
    result.concepts.forEach((c) => allConcepts.add(c));
  }

  const conceptsToFocus = Array.from(allConcepts);

  // ── Find Recommended Courses from Database ─────────────────────────────────
  let recommendedCourses: IRecommendedCourse[] = [];
  try {
    const courseRegexes = conceptsToFocus.map((c) => new RegExp(c, 'i'));
    const matchedCourses = await Course.find({
      $or: [
        { tags: { $in: courseRegexes } },
        { title: { $in: courseRegexes } },
        { description: { $in: courseRegexes } },
      ],
      isPublished: true,
    })
      .select('title slug description tags difficulty')
      .limit(3);

    if (matchedCourses.length > 0) {
      recommendedCourses = matchedCourses.map((c) => ({
        title: c.title,
        slug: c.slug,
        description: c.description,
        reason: `Focuses on ${c.tags.slice(0, 3).join(', ')} to reinforce concepts tested in this contest.`,
        matchingConcepts: c.tags,
      }));
    } else {
      // Fallback: recommend popular foundational courses
      const fallbackCourses = await Course.find({ isPublished: true })
        .select('title slug description tags')
        .limit(2);
      recommendedCourses = fallbackCourses.map((c) => ({
        title: c.title,
        slug: c.slug,
        description: c.description,
        reason: 'Recommended core curriculum course to strengthen coding fundamentals.',
        matchingConcepts: c.tags,
      }));
    }
  } catch (err) {
    console.error('Failed to query recommended courses:', err);
  }

  // Generate executive summary
  const passPercent = totalCases > 0 ? Math.round((totalPassed / totalCases) * 100) : 0;
  let summary = '';
  if (passPercent === 100) {
    summary = `Outstanding work! You passed 100% of all test cases with solid algorithmic logic and clean execution.`;
  } else if (passPercent >= 70) {
    summary = `Strong effort! You achieved a ${passPercent}% pass rate across test cases. Review the edge cases and time complexity suggestions below to reach 100%.`;
  } else if (passPercent >= 40) {
    summary = `Decent start! You passed ${passPercent}% of test cases. You encountered logic and boundary issues on several inputs. Take a look at the recommended lessons to master these patterns.`;
  } else {
    summary = `You scored ${passPercent}%. Several test cases failed due to runtime or logic mismatches. Don't worry — coding competitions are about learning from mistakes! Check the targeted course recommendations below.`;
  }

  return {
    summary,
    mistakes: allMistakes,
    conceptsToFocus,
    recommendedCourses,
    evaluatedAt: new Date(),
  };
}
