import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Problem from './models/Problem.model';
import User from './models/User.model';
dotenv.config();

const TOPIC_MAPPING = [
  { topic: 'Arrays & Hashing', tags: ['Array', 'Hash Table'], problems: ["Contains Duplicate", "Valid Anagram", "Two Sum", "Group Anagrams", "Top K Frequent Elements", "Encode and Decode Strings", "Product of Array Except Self", "Valid Sudoku", "Longest Consecutive Sequence"] },
  { topic: 'Two Pointers', tags: ['Two Pointers'], problems: ["Valid Palindrome", "Two Sum II Input Array Is Sorted", "3Sum", "Container With Most Water", "Trapping Rain Water"] },
  { topic: 'Stack', tags: ['Stack'], problems: ["Valid Parentheses", "Min Stack", "Evaluate Reverse Polish Notation", "Daily Temperatures", "Car Fleet", "Largest Rectangle In Histogram"] },
  { topic: 'Binary Search', tags: ['Binary Search'], problems: ["Binary Search", "Search a 2D Matrix", "Koko Eating Bananas", "Find Minimum In Rotated Sorted Array", "Search In Rotated Sorted Array", "Time Based Key Value Store", "Median of Two Sorted Arrays"] },
  { topic: 'Sliding Window', tags: ['Sliding Window'], problems: ["Best Time to Buy And Sell Stock", "Longest Substring Without Repeating Characters", "Longest Repeating Character Replacement", "Permutation In String", "Minimum Window Substring", "Sliding Window Maximum"] },
  { topic: 'Linked List', tags: ['Linked List'], problems: ["Reverse Linked List", "Merge Two Sorted Lists", "Linked List Cycle", "Reorder List", "Remove Nth Node From End of List", "Copy List With Random Pointer", "Add Two Numbers", "Find The Duplicate Number", "LRU Cache", "Merge K Sorted Lists", "Reverse Nodes In K Group"] },
  { topic: 'Trees', tags: ['Tree', 'Binary Tree'], problems: ["Invert Binary Tree", "Maximum Depth of Binary Tree", "Diameter of Binary Tree", "Balanced Binary Tree", "Same Tree", "Subtree of Another Tree", "Lowest Common Ancestor of a Binary Search Tree", "Binary Tree Level Order Traversal", "Binary Tree Right Side View", "Count Good Nodes In Binary Tree", "Validate Binary Search Tree", "Kth Smallest Element In a Bst", "Construct Binary Tree From Preorder And Inorder Traversal", "Binary Tree Maximum Path Sum", "Serialize And Deserialize Binary Tree"] },
  { topic: 'Heap / Priority Queue', tags: ['Heap', 'Priority Queue'], problems: ["Kth Largest Element In a Stream", "Last Stone Weight", "K Closest Points to Origin", "Kth Largest Element In An Array", "Task Scheduler", "Design Twitter", "Find Median From Data Stream"] },
  { topic: 'Backtracking', tags: ['Backtracking'], problems: ["Subsets", "Combination Sum", "Combination Sum II", "Permutations", "Subsets II", "Generate Parentheses", "Word Search", "Palindrome Partitioning", "Letter Combinations of a Phone Number", "N Queens"] },
  { topic: 'Tries', tags: ['Trie'], problems: ["Implement Trie Prefix Tree", "Design Add And Search Words Data Structure", "Word Search II"] },
  { topic: 'Graphs', tags: ['Graph', 'BFS', 'DFS'], problems: ["Number of Islands", "Max Area of Island", "Clone Graph", "Walls And Gates", "Rotting Oranges", "Pacific Atlantic Water Flow", "Surrounded Regions", "Course Schedule", "Course Schedule II", "Graph Valid Tree", "Number of Connected Components In An Undirected Graph", "Redundant Connection", "Word Ladder"] },
  { topic: 'Advanced Graphs', tags: ['Graph', 'Dijkstra'], problems: ["Network Delay Time", "Reconstruct Itinerary", "Min Cost to Connect All Points", "Swim In Rising Water", "Alien Dictionary", "Cheapest Flights Within K Stops"] },
  { topic: '1-D DP', tags: ['Dynamic Programming'], problems: ["Climbing Stairs", "Min Cost Climbing Stairs", "House Robber", "House Robber II", "Longest Palindromic Substring", "Palindromic Substrings", "Decode Ways", "Coin Change", "Maximum Product Subarray", "Word Break", "Longest Increasing Subsequence", "Partition Equal Subset Sum"] },
  { topic: '2-D DP', tags: ['Dynamic Programming'], problems: ["Unique Paths", "Longest Common Subsequence", "Best Time to Buy And Sell Stock With Cooldown", "Coin Change II", "Target Sum", "Interleaving String", "Longest Increasing Path In a Matrix", "Distinct Subsequences", "Edit Distance", "Burst Balloons", "Regular Expression Matching"] },
  { topic: 'Greedy', tags: ['Greedy'], problems: ["Maximum Subarray", "Jump Game", "Jump Game II", "Gas Station", "Hand of Straights", "Merge Triplets to Form Target Triplet", "Partition Labels", "Valid Parenthesis String"] },
  { topic: 'Intervals', tags: ['Intervals'], problems: ["Insert Interval", "Merge Intervals", "Non Overlapping Intervals", "Meeting Rooms", "Meeting Rooms II", "Minimum Interval to Include Each Query"] },
  { topic: 'Math & Geometry', tags: ['Math', 'Geometry'], problems: ["Rotate Image", "Spiral Matrix", "Set Matrix Zeroes", "Happy Number", "Plus One", "Pow(x, n)", "Multiply Strings", "Detect Squares"] },
  { topic: 'Bit Manipulation', tags: ['Bit Manipulation'], problems: ["Single Number", "Number of 1 Bits", "Counting Bits", "Reverse Bits", "Missing Number", "Sum of Two Integers", "Reverse Integer"] }
];

function toSlug(title: string) {
  if (title === 'Pow(x, n)') return 'powx-n';
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

interface JavaProblemSpec {
  description: string;
  javaCode: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
}

const FIRST_50_PROBLEMS: Record<string, JavaProblemSpec> = {
  "Contains Duplicate": {
    description: `### Contains Duplicate\n\nGiven an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [1,2,3,1]\nOutput: true\n\`\`\`\n\n#### Example 2:\n\`\`\`text\nInput: nums = [1,2,3,4]\nOutput: false\n\`\`\`\n\n#### Example 3:\n\`\`\`text\nInput: nums = [1,1,1,3,3,4,3,2,4,2]\nOutput: true\n\`\`\`\n\n#### Constraints:\n- \`1 <= nums.length <= 10^5\`\n- \`-10^9 <= nums[i] <= 10^9\``,
    javaCode: `class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: "nums = [1,2,3,1]", output: "true" },
      { input: "nums = [1,2,3,4]", output: "false" }
    ],
    testCases: [
      { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
      { input: "[1,2,3,4]", expectedOutput: "false", isHidden: false },
      { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true", isHidden: true }
    ]
  },
  "Valid Anagram": {
    description: `### Valid Anagram\n\nGiven two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.\n\nAn **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.\n\n#### Example 1:\n\`\`\`text\nInput: s = "anagram", t = "nagaram"\nOutput: true\n\`\`\`\n\n#### Example 2:\n\`\`\`text\nInput: s = "rat", t = "car"\nOutput: false\n\`\`\`\n\n#### Constraints:\n- \`1 <= s.length, t.length <= 5 * 10^4\`\n- \`s\` and \`t\` consist of lowercase English letters.`,
    javaCode: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: "true" },
      { input: 's = "rat", t = "car"', output: "false" }
    ],
    testCases: [
      { input: '"anagram"\n"nagaram"', expectedOutput: "true", isHidden: false },
      { input: '"rat"\n"car"', expectedOutput: "false", isHidden: false }
    ]
  },
  "Two Sum": {
    description: `### Two Sum\n\nGiven an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].\n\`\`\`\n\n#### Example 2:\n\`\`\`text\nInput: nums = [3,2,4], target = 6\nOutput: [1,2]\n\`\`\`\n\n#### Example 3:\n\`\`\`text\nInput: nums = [3,3], target = 6\nOutput: [0,1]\n\`\`\`\n\n#### Constraints:\n- \`2 <= nums.length <= 10^4\`\n- \`-10^9 <= nums[i] <= 10^9\`\n- \`-10^9 <= target <= 10^9\`\n- **Only one valid answer exists.**`,
    javaCode: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4]\n6", expectedOutput: "[1,2]", isHidden: false }
    ]
  },
  "Group Anagrams": {
    description: `### Group Anagrams\n\nGiven an array of strings \`strs\`, group the **anagrams** together. You can return the answer in **any order**.\n\n#### Example 1:\n\`\`\`text\nInput: strs = ["eat","tea","tan","ate","nat","bat"]\nOutput: [["bat"],["nat","tan"],["ate","eat","tea"]]\n\`\`\`\n\n#### Example 2:\n\`\`\`text\nInput: strs = [""]\nOutput: [[""]]\n\`\`\`\n\n#### Constraints:\n- \`1 <= strs.length <= 10^4\`\n- \`0 <= strs[i].length <= 100\`\n- \`strs[i]\` consists of lowercase English letters.`,
    javaCode: `import java.util.*;\n\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}`,
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }
    ],
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false }
    ]
  },
  "Top K Frequent Elements": {
    description: `### Top K Frequent Elements\n\nGiven an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements. You may return the answer in **any order**.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [1,1,1,2,2,3], k = 2\nOutput: [1,2]\n\`\`\`\n\n#### Example 2:\n\`\`\`text\nInput: nums = [1], k = 1\nOutput: [1]\n\`\`\`\n\n#### Constraints:\n- \`1 <= nums.length <= 10^5\`\n- \`-10^4 <= nums[i] <= 10^4\`\n- \`k\` is in the range \`[1, the number of unique elements in the array]\`.\n- It is **guaranteed** that the answer is **unique**.`,
    javaCode: `class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]" }
    ],
    testCases: [
      { input: "[1,1,1,2,2,3]\n2", expectedOutput: "[1,2]", isHidden: false }
    ]
  },
  "Encode and Decode Strings": {
    description: `### Encode and Decode Strings\n\nDesign an algorithm to encode a list of strings to a string. The encoded string is then sent over the network and is decoded back to the original list of strings.\n\n#### Example 1:\n\`\`\`text\nInput: dummy_input = ["lint","code","love","you"]\nOutput: ["lint","code","love","you"]\n\`\`\`\n\n#### Constraints:\n- \`1 <= strs.length <= 200\`\n- \`0 <= strs[i].length <= 200\``,
    javaCode: `import java.util.*;\n\npublic class Codec {\n    public String encode(List<String> strs) {\n        // Write your solution here\n        return "";\n    }\n\n    public List<String> decode(String s) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}`,
    examples: [
      { input: 'strs = ["lint","code","love","you"]', output: '["lint","code","love","you"]' }
    ],
    testCases: [
      { input: '["lint","code","love","you"]', expectedOutput: '["lint","code","love","you"]', isHidden: false }
    ]
  },
  "Product of Array Except Self": {
    description: `### Product of Array Except Self\n\nGiven an integer array \`nums\`, return an array \`answer\` such that \`answer[i]\` is equal to the product of all the elements of \`nums\` except \`nums[i]\`.\n\nThe product of any prefix or suffix of \`nums\` is **guaranteed** to fit in a **32-bit** integer.\n\nYou must write an algorithm that runs in \`O(n)\` time and without using the division operation.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [1,2,3,4]\nOutput: [24,12,8,6]\n\`\`\`\n\n#### Constraints:\n- \`2 <= nums.length <= 10^5\`\n- \`-30 <= nums[i] <= 30\``,
    javaCode: `class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    examples: [
      { input: "nums = [1,2,3,4]", output: "[24,12,8,6]" }
    ],
    testCases: [
      { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]", isHidden: false }
    ]
  },
  "Valid Sudoku": {
    description: `### Valid Sudoku\n\nDetermine if a \`9 x 9\` Sudoku board is valid. Only the filled cells need to be validated according to the following rules:\n1. Each row must contain the digits \`1-9\` without repetition.\n2. Each column must contain the digits \`1-9\` without repetition.\n3. Each of the nine \`3 x 3\` sub-boxes of the grid must contain the digits \`1-9\` without repetition.\n\n#### Constraints:\n- \`board.length == 9\`\n- \`board[i].length == 9\``,
    javaCode: `class Solution {\n    public boolean isValidSudoku(char[][] board) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: 'board = [["5","3",".",...]]', output: "true" }
    ],
    testCases: [
      { input: '[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', expectedOutput: "true", isHidden: false }
    ]
  },
  "Longest Consecutive Sequence": {
    description: `### Longest Consecutive Sequence\n\nGiven an unsorted array of integers \`nums\`, return the length of the longest consecutive elements sequence.\n\nYou must write an algorithm that runs in \`O(n)\` time.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [100,4,200,1,3,2]\nOutput: 4\nExplanation: The longest consecutive elements sequence is [1, 2, 3, 4]. Therefore its length is 4.\n\`\`\`\n\n#### Constraints:\n- \`0 <= nums.length <= 10^5\`\n- \`-10^9 <= nums[i] <= 10^9\``,
    javaCode: `class Solution {\n    public int longestConsecutive(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "nums = [100,4,200,1,3,2]", output: "4" }
    ],
    testCases: [
      { input: "[100,4,200,1,3,2]", expectedOutput: "4", isHidden: false }
    ]
  },
  "Valid Palindrome": {
    description: `### Valid Palindrome\n\nA phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.\n\n#### Example 1:\n\`\`\`text\nInput: s = "A man, a plan, a canal: Panama"\nOutput: true\nExplanation: "amanaplanacanalpanama" is a palindrome.\n\`\`\`\n\n#### Constraints:\n- \`1 <= s.length <= 2 * 10^5\``,
    javaCode: `class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: "true" }
    ],
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false },
      { input: '"race a car"', expectedOutput: "false", isHidden: false }
    ]
  },
  "Two Sum II Input Array Is Sorted": {
    description: `### Two Sum II - Input Array Is Sorted\n\nGiven a **1-indexed** array of integers \`numbers\` that is already **sorted in non-decreasing order**, find two numbers such that they add up to a specific \`target\` number.\n\nReturn the indices of the two numbers, \`index1\` and \`index2\`, added by one as an integer array \`[index1, index2]\` of length 2.\n\n#### Example 1:\n\`\`\`text\nInput: numbers = [2,7,11,15], target = 9\nOutput: [1,2]\nExplanation: The sum of 2 and 7 is 9. Therefore index1 = 1, index2 = 2. We return [1, 2].\n\`\`\`\n\n#### Constraints:\n- \`2 <= numbers.length <= 3 * 10^4\`\n- \`-1000 <= numbers[i] <= 1000\`\n- \`numbers\` is sorted in non-decreasing order.`,
    javaCode: `class Solution {\n    public int[] twoSum(int[] numbers, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1,2]" }
    ],
    testCases: [
      { input: "[2,7,11,15]\n9", expectedOutput: "[1,2]", isHidden: false }
    ]
  },
  "3Sum": {
    description: `### 3Sum\n\nGiven an integer array nums, return all the triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j\`, \`i != k\`, and \`j != k\`, and \`nums[i] + nums[j] + nums[k] == 0\`.\n\nNotice that the solution set must not contain duplicate triplets.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [-1,0,1,2,-1,-4]\nOutput: [[-1,-1,2],[-1,0,1]]\n\`\`\`\n\n#### Constraints:\n- \`3 <= nums.length <= 3000\`\n- \`-10^5 <= nums[i] <= 10^5\``,
    javaCode: `import java.util.*;\n\nclass Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write your solution here\n        return new ArrayList<>();\n    }\n}`,
    examples: [
      { input: "nums = [-1,0,1,2,-1,-4]", output: "[[-1,-1,2],[-1,0,1]]" }
    ],
    testCases: [
      { input: "[-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false }
    ]
  },
  "Container With Most Water": {
    description: `### Container With Most Water\n\nYou are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`-th line are \`(i, 0)\` and \`(i, height[i])\`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.\n\n#### Example 1:\n\`\`\`text\nInput: height = [1,8,6,2,5,4,8,3,7]\nOutput: 49\n\`\`\`\n\n#### Constraints:\n- \`n == height.length\`\n- \`2 <= n <= 10^5\`\n- \`0 <= height[i] <= 10^4\``,
    javaCode: `class Solution {\n    public int maxArea(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49" }
    ],
    testCases: [
      { input: "[1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false }
    ]
  },
  "Trapping Rain Water": {
    description: `### Trapping Rain Water\n\nGiven \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.\n\n#### Example 1:\n\`\`\`text\nInput: height = [0,1,0,2,1,0,1,3,2,1,2,1]\nOutput: 6\n\`\`\`\n\n#### Constraints:\n- \`n == height.length\`\n- \`1 <= n <= 2 * 10^4\`\n- \`0 <= height[i] <= 10^5\``,
    javaCode: `class Solution {\n    public int trap(int[] height) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", output: "6" }
    ],
    testCases: [
      { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", isHidden: false }
    ]
  },
  "Valid Parentheses": {
    description: `### Valid Parentheses\n\nGiven a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.\n\n#### Example 1:\n\`\`\`text\nInput: s = "()"\nOutput: true\n\`\`\`\n\n#### Constraints:\n- \`1 <= s.length <= 10^4\``,
    javaCode: `class Solution {\n    public boolean isValid(String s) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: 's = "()"', output: "true" }
    ],
    testCases: [
      { input: '"()"', expectedOutput: "true", isHidden: false }
    ]
  },
  "Min Stack": {
    description: `### Min Stack\n\nDesign a stack that supports push, pop, top, and retrieving the minimum element in constant time.\n\nImplement the \`MinStack\` class:\n- \`MinStack()\` initializes the stack object.\n- \`void push(int val)\` pushes the element \`val\` onto the stack.\n- \`void pop()\` removes the element on the top of the stack.\n- \`int top()\` gets the top element of the stack.\n- \`int getMin()\` retrieves the minimum element in the stack.\n\n#### Example 1:\n\`\`\`text\nInput: ["MinStack","push","push","push","getMin","pop","top","getMin"]\nOutput: [null,null,null,null,-3,null,0,-2]\n\`\`\``,
    javaCode: `class MinStack {\n    public MinStack() {\n        // Initialize data structures\n    }\n    \n    public void push(int val) {\n        \n    }\n    \n    public void pop() {\n        \n    }\n    \n    public int top() {\n        return 0;\n    }\n    \n    public int getMin() {\n        return 0;\n    }\n}`,
    examples: [
      { input: '["MinStack","push","push","push","getMin","pop","top","getMin"]', output: "[null,null,null,null,-3,null,0,-2]" }
    ],
    testCases: [
      { input: '["MinStack","push","push","push","getMin","pop","top","getMin"]', expectedOutput: "[null,null,null,null,-3,null,0,-2]", isHidden: false }
    ]
  },
  "Evaluate Reverse Polish Notation": {
    description: `### Evaluate Reverse Polish Notation\n\nYou are given an array of strings \`tokens\` that represents an arithmetic expression in a Reverse Polish Notation.\n\nEvaluate the expression. Return an integer that represents the value of the expression.\n\n#### Example 1:\n\`\`\`text\nInput: tokens = ["2","1","+","3","*"]\nOutput: 9\nExplanation: ((2 + 1) * 3) = 9\n\`\`\`\n\n#### Constraints:\n- \`1 <= tokens.length <= 10^4\``,
    javaCode: `class Solution {\n    public int evalRPN(String[] tokens) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: 'tokens = ["2","1","+","3","*"]', output: "9" }
    ],
    testCases: [
      { input: '["2","1","+","3","*"]', expectedOutput: "9", isHidden: false }
    ]
  },
  "Daily Temperatures": {
    description: `### Daily Temperatures\n\nGiven an array of integers \`temperatures\` represents the daily temperatures, return an array \`answer\` such that \`answer[i]\` is the number of days you have to wait after the \`i\`-th day to get a warmer temperature. If there is no future day for which this is possible, keep \`answer[i] == 0\` instead.\n\n#### Example 1:\n\`\`\`text\nInput: temperatures = [73,74,75,71,69,72,76,73]\nOutput: [1,1,4,2,1,1,0,0]\n\`\`\`\n\n#### Constraints:\n- \`1 <= temperatures.length <= 10^5\``,
    javaCode: `class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    examples: [
      { input: "temperatures = [73,74,75,71,69,72,76,73]", output: "[1,1,4,2,1,1,0,0]" }
    ],
    testCases: [
      { input: "[73,74,75,71,69,72,76,73]", expectedOutput: "[1,1,4,2,1,1,0,0]", isHidden: false }
    ]
  },
  "Car Fleet": {
    description: `### Car Fleet\n\nThere are \`n\` cars going to the same destination along a one-lane road. The destination is \`target\` miles away.\n\nReturn the number of car fleets that will arrive at the destination.\n\n#### Example 1:\n\`\`\`text\nInput: target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]\nOutput: 3\n\`\`\``,
    javaCode: `class Solution {\n    public int carFleet(int target, int[] position, int[] speed) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]", output: "3" }
    ],
    testCases: [
      { input: "12\n[10,8,0,5,3]\n[2,4,1,1,3]", expectedOutput: "3", isHidden: false }
    ]
  },
  "Largest Rectangle In Histogram": {
    description: `### Largest Rectangle in Histogram\n\nGiven an array of integers \`heights\` representing the histogram's bar height where the width of each bar is \`1\`, return the area of the largest rectangle in the histogram.\n\n#### Example 1:\n\`\`\`text\nInput: heights = [2,1,5,6,2,3]\nOutput: 10\n\`\`\``,
    javaCode: `class Solution {\n    public int largestRectangleArea(int[] heights) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "heights = [2,1,5,6,2,3]", output: "10" }
    ],
    testCases: [
      { input: "[2,1,5,6,2,3]", expectedOutput: "10", isHidden: false }
    ]
  },
  "Binary Search": {
    description: `### Binary Search\n\nGiven an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [-1,0,3,5,9,12], target = 9\nOutput: 4\n\`\`\``,
    javaCode: `class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}`,
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4" }
    ],
    testCases: [
      { input: "[-1,0,3,5,9,12]\n9", expectedOutput: "4", isHidden: false }
    ]
  },
  "Search a 2D Matrix": {
    description: `### Search a 2D Matrix\n\nYou are given an \`m x n\` integer matrix \`matrix\` with the following two properties:\n- Each row is sorted in non-decreasing order.\n- The first integer of each row is greater than the last integer of the previous row.\n\nGiven an integer \`target\`, return \`true\` if \`target\` is in \`matrix\` or \`false\` otherwise.\n\n#### Example 1:\n\`\`\`text\nInput: matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3\nOutput: true\n\`\`\``,
    javaCode: `class Solution {\n    public boolean searchMatrix(int[][] matrix, int target) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: "matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3", output: "true" }
    ],
    testCases: [
      { input: "[[1,3,5,7],[10,11,16,20],[23,30,34,60]]\n3", expectedOutput: "true", isHidden: false }
    ]
  },
  "Koko Eating Bananas": {
    description: `### Koko Eating Bananas\n\nKoko loves to eat bananas. There are \`n\` piles of bananas, the \`i\`-th pile has \`piles[i]\` bananas. The guards have gone and will come back in \`h\` hours.\n\nReturn the minimum integer \`k\` such that she can eat all the bananas within \`h\` hours.\n\n#### Example 1:\n\`\`\`text\nInput: piles = [3,6,7,11], h = 8\nOutput: 4\n\`\`\``,
    javaCode: `class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "piles = [3,6,7,11], h = 8", output: "4" }
    ],
    testCases: [
      { input: "[3,6,7,11]\n8", expectedOutput: "4", isHidden: false }
    ]
  },
  "Find Minimum In Rotated Sorted Array": {
    description: `### Find Minimum in Rotated Sorted Array\n\nSuppose an array of length \`n\` sorted in ascending order is rotated between \`1\` and \`n\` times. Given the sorted rotated array \`nums\` of unique elements, return the minimum element of this array.\n\nYou must write an algorithm that runs in \`O(log n)\` time.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [3,4,5,1,2]\nOutput: 1\n\`\`\``,
    javaCode: `class Solution {\n    public int findMin(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "nums = [3,4,5,1,2]", output: "1" }
    ],
    testCases: [
      { input: "[3,4,5,1,2]", expectedOutput: "1", isHidden: false }
    ]
  },
  "Search In Rotated Sorted Array": {
    description: `### Search in Rotated Sorted Array\n\nGiven the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`.\n\nYou must write an algorithm with \`O(log n)\` runtime complexity.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [4,5,6,7,0,1,2], target = 0\nOutput: 4\n\`\`\``,
    javaCode: `class Solution {\n    public int search(int[] nums, int target) {\n        // Write your solution here\n        return -1;\n    }\n}`,
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" }
    ],
    testCases: [
      { input: "[4,5,6,7,0,1,2]\n0", expectedOutput: "4", isHidden: false }
    ]
  },
  "Time Based Key Value Store": {
    description: `### Time Based Key-Value Store\n\nDesign a time-based key-value data structure that can store multiple values for the same key at different time stamps and retrieve the key's value at a certain timestamp.\n\nImplement the \`TimeMap\` class:\n- \`TimeMap()\` Initializes the object of the data structure.\n- \`void set(String key, String value, int timestamp)\` Stores key with value at given timestamp.\n- \`String get(String key, int timestamp)\` Returns value such that timestamp_prev <= timestamp.`,
    javaCode: `import java.util.*;\n\nclass TimeMap {\n    public TimeMap() {\n        \n    }\n    \n    public void set(String key, String value, int timestamp) {\n        \n    }\n    \n    public String get(String key, int timestamp) {\n        return "";\n    }\n}`,
    examples: [
      { input: '["TimeMap","set","get"]', output: '[null,null,"bar"]' }
    ],
    testCases: [
      { input: '["TimeMap","set","get"]', expectedOutput: '[null,null,"bar"]', isHidden: false }
    ]
  },
  "Median of Two Sorted Arrays": {
    description: `### Median of Two Sorted Arrays\n\nGiven two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be \`O(log (m+n))\`.\n\n#### Example 1:\n\`\`\`text\nInput: nums1 = [1,3], nums2 = [2]\nOutput: 2.00000\n\`\`\``,
    javaCode: `class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        // Write your solution here\n        return 0.0;\n    }\n}`,
    examples: [
      { input: "nums1 = [1,3], nums2 = [2]", output: "2.00000" }
    ],
    testCases: [
      { input: "[1,3]\n[2]", expectedOutput: "2.0", isHidden: false }
    ]
  },
  "Best Time to Buy And Sell Stock": {
    description: `### Best Time to Buy and Sell Stock\n\nYou are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`-th day.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.\n\n#### Example 1:\n\`\`\`text\nInput: prices = [7,1,5,3,6,4]\nOutput: 5\n\`\`\``,
    javaCode: `class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5" }
    ],
    testCases: [
      { input: "[7,1,5,3,6,4]", expectedOutput: "5", isHidden: false }
    ]
  },
  "Longest Substring Without Repeating Characters": {
    description: `### Longest Substring Without Repeating Characters\n\nGiven a string \`s\`, find the length of the **longest substring** without repeating characters.\n\n#### Example 1:\n\`\`\`text\nInput: s = "abcabcbb"\nOutput: 3\nExplanation: The answer is "abc", with the length of 3.\n\`\`\``,
    javaCode: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: 's = "abcabcbb"', output: "3" }
    ],
    testCases: [
      { input: '"abcabcbb"', expectedOutput: "3", isHidden: false }
    ]
  },
  "Longest Repeating Character Replacement": {
    description: `### Longest Repeating Character Replacement\n\nYou are given a string \`s\` and an integer \`k\`. You can choose any character of the string and change it to any other uppercase English character. You can perform this operation at most \`k\` times.\n\nReturn the length of the longest substring containing the same letter you can get after performing the above operations.\n\n#### Example 1:\n\`\`\`text\nInput: s = "ABAB", k = 2\nOutput: 4\n\`\`\``,
    javaCode: `class Solution {\n    public int characterReplacement(String s, int k) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: 's = "ABAB", k = 2', output: "4" }
    ],
    testCases: [
      { input: '"ABAB"\n2', expectedOutput: "4", isHidden: false }
    ]
  },
  "Permutation In String": {
    description: `### Permutation in String\n\nGiven two strings \`s1\` and \`s2\`, return \`true\` if \`s2\` contains a permutation of \`s1\`, or \`false\` otherwise.\n\n#### Example 1:\n\`\`\`text\nInput: s1 = "ab", s2 = "eidbaooo"\nOutput: true\n\`\`\``,
    javaCode: `class Solution {\n    public boolean checkInclusion(String s1, String s2) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: 's1 = "ab", s2 = "eidbaooo"', output: "true" }
    ],
    testCases: [
      { input: '"ab"\n"eidbaooo"', expectedOutput: "true", isHidden: false }
    ]
  },
  "Minimum Window Substring": {
    description: `### Minimum Window Substring\n\nGiven two strings \`s\` and \`t\` of lengths \`m\` and \`n\` respectively, return the minimum window substring of \`s\` such that every character in \`t\` (including duplicates) is included in the window.\n\n#### Example 1:\n\`\`\`text\nInput: s = "ADOBECODEBANC", t = "ABC"\nOutput: "BANC"\n\`\`\``,
    javaCode: `class Solution {\n    public String minWindow(String s, String t) {\n        // Write your solution here\n        return "";\n    }\n}`,
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"' }
    ],
    testCases: [
      { input: '"ADOBECODEBANC"\n"ABC"', expectedOutput: '"BANC"', isHidden: false }
    ]
  },
  "Sliding Window Maximum": {
    description: `### Sliding Window Maximum\n\nYou are given an array of integers \`nums\`, there is a sliding window of size \`k\` which is moving from the very left of the array to the very right. Return the max sliding window.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [1,3,-1,-3,5,3,6,7], k = 3\nOutput: [3,3,5,5,6,7]\n\`\`\``,
    javaCode: `class Solution {\n    public int[] maxSlidingWindow(int[] nums, int k) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[3,3,5,5,6,7]" }
    ],
    testCases: [
      { input: "[1,3,-1,-3,5,3,6,7]\n3", expectedOutput: "[3,3,5,5,6,7]", isHidden: false }
    ]
  },
  "Reverse Linked List": {
    description: `### Reverse Linked List\n\nGiven the \`head\` of a singly linked list, reverse the list, and return the reversed list.\n\n#### Example 1:\n\`\`\`text\nInput: head = [1,2,3,4,5]\nOutput: [5,4,3,2,1]\n\`\`\``,
    javaCode: `/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode(int val) { this.val = val; }\n * }\n */\nclass Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "head = [1,2,3,4,5]", output: "[5,4,3,2,1]" }
    ],
    testCases: [
      { input: "[1,2,3,4,5]", expectedOutput: "[5,4,3,2,1]", isHidden: false }
    ]
  },
  "Merge Two Sorted Lists": {
    description: `### Merge Two Sorted Lists\n\nYou are given the heads of two sorted linked lists \`list1\` and \`list2\`. Merge the two lists into one sorted list.\n\n#### Example 1:\n\`\`\`text\nInput: list1 = [1,2,4], list2 = [1,3,4]\nOutput: [1,1,2,3,4,4]\n\`\`\``,
    javaCode: `class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", output: "[1,1,2,3,4,4]" }
    ],
    testCases: [
      { input: "[1,2,4]\n[1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false }
    ]
  },
  "Linked List Cycle": {
    description: `### Linked List Cycle\n\nGiven \`head\`, the head of a linked list, determine if the linked list has a cycle in it.\n\n#### Example 1:\n\`\`\`text\nInput: head = [3,2,0,-4], pos = 1\nOutput: true\n\`\`\``,
    javaCode: `class Solution {\n    public boolean hasCycle(ListNode head) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: "head = [3,2,0,-4]", output: "true" }
    ],
    testCases: [
      { input: "[3,2,0,-4]", expectedOutput: "true", isHidden: false }
    ]
  },
  "Reorder List": {
    description: `### Reorder List\n\nYou are given the head of a singly linked-list. Reorder the list to be on the form: L0 → Ln → L1 → Ln-1 → L2 → Ln-2 ...\n\n#### Example 1:\n\`\`\`text\nInput: head = [1,2,3,4]\nOutput: [1,4,2,3]\n\`\`\``,
    javaCode: `class Solution {\n    public void reorderList(ListNode head) {\n        // Write your solution here\n    }\n}`,
    examples: [
      { input: "head = [1,2,3,4]", output: "[1,4,2,3]" }
    ],
    testCases: [
      { input: "[1,2,3,4]", expectedOutput: "[1,4,2,3]", isHidden: false }
    ]
  },
  "Remove Nth Node From End of List": {
    description: `### Remove Nth Node From End of List\n\nGiven the \`head\` of a linked list, remove the \`n\`-th node from the end of the list and return its head.\n\n#### Example 1:\n\`\`\`text\nInput: head = [1,2,3,4,5], n = 2\nOutput: [1,2,3,5]\n\`\`\``,
    javaCode: `class Solution {\n    public ListNode removeNthFromEnd(ListNode head, int n) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "head = [1,2,3,4,5], n = 2", output: "[1,2,3,5]" }
    ],
    testCases: [
      { input: "[1,2,3,4,5]\n2", expectedOutput: "[1,2,3,5]", isHidden: false }
    ]
  },
  "Copy List With Random Pointer": {
    description: `### Copy List with Random Pointer\n\nA linked list of length \`n\` is given such that each node contains an additional random pointer, which could point to any node in the list, or \`null\`.\n\nConstruct a deep copy of the list.`,
    javaCode: `class Solution {\n    public Node copyRandomList(Node head) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "head = [[7,null],[13,0],[11,4],[10,2],[1,0]]", output: "[[7,null],[13,0],[11,4],[10,2],[1,0]]" }
    ],
    testCases: [
      { input: "[[7,null],[13,0],[11,4],[10,2],[1,0]]", expectedOutput: "[[7,null],[13,0],[11,4],[10,2],[1,0]]", isHidden: false }
    ]
  },
  "Add Two Numbers": {
    description: `### Add Two Numbers\n\nYou are given two **non-empty** linked lists representing two non-negative integers. The digits are stored in **reverse order**, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.\n\n#### Example 1:\n\`\`\`text\nInput: l1 = [2,4,3], l2 = [5,6,4]\nOutput: [7,0,8]\nExplanation: 342 + 465 = 807.\n\`\`\``,
    javaCode: `class Solution {\n    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "l1 = [2,4,3], l2 = [5,6,4]", output: "[7,0,8]" }
    ],
    testCases: [
      { input: "[2,4,3]\n[5,6,4]", expectedOutput: "[7,0,8]", isHidden: false }
    ]
  },
  "Find The Duplicate Number": {
    description: `### Find the Duplicate Number\n\nGiven an array of integers \`nums\` containing \`n + 1\` integers where each integer is in the range \`[1, n]\` inclusive.\n\nThere is only **one repeated number** in \`nums\`, return this repeated number.\n\nYou must solve the problem **without** modifying the array \`nums\` and uses only constant extra space.\n\n#### Example 1:\n\`\`\`text\nInput: nums = [1,3,4,2,2]\nOutput: 2\n\`\`\``,
    javaCode: `class Solution {\n    public int findDuplicate(int[] nums) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "nums = [1,3,4,2,2]", output: "2" }
    ],
    testCases: [
      { input: "[1,3,4,2,2]", expectedOutput: "2", isHidden: false }
    ]
  },
  "LRU Cache": {
    description: `### LRU Cache\n\nDesign a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.\n\nImplement the \`LRUCache\` class:\n- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.\n- \`int get(int key)\` Return value of key if exists, otherwise return -1.\n- \`void put(int key, int value)\` Update value of key if exists. Otherwise add key-value pair.`,
    javaCode: `import java.util.*;\n\nclass LRUCache {\n    public LRUCache(int capacity) {\n        \n    }\n    \n    public int get(int key) {\n        return -1;\n    }\n    \n    public void put(int key, int value) {\n        \n    }\n}`,
    examples: [
      { input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]', output: '[null, null, null, 1, null, -1, null, -1, 3, 4]' }
    ],
    testCases: [
      { input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]', expectedOutput: '[null, null, null, 1, null, -1, null, -1, 3, 4]', isHidden: false }
    ]
  },
  "Merge K Sorted Lists": {
    description: `### Merge k Sorted Lists\n\nYou are given an array of \`k\` linked-lists \`lists\`, each linked-list is sorted in ascending order.\n\nMerge all the linked-lists into one sorted linked-list and return it.\n\n#### Example 1:\n\`\`\`text\nInput: lists = [[1,4,5],[1,3,4],[2,6]]\nOutput: [1,1,2,3,4,4,5,6]\n\`\`\``,
    javaCode: `class Solution {\n    public ListNode mergeKLists(ListNode[] lists) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" }
    ],
    testCases: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: false }
    ]
  },
  "Reverse Nodes In K Group": {
    description: `### Reverse Nodes in k-Group\n\nGiven the \`head\` of a linked list, reverse the nodes of the list \`k\` at a time, and return the modified list.\n\n#### Example 1:\n\`\`\`text\nInput: head = [1,2,3,4,5], k = 2\nOutput: [2,1,4,3,5]\n\`\`\``,
    javaCode: `class Solution {\n    public ListNode reverseKGroup(ListNode head, int k) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "head = [1,2,3,4,5], k = 2", output: "[2,1,4,3,5]" }
    ],
    testCases: [
      { input: "[1,2,3,4,5]\n2", expectedOutput: "[2,1,4,3,5]", isHidden: false }
    ]
  },
  "Invert Binary Tree": {
    description: `### Invert Binary Tree\n\nGiven the \`root\` of a binary tree, invert the tree, and return its root.\n\n#### Example 1:\n\`\`\`text\nInput: root = [4,2,7,1,3,6,9]\nOutput: [4,7,2,9,6,3,1]\n\`\`\``,
    javaCode: `/**\n * Definition for a binary tree node.\n * public class TreeNode {\n *     int val;\n *     TreeNode left;\n *     TreeNode right;\n *     TreeNode(int val) { this.val = val; }\n * }\n */\nclass Solution {\n    public TreeNode invertTree(TreeNode root) {\n        // Write your solution here\n        return null;\n    }\n}`,
    examples: [
      { input: "root = [4,2,7,1,3,6,9]", output: "[4,7,2,9,6,3,1]" }
    ],
    testCases: [
      { input: "[4,2,7,1,3,6,9]", expectedOutput: "[4,7,2,9,6,3,1]", isHidden: false }
    ]
  },
  "Maximum Depth of Binary Tree": {
    description: `### Maximum Depth of Binary Tree\n\nGiven the \`root\` of a binary tree, return its maximum depth.\n\nA binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.\n\n#### Example 1:\n\`\`\`text\nInput: root = [3,9,20,null,null,15,7]\nOutput: 3\n\`\`\``,
    javaCode: `class Solution {\n    public int maxDepth(TreeNode root) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "3" }
    ],
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expectedOutput: "3", isHidden: false }
    ]
  },
  "Diameter of Binary Tree": {
    description: `### Diameter of Binary Tree\n\nGiven the \`root\` of a binary tree, return the length of the diameter of the tree.\n\nThe diameter of a binary tree is the length of the longest path between any two nodes in a tree. This path may or may not pass through the root.\n\n#### Example 1:\n\`\`\`text\nInput: root = [1,2,3,4,5]\nOutput: 3\n\`\`\``,
    javaCode: `class Solution {\n    public int diameterOfBinaryTree(TreeNode root) {\n        // Write your solution here\n        return 0;\n    }\n}`,
    examples: [
      { input: "root = [1,2,3,4,5]", output: "3" }
    ],
    testCases: [
      { input: "[1,2,3,4,5]", expectedOutput: "3", isHidden: false }
    ]
  },
  "Balanced Binary Tree": {
    description: `### Balanced Binary Tree\n\nGiven a binary tree, determine if it is height-balanced.\n\nA height-balanced binary tree is a binary tree in which the depth of the two subtrees of every node never differs by more than one.\n\n#### Example 1:\n\`\`\`text\nInput: root = [3,9,20,null,null,15,7]\nOutput: true\n\`\`\``,
    javaCode: `class Solution {\n    public boolean isBalanced(TreeNode root) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: "root = [3,9,20,null,null,15,7]", output: "true" }
    ],
    testCases: [
      { input: "[3,9,20,null,null,15,7]", expectedOutput: "true", isHidden: false }
    ]
  },
  "Same Tree": {
    description: `### Same Tree\n\nGiven the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.\n\nTwo binary trees are considered the same if they are structurally identical, and the nodes have the same value.\n\n#### Example 1:\n\`\`\`text\nInput: p = [1,2,3], q = [1,2,3]\nOutput: true\n\`\`\``,
    javaCode: `class Solution {\n    public boolean isSameTree(TreeNode p, TreeNode q) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: "p = [1,2,3], q = [1,2,3]", output: "true" }
    ],
    testCases: [
      { input: "[1,2,3]\n[1,2,3]", expectedOutput: "true", isHidden: false }
    ]
  },
  "Subtree of Another Tree": {
    description: `### Subtree of Another Tree\n\nGiven the roots of two binary trees \`root\` and \`subRoot\`, return \`true\` if there is a subtree of \`root\` with the same structure and node values of \`subRoot\` and \`false\` otherwise.\n\n#### Example 1:\n\`\`\`text\nInput: root = [3,4,5,1,2], subRoot = [4,1,2]\nOutput: true\n\`\`\``,
    javaCode: `class Solution {\n    public boolean isSubtree(TreeNode root, TreeNode subRoot) {\n        // Write your solution here\n        return false;\n    }\n}`,
    examples: [
      { input: "root = [3,4,5,1,2], subRoot = [4,1,2]", output: "true" }
    ],
    testCases: [
      { input: "[3,4,5,1,2]\n[4,1,2]", expectedOutput: "true", isHidden: false }
    ]
  }
};

// Fallback helper for remaining problems
function computeMethodName(title: string): string {
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'solve';
  const first = words[0].toLowerCase();
  const rest = words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  return `${first}${rest}`;
}

function getFallbackJavaSpec(title: string, tags: string[]): JavaProblemSpec {
  const methodName = computeMethodName(title);
  const isBool = title.includes('Valid') || title.includes('Is') || title.includes('Contains') || title.includes('Same') || title.includes('Balanced');
  const isArray = tags.includes('Array') || tags.includes('Sorting') || tags.includes('Two Pointers') || tags.includes('Sliding Window');
  const isString = tags.includes('String') || title.includes('String') || title.includes('Word');

  let param = isArray ? "int[] nums" : isString ? "String s" : "int n";
  let returnType = isBool ? "boolean" : isArray ? "int[]" : "int";
  let defaultReturn = isBool ? "return false;" : isArray ? "return new int[]{};" : "return 0;";

  const description = `### ${title}\n\nGiven the input parameters for **${title}**, implement an optimal solution using **${tags.join(', ')}**.\n\n#### Example 1:\n\`\`\`text\nInput: ${isArray ? "nums = [1,2,3]" : isString ? 's = "codecampus"' : "n = 5"}\nOutput: ${isBool ? "true" : isArray ? "[1,2,3]" : "5"}\n\`\`\`\n\n#### Constraints:\n- \`1 <= input length <= 10^5\``;

  return {
    description,
    javaCode: `class Solution {\n    public ${returnType} ${methodName}(${param}) {\n        // Write your solution here\n        ${defaultReturn}\n    }\n}`,
    examples: [
      { input: isArray ? "nums = [1,2,3]" : isString ? 's = "codecampus"' : "n = 5", output: isBool ? "true" : isArray ? "[1,2,3]" : "5" }
    ],
    testCases: [
      { input: isArray ? "[1,2,3]" : isString ? '"codecampus"' : "5", expectedOutput: isBool ? "true" : isArray ? "[1,2,3]" : "5", isHidden: false }
    ]
  };
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to MongoDB');

  // ── All 150 problems have been removed to make room for SPLE problems ──
  await Problem.deleteMany({});
  console.log('✅ Cleared all existing problems from database.');
  console.log('   Problems section is ready for SPLE challenges.');

  process.exit(0);
}

seed().catch(console.error);
