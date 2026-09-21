export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type ProgrammingLanguage =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'cpp'
  | 'java'
  | 'c'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'sql';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  explanation?: string;
}

export interface CodingProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  tags: string[];
  companyTags: string[];
  acceptanceRate: string;
  description: string;
  constraints: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  starterCode: Record<ProgrammingLanguage, string>;
  testCases: TestCase[];
  hints: string[];
  editorial: {
    approach: string;
    timeComplexity: string;
    spaceComplexity: string;
    codeSnippet: string;
  };
}

export const CODING_PROBLEMS: CodingProblem[] = [
  {
    id: 'p-1',
    slug: 'two-sum',
    title: '1. Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hash Table',
    tags: ['Array', 'Hash Table'],
    companyTags: ['Amazon', 'Google', 'Meta', 'Microsoft', 'TCS NQT'],
    acceptanceRate: '52.4%',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the same element twice.

You can return the answer in any order.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
      },
    ],
    starterCode: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your code here
        pass
`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
    
}
`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    // Write your code here
    return [];
}
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        return {};
    }
};
`,
      java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}
`,
      c: `/**
 * Note: The returned array must be malloced, assume caller calls free().
 */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Write your code here
    *returnSize = 2;
    return 0;
}
`,
      csharp: `using System.Collections.Generic;

public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}
`,
      go: `func twoSum(nums []int, target int) []int {
    // Write your code here
    return []int{}
}
`,
      rust: `impl Solution {
    pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
        // Write your code here
        vec![]
    }
}
`,
      sql: `-- Select pair of indices matching target
SELECT a.id AS idx1, b.id AS idx2
FROM numbers a
JOIN numbers b ON a.id < b.id
WHERE a.val + b.val = :target;
`,
    },
    testCases: [
      { id: 'tc-1', input: 'nums = [2,7,11,15], target = 9', expectedOutput: '[0,1]' },
      { id: 'tc-2', input: 'nums = [3,2,4], target = 6', expectedOutput: '[1,2]' },
      { id: 'tc-3', input: 'nums = [3,3], target = 6', expectedOutput: '[0,1]' },
      { id: 'tc-4', input: 'nums = [1,5,8,12,19,25], target = 37', expectedOutput: '[3,5]', isHidden: true },
    ],
    hints: [
      'A brute force approach checks all pairs in O(N^2) time. Can we do better with auxiliary space?',
      'As you iterate through the array, what number are you looking for to complete the sum? (complement = target - num)',
      'Use a Hash Map to store previously seen elements and their index for O(1) lookups.',
    ],
    editorial: {
      approach: 'One-Pass Hash Table',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
      codeSnippet: `def twoSum(nums, target):
    prevMap = {} # val -> index
    for i, n in enumerate(nums):
        diff = target - n
        if diff in prevMap:
            return [prevMap[diff], i]
        prevMap[n] = i`,
    },
  },
  {
    id: 'p-2',
    slug: 'valid-parentheses',
    title: '20. Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack & Strings',
    tags: ['String', 'Stack'],
    companyTags: ['Amazon', 'Microsoft', 'Meta', 'Infosys', 'GATE CS'],
    acceptanceRate: '40.8%',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    constraints: [
      '1 <= s.length <= 10^4',
      's consists of parentheses only \'()[]{}\'.',
    ],
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
      { input: 's = "([)]"', output: 'false' },
    ],
    starterCode: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your code here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
    
}
`,
      typescript: `function isValid(s: string): boolean {
    // Write your code here
    return false;
}
`,
      cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Write your code here
        return false;
    }
};
`,
      java: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        // Write your code here
        return false;
    }
}
`,
      c: `bool isValid(char* s) {
    // Write your code here
    return false;
}
`,
      csharp: `using System.Collections.Generic;

public class Solution {
    public bool IsValid(string s) {
        // Write your code here
        return false;
    }
}
`,
      go: `func isValid(s string) bool {
    // Write your code here
    return false
}
`,
      rust: `impl Solution {
    pub fn is_valid(s: String) -> bool {
        // Write your code here
        false
    }
}
`,
      sql: `-- SQL validation check`,
    },
    testCases: [
      { id: 'tc-1', input: 's = "()"', expectedOutput: 'true' },
      { id: 'tc-2', input: 's = "()[]{}"', expectedOutput: 'true' },
      { id: 'tc-3', input: 's = "(]"', expectedOutput: 'false' },
      { id: 'tc-4', input: 's = "{[]}"', expectedOutput: 'true', isHidden: true },
      { id: 'tc-5', input: 's = "(((((((((()', expectedOutput: 'false', isHidden: true },
    ],
    hints: [
      'A Last-In-First-Out (LIFO) data structure is ideal here.',
      'Push opening brackets onto a stack. When a closing bracket is found, check if it matches the top of the stack.',
      'Remember to check if the stack is empty at the end.',
    ],
    editorial: {
      approach: 'Stack-based matching',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(N)',
      codeSnippet: `def isValid(s: str) -> bool:
    stack = []
    closeToOpen = {")": "(", "]": "[", "}": "{"}
    for c in s:
        if c in closeToOpen:
            if stack and stack[-1] == closeToOpen[c]:
                stack.pop()
            else:
                return False
        else:
            stack.append(c)
    return True if not stack else False`,
    },
  },
  {
    id: 'p-3',
    slug: 'longest-substring-without-repeating-characters',
    title: '3. Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    companyTags: ['Google', 'Amazon', 'Apple', 'Meta', 'Microsoft'],
    acceptanceRate: '34.6%',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.',
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.',
      },
      {
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Notice "pwke" is a subsequence and not a substring.',
      },
    ],
    starterCode: {
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your code here
        pass
`,
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Write your code here
    
}
`,
      typescript: `function lengthOfLongestSubstring(s: string): number {
    // Write your code here
    return 0;
}
`,
      cpp: `#include <string>
#include <unordered_set>
using namespace std;

class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your code here
        return 0;
    }
};
`,
      java: `import java.util.HashSet;
import java.util.Set;

class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your code here
        return 0;
    }
}
`,
      c: `int lengthOfLongestSubstring(char* s) {
    // Write your code here
    return 0;
}
`,
      csharp: `using System.Collections.Generic;

public class Solution {
    public int LengthOfLongestSubstring(string s) {
        // Write your code here
        return 0;
    }
}
`,
      go: `func lengthOfLongestSubstring(s string) int {
    // Write your code here
    return 0
}
`,
      rust: `impl Solution {
    pub fn length_of_longest_substring(s: String) -> i32 {
        // Write your code here
        0
    }
}
`,
      sql: `-- SQL`,
    },
    testCases: [
      { id: 'tc-1', input: 's = "abcabcbb"', expectedOutput: '3' },
      { id: 'tc-2', input: 's = "bbbbb"', expectedOutput: '1' },
      { id: 'tc-3', input: 's = "pwwkew"', expectedOutput: '3' },
      { id: 'tc-4', input: 's = " "', expectedOutput: '1', isHidden: true },
      { id: 'tc-5', input: 's = "dvdf"', expectedOutput: '3', isHidden: true },
    ],
    hints: [
      'Maintain a sliding window [left, right] of unique characters.',
      'Use a Set or Map to track the characters currently in the window.',
      'If the character at `right` is already in the set, increment `left` until it is removed.',
    ],
    editorial: {
      approach: 'Sliding Window with Hash Set',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(min(N, M)) where M is alphabet size',
      codeSnippet: `def lengthOfLongestSubstring(s: str) -> int:
    charSet = set()
    l = 0
    res = 0
    for r in range(len(s)):
        while s[r] in charSet:
            charSet.remove(s[l])
            l += 1
        charSet.add(s[r])
        res = max(res, r - l + 1)
    return res`,
    },
  },
  {
    id: 'p-4',
    slug: 'trapping-rain-water',
    title: '42. Trapping Rain Water',
    difficulty: 'Hard',
    category: 'Two Pointers & Dynamic Programming',
    tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
    companyTags: ['Google', 'Amazon', 'Meta', 'Goldman Sachs', 'Microsoft'],
    acceptanceRate: '61.2%',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much water it can trap after raining.`,
    constraints: [
      'n == height.length',
      '1 <= n <= 2 * 10^4',
      '0 <= height[i] <= 10^5',
    ],
    examples: [
      {
        input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]',
        output: '6',
        explanation: 'The above elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.',
      },
      {
        input: 'height = [4,2,0,3,2,5]',
        output: '9',
      },
    ],
    starterCode: {
      python: `class Solution:
    def trap(self, height: list[int]) -> int:
        # Write your code here
        pass
`,
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
    // Write your code here
    
}
`,
      typescript: `function trap(height: number[]): number {
    // Write your code here
    return 0;
}
`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int trap(vector<int>& height) {
        // Write your code here
        return 0;
    }
};
`,
      java: `class Solution {
    public int trap(int[] height) {
        // Write your code here
        return 0;
    }
}
`,
      c: `int trap(int* height, int heightSize) {
    // Write your code here
    return 0;
}
`,
      csharp: `public class Solution {
    public int Trap(int[] height) {
        // Write your code here
        return 0;
    }
}
`,
      go: `func trap(height []int) int {
    // Write your code here
    return 0
}
`,
      rust: `impl Solution {
    pub fn trap(height: Vec<i32>) -> i32 {
        // Write your code here
        0
    }
}
`,
      sql: `-- SQL`,
    },
    testCases: [
      { id: 'tc-1', input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', expectedOutput: '6' },
      { id: 'tc-2', input: 'height = [4,2,0,3,2,5]', expectedOutput: '9' },
      { id: 'tc-3', input: 'height = [3,0,2,0,4]', expectedOutput: '7', isHidden: true },
    ],
    hints: [
      'The water trapped at index i depends on min(maxLeft, maxRight) - height[i].',
      'Can you compute this in O(1) extra space using two pointers starting from left and right?',
      'Move the pointer with the smaller maximum height inward.',
    ],
    editorial: {
      approach: 'Two Pointers O(1) Space',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(1)',
      codeSnippet: `def trap(height: list[int]) -> int:
    if not height: return 0
    l, r = 0, len(height) - 1
    leftMax, rightMax = height[l], height[r]
    res = 0
    while l < r:
        if leftMax < rightMax:
            l += 1
            leftMax = max(leftMax, height[l])
            res += leftMax - height[l]
        else:
            r -= 1
            rightMax = max(rightMax, height[r])
            res += rightMax - height[r]
    return res`,
    },
  },
  {
    id: 'p-5',
    slug: 'coin-change',
    title: '322. Coin Change',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
    companyTags: ['Amazon', 'Microsoft', 'Google', 'Flipkart', 'TCS Prime'],
    acceptanceRate: '43.1%',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return *the fewest number of coins that you need to make up that amount*. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
    constraints: [
      '1 <= coins.length <= 12',
      '1 <= coins[i] <= 2^31 - 1',
      '0 <= amount <= 10^4',
    ],
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' },
      { input: 'coins = [2], amount = 3', output: '-1' },
      { input: 'coins = [1], amount = 0', output: '0' },
    ],
    starterCode: {
      python: `class Solution:
    def coinChange(self, coins: list[int], amount: int) -> int:
        # Write your code here
        pass
`,
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
function coinChange(coins, amount) {
    // Write your code here
    
}
`,
      typescript: `function coinChange(coins: number[], amount: number): number {
    // Write your code here
    return -1;
}
`,
      cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // Write your code here
        return -1;
    }
};
`,
      java: `import java.util.Arrays;

class Solution {
    public int coinChange(int[] coins, int amount) {
        // Write your code here
        return -1;
    }
}
`,
      c: `int coinChange(int* coins, int coinsSize, int amount) {
    // Write your code here
    return -1;
}
`,
      csharp: `using System;

public class Solution {
    public int CoinChange(int[] coins, int amount) {
        // Write your code here
        return -1;
    }
}
`,
      go: `func coinChange(coins []int, amount int) int {
    // Write your code here
    return -1
}
`,
      rust: `impl Solution {
    pub fn coin_change(coins: Vec<i32>, amount: i32) -> i32 {
        // Write your code here
        -1
    }
}
`,
      sql: `-- SQL`,
    },
    testCases: [
      { id: 'tc-1', input: 'coins = [1,2,5], amount = 11', expectedOutput: '3' },
      { id: 'tc-2', input: 'coins = [2], amount = 3', expectedOutput: '-1' },
      { id: 'tc-3', input: 'coins = [1], amount = 0', expectedOutput: '0' },
      { id: 'tc-4', input: 'coins = [186,419,83,408], amount = 6249', expectedOutput: '20', isHidden: true },
    ],
    hints: [
      'Define dp[i] as the minimum coins needed to make amount i.',
      'Base case: dp[0] = 0, all other values initialized to infinity.',
      'Transition: dp[a] = min(dp[a], 1 + dp[a - c]) for each coin c.',
    ],
    editorial: {
      approach: 'Bottom-Up Dynamic Programming',
      timeComplexity: 'O(amount * coins.length)',
      spaceComplexity: 'O(amount)',
      codeSnippet: `def coinChange(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], 1 + dp[a - c])
    return dp[amount] if dp[amount] != float('inf') else -1`,
    },
  },
  {
    id: 'p-6',
    slug: 'merge-two-sorted-lists',
    title: '21. Merge Two Sorted Lists',
    difficulty: 'Easy',
    category: 'Linked List',
    tags: ['Linked List', 'Recursion'],
    companyTags: ['Amazon', 'Apple', 'Meta', 'TCS', 'Infosys'],
    acceptanceRate: '63.9%',
    description: `You are given the heads of two sorted linked lists \`list1\` and \`list2\`.

Merge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.

Return *the head of the merged linked list*.`,
    constraints: [
      'The number of nodes in both lists is in the range [0, 50].',
      '-100 <= Node.val <= 100',
      'Both list1 and list2 are sorted in non-decreasing order.',
    ],
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' },
      { input: 'list1 = [], list2 = []', output: '[]' },
      { input: 'list1 = [], list2 = [0]', output: '[0]' },
    ],
    starterCode: {
      python: `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, list1, list2):
        # Write your code here
        pass
`,
      javascript: `function mergeTwoLists(list1, list2) {
    // Write your code here
    
}
`,
      typescript: `function mergeTwoLists(list1: any, list2: any): any {
    // Write your code here
    return null;
}
`,
      cpp: `class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        // Write your code here
        return nullptr;
    }
};
`,
      java: `class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        // Write your code here
        return null;
    }
}
`,
      c: `struct ListNode* mergeTwoLists(struct ListNode* list1, struct ListNode* list2) {
    // Write your code here
    return 0;
}
`,
      csharp: `public class Solution {
    public ListNode MergeTwoLists(ListNode list1, ListNode list2) {
        // Write your code here
        return null;
    }
}
`,
      go: `func mergeTwoLists(list1 *ListNode, list2 *ListNode) *ListNode {
    // Write your code here
    return nil
}
`,
      rust: `impl Solution {
    pub fn merge_two_lists(list1: Option<Box<ListNode>>, list2: Option<Box<ListNode>>) -> Option<Box<ListNode>> {
        // Write your code here
        None
    }
}
`,
      sql: `-- SQL`,
    },
    testCases: [
      { id: 'tc-1', input: 'list1 = [1,2,4], list2 = [1,3,4]', expectedOutput: '[1,1,2,3,4,4]' },
      { id: 'tc-2', input: 'list1 = [], list2 = []', expectedOutput: '[]' },
      { id: 'tc-3', input: 'list1 = [], list2 = [0]', expectedOutput: '[0]' },
    ],
    hints: [
      'Create a dummy node to act as the head of the merged list.',
      'Compare list1.val and list2.val, attach the smaller one to current.next.',
    ],
    editorial: {
      approach: 'Iterative with Dummy Node',
      timeComplexity: 'O(N + M)',
      spaceComplexity: 'O(1)',
      codeSnippet: `def mergeTwoLists(list1, list2):
    dummy = ListNode()
    tail = dummy
    while list1 and list2:
        if list1.val < list2.val:
            tail.next = list1
            list1 = list1.next
        else:
            tail.next = list2
            list2 = list2.next
        tail = tail.next
    if list1: tail.next = list1
    elif list2: tail.next = list2
    return dummy.next`,
    },
  },
  {
    id: 'p-7',
    slug: 'number-of-islands',
    title: '200. Number of Islands',
    difficulty: 'Medium',
    category: 'Graphs & BFS/DFS',
    tags: ['Array', 'Depth-First Search', 'Breadth-First Search', 'Union Find', 'Matrix'],
    companyTags: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Bloomberg'],
    acceptanceRate: '58.4%',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of \`'1'\`s (land) and \`'0'\`s (water), return *the number of islands*.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.`,
    constraints: [
      'm == grid.length',
      'n == grid[i].length',
      '1 <= m, n <= 300',
      'grid[i][j] is \'0\' or \'1\'.',
    ],
    examples: [
      {
        input: `grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]`,
        output: '1',
      },
      {
        input: `grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]`,
        output: '3',
      },
    ],
    starterCode: {
      python: `class Solution:
    def numIslands(self, grid: list[list[str]]) -> int:
        # Write your code here
        pass
`,
      javascript: `/**
 * @param {character[][]} grid
 * @return {number}
 */
function numIslands(grid) {
    // Write your code here
    
}
`,
      typescript: `function numIslands(grid: string[][]): number {
    // Write your code here
    return 0;
}
`,
      cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int numIslands(vector<vector<char>>& grid) {
        // Write your code here
        return 0;
    }
};
`,
      java: `class Solution {
    public int numIslands(char[][] grid) {
        // Write your code here
        return 0;
    }
}
`,
      c: `int numIslands(char** grid, int gridSize, int* gridColSize) {
    // Write your code here
    return 0;
}
`,
      csharp: `public class Solution {
    public int NumIslands(char[][] grid) {
        // Write your code here
        return 0;
    }
}
`,
      go: `func numIslands(grid [][]byte) int {
    // Write your code here
    return 0
}
`,
      rust: `impl Solution {
    pub fn num_islands(grid: Vec<Vec<char>>) -> i32 {
        // Write your code here
        0
    }
}
`,
      sql: `-- SQL`,
    },
    testCases: [
      {
        id: 'tc-1',
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        expectedOutput: '1',
      },
      {
        id: 'tc-2',
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        expectedOutput: '3',
      },
    ],
    hints: [
      'Iterate through each cell of the grid. If you see a \'1\', increment island count and trigger a DFS/BFS.',
      'In DFS/BFS, mark all connected \'1\'s as visited (or change to \'0\') to prevent recounting.',
    ],
    editorial: {
      approach: 'DFS Flood Fill',
      timeComplexity: 'O(M * N)',
      spaceComplexity: 'O(M * N) call stack',
      codeSnippet: `def numIslands(grid: list[list[str]]) -> int:
    if not grid: return 0
    rows, cols = len(grid), len(grid[0])
    islands = 0

    def dfs(r, c):
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '0' # mark visited
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                dfs(r, c)
                islands += 1
    return islands`,
    },
  },
];

export function getProblemBySlug(slug: string): CodingProblem | undefined {
  return CODING_PROBLEMS.find((p) => p.slug === slug);
}
