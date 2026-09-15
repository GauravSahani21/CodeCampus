export interface IAICodeReviewResult {
  overallRating: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  timeComplexity: string;
  spaceComplexity: string;
  complexityExplanation: string;
  detectedBugs: Array<{
    title: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    suggestedFix: string;
  }>;
  inefficiencies: Array<{
    title: string;
    explanation: string;
    impact: string;
  }>;
  improvements: string[];
  refactoredSnippet?: string;
  recommendedCourse?: {
    title: string;
    slug: string;
    reason: string;
    lessonId?: string;
  };
}

export function generateAICodeReview(
  language: string,
  code: string,
  context?: { problemTitle?: string; problemDescription?: string }
): IAICodeReviewResult {
  const lang = language.toLowerCase();
  const trimmed = code.trim();
  const lines = trimmed.split('\n');

  const bugs: IAICodeReviewResult['detectedBugs'] = [];
  const inefficiencies: IAICodeReviewResult['inefficiencies'] = [];
  const improvements: string[] = [];

  let estimatedTime = 'O(N)';
  let estimatedSpace = 'O(1)';
  let complexityExplanation = 'Linear scan through the input with minimal auxiliary storage allocated.';

  // 1. Analyze Complexity & Nested Loops
  let nestedLoopCount = 0;
  const loopKeywords = ['for (', 'for(', 'while (', 'while(', 'for item in', 'for i in'];
  let currentLoopDepth = 0;

  for (const line of lines) {
    const hasLoop = loopKeywords.some((k) => line.includes(k));
    if (hasLoop) {
      currentLoopDepth++;
      if (currentLoopDepth > nestedLoopCount) {
        nestedLoopCount = currentLoopDepth;
      }
    }
    if (line.includes('}') || (lang === 'python' && line.length > 0 && !line.startsWith('    '))) {
      if (currentLoopDepth > 0) currentLoopDepth--;
    }
  }

  if (nestedLoopCount >= 2) {
    estimatedTime = 'O(N²)';
    complexityExplanation = 'Quadratic runtime detected due to nested loop iterations over the collection.';
    inefficiencies.push({
      title: 'Quadratic Time Complexity in Nested Loops',
      explanation: 'Nested loops iterate over elements multiple times, which may result in Time Limit Exceeded (TLE) on inputs exceeding 10⁴ elements.',
      impact: 'O(N²) bottleneck',
    });
    improvements.push('Consider using a Hash Map or Frequency Array to reduce nested search from O(N²) to O(N).');
  } else if (trimmed.includes('sort(') || trimmed.includes('.sort') || trimmed.includes('Arrays.sort')) {
    estimatedTime = 'O(N log N)';
    complexityExplanation = 'Dominated by comparison-based sorting of the dataset.';
  }

  // 2. Analyze Space Complexity
  if (
    trimmed.includes('new int[') ||
    trimmed.includes('new ArrayList') ||
    trimmed.includes('vector<') ||
    trimmed.includes('new Array') ||
    trimmed.includes('[]') ||
    trimmed.includes('dict()') ||
    trimmed.includes('set()')
  ) {
    estimatedSpace = 'O(N)';
  }

  // 3. Detect Inefficiencies & Bugs
  if (lang === 'python') {
    if (trimmed.includes('range(len(') && !trimmed.includes('enumerate(')) {
      improvements.push('Use Pythonic `enumerate()` instead of index-based `range(len(...))` iteration.');
    }
    if (trimmed.includes('+') && trimmed.includes('for ') && trimmed.includes("''")) {
      inefficiencies.push({
        title: 'String Concatenation in Loop',
        explanation: 'Repeated string concatenation in Python creates new immutable string allocations on each cycle.',
        impact: 'O(N²) memory overhead',
      });
      improvements.push('Use a list buffer and `" ".join(list)` for efficient string assembly.');
    }
  } else if (lang === 'javascript' || lang === 'typescript') {
    if (trimmed.includes('var ')) {
      bugs.push({
        title: 'Legacy `var` Declaration',
        description: 'Using `var` introduces function-scoped hoisting issues and potential variable leakage.',
        severity: 'warning',
        suggestedFix: 'Replace `var` with block-scoped `const` or `let`.',
      });
    }
    if (trimmed.includes('==') && !trimmed.includes('===')) {
      bugs.push({
        title: 'Loose Equality Operator',
        description: 'Loose equality `==` triggers implicit type coercion which frequently causes subtle edge case bugs.',
        severity: 'warning',
        suggestedFix: 'Always use strict equality `===` to prevent unintended type coercions.',
      });
    }
  } else if (lang === 'java') {
    if (trimmed.includes('==') && trimmed.includes('String')) {
      bugs.push({
        title: 'Reference Equality on Strings',
        description: 'Comparing strings with `==` compares memory references rather than string value equivalence.',
        severity: 'critical',
        suggestedFix: 'Use `.equals()` or `Objects.equals(a, b)` for content comparison.',
      });
    }
  } else if (lang === 'cpp') {
    if (trimmed.includes('vector<int> ') && trimmed.includes('(') && !trimmed.includes('&')) {
      inefficiencies.push({
        title: 'Pass-by-Value Vector Parameter',
        explanation: 'Passing containers by value invokes a deep copy copy-constructor on every invocation.',
        impact: 'Unnecessary O(N) allocation per call',
      });
      improvements.push('Pass containers by const reference `const vector<int>&` to avoid cloning data.');
    }
  }

  // Edge case checks
  if (!trimmed.includes('length === 0') && !trimmed.includes('null') && !trimmed.includes('len(') && !trimmed.includes('empty()')) {
    improvements.push('Add guard clauses to handle null, empty inputs, or singleton arrays upfront.');
  }

  // Calculate Overall Rating
  let rating: IAICodeReviewResult['overallRating'] = 'A';
  if (bugs.some((b) => b.severity === 'critical')) {
    rating = 'D';
  } else if (inefficiencies.length > 1 || bugs.length > 0) {
    rating = 'B';
  } else if (inefficiencies.length > 0) {
    rating = 'B';
  }

  const summary =
    rating === 'A'
      ? 'Clean, idiomatic implementation with well-structured logic and sound asymptotic complexity.'
      : rating === 'B'
      ? 'Functional implementation with good structure, but contains optimization opportunities to reduce time or memory overhead.'
      : 'Working logic identified, but contains critical edge case pitfalls or suboptimal complexity that should be addressed.';

  let recommendedCourse: IAICodeReviewResult['recommendedCourse'] = undefined;
  if (estimatedTime === 'O(N²)' || inefficiencies.length > 0) {
    recommendedCourse = {
      title: 'Data Structures & Algorithms',
      slug: 'dsa',
      reason: 'Strengthen array partitioning and sliding window patterns to replace nested iterations with linear runtime.',
    };
  } else if (bugs.length > 0 || lang === 'java') {
    recommendedCourse = {
      title: 'Java Full Course',
      slug: 'java-full-course',
      reason: 'Reinforce object-oriented programming patterns and robust input validation practices.',
    };
  }

  return {
    overallRating: rating,
    summary,
    timeComplexity: estimatedTime,
    spaceComplexity: estimatedSpace,
    complexityExplanation,
    detectedBugs: bugs,
    inefficiencies,
    improvements: improvements.length > 0 ? improvements : ['Code structure follows standard algorithmic conventions.'],
    recommendedCourse,
  };
}

