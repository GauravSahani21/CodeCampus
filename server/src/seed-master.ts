/**
 * Master DB Seed Script
 * Creates: admin, instructor, student users + sample problems + courses
 * Run with: npx ts-node src/seed-master.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.model';
import Problem from './models/Problem.model';
import Course from './models/Course.model';

dotenv.config();

// ─── Users ────────────────────────────────────────────────────────────────────
const USERS = [
  {
    username: 'admin',
    email: 'admin@codecampus.com',
    password: 'Admin@123',
    role: 'admin' as const,
    bio: 'Platform Administrator',
  },
  {
    username: 'instructor',
    email: 'instructor@codecampus.com',
    password: 'Instructor@123',
    role: 'instructor' as const,
    bio: 'SPLE Course Instructor — teaches algorithms, data structures and competitive programming.',
  },
  {
    username: 'student1',
    email: 'student1@codecampus.com',
    password: 'Student@123',
    role: 'user' as const,
    bio: 'Aspiring software engineer learning DSA.',
  },
  {
    username: 'student2',
    email: 'student2@codecampus.com',
    password: 'Student@123',
    role: 'user' as const,
    bio: 'Competitive programmer.',
  },
];

// ─── Problems ─────────────────────────────────────────────────────────────────
const PROBLEMS = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy' as const,
    tags: ['Array', 'Hash Table'],
    description: `### Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

#### Example 1:
\`\`\`text
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 9, return [0, 1].
\`\`\`

#### Example 2:
\`\`\`text
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

#### Constraints:
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- Only one valid answer exists.`,
    inputFormat: 'First line: n (array length)\nSecond line: space-separated integers\nThird line: target',
    outputFormat: 'Two space-separated indices',
    constraints: '2 <= n <= 10^4, -10^9 <= nums[i] <= 10^9',
    starterTemplates: {
      python: `def twoSum(nums, target):
    # Your code here
    pass

import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
result = twoSum(nums, target)
print(*result)`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const nums = lines[1].split(' ').map(Number);
  const target = parseInt(lines[2]);
  function twoSum(nums, target) {
    // Your code here
  }
  console.log(twoSum(nums, target).join(' '));
});`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    // Your code here
    return {};
}
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for(int i=0;i<n;i++) cin >> nums[i];
    int target; cin >> target;
    auto r = twoSum(nums, target);
    cout << r[0] << " " << r[1] << endl;
}`,
      java: `import java.util.*;
public class Main {
    static int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for(int i=0;i<n;i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        int[] r = twoSum(nums, target);
        System.out.println(r[0] + " " + r[1]);
    }
}`,
    },
    exampleTestCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
    ],
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: false },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 49,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'Easy' as const,
    tags: ['Array', 'Hash Table'],
    description: `### Contains Duplicate

Given an integer array \`nums\`, return \`true\` if any value appears **at least twice** in the array, and return \`false\` if every element is distinct.

#### Example 1:
\`\`\`text
Input: nums = [1,2,3,1]
Output: true
\`\`\`

#### Example 2:
\`\`\`text
Input: nums = [1,2,3,4]
Output: false
\`\`\`

#### Constraints:
- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\``,
    inputFormat: 'First line: n\nSecond line: space-separated integers',
    outputFormat: 'true or false',
    constraints: '1 <= n <= 10^5',
    starterTemplates: {
      python: `def containsDuplicate(nums):
    # Your code here
    pass

import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
print(str(containsDuplicate(nums)).lower())`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const nums = lines[1].split(' ').map(Number);
  function containsDuplicate(nums) {
    // Your code here
  }
  console.log(containsDuplicate(nums).toString());
});`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;
bool containsDuplicate(vector<int>& nums) {
    // Your code here
    return false;
}
int main() {
    int n; cin >> n;
    vector<int> nums(n);
    for(int i=0;i<n;i++) cin >> nums[i];
    cout << (containsDuplicate(nums) ? "true" : "false") << endl;
}`,
      java: `import java.util.*;
public class Main {
    static boolean containsDuplicate(int[] nums) {
        // Your code here
        return false;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for(int i=0;i<n;i++) nums[i] = sc.nextInt();
        System.out.println(containsDuplicate(nums));
    }
}`,
    },
    exampleTestCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true', explanation: '1 appears twice' },
      { input: '4\n1 2 3 4', expectedOutput: 'false', explanation: 'all elements distinct' },
    ],
    testCases: [
      { input: '4\n1 2 3 1', expectedOutput: 'true', isHidden: false },
      { input: '4\n1 2 3 4', expectedOutput: 'false', isHidden: false },
      { input: '10\n1 1 1 3 3 4 3 2 4 2', expectedOutput: 'true', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 61,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    difficulty: 'Easy' as const,
    tags: ['Two Pointers', 'String'],
    description: `### Valid Palindrome

A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

#### Example 1:
\`\`\`text
Input: s = "A man, a plan, a canal: Panama"
Output: true
\`\`\`

#### Example 2:
\`\`\`text
Input: s = "race a car"
Output: false
\`\`\`

#### Constraints:
- \`1 <= s.length <= 2 * 10^5\`
- \`s\` consists only of printable ASCII characters.`,
    inputFormat: 'A single string on one line',
    outputFormat: 'true or false',
    constraints: '1 <= s.length <= 2 * 10^5',
    starterTemplates: {
      python: `import sys
s = sys.stdin.readline().rstrip('\\n')
def isPalindrome(s):
    # Your code here
    pass
print(str(isPalindrome(s)).lower())`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let s = '';
rl.on('line', l => s = l);
rl.on('close', () => {
  function isPalindrome(s) {
    // Your code here
  }
  console.log(isPalindrome(s).toString());
});`,
      cpp: `#include <iostream>
#include <string>
using namespace std;
bool isPalindrome(string s) {
    // Your code here
    return false;
}
int main() {
    string s; getline(cin, s);
    cout << (isPalindrome(s) ? "true" : "false") << endl;
}`,
      java: `import java.util.*;
public class Main {
    static boolean isPalindrome(String s) {
        // Your code here
        return false;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(isPalindrome(s));
    }
}`,
    },
    exampleTestCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', explanation: 'After cleaning: amanaplanacanalpanama' },
      { input: 'race a car', expectedOutput: 'false' },
    ],
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isHidden: false },
      { input: 'race a car', expectedOutput: 'false', isHidden: false },
      { input: ' ', expectedOutput: 'true', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 43,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy' as const,
    tags: ['Array', 'Sliding Window', 'Dynamic Programming'],
    description: `### Best Time to Buy and Sell Stock

You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`-th day.

You want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.

Return the *maximum profit* you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

#### Example 1:
\`\`\`text
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price=1), sell on day 5 (price=6), profit = 6-1 = 5.
\`\`\`

#### Example 2:
\`\`\`text
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: No profitable transaction possible.
\`\`\`

#### Constraints:
- \`1 <= prices.length <= 10^5\`
- \`0 <= prices[i] <= 10^4\``,
    inputFormat: 'First line: n\nSecond line: space-separated integers',
    outputFormat: 'Maximum profit as integer',
    constraints: '1 <= n <= 10^5, 0 <= prices[i] <= 10^4',
    starterTemplates: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
prices = list(map(int, data[1:n+1]))
def maxProfit(prices):
    # Your code here
    pass
print(maxProfit(prices))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const prices = lines[1].split(' ').map(Number);
  function maxProfit(prices) {
    // Your code here
  }
  console.log(maxProfit(prices));
});`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int maxProfit(vector<int>& prices) {
    // Your code here
    return 0;
}
int main() {
    int n; cin >> n;
    vector<int> p(n);
    for(int i=0;i<n;i++) cin >> p[i];
    cout << maxProfit(p) << endl;
}`,
      java: `import java.util.*;
public class Main {
    static int maxProfit(int[] prices) {
        // Your code here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] p = new int[n];
        for(int i=0;i<n;i++) p[i] = sc.nextInt();
        System.out.println(maxProfit(p));
    }
}`,
    },
    exampleTestCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5' },
      { input: '5\n7 6 4 3 1', expectedOutput: '0' },
    ],
    testCases: [
      { input: '6\n7 1 5 3 6 4', expectedOutput: '5', isHidden: false },
      { input: '5\n7 6 4 3 1', expectedOutput: '0', isHidden: false },
      { input: '1\n5', expectedOutput: '0', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 54,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium' as const,
    tags: ['Array', 'Dynamic Programming', 'Greedy'],
    description: `### Maximum Subarray

Given an integer array \`nums\`, find the **subarray** with the largest sum and return its sum.

#### Example 1:
\`\`\`text
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

#### Example 2:
\`\`\`text
Input: nums = [1]
Output: 1
\`\`\`

#### Constraints:
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\``,
    inputFormat: 'First line: n\nSecond line: space-separated integers (can be negative)',
    outputFormat: 'Maximum subarray sum',
    constraints: '1 <= n <= 10^5, -10^4 <= nums[i] <= 10^4',
    starterTemplates: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
def maxSubArray(nums):
    # Your code here
    pass
print(maxSubArray(nums))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const nums = lines[1].split(' ').map(Number);
  function maxSubArray(nums) {
    // Your code here
  }
  console.log(maxSubArray(nums));
});`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int maxSubArray(vector<int>& nums) {
    // Your code here
    return 0;
}
int main() {
    int n; cin >> n;
    vector<int> v(n);
    for(int i=0;i<n;i++) cin >> v[i];
    cout << maxSubArray(v) << endl;
}`,
      java: `import java.util.*;
public class Main {
    static int maxSubArray(int[] nums) {
        // Your code here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] v = new int[n];
        for(int i=0;i<n;i++) v[i] = sc.nextInt();
        System.out.println(maxSubArray(v));
    }
}`,
    },
    exampleTestCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', explanation: 'Subarray [4,-1,2,1] sums to 6' },
      { input: '1\n1', expectedOutput: '1' },
    ],
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
      { input: '1\n1', expectedOutput: '1', isHidden: false },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 50,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy' as const,
    tags: ['Dynamic Programming', 'Math'],
    description: `### Climbing Stairs

You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb **1** or **2** steps. In how many distinct ways can you climb to the top?

#### Example 1:
\`\`\`text
Input: n = 2
Output: 2
Explanation: 1+1, 2
\`\`\`

#### Example 2:
\`\`\`text
Input: n = 3
Output: 3
Explanation: 1+1+1, 1+2, 2+1
\`\`\`

#### Constraints:
- \`1 <= n <= 45\``,
    inputFormat: 'A single integer n',
    outputFormat: 'Number of distinct ways',
    constraints: '1 <= n <= 45',
    starterTemplates: {
      python: `import sys
n = int(sys.stdin.read().strip())
def climbStairs(n):
    # Your code here
    pass
print(climbStairs(n))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
rl.on('line', l => {
  const n = parseInt(l.trim());
  function climbStairs(n) {
    // Your code here
  }
  console.log(climbStairs(n));
  rl.close();
});`,
      cpp: `#include <iostream>
using namespace std;
int climbStairs(int n) {
    // Your code here
    return 0;
}
int main() {
    int n; cin >> n;
    cout << climbStairs(n) << endl;
}`,
      java: `import java.util.*;
public class Main {
    static int climbStairs(int n) {
        // Your code here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.println(climbStairs(sc.nextInt()));
    }
}`,
    },
    exampleTestCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
    ],
    testCases: [
      { input: '2', expectedOutput: '2', isHidden: false },
      { input: '3', expectedOutput: '3', isHidden: false },
      { input: '10', expectedOutput: '89', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 51,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy' as const,
    tags: ['Binary Search', 'Array'],
    description: `### Binary Search

Given an array of integers \`nums\` which is **sorted in ascending order**, and an integer \`target\`, write a function to search for \`target\` in \`nums\`. If \`target\` exists return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.

#### Example 1:
\`\`\`text
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
\`\`\`

#### Example 2:
\`\`\`text
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
\`\`\`

#### Constraints:
- \`1 <= nums.length <= 10^4\`
- All integers in \`nums\` are unique.
- \`nums\` is sorted in ascending order.`,
    inputFormat: 'First line: n\nSecond line: space-separated sorted integers\nThird line: target',
    outputFormat: 'Index of target or -1',
    constraints: '1 <= n <= 10^4',
    starterTemplates: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
def search(nums, target):
    # Your code here
    pass
print(search(nums, target))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const nums = lines[1].split(' ').map(Number);
  const target = parseInt(lines[2]);
  function search(nums, target) {
    // Your code here
  }
  console.log(search(nums, target));
});`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int search(vector<int>& nums, int target) {
    // Your code here
    return -1;
}
int main() {
    int n; cin >> n;
    vector<int> v(n);
    for(int i=0;i<n;i++) cin >> v[i];
    int t; cin >> t;
    cout << search(v, t) << endl;
}`,
      java: `import java.util.*;
public class Main {
    static int search(int[] nums, int target) {
        // Your code here
        return -1;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] v = new int[n];
        for(int i=0;i<n;i++) v[i] = sc.nextInt();
        System.out.println(search(v, sc.nextInt()));
    }
}`,
    },
    exampleTestCases: [
      { input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4' },
      { input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1' },
    ],
    testCases: [
      { input: '6\n-1 0 3 5 9 12\n9', expectedOutput: '4', isHidden: false },
      { input: '6\n-1 0 3 5 9 12\n2', expectedOutput: '-1', isHidden: false },
      { input: '1\n5\n5', expectedOutput: '0', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 57,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium' as const,
    tags: ['Graph', 'BFS', 'DFS', 'Array'],
    description: `### Number of Islands

Given an \`m x n\` 2D binary grid which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return the *number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.

#### Example 1:
\`\`\`text
Input:
11110
11010
11000
00000
Output: 1
\`\`\`

#### Example 2:
\`\`\`text
Input:
11000
11000
00100
00011
Output: 3
\`\`\`

#### Constraints:
- \`m, n >= 1\`
- \`grid[i][j]\` is \`'0'\` or \`'1'\``,
    inputFormat: 'First line: m n\nNext m lines: each row as a string of 0s and 1s',
    outputFormat: 'Number of islands',
    constraints: '1 <= m, n <= 300',
    starterTemplates: {
      python: `import sys
lines = sys.stdin.read().split('\\n')
m, n = map(int, lines[0].split())
grid = [list(lines[i+1]) for i in range(m)]
def numIslands(grid):
    # Your code here
    pass
print(numIslands(grid))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const [m, n] = lines[0].split(' ').map(Number);
  const grid = lines.slice(1, m+1).map(r => r.split(''));
  function numIslands(grid) {
    // Your code here
  }
  console.log(numIslands(grid));
});`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int numIslands(vector<vector<char>>& grid) {
    // Your code here
    return 0;
}
int main() {
    int m, n; cin >> m >> n;
    vector<vector<char>> g(m, vector<char>(n));
    for(int i=0;i<m;i++) { string row; cin >> row; for(int j=0;j<n;j++) g[i][j]=row[j]; }
    cout << numIslands(g) << endl;
}`,
      java: `import java.util.*;
public class Main {
    static int numIslands(char[][] grid) {
        // Your code here
        return 0;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int m = sc.nextInt(), n = sc.nextInt();
        char[][] g = new char[m][n];
        for(int i=0;i<m;i++) { String row = sc.next(); for(int j=0;j<n;j++) g[i][j]=row.charAt(j); }
        System.out.println(numIslands(g));
    }
}`,
    },
    exampleTestCases: [
      { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1' },
      { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3' },
    ],
    testCases: [
      { input: '4 5\n11110\n11010\n11000\n00000', expectedOutput: '1', isHidden: false },
      { input: '4 5\n11000\n11000\n00100\n00011', expectedOutput: '3', isHidden: false },
      { input: '1 1\n1', expectedOutput: '1', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 56,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium' as const,
    tags: ['Dynamic Programming', 'Array', 'Greedy'],
    description: `### Coin Change

You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the **fewest number of coins** that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

#### Example 1:
\`\`\`text
Input: coins = [1,5,11,15,20,25], amount = 36
Output: 3
Explanation: 11 + 25 = 36 needs 2 coins, or 1+10+25... Use 11+25=36 → 2, or 1+10+25 → not available. Best: 11+25=36 uses 2 coins → wait... 11+25=36? 11+25=36. Yes! Output: 2
\`\`\`

Actually simpler:
\`\`\`text
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1
\`\`\`

#### Constraints:
- \`1 <= coins.length <= 12\`
- \`1 <= coins[i] <= 2^31 - 1\`
- \`0 <= amount <= 10^4\``,
    inputFormat: 'First line: n\nSecond line: space-separated coin denominations\nThird line: amount',
    outputFormat: 'Minimum coins or -1',
    constraints: '1 <= n <= 12, 0 <= amount <= 10^4',
    starterTemplates: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
coins = list(map(int, data[1:n+1]))
amount = int(data[n+1])
def coinChange(coins, amount):
    # Your code here
    pass
print(coinChange(coins, amount))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const coins = lines[1].split(' ').map(Number);
  const amount = parseInt(lines[2]);
  function coinChange(coins, amount) {
    // Your code here
  }
  console.log(coinChange(coins, amount));
});`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
int coinChange(vector<int>& coins, int amount) {
    // Your code here
    return -1;
}
int main() {
    int n; cin >> n;
    vector<int> c(n);
    for(int i=0;i<n;i++) cin >> c[i];
    int a; cin >> a;
    cout << coinChange(c, a) << endl;
}`,
      java: `import java.util.*;
public class Main {
    static int coinChange(int[] coins, int amount) {
        // Your code here
        return -1;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] c = new int[n];
        for(int i=0;i<n;i++) c[i] = sc.nextInt();
        System.out.println(coinChange(c, sc.nextInt()));
    }
}`,
    },
    exampleTestCases: [
      { input: '3\n1 2 5\n11', expectedOutput: '3', explanation: '5+5+1 = 11 uses 3 coins' },
      { input: '1\n2\n3', expectedOutput: '-1', explanation: 'Cannot make amount 3 with only coin of 2' },
    ],
    testCases: [
      { input: '3\n1 2 5\n11', expectedOutput: '3', isHidden: false },
      { input: '1\n2\n3', expectedOutput: '-1', isHidden: false },
      { input: '1\n1\n0', expectedOutput: '0', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 42,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
  {
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: 'Easy' as const,
    tags: ['Linked List', 'Recursion'],
    description: `### Reverse Linked List

Given the \`head\` of a singly linked list, reverse the list, and return the *reversed list*.

#### Example 1:
\`\`\`text
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

#### Example 2:
\`\`\`text
Input: head = [1,2]
Output: [2,1]
\`\`\`

#### Constraints:
- The number of nodes in the list is in the range \`[0, 5000]\`.
- \`-5000 <= Node.val <= 5000\``,
    inputFormat: 'First line: n\nSecond line: space-separated node values',
    outputFormat: 'Space-separated values of reversed list',
    constraints: '0 <= n <= 5000',
    starterTemplates: {
      python: `import sys
data = sys.stdin.read().split()
n = int(data[0])
vals = list(map(int, data[1:n+1])) if n > 0 else []

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def build(vals):
    if not vals: return None
    head = ListNode(vals[0])
    cur = head
    for v in vals[1:]: cur.next = ListNode(v); cur = cur.next
    return head

def reverseList(head):
    # Your code here
    pass

result = reverseList(build(vals))
out = []
while result: out.append(str(result.val)); result = result.next
print(' '.join(out))`,
      javascript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
  const n = parseInt(lines[0]);
  const vals = n > 0 ? lines[1].split(' ').map(Number) : [];
  // Build list, reverse, print
  class ListNode { constructor(val=0,next=null){this.val=val;this.next=next;} }
  let head = null, cur = null;
  for(const v of vals) { const node=new ListNode(v); if(!head) head=node; else cur.next=node; cur=node; }
  function reverseList(head) { /* Your code here */ }
  let r = reverseList(head), out = [];
  while(r) { out.push(r.val); r = r.next; }
  console.log(out.join(' '));
});`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;
struct ListNode { int val; ListNode* next; ListNode(int v):val(v),next(nullptr){} };
ListNode* reverseList(ListNode* head) {
    // Your code here
    return nullptr;
}
int main() {
    int n; cin >> n;
    ListNode* head=nullptr; ListNode* cur=nullptr;
    for(int i=0;i<n;i++){ int v; cin>>v; auto* node=new ListNode(v); if(!head) head=node; else cur->next=node; cur=node; }
    auto* r=reverseList(head);
    while(r){ cout<<r->val; if(r->next) cout<<" "; r=r->next; }
    cout<<endl;
}`,
      java: `import java.util.*;
public class Main {
    static class ListNode { int val; ListNode next; ListNode(int v){val=v;} }
    static ListNode reverseList(ListNode head) {
        // Your code here
        return null;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        ListNode head=null, cur=null;
        for(int i=0;i<n;i++){ ListNode node=new ListNode(sc.nextInt()); if(head==null) head=node; else cur.next=node; cur=node; }
        ListNode r=reverseList(head);
        StringBuilder sb=new StringBuilder();
        while(r!=null){ sb.append(r.val); if(r.next!=null) sb.append(" "); r=r.next; }
        System.out.println(sb);
    }
}`,
    },
    exampleTestCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1' },
      { input: '2\n1 2', expectedOutput: '2 1' },
    ],
    testCases: [
      { input: '5\n1 2 3 4 5', expectedOutput: '5 4 3 2 1', isHidden: false },
      { input: '2\n1 2', expectedOutput: '2 1', isHidden: false },
      { input: '0\n', expectedOutput: '', isHidden: true },
    ],
    isPublished: true,
    acceptanceRate: 73,
    totalSubmissions: 0,
    successfulSubmissions: 0,
  },
];

// ─── Courses ───────────────────────────────────────────────────────────────────
const COURSES = [
  {
    title: 'Data Structures Mastery',
    slug: 'data-structures-mastery',
    description: 'Master fundamental data structures — arrays, linked lists, stacks, queues, trees, graphs, and hash tables — with hands-on coding problems and visual explanations.',
    difficulty: 'Intermediate' as const,
    tags: ['Array', 'Linked List', 'Tree', 'Graph', 'Hash Table', 'Stack', 'Queue'],
    isPublished: true,
    lessons: [
      {
        title: 'Arrays & Dynamic Arrays',
        order: 1,
        duration: 15,
        codeLanguage: 'python',
        content: `## Arrays

Arrays are the most fundamental data structure. An array stores elements in **contiguous memory locations**, allowing **O(1)** random access.

### Key Operations
| Operation | Time Complexity |
|-----------|----------------|
| Access    | O(1)           |
| Search    | O(n)           |
| Insert (end) | O(1) amortized |
| Insert (middle) | O(n)    |
| Delete    | O(n)           |

### Python Example
\`\`\`python
# Dynamic array operations
nums = [1, 2, 3, 4, 5]

# Access: O(1)
print(nums[2])  # 3

# Append: O(1) amortized
nums.append(6)

# Two-pointer technique: O(n)
def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        complement = target - n
        if complement in seen:
            return [seen[complement], i]
        seen[n] = i
\`\`\`

### When to Use Arrays
- When you need **O(1) random access** by index
- When the size is approximately known
- For **cache-friendly** sequential access patterns`,
        codeTemplate: `# Practice: Two Sum using hash map
def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        # Your code here
        pass

print(twoSum([2,7,11,15], 9))  # Expected: [0, 1]`,
      },
      {
        title: 'Linked Lists',
        order: 2,
        duration: 20,
        codeLanguage: 'python',
        content: `## Linked Lists

A linked list is a linear data structure where each element (node) contains a value and a reference (pointer) to the next node.

### Types
- **Singly Linked List**: each node points to the next
- **Doubly Linked List**: each node points to both next and previous
- **Circular**: last node points back to head

### Key Operations
| Operation | Time Complexity |
|-----------|----------------|
| Access    | O(n)           |
| Search    | O(n)           |
| Insert (head) | O(1)      |
| Insert (tail) | O(1) with tail pointer |
| Delete    | O(n)           |

### Implementation
\`\`\`python
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head):
    prev, curr = None, head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev
\`\`\``,
        codeTemplate: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head):
    # Reverse the linked list iteratively
    # Your code here
    pass

# Build test list: 1 -> 2 -> 3 -> 4 -> 5
nodes = [ListNode(i) for i in range(1, 6)]
for i in range(4): nodes[i].next = nodes[i+1]
head = nodes[0]
rev = reverseList(head)
while rev: print(rev.val, end=' '); rev = rev.next`,
      },
    ],
  },
  {
    title: 'Algorithm Design & Analysis',
    slug: 'algorithm-design-analysis',
    description: 'Learn core algorithm paradigms — Divide & Conquer, Dynamic Programming, Greedy algorithms, Backtracking — with rigorous complexity analysis and real coding problems.',
    difficulty: 'Advanced' as const,
    tags: ['Dynamic Programming', 'Greedy', 'Backtracking', 'Divide and Conquer', 'Sorting', 'Recursion'],
    isPublished: true,
    lessons: [
      {
        title: 'Dynamic Programming Fundamentals',
        order: 1,
        duration: 25,
        codeLanguage: 'python',
        content: `## Dynamic Programming

Dynamic Programming (DP) is an optimization technique that solves problems by **breaking them into overlapping subproblems** and storing solutions to avoid redundant computation.

### Two Key Properties
1. **Optimal Substructure**: An optimal solution contains optimal solutions to subproblems
2. **Overlapping Subproblems**: The same subproblems are solved multiple times

### Approaches
- **Top-Down (Memoization)**: Recursive + cache
- **Bottom-Up (Tabulation)**: Iterative, build up from base cases

### Classic Example: Fibonacci
\`\`\`python
# Naive: O(2^n)
def fib_naive(n):
    if n <= 1: return n
    return fib_naive(n-1) + fib_naive(n-2)

# Memoized: O(n)
def fib_memo(n, memo={}):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] = fib_memo(n-1, memo) + fib_memo(n-2, memo)
    return memo[n]

# Tabulated: O(n) time, O(1) space
def fib_dp(n):
    if n <= 1: return n
    a, b = 0, 1
    for _ in range(2, n+1):
        a, b = b, a + b
    return b
\`\`\`

### Climbing Stairs — DP Pattern
\`\`\`python
def climbStairs(n):
    if n <= 2: return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]
\`\`\``,
        codeTemplate: `def coinChange(coins, amount):
    """
    Find minimum coins to make 'amount'.
    Use bottom-up DP: dp[i] = min coins to make amount i
    """
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    
    for i in range(1, amount + 1):
        for coin in coins:
            # Your code here: update dp[i]
            pass
    
    return dp[amount] if dp[amount] != float('inf') else -1

print(coinChange([1, 2, 5], 11))  # Expected: 3`,
      },
    ],
  },
  {
    title: 'Graph Theory & Algorithms',
    slug: 'graph-theory-algorithms',
    description: 'Deep dive into graph representations, traversals (BFS/DFS), shortest paths (Dijkstra, Bellman-Ford), MST, and topological sort — the backbone of network and optimization problems.',
    difficulty: 'Advanced' as const,
    tags: ['Graph', 'BFS', 'DFS', 'Dijkstra', 'Topological Sort', 'MST'],
    isPublished: true,
    lessons: [
      {
        title: 'Graph Representations & BFS',
        order: 1,
        duration: 20,
        codeLanguage: 'python',
        content: `## Graph Representations

Graphs model relationships between objects. Represented as G = (V, E).

### Adjacency List (Preferred)
\`\`\`python
from collections import defaultdict, deque

graph = defaultdict(list)
graph[0] = [1, 2]
graph[1] = [0, 3]
graph[2] = [0, 3]
graph[3] = [1, 2]
\`\`\`

### BFS (Breadth-First Search)
- Explores **level by level**
- Uses a **queue**
- Time: O(V + E)

\`\`\`python
def bfs(graph, start):
    visited = set([start])
    queue = deque([start])
    order = []
    
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    
    return order
\`\`\`

### Number of Islands — BFS
\`\`\`python
def numIslands(grid):
    if not grid: return 0
    count = 0
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j] == '1':
                count += 1
                # BFS to sink the island
                q = deque([(i, j)])
                grid[i][j] = '0'
                while q:
                    r, c = q.popleft()
                    for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
                        nr, nc = r+dr, c+dc
                        if 0<=nr<len(grid) and 0<=nc<len(grid[0]) and grid[nr][nc]=='1':
                            q.append((nr, nc))
                            grid[nr][nc] = '0'
    return count
\`\`\``,
        codeTemplate: `from collections import deque

def numIslands(grid):
    # Count connected components of '1's using BFS
    if not grid: return 0
    count = 0
    
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j] == '1':
                count += 1
                # TODO: BFS to mark all connected '1's as visited ('0')
    
    return count

grid = [
    ['1','1','1','1','0'],
    ['1','1','0','1','0'],
    ['1','1','0','0','0'],
    ['0','0','0','0','0']
]
print(numIslands(grid))  # Expected: 1`,
      },
    ],
  },
  {
    title: 'Python for Beginners',
    slug: 'python-for-beginners',
    description: 'Start your programming journey with Python — variables, control flow, functions, data structures, and problem-solving fundamentals. No prior experience needed.',
    difficulty: 'Beginner' as const,
    tags: ['Python', 'Language', 'Basics', 'Array'],
    isPublished: true,
    lessons: [
      {
        title: 'Variables & Data Types',
        order: 1,
        duration: 10,
        codeLanguage: 'python',
        content: `## Variables & Data Types in Python

Python is a **dynamically typed** language — you don't need to declare types explicitly.

\`\`\`python
name = "Alice"
age = 25
pi = 3.14159
is_active = True

# List (mutable)
nums = [1, 2, 3, 4, 5]

# Dictionary (hash map)
person = {"name": "Alice", "age": 25}
\`\`\`

### Type Checking
\`\`\`python
print(type(name))    # <class 'str'>
print(type(age))     # <class 'int'>
print(type(nums))    # <class 'list'>
\`\`\`

### String Operations
\`\`\`python
s = "hello world"
print(s.upper())     # HELLO WORLD
print(s.split())     # ['hello', 'world']
print(s[:5])         # hello
\`\`\``,
        codeTemplate: `# Try it yourself!
name = "CodeCampus"
age = 1

print(f"Welcome to {name}!")
print(f"Version: {age}")

# Create a list and iterate
topics = ["Arrays", "Linked Lists", "Trees"]
for topic in topics:
    print(f"- {topic}")`,
      },
    ],
  },
  {
    title: 'Competitive Programming Bootcamp',
    slug: 'competitive-programming-bootcamp',
    description: 'Train for coding contests with timed problem-solving, advanced techniques, and contest strategies. Covers sliding window, two pointers, segment trees, and more.',
    difficulty: 'Advanced' as const,
    tags: ['Array', 'Two Pointers', 'Sliding Window', 'Binary Search', 'Sorting'],
    isPublished: true,
    lessons: [
      {
        title: 'Sliding Window Technique',
        order: 1,
        duration: 20,
        codeLanguage: 'python',
        content: `## Sliding Window

The sliding window technique reduces nested loops to a single pass — **O(n²) → O(n)**.

### Fixed-Size Window
\`\`\`python
def maxSumSubarray(nums, k):
    window_sum = sum(nums[:k])
    max_sum = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i-k]
        max_sum = max(max_sum, window_sum)
    return max_sum
\`\`\`

### Variable-Size Window
\`\`\`python
def maxProfit(prices):
    left, right = 0, 1
    max_profit = 0
    while right < len(prices):
        if prices[right] > prices[left]:
            max_profit = max(max_profit, prices[right] - prices[left])
        else:
            left = right
        right += 1
    return max_profit
\`\`\``,
        codeTemplate: `def maxProfit(prices):
    """
    Use two pointers (sliding window) to find max profit.
    left = buy day, right = sell day
    """
    left, right = 0, 1
    max_profit = 0
    while right < len(prices):
        # Your logic here
        right += 1
    return max_profit

print(maxProfit([7,1,5,3,6,4]))  # Expected: 5
print(maxProfit([7,6,4,3,1]))    # Expected: 0`,
      },
    ],
  },
];

// ─── Main Seed Function ────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🚀 CodeCampus Master Seed');
  console.log('========================');

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set in .env');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log('👤 Seeding users...');
  await User.deleteMany({});

  for (const u of USERS) {
    await User.create({
      username: u.username,
      email: u.email,
      // Pass plain text — pre('save') hook in User.model.ts hashes it
      passwordHash: u.password,
      role: u.role,
      bio: u.bio,
      joinedAt: new Date(),
      stats: { solved: 0, attempted: 0, streak: 0 },
      activityLog: [],
      solvedProblems: [],
      badges: [],
    });
    console.log(`   ✓ ${u.role.padEnd(12)} ${u.email}  (password: ${u.password})`);
  }

  // ── 2. Problems ───────────────────────────────────────────────────────────
  console.log('\n📝 Seeding problems...');
  await Problem.deleteMany({});

  for (const p of PROBLEMS) {
    await Problem.create(p);
    console.log(`   ✓ [${p.difficulty.padEnd(6)}] ${p.title}`);
  }

  // ── 3. Courses ────────────────────────────────────────────────────────────
  console.log('\n📚 Seeding courses...');
  await Course.deleteMany({});

  for (const c of COURSES) {
    await Course.create(c);
    console.log(`   ✓ [${c.difficulty.padEnd(12)}] ${c.title} (${c.lessons.length} lessons)`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════');
  console.log('✅ Database seeded successfully!\n');
  console.log('📋 Login Credentials:');
  console.log('   Admin:      admin@codecampus.com       / Admin@123');
  console.log('   Instructor: instructor@codecampus.com  / Instructor@123');
  console.log('   Student 1:  student1@codecampus.com    / Student@123');
  console.log('   Student 2:  student2@codecampus.com    / Student@123');
  console.log('\n📊 Seeded:');
  console.log(`   ${USERS.length} users`);
  console.log(`   ${PROBLEMS.length} problems`);
  console.log(`   ${COURSES.length} courses`);
  console.log('════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
