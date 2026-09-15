import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from './models/Course.model';
import User from './models/User.model';
dotenv.config();

const COURSES = [
  // ─────────────────────────────────────────────
  // COURSE 1: Python for Beginners
  // ─────────────────────────────────────────────
  {
    title: 'Python for Beginners',
    slug: 'python-for-beginners',
    description:
      'Start your programming journey with Python — one of the most beginner-friendly and versatile languages. Learn variables, control flow, functions, data structures, and file handling through hands-on examples.',
    difficulty: 'Beginner' as const,
    tags: ['Python', 'Language'],
    isPublished: true,
    lessons: [
      {
        title: 'Variables & Data Types',
        order: 1,
        duration: 10,
        codeLanguage: 'python',
        content: `## Variables & Data Types in Python

Python is a **dynamically typed** language, meaning you do not need to declare a variable's type explicitly. The interpreter figures it out at runtime.

### Declaring Variables

A variable is created the moment you assign a value to it:

\`\`\`python
name = "Alice"
age = 30
pi = 3.14159
is_active = True
\`\`\`

### Core Data Types

| Type | Example | Description |
|------|---------|-------------|
| \`int\` | \`42\` | Whole numbers |
| \`float\` | \`3.14\` | Decimal numbers |
| \`str\` | \`"hello"\` | Text strings |
| \`bool\` | \`True\` / \`False\` | Boolean values |
| \`NoneType\` | \`None\` | Represents absence of value |

### Type Checking & Conversion

Use \`type()\` to inspect a variable and casting functions to convert between types:

\`\`\`python
x = "100"
print(type(x))  # <class 'str'>

y = int(x)       # Convert to int
z = float(x)     # Convert to float
\`\`\`

### String Formatting

Python 3.6+ supports **f-strings** for readable string interpolation:

\`\`\`python
name = "Alice"
age = 30
print(f"{name} is {age} years old.")
\`\`\`

### Key Rules

- Variable names must start with a letter or underscore.
- Names are **case-sensitive** (\`Age\` and \`age\` are different).
- Use \`snake_case\` for variable names by convention.
- Constants are written in \`UPPER_SNAKE_CASE\` (e.g., \`MAX_SIZE = 100\`).

### Multiple Assignment

Python supports assigning multiple variables in one line:

\`\`\`python
a, b, c = 1, 2, 3
x = y = z = 0
\`\`\`

Understanding data types is the foundation of every Python program. Every value you create, pass to a function, or return from a function has a type, and knowing how to work with types will prevent countless bugs down the road.`,
        codeExample: `# Variables & Data Types Demo
name = "Alice"
age = 30
height = 5.6
is_student = True

# Type checking
print(type(name))    # <class 'str'>
print(type(age))     # <class 'int'>

# Type conversion
score = "95"
score_int = int(score)
print(score_int + 5)  # 100

# f-string formatting
print(f"{name} is {age} years old and {height} ft tall.")

# Multiple assignment
x, y, z = 10, 20, 30
print(x + y + z)  # 60`,
        quiz: [
          {
            question: 'What is the output of type(3.14) in Python?',
            options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'decimal'>"],
            answer: 1,
          },
          {
            question: 'Which of the following is a valid variable name in Python?',
            options: ['2name', 'my-var', '_count', 'class'],
            answer: 2,
          },
          {
            question: 'What does int("42") return?',
            options: ['The string "42"', 'The integer 42', 'An error', 'None'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Control Flow: if/else & Loops',
        order: 2,
        duration: 12,
        codeLanguage: 'python',
        content: `## Control Flow in Python

Control flow lets your program make decisions and repeat actions. Python uses **indentation** (not braces) to define blocks of code.

### Conditional Statements

\`\`\`python
temperature = 35

if temperature > 30:
    print("It's hot outside!")
elif temperature > 20:
    print("Nice weather.")
else:
    print("It's cold!")
\`\`\`

### Comparison & Logical Operators

- Comparison: \`==\`, \`!=\`, \`>\`, \`<\`, \`>=\`, \`<=\`
- Logical: \`and\`, \`or\`, \`not\`

\`\`\`python
age = 25
has_id = True

if age >= 18 and has_id:
    print("Access granted")
\`\`\`

### The \`for\` Loop

Iterate over sequences (lists, strings, ranges):

\`\`\`python
for i in range(5):
    print(i)  # 0, 1, 2, 3, 4

for char in "Python":
    print(char)
\`\`\`

### The \`while\` Loop

Repeats as long as a condition is true:

\`\`\`python
count = 0
while count < 5:
    print(count)
    count += 1
\`\`\`

### Loop Control Statements

- **\`break\`** — exit the loop immediately
- **\`continue\`** — skip the current iteration
- **\`else\`** on loops — runs if the loop finished without a \`break\`

\`\`\`python
for n in range(10):
    if n == 5:
        break
    if n % 2 == 0:
        continue
    print(n)  # prints 1, 3
\`\`\`

### Nested Loops

You can place loops inside other loops. This is common when working with 2-D data:

\`\`\`python
for i in range(3):
    for j in range(3):
        print(f"({i},{j})", end=" ")
    print()
\`\`\`

Mastering control flow is essential because virtually every program needs to branch or iterate. Practice writing small scripts that combine \`if\`, \`for\`, and \`while\` to build your intuition.`,
        codeExample: `# Control Flow Demo
# --- if / elif / else ---
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
else:
    grade = "F"
print(f"Score {score} => Grade {grade}")

# --- for loop with range ---
total = 0
for i in range(1, 11):
    total += i
print(f"Sum of 1-10 = {total}")

# --- while loop ---
n = 1
while n <= 5:
    print(f"  n = {n}")
    n += 1

# --- break and continue ---
for num in range(20):
    if num % 2 == 0:
        continue
    if num > 10:
        break
    print(num, end=" ")  # 1 3 5 7 9`,
        quiz: [
          {
            question: 'What keyword skips to the next iteration of a loop in Python?',
            options: ['break', 'skip', 'continue', 'pass'],
            answer: 2,
          },
          {
            question: 'How many times does `for i in range(3):` iterate?',
            options: ['2', '3', '4'],
            answer: 1,
          },
          {
            question: 'What does Python use to define code blocks?',
            options: ['Curly braces {}', 'Parentheses ()', 'Indentation', 'Keywords begin/end'],
            answer: 2,
          },
        ],
      },
      {
        title: 'Functions & Scope',
        order: 3,
        duration: 12,
        codeLanguage: 'python',
        content: `## Functions & Scope

Functions let you organize code into reusable blocks. In Python, you define a function with the \`def\` keyword.

### Defining a Function

\`\`\`python
def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))  # Hello, Alice!
\`\`\`

### Parameters & Arguments

- **Positional arguments**: matched by position.
- **Default parameters**: provide a fallback value.
- **Keyword arguments**: passed by name.
- **\`*args\` and \`**kwargs\`**: accept variable-length arguments.

\`\`\`python
def power(base, exp=2):
    return base ** exp

print(power(3))       # 9
print(power(2, 10))   # 1024
\`\`\`

### Returning Values

A function can return multiple values as a tuple:

\`\`\`python
def min_max(numbers):
    return min(numbers), max(numbers)

lo, hi = min_max([4, 1, 7, 2])
print(lo, hi)  # 1 7
\`\`\`

### Scope Rules (LEGB)

Python resolves names in this order:

1. **L**ocal — inside the current function
2. **E**nclosing — in any enclosing function (closures)
3. **G**lobal — module-level
4. **B**uilt-in — Python's built-in names

\`\`\`python
x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)  # local
    inner()

outer()
\`\`\`

### Lambda Functions

Small anonymous functions defined in a single expression:

\`\`\`python
square = lambda n: n ** 2
print(square(5))  # 25

nums = [3, 1, 4, 1, 5]
sorted_nums = sorted(nums, key=lambda x: -x)
print(sorted_nums)  # [5, 4, 3, 1, 1]
\`\`\`

### Docstrings

Always document your functions with a docstring:

\`\`\`python
def factorial(n):
    """Return the factorial of n (n must be >= 0)."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)
\`\`\`

Functions are the building blocks of clean, maintainable code. Keep them short, give them descriptive names, and make sure each function does one thing well.`,
        codeExample: `# Functions & Scope Demo
def greet(name, greeting="Hello"):
    """Return a greeting string."""
    return f"{greeting}, {name}!"

print(greet("Alice"))
print(greet("Bob", greeting="Hi"))

# *args and **kwargs
def summarize(*args, **kwargs):
    print(f"Positional: {args}")
    print(f"Keyword:    {kwargs}")

summarize(1, 2, 3, name="Alice", age=30)

# Multiple return values
def stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

lo, hi, avg = stats([10, 20, 30, 40, 50])
print(f"Min={lo}, Max={hi}, Avg={avg}")

# Lambda + higher-order functions
words = ["banana", "apple", "cherry"]
words_sorted = sorted(words, key=lambda w: len(w))
print(words_sorted)  # ['apple', 'banana', 'cherry']`,
        quiz: [
          {
            question: 'What does the LEGB rule stand for in Python?',
            options: [
              'Local, Enclosing, Global, Built-in',
              'Loop, Else, Global, Break',
              'List, Element, Get, Boolean',
            ],
            answer: 0,
          },
          {
            question: 'What keyword is used to define a function in Python?',
            options: ['func', 'function', 'def', 'define'],
            answer: 2,
          },
          {
            question: 'What does `lambda x: x * 2` create?',
            options: ['A class', 'An anonymous function', 'A generator', 'A decorator'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Lists, Tuples & Dictionaries',
        order: 4,
        duration: 12,
        codeLanguage: 'python',
        content: `## Lists, Tuples & Dictionaries

Python's built-in collection types are among its greatest strengths. Understanding when to use each one is key to writing efficient programs.

### Lists

Lists are **ordered, mutable** sequences:

\`\`\`python
fruits = ["apple", "banana", "cherry"]
fruits.append("date")
fruits[0] = "avocado"
print(fruits)  # ['avocado', 'banana', 'cherry', 'date']
\`\`\`

**Useful list methods**: \`append()\`, \`extend()\`, \`insert()\`, \`pop()\`, \`remove()\`, \`sort()\`, \`reverse()\`

**List comprehensions** offer a concise way to create lists:

\`\`\`python
squares = [x ** 2 for x in range(10)]
evens = [x for x in range(20) if x % 2 == 0]
\`\`\`

### Tuples

Tuples are **ordered, immutable** sequences — once created, they cannot be changed:

\`\`\`python
point = (3, 4)
x, y = point  # tuple unpacking
print(x, y)   # 3 4
\`\`\`

Tuples are ideal for fixed collections like coordinates, RGB colours, or database rows.

### Dictionaries

Dictionaries store **key-value pairs** with O(1) average lookup:

\`\`\`python
student = {
    "name": "Alice",
    "age": 20,
    "grades": [90, 85, 92]
}
print(student["name"])      # Alice
student["graduated"] = False  # add new key
\`\`\`

**Useful dict methods**: \`keys()\`, \`values()\`, \`items()\`, \`get()\`, \`pop()\`, \`update()\`

### Dictionary Comprehensions

\`\`\`python
word = "mississippi"
freq = {ch: word.count(ch) for ch in set(word)}
print(freq)  # {'m': 1, 'i': 4, 's': 4, 'p': 2}
\`\`\`

### Sets (Bonus)

Sets are **unordered collections of unique elements**:

\`\`\`python
a = {1, 2, 3}
b = {3, 4, 5}
print(a & b)  # intersection: {3}
print(a | b)  # union: {1, 2, 3, 4, 5}
\`\`\`

### Choosing the Right Collection

| Need | Use |
|------|-----|
| Ordered, mutable sequence | \`list\` |
| Immutable sequence / hashable key | \`tuple\` |
| Key-value lookup | \`dict\` |
| Unique elements, set operations | \`set\` |

Knowing these four collection types cold will let you solve the vast majority of everyday programming problems cleanly and efficiently.`,
        codeExample: `# Lists, Tuples & Dictionaries Demo

# --- Lists ---
numbers = [5, 3, 8, 1, 9]
numbers.sort()
print("Sorted:", numbers)  # [1, 3, 5, 8, 9]

squares = [x ** 2 for x in numbers]
print("Squares:", squares)

# --- Tuples ---
coordinates = (10.5, 20.3)
lat, lon = coordinates
print(f"Lat: {lat}, Lon: {lon}")

# --- Dictionaries ---
inventory = {"apples": 5, "bananas": 12, "oranges": 3}
inventory["grapes"] = 7
for fruit, count in inventory.items():
    print(f"  {fruit}: {count}")

# Safe access with .get()
print(inventory.get("mangoes", 0))  # 0

# Dictionary comprehension
doubled = {k: v * 2 for k, v in inventory.items()}
print("Doubled:", doubled)`,
        quiz: [
          {
            question: 'Which Python data structure is immutable?',
            options: ['list', 'dict', 'tuple', 'set'],
            answer: 2,
          },
          {
            question: 'What is the average time complexity of dictionary key lookup?',
            options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
            answer: 2,
          },
          {
            question: 'What does [x**2 for x in range(5)] produce?',
            options: ['[1, 4, 9, 16, 25]', '[0, 1, 4, 9, 16]', '[0, 2, 4, 6, 8]'],
            answer: 1,
          },
        ],
      },
      {
        title: 'File I/O & Error Handling',
        order: 5,
        duration: 10,
        codeLanguage: 'python',
        content: `## File I/O & Error Handling

Real programs need to read from and write to files, and they need to handle errors gracefully when things go wrong.

### Reading Files

The \`with\` statement ensures files are properly closed:

\`\`\`python
with open("data.txt", "r") as f:
    content = f.read()
    print(content)
\`\`\`

Other reading methods:
- \`f.readline()\` — read one line
- \`f.readlines()\` — read all lines into a list
- Iterate directly: \`for line in f:\`

### Writing Files

\`\`\`python
with open("output.txt", "w") as f:
    f.write("Hello, file!\\n")
    f.write("Second line.\\n")
\`\`\`

Modes: \`"r"\` (read), \`"w"\` (write — overwrites), \`"a"\` (append), \`"rb"\` / \`"wb"\` (binary).

### Working with CSV

\`\`\`python
import csv

with open("scores.csv", "r") as f:
    reader = csv.DictReader(f)
    for row in reader:
        print(row["name"], row["score"])
\`\`\`

### Exception Handling

Use \`try\` / \`except\` to catch and handle errors:

\`\`\`python
try:
    result = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")
except Exception as e:
    print(f"Unexpected error: {e}")
finally:
    print("This always runs.")
\`\`\`

### Common Built-in Exceptions

- \`ValueError\` — wrong value (e.g., \`int("abc")\`)
- \`TypeError\` — wrong type (e.g., \`"a" + 1\`)
- \`FileNotFoundError\` — file does not exist
- \`KeyError\` — missing dictionary key
- \`IndexError\` — list index out of range

### Raising Exceptions

You can raise your own exceptions:

\`\`\`python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError("Insufficient funds")
    return balance - amount
\`\`\`

### Custom Exceptions

\`\`\`python
class InsufficientFundsError(Exception):
    pass
\`\`\`

Combining file I/O with proper error handling makes your programs robust and production-ready. Always use \`with\` for file operations and wrap risky code in \`try/except\` blocks.`,
        codeExample: `# File I/O & Error Handling Demo
import os

# --- Writing a file ---
with open("example.txt", "w") as f:
    f.write("Line 1: Hello, world!\\n")
    f.write("Line 2: Python is great.\\n")
    f.write("Line 3: File I/O is easy.\\n")

# --- Reading a file ---
with open("example.txt", "r") as f:
    for i, line in enumerate(f, 1):
        print(f"  Line {i}: {line.strip()}")

# --- Error handling ---
def safe_divide(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return "Error: division by zero"
    except TypeError:
        return "Error: invalid types"

print(safe_divide(10, 3))   # 3.333...
print(safe_divide(10, 0))   # Error: division by zero
print(safe_divide("a", 2))  # Error: invalid types

# Clean up
os.remove("example.txt")
print("Temp file removed.")`,
        quiz: [
          {
            question: 'Which statement ensures a file is automatically closed in Python?',
            options: ['try/except', 'with open()', 'f.close()', 'finally'],
            answer: 1,
          },
          {
            question: 'What file mode appends to an existing file?',
            options: ['"r"', '"w"', '"a"', '"x"'],
            answer: 2,
          },
          {
            question: 'Which block always executes regardless of exceptions?',
            options: ['try', 'except', 'else', 'finally'],
            answer: 3,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COURSE 2: JavaScript Essentials
  // ─────────────────────────────────────────────
  {
    title: 'JavaScript Essentials',
    slug: 'javascript-essentials',
    description:
      'Master the language of the web. From DOM manipulation and events to async programming and modern ES6+ features, this course covers everything you need to become productive with JavaScript.',
    difficulty: 'Beginner' as const,
    tags: ['JavaScript', 'Language'],
    isPublished: true,
    lessons: [
      {
        title: 'Variables & the DOM',
        order: 1,
        duration: 10,
        codeLanguage: 'javascript',
        content: `## Variables & the DOM

JavaScript runs in the browser and on the server (Node.js). Understanding variables and the Document Object Model (DOM) is the first step.

### Declaring Variables

ES6 introduced \`let\` and \`const\` to replace the older \`var\`:

\`\`\`javascript
const PI = 3.14159;  // cannot be reassigned
let count = 0;       // can be reassigned
var legacy = "old";  // function-scoped (avoid)
\`\`\`

| Keyword | Scope | Reassign? | Hoist? |
|---------|-------|-----------|--------|
| \`const\` | Block | No | No (TDZ) |
| \`let\` | Block | Yes | No (TDZ) |
| \`var\` | Function | Yes | Yes |

### Data Types

JavaScript has **7 primitive types**: \`string\`, \`number\`, \`boolean\`, \`null\`, \`undefined\`, \`symbol\`, \`bigint\`, plus \`object\`.

\`\`\`javascript
let name = "Alice";        // string
let age = 30;              // number
let isActive = true;       // boolean
let data = null;           // null
let x;                     // undefined
\`\`\`

### The DOM

The **Document Object Model** is the browser's representation of an HTML page as a tree of nodes. JavaScript can read and modify this tree:

\`\`\`javascript
// Select elements
const heading = document.querySelector("h1");
const buttons = document.querySelectorAll(".btn");

// Modify content & style
heading.textContent = "Welcome!";
heading.style.color = "blue";
\`\`\`

### Creating Elements

\`\`\`javascript
const li = document.createElement("li");
li.textContent = "New item";
document.querySelector("ul").appendChild(li);
\`\`\`

### Key Takeaways

- Prefer \`const\` by default; use \`let\` only when reassignment is needed.
- Use \`querySelector\` / \`querySelectorAll\` instead of older methods.
- The DOM bridges your JavaScript logic and what users see on screen.`,
        codeExample: `// Variables & DOM Demo

// --- Variables ---
const APP_NAME = "CodeCampus";
let userScore = 0;

console.log(\`Welcome to \${APP_NAME}\`);

userScore += 10;
console.log(\`Score: \${userScore}\`);

// --- typeof ---
console.log(typeof APP_NAME);   // "string"
console.log(typeof userScore);  // "number"
console.log(typeof true);       // "boolean"
console.log(typeof undefined);  // "undefined"
console.log(typeof null);       // "object" (famous JS quirk)

// --- DOM manipulation (browser context) ---
// const title = document.querySelector("#title");
// title.textContent = "Hello from JS!";
// title.classList.add("highlight");

// --- Creating elements ---
// const p = document.createElement("p");
// p.textContent = "Dynamic paragraph";
// document.body.appendChild(p);`,
        quiz: [
          {
            question: 'Which keyword declares a block-scoped variable that cannot be reassigned?',
            options: ['var', 'let', 'const', 'static'],
            answer: 2,
          },
          {
            question: 'What does typeof null return in JavaScript?',
            options: ['"null"', '"undefined"', '"object"', '"boolean"'],
            answer: 2,
          },
          {
            question: 'Which method selects the first matching element in the DOM?',
            options: ['getElementById', 'querySelector', 'getElementsByClassName', 'querySelectorAll'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Functions & Events',
        order: 2,
        duration: 12,
        codeLanguage: 'javascript',
        content: `## Functions & Events

Functions are first-class citizens in JavaScript — they can be assigned to variables, passed as arguments, and returned from other functions.

### Function Declarations vs Expressions

\`\`\`javascript
// Declaration (hoisted)
function add(a, b) {
  return a + b;
}

// Expression (not hoisted)
const multiply = function(a, b) {
  return a * b;
};

// Arrow function (ES6+)
const subtract = (a, b) => a - b;
\`\`\`

### Arrow Functions

Arrow functions have a shorter syntax and **do not bind their own \`this\`**:

\`\`\`javascript
const nums = [1, 2, 3, 4];
const doubled = nums.map(n => n * 2);
console.log(doubled);  // [2, 4, 6, 8]
\`\`\`

### Default Parameters

\`\`\`javascript
function greet(name = "World") {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Event Handling

Events let your code respond to user actions:

\`\`\`javascript
const btn = document.querySelector("#myBtn");

btn.addEventListener("click", (event) => {
  console.log("Button clicked!", event.target);
});
\`\`\`

### Common Events

| Event | Triggers when… |
|-------|---------------|
| \`click\` | Element is clicked |
| \`input\` | Input value changes |
| \`submit\` | Form is submitted |
| \`keydown\` | Key is pressed |
| \`mouseover\` | Cursor enters element |

### Event Delegation

Instead of attaching listeners to every child, attach one to the parent:

\`\`\`javascript
document.querySelector("ul").addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    console.log("Clicked:", e.target.textContent);
  }
});
\`\`\`

### Removing Event Listeners

\`\`\`javascript
function handleClick() { console.log("clicked"); }
btn.addEventListener("click", handleClick);
btn.removeEventListener("click", handleClick);
\`\`\`

Understanding functions and events is crucial because JavaScript's event-driven model is the backbone of all interactive web applications.`,
        codeExample: `// Functions & Events Demo

// --- Function types ---
function add(a, b) {
  return a + b;
}

const multiply = (a, b) => a * b;

const greet = (name = "World") => \`Hello, \${name}!\`;

console.log(add(3, 4));         // 7
console.log(multiply(3, 4));    // 12
console.log(greet());           // Hello, World!
console.log(greet("Alice"));    // Hello, Alice!

// --- Higher-order functions ---
const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(n => n ** 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);

console.log("Squared:", squared);
console.log("Evens:", evens);
console.log("Sum:", sum);

// --- Event handling (browser) ---
// document.querySelector("#btn").addEventListener("click", () => {
//   alert("Button was clicked!");
// });`,
        quiz: [
          {
            question: 'What does an arrow function NOT bind?',
            options: ['arguments', 'this', 'Both arguments and this'],
            answer: 2,
          },
          {
            question: 'Which method attaches an event handler to a DOM element?',
            options: ['onClick()', 'addEventListener()', 'attachEvent()', 'handleEvent()'],
            answer: 1,
          },
          {
            question: 'What is event delegation?',
            options: [
              'Attaching an event to every child element',
              'Attaching one event listener to a parent to handle child events',
              'Removing events from the DOM',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'Arrays & Objects',
        order: 3,
        duration: 10,
        codeLanguage: 'javascript',
        content: `## Arrays & Objects

Arrays and objects are the two most important data structures in JavaScript.

### Arrays

Arrays are ordered, zero-indexed lists:

\`\`\`javascript
const fruits = ["apple", "banana", "cherry"];
console.log(fruits[0]);  // "apple"
console.log(fruits.length);  // 3
\`\`\`

### Essential Array Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| \`push()\` | Add to end | new length |
| \`pop()\` | Remove from end | removed element |
| \`unshift()\` | Add to start | new length |
| \`shift()\` | Remove from start | removed element |
| \`map()\` | Transform each element | new array |
| \`filter()\` | Keep matching elements | new array |
| \`reduce()\` | Accumulate to single value | accumulated value |
| \`find()\` | First match | element or undefined |
| \`includes()\` | Check existence | boolean |

\`\`\`javascript
const nums = [1, 2, 3, 4, 5];
const doubled = nums.map(n => n * 2);      // [2,4,6,8,10]
const big = nums.filter(n => n > 3);       // [4, 5]
const total = nums.reduce((s, n) => s + n, 0); // 15
\`\`\`

### Objects

Objects store key-value pairs:

\`\`\`javascript
const user = {
  name: "Alice",
  age: 25,
  isAdmin: false,
};

console.log(user.name);       // dot notation
console.log(user["age"]);     // bracket notation
\`\`\`

### Destructuring

\`\`\`javascript
const { name, age } = user;
const [first, ...rest] = [1, 2, 3, 4];
\`\`\`

### Spread Operator

\`\`\`javascript
const updated = { ...user, age: 26 };
const merged = [...fruits, "date"];
\`\`\`

### Object Methods

\`\`\`javascript
Object.keys(user);    // ["name", "age", "isAdmin"]
Object.values(user);  // ["Alice", 25, false]
Object.entries(user); // [["name","Alice"], ["age",25], ...]
\`\`\`

Arrays and objects together form the backbone of JavaScript data handling. Master \`map\`, \`filter\`, \`reduce\`, destructuring, and the spread operator and you'll write cleaner, more expressive code.`,
        codeExample: `// Arrays & Objects Demo

// --- Arrays ---
const scores = [85, 92, 78, 95, 88];
const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
console.log(\`Average: \${average}\`);

const passed = scores.filter(s => s >= 80);
console.log("Passed:", passed);

// --- Objects ---
const product = {
  name: "Laptop",
  price: 999,
  inStock: true,
  tags: ["electronics", "computers"],
};

// Destructuring
const { name, price, ...rest } = product;
console.log(\`\${name}: $\${price}\`);

// Spread operator
const updated = { ...product, price: 899, onSale: true };
console.log("Updated:", updated);

// Object.entries iteration
for (const [key, value] of Object.entries(product)) {
  console.log(\`  \${key}: \${value}\`);
}`,
        quiz: [
          {
            question: 'What does array.filter() return?',
            options: [
              'A single value',
              'A new array with elements that pass the test',
              'The first matching element',
              'A boolean',
            ],
            answer: 1,
          },
          {
            question: 'Which syntax destructures an object?',
            options: [
              'const [a, b] = obj',
              'const {a, b} = obj',
              'const (a, b) = obj',
            ],
            answer: 1,
          },
          {
            question: 'What does the spread operator (...) do with objects?',
            options: [
              'Deletes properties',
              'Creates a shallow copy / merges objects',
              'Deep clones the object',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'Async JavaScript & Promises',
        order: 4,
        duration: 15,
        codeLanguage: 'javascript',
        content: `## Async JavaScript & Promises

JavaScript is **single-threaded** but uses an **event loop** to handle asynchronous operations like network requests, timers, and file I/O without blocking.

### Callbacks (The Old Way)

\`\`\`javascript
setTimeout(() => {
  console.log("Done after 1 second");
}, 1000);
\`\`\`

Callbacks can lead to **callback hell** — deeply nested, hard-to-read code.

### Promises

A Promise represents a value that may be available now, later, or never:

\`\`\`javascript
const fetchData = new Promise((resolve, reject) => {
  const success = true;
  if (success) resolve("Data loaded!");
  else reject("Error occurred");
});

fetchData
  .then(data => console.log(data))
  .catch(err => console.error(err));
\`\`\`

### Promise States

1. **Pending** — initial state
2. **Fulfilled** — operation completed successfully
3. **Rejected** — operation failed

### Chaining Promises

\`\`\`javascript
fetch("/api/user")
  .then(res => res.json())
  .then(user => fetch(\`/api/posts/\${user.id}\`))
  .then(res => res.json())
  .then(posts => console.log(posts))
  .catch(err => console.error(err));
\`\`\`

### async/await

\`async/await\` is syntactic sugar over Promises, making async code look synchronous:

\`\`\`javascript
async function loadUser() {
  try {
    const res = await fetch("/api/user");
    const user = await res.json();
    console.log(user);
  } catch (err) {
    console.error("Failed:", err);
  }
}
\`\`\`

### Promise Utility Methods

- \`Promise.all([p1, p2])\` — waits for **all** to resolve
- \`Promise.race([p1, p2])\` — resolves/rejects with the **first** settled
- \`Promise.allSettled([p1, p2])\` — waits for all to settle (fulfilled or rejected)

\`\`\`javascript
const [users, posts] = await Promise.all([
  fetch("/api/users").then(r => r.json()),
  fetch("/api/posts").then(r => r.json()),
]);
\`\`\`

Understanding async patterns is non-negotiable for modern JavaScript — from API calls to database queries, nearly everything is asynchronous.`,
        codeExample: `// Async JavaScript Demo

// --- Creating a Promise ---
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- async / await ---
async function main() {
  console.log("Start");

  await delay(1000);
  console.log("1 second passed");

  await delay(500);
  console.log("1.5 seconds total");

  // Simulating parallel requests with Promise.all
  const [a, b] = await Promise.all([
    delay(300).then(() => "Result A"),
    delay(200).then(() => "Result B"),
  ]);
  console.log(a, b);  // Result A Result B

  console.log("Done!");
}

main();

// --- Error handling ---
async function safeFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error("Fetch failed:", err.message);
    return null;
  }
}`,
        quiz: [
          {
            question: 'What are the three states of a JavaScript Promise?',
            options: [
              'Start, Running, Done',
              'Pending, Fulfilled, Rejected',
              'Open, Closed, Error',
            ],
            answer: 1,
          },
          {
            question: 'What does async/await replace?',
            options: ['Callbacks', 'Promise .then() chains', 'Both callbacks and .then() chains'],
            answer: 2,
          },
          {
            question: 'What does Promise.all() do if one promise rejects?',
            options: [
              'Ignores the rejection',
              'Immediately rejects the entire Promise.all',
              'Returns partial results',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'ES6+ Modern Features',
        order: 5,
        duration: 10,
        codeLanguage: 'javascript',
        content: `## ES6+ Modern Features

ECMAScript 2015 (ES6) and later versions brought transformative features to JavaScript. Here are the most impactful ones.

### Template Literals

\`\`\`javascript
const name = "Alice";
console.log(\`Hello, \${name}! 2 + 2 = \${2 + 2}\`);
\`\`\`

### Destructuring

Extract values from arrays and objects:

\`\`\`javascript
const [first, second, ...rest] = [1, 2, 3, 4, 5];
const { title, author } = { title: "JS Guide", author: "MDN" };
\`\`\`

### Spread & Rest Operators

\`\`\`javascript
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5];

function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
\`\`\`

### Optional Chaining (\`?.\`)

Safely access deeply nested properties:

\`\`\`javascript
const city = user?.address?.city ?? "Unknown";
\`\`\`

### Nullish Coalescing (\`??\`)

Returns the right-hand side only if the left is \`null\` or \`undefined\`:

\`\`\`javascript
const port = config.port ?? 3000;
\`\`\`

### Map & Set

\`\`\`javascript
const map = new Map();
map.set("key", "value");
console.log(map.get("key"));

const set = new Set([1, 2, 2, 3]);
console.log(set.size);  // 3
\`\`\`

### Modules

\`\`\`javascript
// math.js
export const add = (a, b) => a + b;
export default class Calculator { /* ... */ }

// app.js
import Calculator, { add } from "./math.js";
\`\`\`

### for...of Loop

\`\`\`javascript
for (const item of ["a", "b", "c"]) {
  console.log(item);
}
\`\`\`

### Classes

\`\`\`javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return \`\${this.name} makes a sound.\`;
  }
}
class Dog extends Animal {
  speak() {
    return \`\${this.name} barks.\`;
  }
}
\`\`\`

These modern features make JavaScript more expressive, safer, and closer to other modern languages. Adopt them from day one to write cleaner code.`,
        codeExample: `// ES6+ Modern Features Demo

// Template literals
const lang = "JavaScript";
console.log(\`Learning \${lang} in \${new Date().getFullYear()}\`);

// Destructuring
const [x, y, ...rest] = [10, 20, 30, 40];
console.log(x, y, rest);  // 10 20 [30, 40]

// Spread
const defaults = { theme: "dark", lang: "en" };
const userPrefs = { ...defaults, lang: "fr" };
console.log(userPrefs);

// Optional chaining & nullish coalescing
const user = { name: "Alice", address: null };
const city = user?.address?.city ?? "Not provided";
console.log(\`City: \${city}\`);

// Map & Set
const wordCount = new Map();
"hello world hello".split(" ").forEach(w => {
  wordCount.set(w, (wordCount.get(w) || 0) + 1);
});
console.log(Object.fromEntries(wordCount));

// Classes
class Rectangle {
  constructor(w, h) { this.w = w; this.h = h; }
  area() { return this.w * this.h; }
}
const r = new Rectangle(5, 3);
console.log(\`Area: \${r.area()}\`);  // 15`,
        quiz: [
          {
            question: 'What does the nullish coalescing operator (??) check for?',
            options: [
              'Falsy values (0, "", false)',
              'Only null or undefined',
              'Truthy values',
            ],
            answer: 1,
          },
          {
            question: 'What does optional chaining (?.) return if a property is missing?',
            options: ['An error', 'null', 'undefined', 'false'],
            answer: 2,
          },
          {
            question: 'Which ES6 data structure stores only unique values?',
            options: ['Array', 'Map', 'Set', 'Object'],
            answer: 2,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COURSE 3: Java Fundamentals
  // ─────────────────────────────────────────────
  {
    title: 'Java Fundamentals',
    slug: 'java-fundamentals',
    description:
      'Build a solid foundation in Java — the industry-standard language for enterprise, Android, and backend development. Covers primitives, OOP, collections, exceptions, and functional-style programming.',
    difficulty: 'Beginner' as const,
    tags: ['Java', 'Language'],
    isPublished: true,
    lessons: [
      {
        title: 'Hello World & Primitive Types',
        order: 1,
        duration: 10,
        codeLanguage: 'java',
        content: `## Hello World & Primitive Types

Java is a **statically typed**, object-oriented language that runs on the Java Virtual Machine (JVM). Every Java program starts with a class that contains a \`main\` method.

### Your First Program

\`\`\`java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
\`\`\`

### Primitive Data Types

Java has **8 primitive types**:

| Type | Size | Range / Purpose |
|------|------|-----------------|
| \`byte\` | 1 byte | -128 to 127 |
| \`short\` | 2 bytes | -32,768 to 32,767 |
| \`int\` | 4 bytes | ~±2 billion |
| \`long\` | 8 bytes | very large integers |
| \`float\` | 4 bytes | decimal (less precise) |
| \`double\` | 8 bytes | decimal (more precise) |
| \`char\` | 2 bytes | single Unicode character |
| \`boolean\` | 1 bit | \`true\` or \`false\` |

\`\`\`java
int age = 25;
double pi = 3.14159;
char grade = 'A';
boolean isJavaFun = true;
long bigNumber = 9_000_000_000L;
\`\`\`

### Strings

Strings are **objects**, not primitives:

\`\`\`java
String name = "Alice";
int len = name.length();
String upper = name.toUpperCase();
boolean eq = name.equals("Alice");  // use .equals(), not ==
\`\`\`

### Type Casting

\`\`\`java
int x = 10;
double y = x;          // implicit (widening)
int z = (int) 9.99;    // explicit (narrowing) → 9
\`\`\`

### Constants

Use \`final\` for constants:

\`\`\`java
final double TAX_RATE = 0.07;
\`\`\`

### Key Takeaways

- Java is **strongly and statically typed** — every variable needs a declared type.
- Use \`.equals()\` for String comparison, not \`==\`.
- Underscore in numeric literals (e.g., \`1_000_000\`) improves readability.`,
        codeExample: `public class PrimitiveTypes {
    public static void main(String[] args) {
        // Primitive types
        int age = 25;
        double salary = 75_000.50;
        char initial = 'J';
        boolean employed = true;

        System.out.println("Age: " + age);
        System.out.println("Salary: $" + salary);
        System.out.println("Initial: " + initial);
        System.out.println("Employed: " + employed);

        // String operations
        String name = "Alice Johnson";
        System.out.println("Length: " + name.length());
        System.out.println("Upper: " + name.toUpperCase());
        System.out.println("Substring: " + name.substring(0, 5));
        System.out.println("Contains 'John': " + name.contains("John"));

        // Type casting
        int x = 10;
        double y = x;               // widening
        int z = (int) 3.99;         // narrowing -> 3
        System.out.println(y + ", " + z);
    }
}`,
        quiz: [
          {
            question: 'How many primitive types does Java have?',
            options: ['6', '7', '8', '10'],
            answer: 2,
          },
          {
            question: 'How should you compare two Strings in Java?',
            options: ['Using ==', 'Using .equals()', 'Using .compare()', 'Using ==='],
            answer: 1,
          },
          {
            question: 'What keyword makes a variable constant in Java?',
            options: ['const', 'final', 'static', 'immutable'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Object-Oriented Programming',
        order: 2,
        duration: 15,
        codeLanguage: 'java',
        content: `## Object-Oriented Programming in Java

Java is fundamentally an OOP language. The four pillars are **Encapsulation**, **Inheritance**, **Polymorphism**, and **Abstraction**.

### Classes & Objects

\`\`\`java
public class Car {
    private String make;
    private int year;

    public Car(String make, int year) {
        this.make = make;
        this.year = year;
    }

    public String getMake() { return make; }
    public int getYear() { return year; }
}
\`\`\`

### Encapsulation

Keep fields \`private\` and expose them through \`public\` getters/setters. This protects internal state.

### Inheritance

\`\`\`java
public class ElectricCar extends Car {
    private int batteryCapacity;

    public ElectricCar(String make, int year, int battery) {
        super(make, year);
        this.batteryCapacity = battery;
    }
}
\`\`\`

### Polymorphism

A single method can behave differently depending on the object:

\`\`\`java
Car myCar = new ElectricCar("Tesla", 2024, 100);
// myCar is treated as Car, but is actually ElectricCar
\`\`\`

- **Method Overriding**: subclass provides a specific implementation.
- **Method Overloading**: same method name, different parameters.

### Abstraction

Use \`abstract\` classes or \`interface\` to define contracts:

\`\`\`java
public interface Drawable {
    void draw();
}

public class Circle implements Drawable {
    public void draw() {
        System.out.println("Drawing a circle");
    }
}
\`\`\`

### The \`this\` and \`super\` Keywords

- \`this\` refers to the current instance.
- \`super\` refers to the parent class.

### Access Modifiers

| Modifier | Class | Package | Subclass | World |
|----------|-------|---------|----------|-------|
| \`public\` | ✅ | ✅ | ✅ | ✅ |
| \`protected\` | ✅ | ✅ | ✅ | ❌ |
| (default) | ✅ | ✅ | ❌ | ❌ |
| \`private\` | ✅ | ❌ | ❌ | ❌ |

OOP in Java is not optional — it's the foundation of every framework, library, and pattern you'll encounter.`,
        codeExample: `// Object-Oriented Programming Demo

abstract class Shape {
    String color;

    Shape(String color) {
        this.color = color;
    }

    abstract double area();

    @Override
    public String toString() {
        return color + " shape with area " + String.format("%.2f", area());
    }
}

class Circle extends Shape {
    double radius;

    Circle(String color, double radius) {
        super(color);
        this.radius = radius;
    }

    @Override
    double area() {
        return Math.PI * radius * radius;
    }
}

class Rectangle extends Shape {
    double width, height;

    Rectangle(String color, double w, double h) {
        super(color);
        this.width = w;
        this.height = h;
    }

    @Override
    double area() {
        return width * height;
    }
}

public class OOPDemo {
    public static void main(String[] args) {
        Shape[] shapes = {
            new Circle("Red", 5),
            new Rectangle("Blue", 4, 6),
            new Circle("Green", 3)
        };

        for (Shape s : shapes) {
            System.out.println(s);
        }
    }
}`,
        quiz: [
          {
            question: 'Which OOP pillar involves hiding internal details behind getters/setters?',
            options: ['Inheritance', 'Polymorphism', 'Encapsulation', 'Abstraction'],
            answer: 2,
          },
          {
            question: 'What keyword is used to inherit a class in Java?',
            options: ['inherits', 'implements', 'extends', 'super'],
            answer: 2,
          },
          {
            question: 'Can you instantiate an abstract class directly in Java?',
            options: ['Yes', 'No', 'Only with a constructor'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Collections Framework',
        order: 3,
        duration: 12,
        codeLanguage: 'java',
        content: `## Java Collections Framework

The Collections Framework provides data structures and algorithms to store and manipulate groups of objects efficiently.

### Core Interfaces

\`\`\`
Collection
├── List   (ordered, allows duplicates)
├── Set    (no duplicates)
└── Queue  (FIFO ordering)
Map        (key-value pairs, separate hierarchy)
\`\`\`

### ArrayList

Resizable array implementation of \`List\`:

\`\`\`java
List<String> names = new ArrayList<>();
names.add("Alice");
names.add("Bob");
names.add("Charlie");
System.out.println(names.get(0));  // Alice
names.remove(1);                   // removes "Bob"
\`\`\`

### LinkedList

Doubly-linked list — better for frequent insertions/deletions:

\`\`\`java
LinkedList<Integer> list = new LinkedList<>();
list.addFirst(1);
list.addLast(3);
list.add(1, 2);  // insert at index 1
\`\`\`

### HashMap

O(1) average lookup by key:

\`\`\`java
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 95);
scores.put("Bob", 87);
System.out.println(scores.get("Alice"));  // 95
scores.getOrDefault("Eve", 0);            // 0
\`\`\`

### HashSet

Stores unique elements with O(1) lookups:

\`\`\`java
Set<String> tags = new HashSet<>();
tags.add("java");
tags.add("java");  // duplicate ignored
System.out.println(tags.size());  // 1
\`\`\`

### Iterating Collections

\`\`\`java
// Enhanced for loop
for (String name : names) {
    System.out.println(name);
}

// forEach with lambda
names.forEach(name -> System.out.println(name));

// Iterating a Map
for (Map.Entry<String, Integer> e : scores.entrySet()) {
    System.out.println(e.getKey() + ": " + e.getValue());
}
\`\`\`

### Choosing the Right Collection

| Need | Use |
|------|-----|
| Index-based access | \`ArrayList\` |
| Frequent insert/delete | \`LinkedList\` |
| Key-value pairs | \`HashMap\` |
| Unique elements | \`HashSet\` |
| Sorted order | \`TreeMap\` / \`TreeSet\` |
| Thread-safe | \`ConcurrentHashMap\` |

The Collections Framework is indispensable. Choosing the right data structure can mean the difference between an O(1) lookup and an O(n) scan.`,
        codeExample: `import java.util.*;

public class CollectionsDemo {
    public static void main(String[] args) {
        // ArrayList
        List<String> fruits = new ArrayList<>(Arrays.asList("Apple", "Banana", "Cherry"));
        fruits.add("Date");
        System.out.println("Fruits: " + fruits);

        // HashMap
        Map<String, Integer> wordCount = new HashMap<>();
        String sentence = "the cat sat on the mat the cat";
        for (String word : sentence.split(" ")) {
            wordCount.put(word, wordCount.getOrDefault(word, 0) + 1);
        }
        System.out.println("Word counts: " + wordCount);

        // HashSet — unique elements
        Set<Integer> nums = new HashSet<>(Arrays.asList(1, 2, 2, 3, 3, 3));
        System.out.println("Unique nums: " + nums);  // [1, 2, 3]

        // Sorting
        List<Integer> numbers = Arrays.asList(5, 3, 8, 1, 9, 2);
        Collections.sort(numbers);
        System.out.println("Sorted: " + numbers);

        // Iterating a map
        wordCount.forEach((word, count) ->
            System.out.println("  " + word + " -> " + count)
        );
    }
}`,
        quiz: [
          {
            question: 'Which Java collection does NOT allow duplicate elements?',
            options: ['ArrayList', 'LinkedList', 'HashSet', 'HashMap'],
            answer: 2,
          },
          {
            question: 'What is the average time complexity of HashMap.get()?',
            options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
            answer: 2,
          },
          {
            question: 'Which class should you use for a sorted set?',
            options: ['HashSet', 'LinkedHashSet', 'TreeSet'],
            answer: 2,
          },
        ],
      },
      {
        title: 'Exception Handling',
        order: 4,
        duration: 10,
        codeLanguage: 'java',
        content: `## Exception Handling in Java

Exceptions are events that disrupt normal program flow. Java's exception mechanism lets you catch and handle these events gracefully.

### Exception Hierarchy

\`\`\`
Throwable
├── Error            (JVM errors — do not catch)
└── Exception
    ├── IOException  (checked)
    ├── SQLException (checked)
    └── RuntimeException (unchecked)
        ├── NullPointerException
        ├── ArrayIndexOutOfBoundsException
        └── ArithmeticException
\`\`\`

### Checked vs Unchecked

- **Checked exceptions** must be caught or declared with \`throws\`.
- **Unchecked exceptions** (RuntimeException subclasses) don't require explicit handling.

### try-catch-finally

\`\`\`java
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.err.println("Cannot divide by zero: " + e.getMessage());
} finally {
    System.out.println("Cleanup code runs here");
}
\`\`\`

### Multiple Catch Blocks

\`\`\`java
try {
    String s = null;
    s.length();
} catch (NullPointerException e) {
    System.err.println("Null pointer!");
} catch (Exception e) {
    System.err.println("General error: " + e.getMessage());
}
\`\`\`

### try-with-resources

Automatically closes resources implementing \`AutoCloseable\`:

\`\`\`java
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    String line;
    while ((line = br.readLine()) != null) {
        System.out.println(line);
    }
} catch (IOException e) {
    System.err.println("File error: " + e.getMessage());
}
\`\`\`

### Throwing Exceptions

\`\`\`java
public void withdraw(double amount) {
    if (amount <= 0) {
        throw new IllegalArgumentException("Amount must be positive");
    }
}
\`\`\`

### Custom Exceptions

\`\`\`java
public class InsufficientFundsException extends Exception {
    public InsufficientFundsException(String message) {
        super(message);
    }
}
\`\`\`

### Best Practices

- Catch specific exceptions, not generic \`Exception\`.
- Always use try-with-resources for I/O.
- Don't swallow exceptions silently (empty catch blocks).
- Use custom exceptions for domain-specific errors.`,
        codeExample: `public class ExceptionDemo {
    // Custom exception
    static class InvalidAgeException extends Exception {
        InvalidAgeException(String msg) { super(msg); }
    }

    static void validateAge(int age) throws InvalidAgeException {
        if (age < 0 || age > 150) {
            throw new InvalidAgeException("Age must be 0-150, got: " + age);
        }
        System.out.println("Valid age: " + age);
    }

    public static void main(String[] args) {
        // Basic try-catch
        try {
            int[] arr = {1, 2, 3};
            System.out.println(arr[5]);  // throws
        } catch (ArrayIndexOutOfBoundsException e) {
            System.err.println("Index error: " + e.getMessage());
        }

        // Multiple catch + finally
        try {
            String s = null;
            s.length();
        } catch (NullPointerException e) {
            System.err.println("Null pointer caught!");
        } finally {
            System.out.println("Finally block executed.");
        }

        // Custom exception
        try {
            validateAge(200);
        } catch (InvalidAgeException e) {
            System.err.println("Custom: " + e.getMessage());
        }

        // Successful validation
        try {
            validateAge(25);
        } catch (InvalidAgeException e) {
            System.err.println(e.getMessage());
        }
    }
}`,
        quiz: [
          {
            question: 'Which type of exception must be caught or declared in Java?',
            options: ['Unchecked exceptions', 'Runtime exceptions', 'Checked exceptions', 'Errors'],
            answer: 2,
          },
          {
            question: 'What does try-with-resources automatically do?',
            options: ['Catches all exceptions', 'Closes resources', 'Retries the operation', 'Logs the error'],
            answer: 1,
          },
          {
            question: 'Which block always executes regardless of exceptions?',
            options: ['try', 'catch', 'finally', 'throws'],
            answer: 2,
          },
        ],
      },
      {
        title: 'Streams & Lambda Expressions',
        order: 5,
        duration: 12,
        codeLanguage: 'java',
        content: `## Streams & Lambda Expressions

Java 8 introduced **lambda expressions** and the **Stream API**, enabling functional-style programming.

### Lambda Expressions

A lambda is a concise way to represent an anonymous function:

\`\`\`java
// Before Java 8
Comparator<String> cmp = new Comparator<String>() {
    public int compare(String a, String b) {
        return a.length() - b.length();
    }
};

// With lambda
Comparator<String> cmp = (a, b) -> a.length() - b.length();
\`\`\`

### Functional Interfaces

A functional interface has exactly one abstract method. Common ones:

| Interface | Method | Purpose |
|-----------|--------|---------|
| \`Predicate<T>\` | \`test(T)\` | Returns boolean |
| \`Function<T,R>\` | \`apply(T)\` | Transforms T → R |
| \`Consumer<T>\` | \`accept(T)\` | Consumes T, returns void |
| \`Supplier<T>\` | \`get()\` | Produces T |

### The Stream API

Streams process collections in a declarative, pipeline fashion:

\`\`\`java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "Dave");

List<String> result = names.stream()
    .filter(n -> n.length() > 3)
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());
// [ALICE, CHARLIE, DAVE]
\`\`\`

### Common Stream Operations

- **\`filter()\`** — keep elements matching a predicate
- **\`map()\`** — transform each element
- **\`sorted()\`** — sort elements
- **\`reduce()\`** — combine elements into a single result
- **\`collect()\`** — gather results into a collection
- **\`forEach()\`** — perform an action on each element

### Reducing

\`\`\`java
int sum = IntStream.rangeClosed(1, 100).sum();  // 5050

Optional<Integer> max = numbers.stream()
    .reduce(Integer::max);
\`\`\`

### Method References

Shorthand for lambdas that call an existing method:

\`\`\`java
names.forEach(System.out::println);
// equivalent to: names.forEach(n -> System.out.println(n));
\`\`\`

### Parallel Streams

For CPU-intensive work, use \`parallelStream()\` to leverage multi-core processors:

\`\`\`java
long count = list.parallelStream()
    .filter(n -> isPrime(n))
    .count();
\`\`\`

Streams and lambdas bring the power of functional programming to Java, making code more readable and often more performant.`,
        codeExample: `import java.util.*;
import java.util.stream.*;

public class StreamsDemo {
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(5, 3, 8, 1, 9, 2, 7, 4, 6);

        // Filter, map, collect
        List<Integer> evenDoubled = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * 2)
            .sorted()
            .collect(Collectors.toList());
        System.out.println("Even doubled: " + evenDoubled);

        // Reduce — sum
        int sum = numbers.stream().reduce(0, Integer::sum);
        System.out.println("Sum: " + sum);

        // String processing
        List<String> words = Arrays.asList("hello", "world", "java", "streams");
        String joined = words.stream()
            .filter(w -> w.length() > 4)
            .map(String::toUpperCase)
            .collect(Collectors.joining(", "));
        System.out.println("Joined: " + joined);

        // Statistics
        IntSummaryStatistics stats = numbers.stream()
            .mapToInt(Integer::intValue)
            .summaryStatistics();
        System.out.println("Stats: " + stats);

        // Grouping
        Map<Boolean, List<Integer>> partition = numbers.stream()
            .collect(Collectors.partitioningBy(n -> n > 5));
        System.out.println("Partitioned: " + partition);
    }
}`,
        quiz: [
          {
            question: 'What is a functional interface in Java?',
            options: [
              'An interface with no methods',
              'An interface with exactly one abstract method',
              'An interface with multiple default methods',
            ],
            answer: 1,
          },
          {
            question: 'Which stream operation transforms each element?',
            options: ['filter()', 'map()', 'reduce()', 'collect()'],
            answer: 1,
          },
          {
            question: 'What does System.out::println represent?',
            options: ['A lambda expression', 'A method reference', 'A static import'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COURSE 4: C++ Crash Course
  // ─────────────────────────────────────────────
  {
    title: 'C++ Crash Course',
    slug: 'cpp-crash-course',
    description:
      'A fast-paced introduction to C++ covering syntax, pointers, the Standard Template Library, and object-oriented programming. Ideal for programmers who want to learn C++ quickly.',
    difficulty: 'Beginner' as const,
    tags: ['C++', 'Language'],
    isPublished: true,
    lessons: [
      {
        title: 'Syntax & I/O',
        order: 1,
        duration: 10,
        codeLanguage: 'cpp',
        content: `## C++ Syntax & I/O

C++ is a powerful, compiled language used in systems programming, game development, and competitive programming. It extends C with classes, templates, and a rich standard library.

### Your First Program

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
\`\`\`

### Variables & Data Types

\`\`\`cpp
int age = 25;
double pi = 3.14159;
char grade = 'A';
bool isActive = true;
string name = "Alice";  // requires <string>
\`\`\`

### Input & Output

\`\`\`cpp
int x;
cout << "Enter a number: ";
cin >> x;
cout << "You entered: " << x << endl;
\`\`\`

### Control Flow

\`\`\`cpp
if (x > 0) {
    cout << "Positive";
} else if (x == 0) {
    cout << "Zero";
} else {
    cout << "Negative";
}

for (int i = 0; i < 5; i++) {
    cout << i << " ";
}

while (x > 0) {
    x--;
}
\`\`\`

### Functions

\`\`\`cpp
int add(int a, int b) {
    return a + b;
}

// Default parameters
void greet(string name = "World") {
    cout << "Hello, " << name << "!" << endl;
}
\`\`\`

### Fast I/O for Competitive Programming

\`\`\`cpp
ios_base::sync_with_stdio(false);
cin.tie(NULL);
\`\`\`

### Key Differences from C

- \`cout\`/\`cin\` instead of \`printf\`/\`scanf\`
- \`string\` type instead of \`char[]\`
- Namespaces (\`std::\`)
- References and function overloading
- Classes and templates

C++ gives you the performance of C with the abstractions of a modern language. Understanding its syntax is the gateway to everything else.`,
        codeExample: `#include <iostream>
#include <string>
using namespace std;

// Function with default parameter
int power(int base, int exp = 2) {
    int result = 1;
    for (int i = 0; i < exp; i++) {
        result *= base;
    }
    return result;
}

int main() {
    // Variables & output
    string name = "Alice";
    int age = 25;
    double gpa = 3.85;

    cout << "Name: " << name << endl;
    cout << "Age: " << age << endl;
    cout << "GPA: " << gpa << endl;

    // Loops
    cout << "Squares: ";
    for (int i = 1; i <= 5; i++) {
        cout << power(i) << " ";  // 1 4 9 16 25
    }
    cout << endl;

    // Custom exponent
    cout << "2^10 = " << power(2, 10) << endl;  // 1024

    // String operations
    string greeting = "Hello, " + name + "!";
    cout << greeting << " (length: " << greeting.length() << ")" << endl;

    return 0;
}`,
        quiz: [
          {
            question: 'Which header is needed for cout and cin?',
            options: ['<stdio.h>', '<iostream>', '<string>', '<cstdlib>'],
            answer: 1,
          },
          {
            question: 'What does `endl` do in C++?',
            options: ['Ends the program', 'Inserts a newline and flushes', 'Declares a variable', 'Defines a constant'],
            answer: 1,
          },
          {
            question: 'What is the return type of main() in C++?',
            options: ['void', 'int', 'bool', 'string'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Pointers & References',
        order: 2,
        duration: 15,
        codeLanguage: 'cpp',
        content: `## Pointers & References

Pointers and references are fundamental to C++. They give you direct control over memory and enable efficient function parameter passing.

### Pointers

A pointer stores the **memory address** of a variable:

\`\`\`cpp
int x = 42;
int* ptr = &x;   // ptr holds the address of x
cout << *ptr;     // dereference: prints 42
*ptr = 100;       // modifies x through the pointer
cout << x;        // 100
\`\`\`

### Pointer Arithmetic

\`\`\`cpp
int arr[] = {10, 20, 30, 40};
int* p = arr;
cout << *(p + 2);  // 30 — move 2 ints forward
\`\`\`

### Null Pointers

\`\`\`cpp
int* p = nullptr;  // C++11 null pointer
if (p == nullptr) {
    cout << "Pointer is null" << endl;
}
\`\`\`

### References

A reference is an **alias** for an existing variable:

\`\`\`cpp
int x = 10;
int& ref = x;   // ref IS x
ref = 20;
cout << x;       // 20
\`\`\`

### Pass by Value vs Reference vs Pointer

\`\`\`cpp
void byValue(int x)   { x = 99; }      // copy — original unchanged
void byRef(int& x)    { x = 99; }      // alias — original modified
void byPtr(int* x)    { *x = 99; }     // address — original modified
\`\`\`

### Dynamic Memory

\`\`\`cpp
int* arr = new int[5];    // allocate on heap
for (int i = 0; i < 5; i++) arr[i] = i * 10;
delete[] arr;              // free memory — MUST do this!
\`\`\`

### Smart Pointers (Modern C++)

Avoid raw \`new\`/\`delete\` — use smart pointers:

\`\`\`cpp
#include <memory>
unique_ptr<int> p1 = make_unique<int>(42);
shared_ptr<int> p2 = make_shared<int>(100);
// memory is automatically freed
\`\`\`

### Key Rules

- Always initialize pointers (use \`nullptr\` if no target yet).
- Every \`new\` must have a matching \`delete\`.
- Prefer references over pointers when possible.
- Prefer smart pointers over raw pointers in modern C++.`,
        codeExample: `#include <iostream>
#include <memory>
using namespace std;

// Pass by reference — modifies original
void doubleValue(int& x) {
    x *= 2;
}

// Pass by pointer
void tripleValue(int* x) {
    if (x != nullptr) {
        *x *= 3;
    }
}

// Swap using pointers
void swapPtr(int* a, int* b) {
    int temp = *a;
    *a = *b;
    *b = temp;
}

int main() {
    // Basic pointer usage
    int x = 10;
    int* ptr = &x;
    cout << "Value: " << *ptr << ", Address: " << ptr << endl;

    // Pass by reference
    doubleValue(x);
    cout << "After doubleValue: " << x << endl;  // 20

    // Pass by pointer
    tripleValue(&x);
    cout << "After tripleValue: " << x << endl;  // 60

    // Swap
    int a = 5, b = 9;
    swapPtr(&a, &b);
    cout << "After swap: a=" << a << ", b=" << b << endl;

    // Smart pointers
    unique_ptr<int> smart = make_unique<int>(42);
    cout << "Smart pointer: " << *smart << endl;
    // No need to delete — freed automatically

    return 0;
}`,
        quiz: [
          {
            question: 'What does the & operator do when used with a variable name?',
            options: [
              'Dereferences the pointer',
              'Returns the memory address',
              'Creates a copy',
              'Declares a reference',
            ],
            answer: 1,
          },
          {
            question: 'What happens if you forget to call delete after new?',
            options: ['Compile error', 'Memory leak', 'Segmentation fault', 'Nothing'],
            answer: 1,
          },
          {
            question: 'Which smart pointer allows only one owner of the resource?',
            options: ['shared_ptr', 'weak_ptr', 'unique_ptr', 'auto_ptr'],
            answer: 2,
          },
        ],
      },
      {
        title: 'STL Containers & Iterators',
        order: 3,
        duration: 12,
        codeLanguage: 'cpp',
        content: `## STL Containers & Iterators

The **Standard Template Library (STL)** provides generic, reusable data structures and algorithms. It's what makes C++ productive.

### vector — Dynamic Array

\`\`\`cpp
#include <vector>
vector<int> v = {1, 2, 3};
v.push_back(4);
v.pop_back();
cout << v.size();    // 3
cout << v[0];        // 1
\`\`\`

### map — Sorted Key-Value Pairs

\`\`\`cpp
#include <map>
map<string, int> scores;
scores["Alice"] = 95;
scores["Bob"] = 87;

for (auto& [name, score] : scores) {
    cout << name << ": " << score << endl;
}
\`\`\`

### unordered_map — Hash Map (O(1) average)

\`\`\`cpp
#include <unordered_map>
unordered_map<string, int> freq;
freq["hello"]++;
freq["world"]++;
\`\`\`

### set & unordered_set

\`\`\`cpp
set<int> s = {3, 1, 4, 1, 5};     // sorted, unique: {1, 3, 4, 5}
unordered_set<int> us = {3, 1, 4}; // hash-based, unique
\`\`\`

### stack & queue

\`\`\`cpp
#include <stack>
#include <queue>

stack<int> st;
st.push(1); st.push(2);
cout << st.top();  // 2
st.pop();

queue<int> q;
q.push(1); q.push(2);
cout << q.front();  // 1
q.pop();
\`\`\`

### priority_queue (Max-Heap)

\`\`\`cpp
priority_queue<int> pq;
pq.push(3); pq.push(1); pq.push(4);
cout << pq.top();  // 4

// Min-heap
priority_queue<int, vector<int>, greater<int>> minPQ;
\`\`\`

### Iterators

Iterators provide a uniform way to traverse containers:

\`\`\`cpp
vector<int> v = {10, 20, 30};
for (auto it = v.begin(); it != v.end(); ++it) {
    cout << *it << " ";
}
\`\`\`

### STL Algorithms

\`\`\`cpp
#include <algorithm>
sort(v.begin(), v.end());
reverse(v.begin(), v.end());
auto it = find(v.begin(), v.end(), 20);
int cnt = count(v.begin(), v.end(), 10);
\`\`\`

The STL is one of C++'s biggest advantages. Mastering it means you rarely need to implement basic data structures from scratch.`,
        codeExample: `#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <algorithm>
#include <numeric>
using namespace std;

int main() {
    // Vector
    vector<int> nums = {5, 3, 8, 1, 9, 2, 7};
    sort(nums.begin(), nums.end());
    cout << "Sorted: ";
    for (int n : nums) cout << n << " ";
    cout << endl;

    // Accumulate (sum)
    int sum = accumulate(nums.begin(), nums.end(), 0);
    cout << "Sum: " << sum << endl;

    // Map — word frequency
    map<string, int> freq;
    vector<string> words = {"hello", "world", "hello", "cpp", "world", "hello"};
    for (const auto& w : words) freq[w]++;

    cout << "Frequencies:" << endl;
    for (auto& [word, count] : freq) {
        cout << "  " << word << ": " << count << endl;
    }

    // Set — unique elements
    set<int> unique_nums(nums.begin(), nums.end());
    cout << "Unique count: " << unique_nums.size() << endl;

    // Find and binary search
    auto it = find(nums.begin(), nums.end(), 7);
    if (it != nums.end()) {
        cout << "Found 7 at index: " << distance(nums.begin(), it) << endl;
    }

    return 0;
}`,
        quiz: [
          {
            question: 'What is the time complexity of unordered_map lookup on average?',
            options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
            answer: 2,
          },
          {
            question: 'Which STL container is a max-heap by default?',
            options: ['queue', 'stack', 'priority_queue', 'set'],
            answer: 2,
          },
          {
            question: 'What header is needed for sort() and find()?',
            options: ['<vector>', '<algorithm>', '<functional>', '<iterator>'],
            answer: 1,
          },
        ],
      },
      {
        title: 'OOP in C++',
        order: 4,
        duration: 12,
        codeLanguage: 'cpp',
        content: `## Object-Oriented Programming in C++

C++ supports full OOP with classes, inheritance, polymorphism, and operator overloading — all with the performance of a compiled language.

### Classes & Objects

\`\`\`cpp
class Rectangle {
private:
    double width, height;
public:
    Rectangle(double w, double h) : width(w), height(h) {}
    double area() const { return width * height; }
    double perimeter() const { return 2 * (width + height); }
};

Rectangle r(5.0, 3.0);
cout << r.area();  // 15
\`\`\`

### Constructor Initializer Lists

Preferred over assignment in the constructor body — especially for const members and references:

\`\`\`cpp
class Point {
    const int x, y;
public:
    Point(int x, int y) : x(x), y(y) {}
};
\`\`\`

### Inheritance

\`\`\`cpp
class Shape {
public:
    virtual double area() const = 0;   // pure virtual
    virtual ~Shape() = default;         // virtual destructor
};

class Circle : public Shape {
    double radius;
public:
    Circle(double r) : radius(r) {}
    double area() const override {
        return 3.14159 * radius * radius;
    }
};
\`\`\`

### Polymorphism

Use pointers or references to the base class for runtime polymorphism:

\`\`\`cpp
Shape* s = new Circle(5);
cout << s->area();  // calls Circle::area()
delete s;
\`\`\`

### Operator Overloading

\`\`\`cpp
class Vector2D {
public:
    double x, y;
    Vector2D(double x, double y) : x(x), y(y) {}

    Vector2D operator+(const Vector2D& other) const {
        return {x + other.x, y + other.y};
    }

    friend ostream& operator<<(ostream& os, const Vector2D& v) {
        os << "(" << v.x << ", " << v.y << ")";
        return os;
    }
};
\`\`\`

### The Rule of Three/Five

If your class manages resources, define:
- Destructor
- Copy constructor / Copy assignment operator
- (C++11) Move constructor / Move assignment operator

### Best Practices

- Use \`override\` to catch errors in virtual function signatures.
- Always declare destructors \`virtual\` in base classes.
- Prefer composition over inheritance.
- Use \`const\` methods when they don't modify state.`,
        codeExample: `#include <iostream>
#include <vector>
#include <memory>
using namespace std;

// Abstract base class
class Shape {
public:
    virtual double area() const = 0;
    virtual string name() const = 0;
    virtual ~Shape() = default;

    void print() const {
        cout << name() << " — area: " << area() << endl;
    }
};

class Circle : public Shape {
    double radius;
public:
    Circle(double r) : radius(r) {}
    double area() const override { return 3.14159 * radius * radius; }
    string name() const override { return "Circle"; }
};

class Rectangle : public Shape {
    double w, h;
public:
    Rectangle(double w, double h) : w(w), h(h) {}
    double area() const override { return w * h; }
    string name() const override { return "Rectangle"; }
};

class Triangle : public Shape {
    double base, height;
public:
    Triangle(double b, double h) : base(b), height(h) {}
    double area() const override { return 0.5 * base * height; }
    string name() const override { return "Triangle"; }
};

int main() {
    // Polymorphism with smart pointers
    vector<unique_ptr<Shape>> shapes;
    shapes.push_back(make_unique<Circle>(5.0));
    shapes.push_back(make_unique<Rectangle>(4.0, 6.0));
    shapes.push_back(make_unique<Triangle>(3.0, 8.0));

    double totalArea = 0;
    for (const auto& s : shapes) {
        s->print();
        totalArea += s->area();
    }
    cout << "Total area: " << totalArea << endl;

    return 0;
}`,
        quiz: [
          {
            question: 'What does `= 0` mean in a virtual function declaration?',
            options: [
              'Sets the return value to 0',
              'Makes the function pure virtual (abstract)',
              'Deletes the function',
            ],
            answer: 1,
          },
          {
            question: 'Why should base class destructors be virtual in C++?',
            options: [
              'To allow constructor chaining',
              'To ensure derived class destructors are called during deletion',
              'To improve performance',
            ],
            answer: 1,
          },
          {
            question: 'Which keyword in C++11 ensures you correctly override a virtual function?',
            options: ['virtual', 'final', 'override', 'explicit'],
            answer: 2,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COURSE 5: Data Structures Mastery
  // ─────────────────────────────────────────────
  {
    title: 'Data Structures Mastery',
    slug: 'data-structures-mastery',
    description:
      'Deeply understand the data structures that power every algorithm. From arrays and linked lists to trees and hash tables — learn when and why to use each one.',
    difficulty: 'Intermediate' as const,
    tags: ['Data Structures', 'Fundamentals'],
    isPublished: true,
    lessons: [
      {
        title: 'Arrays & Strings',
        order: 1,
        duration: 10,
        codeLanguage: 'python',
        content: `## Arrays & Strings

Arrays are the simplest and most fundamental data structure — a contiguous block of memory holding elements of the same type.

### How Arrays Work in Memory

Elements are stored at consecutive memory addresses. Given the base address and the element size, the address of any element can be calculated in O(1):

\`\`\`
address(arr[i]) = base_address + i * element_size
\`\`\`

This is why array access is **O(1)** — constant time.

### Time Complexities

| Operation | Time |
|-----------|------|
| Access by index | O(1) |
| Search (unsorted) | O(n) |
| Search (sorted) | O(log n) — binary search |
| Insert at end | O(1) amortized |
| Insert at arbitrary position | O(n) |
| Delete | O(n) |

### Common Array Techniques

1. **Two Pointers**: Use two indices to traverse from both ends.
2. **Sliding Window**: Maintain a window of elements for subarray problems.
3. **Prefix Sum**: Precompute cumulative sums for range queries.
4. **Kadane's Algorithm**: Find maximum subarray sum in O(n).

### Strings as Arrays

Strings are essentially arrays of characters. Key operations:

\`\`\`python
s = "hello"
# Reverse
print(s[::-1])       # "olleh"
# Check palindrome
print(s == s[::-1])  # False
# Character frequency
from collections import Counter
print(Counter(s))    # Counter({'l': 2, 'h': 1, 'e': 1, 'o': 1})
\`\`\`

### Classic Problems

- **Two Sum**: Find two numbers that add up to a target.
- **Best Time to Buy and Sell Stock**: Maximize profit with one buy/sell.
- **Maximum Subarray (Kadane's)**: Find contiguous subarray with maximum sum.
- **Valid Anagram**: Check if two strings are anagrams.

### Key Insight

Most array problems can be solved efficiently with sorting, hashing, or two-pointer techniques. Before jumping to complex solutions, ask: "Can I sort it? Can I use a hash map? Can I use two pointers?"`,
        codeExample: `# Arrays & Strings — Classic Algorithms

# 1. Two Sum — O(n) with hash map
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

print("Two Sum:", two_sum([2, 7, 11, 15], 9))  # [0, 1]

# 2. Kadane's Algorithm — Maximum Subarray Sum
def max_subarray(nums):
    max_sum = current = nums[0]
    for num in nums[1:]:
        current = max(num, current + num)
        max_sum = max(max_sum, current)
    return max_sum

print("Max subarray:", max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # 6

# 3. Valid Anagram
def is_anagram(s, t):
    from collections import Counter
    return Counter(s) == Counter(t)

print("Anagram:", is_anagram("listen", "silent"))  # True

# 4. Reverse String in place
def reverse_string(s):
    chars = list(s)
    left, right = 0, len(chars) - 1
    while left < right:
        chars[left], chars[right] = chars[right], chars[left]
        left += 1
        right -= 1
    return "".join(chars)

print("Reversed:", reverse_string("algorithm"))`,
        quiz: [
          {
            question: 'What is the time complexity of accessing an element by index in an array?',
            options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
            answer: 2,
          },
          {
            question: 'What technique does Kadane\'s algorithm use?',
            options: ['Divide and conquer', 'Dynamic programming', 'Greedy', 'Backtracking'],
            answer: 1,
          },
          {
            question: 'What is the optimal time complexity for Two Sum using a hash map?',
            options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'],
            answer: 2,
          },
        ],
      },
      {
        title: 'Linked Lists (Singly & Doubly)',
        order: 2,
        duration: 12,
        codeLanguage: 'python',
        content: `## Linked Lists

A linked list is a linear data structure where each element (node) contains data and a pointer to the next node. Unlike arrays, elements are **not stored contiguously** in memory.

### Singly Linked List

Each node has \`data\` and a \`next\` pointer:

\`\`\`
[data|next] -> [data|next] -> [data|next] -> None
\`\`\`

### Doubly Linked List

Each node has \`prev\`, \`data\`, and \`next\`:

\`\`\`
None <- [prev|data|next] <-> [prev|data|next] <-> [prev|data|next] -> None
\`\`\`

### Time Complexities

| Operation | Singly | Doubly |
|-----------|--------|--------|
| Access by index | O(n) | O(n) |
| Insert at head | O(1) | O(1) |
| Insert at tail | O(n)* | O(1) |
| Delete at head | O(1) | O(1) |
| Delete given node | O(n) | O(1) |
| Search | O(n) | O(n) |

*O(1) if you maintain a tail pointer.

### When to Use Linked Lists

- Frequent insertions/deletions at arbitrary positions.
- Unknown or highly variable size.
- Implementing stacks, queues, or LRU caches.

### Classic Linked List Techniques

1. **Fast & Slow Pointers** — detect cycles, find the middle.
2. **Dummy Head Node** — simplifies edge cases for insertions/deletions.
3. **Reverse a Linked List** — fundamental operation.
4. **Merge Two Sorted Lists** — classic merge technique.

### Reversing a Linked List

\`\`\`python
def reverse(head):
    prev = None
    current = head
    while current:
        next_node = current.next
        current.next = prev
        prev = current
        current = next_node
    return prev
\`\`\`

### Detecting a Cycle (Floyd's Algorithm)

\`\`\`python
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False
\`\`\`

Linked lists are foundational. They teach pointer manipulation and form the basis of more complex structures like trees and graphs.`,
        codeExample: `# Linked List Implementation & Operations

class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node

    def prepend(self, data):
        new_node = Node(data)
        new_node.next = self.head
        self.head = new_node

    def delete(self, data):
        if not self.head:
            return
        if self.head.data == data:
            self.head = self.head.next
            return
        current = self.head
        while current.next and current.next.data != data:
            current = current.next
        if current.next:
            current.next = current.next.next

    def reverse(self):
        prev = None
        current = self.head
        while current:
            next_node = current.next
            current.next = prev
            prev = current
            current = next_node
        self.head = prev

    def display(self):
        elements = []
        current = self.head
        while current:
            elements.append(str(current.data))
            current = current.next
        print(" -> ".join(elements) + " -> None")

# Demo
ll = LinkedList()
for val in [1, 2, 3, 4, 5]:
    ll.append(val)

print("Original:")
ll.display()       # 1 -> 2 -> 3 -> 4 -> 5 -> None

ll.reverse()
print("Reversed:")
ll.display()       # 5 -> 4 -> 3 -> 2 -> 1 -> None

ll.delete(3)
print("After deleting 3:")
ll.display()       # 5 -> 4 -> 2 -> 1 -> None`,
        quiz: [
          {
            question: 'What is the time complexity of inserting at the head of a singly linked list?',
            options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
            answer: 2,
          },
          {
            question: "What algorithm detects cycles in a linked list using two pointers?",
            options: ["Dijkstra's", "Floyd's Tortoise and Hare", "Kadane's", "Binary search"],
            answer: 1,
          },
          {
            question: 'What extra pointer does a doubly linked list node have compared to a singly linked list?',
            options: ['random', 'prev', 'parent', 'child'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Stacks & Queues',
        order: 3,
        duration: 10,
        codeLanguage: 'python',
        content: `## Stacks & Queues

Stacks and queues are abstract data types that restrict how elements are added and removed, making them useful for specific problem patterns.

### Stack — LIFO (Last In, First Out)

Think of a stack of plates — you can only add/remove from the top.

| Operation | Time |
|-----------|------|
| push(item) | O(1) |
| pop() | O(1) |
| peek()/top() | O(1) |
| isEmpty() | O(1) |

### Stack Applications

- **Balanced Parentheses**: Check if brackets are matched.
- **Expression Evaluation**: Infix to postfix conversion.
- **Undo/Redo**: Text editors use stacks.
- **DFS**: Depth-first search uses a stack (implicitly via recursion).
- **Call Stack**: Function calls are managed on the stack.

### Queue — FIFO (First In, First Out)

Think of a line at a store — first person in line is served first.

| Operation | Time |
|-----------|------|
| enqueue(item) | O(1) |
| dequeue() | O(1) |
| front() | O(1) |
| isEmpty() | O(1) |

### Queue Applications

- **BFS**: Breadth-first search uses a queue.
- **Task Scheduling**: CPU schedulers, print queues.
- **Rate Limiting**: Sliding window of requests.
- **Cache**: LRU caches combine a queue with a hash map.

### Deque (Double-Ended Queue)

Allows insertion and removal from both ends in O(1):

\`\`\`python
from collections import deque
d = deque([1, 2, 3])
d.appendleft(0)
d.append(4)
d.popleft()
d.pop()
\`\`\`

### Classic Problem: Valid Parentheses

\`\`\`python
def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            if not stack or stack[-1] != mapping[char]:
                return False
            stack.pop()
        else:
            stack.append(char)
    return len(stack) == 0
\`\`\`

Stacks and queues appear everywhere in computer science. Recognizing when a problem has LIFO or FIFO semantics is the first step to an efficient solution.`,
        codeExample: `# Stacks & Queues Demo
from collections import deque

# --- Stack using a list ---
class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if self.is_empty():
            raise IndexError("Stack is empty")
        return self._items.pop()

    def peek(self):
        return self._items[-1]

    def is_empty(self):
        return len(self._items) == 0

    def size(self):
        return len(self._items)

# Valid Parentheses
def is_valid_parens(s):
    stack = Stack()
    pairs = {')': '(', '}': '{', ']': '['}
    for ch in s:
        if ch in '({[':
            stack.push(ch)
        elif ch in ')}]':
            if stack.is_empty() or stack.peek() != pairs[ch]:
                return False
            stack.pop()
    return stack.is_empty()

print(is_valid_parens("({[]})"))  # True
print(is_valid_parens("({[)"))    # False

# --- Queue using deque ---
class Queue:
    def __init__(self):
        self._items = deque()

    def enqueue(self, item):
        self._items.append(item)

    def dequeue(self):
        return self._items.popleft()

    def front(self):
        return self._items[0]

    def is_empty(self):
        return len(self._items) == 0

# BFS simulation
q = Queue()
for task in ["Task A", "Task B", "Task C"]:
    q.enqueue(task)

while not q.is_empty():
    print(f"Processing: {q.dequeue()}")`,
        quiz: [
          {
            question: 'Which principle does a stack follow?',
            options: ['FIFO', 'LIFO', 'Priority', 'Random access'],
            answer: 1,
          },
          {
            question: 'Which traversal algorithm uses a queue?',
            options: ['DFS', 'BFS', 'Binary Search', 'Merge Sort'],
            answer: 1,
          },
          {
            question: 'What data structure would you use to check balanced parentheses?',
            options: ['Queue', 'Stack', 'Linked List', 'Array'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Trees & Binary Search Trees',
        order: 4,
        duration: 15,
        codeLanguage: 'python',
        content: `## Trees & Binary Search Trees

A **tree** is a hierarchical data structure made up of nodes connected by edges. It's one of the most important structures in computer science.

### Tree Terminology

- **Root**: Top node (no parent)
- **Leaf**: Node with no children
- **Depth**: Distance from root to node
- **Height**: Distance from node to deepest leaf
- **Subtree**: A node and all its descendants

### Binary Tree

Each node has at most **two** children (left and right):

\`\`\`python
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None
\`\`\`

### Binary Search Tree (BST)

A BST maintains the invariant: left child < parent < right child. This enables O(log n) average search, insert, and delete.

### BST Operations

| Operation | Average | Worst (unbalanced) |
|-----------|---------|-------------------|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

### Tree Traversals

There are four main ways to visit all nodes:

1. **In-order** (Left, Root, Right) — gives sorted order for BST
2. **Pre-order** (Root, Left, Right) — useful for serialization
3. **Post-order** (Left, Right, Root) — useful for deletion
4. **Level-order** (BFS) — visit level by level

\`\`\`python
def inorder(node):
    if node:
        inorder(node.left)
        print(node.val, end=" ")
        inorder(node.right)
\`\`\`

### Self-Balancing Trees

To avoid O(n) worst case, use self-balancing trees:
- **AVL Tree**: Strict balance (height difference ≤ 1)
- **Red-Black Tree**: Relaxed balance (used in Java's TreeMap)

### Common Tree Problems

- Maximum/minimum depth
- Check if a tree is balanced
- Lowest Common Ancestor (LCA)
- Validate BST
- Serialize and deserialize

Trees are everywhere — file systems, databases (B-trees), DOM, and expression parsers all use tree structures.`,
        codeExample: `# Binary Search Tree Implementation
from collections import deque

class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

class BST:
    def __init__(self):
        self.root = None

    def insert(self, val):
        self.root = self._insert(self.root, val)

    def _insert(self, node, val):
        if not node:
            return TreeNode(val)
        if val < node.val:
            node.left = self._insert(node.left, val)
        elif val > node.val:
            node.right = self._insert(node.right, val)
        return node

    def search(self, val):
        return self._search(self.root, val)

    def _search(self, node, val):
        if not node:
            return False
        if val == node.val:
            return True
        elif val < node.val:
            return self._search(node.left, val)
        else:
            return self._search(node.right, val)

    def inorder(self):
        result = []
        self._inorder(self.root, result)
        return result

    def _inorder(self, node, result):
        if node:
            self._inorder(node.left, result)
            result.append(node.val)
            self._inorder(node.right, result)

    def level_order(self):
        if not self.root:
            return []
        result, queue = [], deque([self.root])
        while queue:
            node = queue.popleft()
            result.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        return result

# Demo
bst = BST()
for val in [8, 3, 10, 1, 6, 14, 4, 7]:
    bst.insert(val)

print("In-order:   ", bst.inorder())      # [1, 3, 4, 6, 7, 8, 10, 14]
print("Level-order:", bst.level_order())   # [8, 3, 10, 1, 6, 14, 4, 7]
print("Search 6:   ", bst.search(6))      # True
print("Search 5:   ", bst.search(5))      # False`,
        quiz: [
          {
            question: 'What traversal of a BST gives elements in sorted order?',
            options: ['Pre-order', 'Post-order', 'In-order', 'Level-order'],
            answer: 2,
          },
          {
            question: 'What is the worst-case time complexity of search in an unbalanced BST?',
            options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
            answer: 2,
          },
          {
            question: 'Which self-balancing BST is used internally by Java\'s TreeMap?',
            options: ['AVL Tree', 'Red-Black Tree', 'B-Tree', 'Splay Tree'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Hash Tables & Hash Maps',
        order: 5,
        duration: 10,
        codeLanguage: 'python',
        content: `## Hash Tables & Hash Maps

A hash table (or hash map) maps **keys to values** using a hash function. It is one of the most frequently used data structures because of its O(1) average-case operations.

### How Hashing Works

1. A **hash function** converts a key into an integer (the hash code).
2. The hash code is mapped to a **bucket index** using modulo: \`index = hash(key) % table_size\`.
3. The value is stored at that index.

### Collision Resolution

When two keys hash to the same index, we have a **collision**. Common strategies:

- **Chaining**: Each bucket holds a linked list of entries.
- **Open Addressing**: Probe for the next available slot (linear probing, quadratic probing, double hashing).

### Time Complexities

| Operation | Average | Worst |
|-----------|---------|-------|
| Insert | O(1) | O(n) |
| Lookup | O(1) | O(n) |
| Delete | O(1) | O(n) |

Worst case occurs when all keys hash to the same bucket.

### Python's dict

Python dictionaries are hash maps internally:

\`\`\`python
scores = {"Alice": 95, "Bob": 87}
scores["Charlie"] = 92
print(scores.get("Dave", 0))  # 0 (default)
\`\`\`

### Common Hash Map Patterns

1. **Frequency counting**: Count occurrences of elements.
2. **Two Sum**: Store complements for O(n) lookup.
3. **Grouping**: Group anagrams by sorted key.
4. **Caching / Memoization**: Store computed results.

### Load Factor

\`load_factor = n / table_size\`. When it exceeds a threshold (e.g., 0.75), the table is **resized** (doubled) and all entries are **rehashed**.

### Hash Maps vs Other Structures

| Feature | Hash Map | BST (TreeMap) | Array |
|---------|----------|---------------|-------|
| Lookup | O(1) avg | O(log n) | O(n) |
| Ordered? | No | Yes | By index |
| Key type | Hashable | Comparable | Integer index |

Hash maps are arguably the single most important data structure for coding interviews. If you can solve a problem with a hash map, it's almost always the interviewer's expected approach.`,
        codeExample: `# Hash Table — Manual Implementation + dict Patterns

class HashTable:
    def __init__(self, size=16):
        self.size = size
        self.buckets = [[] for _ in range(size)]

    def _hash(self, key):
        return hash(key) % self.size

    def put(self, key, value):
        idx = self._hash(key)
        for i, (k, v) in enumerate(self.buckets[idx]):
            if k == key:
                self.buckets[idx][i] = (key, value)
                return
        self.buckets[idx].append((key, value))

    def get(self, key, default=None):
        idx = self._hash(key)
        for k, v in self.buckets[idx]:
            if k == key:
                return v
        return default

    def delete(self, key):
        idx = self._hash(key)
        self.buckets[idx] = [(k, v) for k, v in self.buckets[idx] if k != key]

# Demo — custom hash table
ht = HashTable()
ht.put("name", "Alice")
ht.put("age", 25)
print(ht.get("name"))   # Alice
print(ht.get("age"))    # 25
print(ht.get("email", "N/A"))  # N/A

# --- Common pattern: frequency counter ---
def top_k_frequent(nums, k):
    from collections import Counter
    count = Counter(nums)
    return [item for item, freq in count.most_common(k)]

print(top_k_frequent([1,1,1,2,2,3], 2))  # [1, 2]

# --- Group anagrams ---
def group_anagrams(strs):
    groups = {}
    for s in strs:
        key = "".join(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())

print(group_anagrams(["eat","tea","tan","ate","nat","bat"]))`,
        quiz: [
          {
            question: 'What is the average time complexity of hash map lookup?',
            options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
            answer: 2,
          },
          {
            question: 'What happens when two keys hash to the same bucket?',
            options: ['An error is thrown', 'A collision occurs', 'The key is discarded', 'The table is deleted'],
            answer: 1,
          },
          {
            question: 'Which collision resolution strategy uses linked lists at each bucket?',
            options: ['Open addressing', 'Chaining', 'Linear probing', 'Double hashing'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COURSE 6: Algorithm Fundamentals
  // ─────────────────────────────────────────────
  {
    title: 'Algorithm Fundamentals',
    slug: 'algorithm-fundamentals',
    description:
      'Build strong algorithmic thinking. Learn Big-O notation, sorting & searching algorithms, recursion, and the difference between greedy and dynamic programming approaches.',
    difficulty: 'Intermediate' as const,
    tags: ['Algorithms', 'Fundamentals'],
    isPublished: true,
    lessons: [
      {
        title: 'Big-O Notation & Complexity Analysis',
        order: 1,
        duration: 10,
        codeLanguage: 'python',
        content: `## Big-O Notation & Complexity Analysis

Big-O notation describes how an algorithm's running time or space usage grows relative to the input size **n**. It captures the **worst-case upper bound**.

### Common Complexities (Fastest to Slowest)

| Big-O | Name | Example |
|-------|------|---------|
| O(1) | Constant | Array access, hash map lookup |
| O(log n) | Logarithmic | Binary search |
| O(n) | Linear | Single loop through array |
| O(n log n) | Linearithmic | Merge sort, heap sort |
| O(n²) | Quadratic | Nested loops (bubble sort) |
| O(2ⁿ) | Exponential | Recursive Fibonacci (naive) |
| O(n!) | Factorial | Permutation generation |

### Rules for Calculating Big-O

1. **Drop constants**: O(2n) → O(n)
2. **Drop lower-order terms**: O(n² + n) → O(n²)
3. **Nested loops multiply**: Loop inside loop → O(n × m)
4. **Sequential steps add**: O(n) + O(m) = O(n + m)

### Space Complexity

Space complexity measures **extra memory** used by an algorithm (beyond the input):

\`\`\`python
# O(1) space — in-place
def reverse_in_place(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1

# O(n) space — creates new array
def reverse_copy(arr):
    return arr[::-1]
\`\`\`

### Amortized Analysis

Some operations are usually O(1) but occasionally O(n). For example, appending to a dynamic array triggers a resize every so often. The **amortized** cost per operation remains O(1).

### How to Analyze Your Code

1. Identify the input size (**n**).
2. Count how many times the innermost operation runs.
3. Express as a function of **n**.
4. Drop constants and lower-order terms.

### Why It Matters

Understanding complexity lets you predict whether your solution will pass within time limits. For n = 10⁶, an O(n²) solution (~10¹²) will time out, but O(n log n) (~2 × 10⁷) will pass.`,
        codeExample: `# Big-O Complexity Examples

import time

# O(1) — Constant time
def get_first(arr):
    return arr[0] if arr else None

# O(log n) — Logarithmic (binary search)
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

# O(n) — Linear
def find_max(arr):
    maximum = arr[0]
    for num in arr:
        if num > maximum:
            maximum = num
    return maximum

# O(n²) — Quadratic
def has_duplicate_pair(arr):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                return True
    return False

# O(n log n) — Sorting
def sort_and_search(arr, target):
    arr.sort()  # O(n log n)
    return binary_search(arr, target)  # O(log n)
    # Total: O(n log n)

# Demo
data = list(range(100000))
start = time.time()
binary_search(data, 99999)
print(f"Binary search: {time.time() - start:.6f}s")

start = time.time()
find_max(data)
print(f"Linear scan:   {time.time() - start:.6f}s")`,
        quiz: [
          {
            question: 'What is the Big-O of binary search?',
            options: ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'],
            answer: 2,
          },
          {
            question: 'What does "drop constants" mean in Big-O analysis?',
            options: [
              'Remove constant variables from code',
              'O(3n) simplifies to O(n)',
              'Ignore the input size',
            ],
            answer: 1,
          },
          {
            question: 'What is the time complexity of two nested loops over an array of size n?',
            options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(2n)'],
            answer: 2,
          },
        ],
      },
      {
        title: 'Sorting Algorithms',
        order: 2,
        duration: 15,
        codeLanguage: 'python',
        content: `## Sorting Algorithms

Sorting is one of the most studied topics in computer science. Understanding sorting algorithms teaches you about trade-offs between time, space, and stability.

### Bubble Sort — O(n²)

Repeatedly swap adjacent elements that are in the wrong order:

\`\`\`python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
\`\`\`

Simple but slow. Good for small or nearly-sorted data.

### Merge Sort — O(n log n)

Divide the array in half, recursively sort each half, then merge:

\`\`\`python
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)
\`\`\`

**Stable** and guaranteed O(n log n), but uses O(n) extra space.

### Quick Sort — O(n log n) average

Pick a pivot, partition the array so smaller elements go left, larger go right, then recurse:

\`\`\`python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + mid + quick_sort(right)
\`\`\`

**In-place** (with proper implementation), but worst case is O(n²) with bad pivots.

### Comparison Table

| Algorithm | Best | Average | Worst | Space | Stable? |
|-----------|------|---------|-------|-------|---------|
| Bubble Sort | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick Sort | O(n log n) | O(n log n) | O(n²) | O(log n) | No |

### Which to Use?

- **Merge Sort**: When stability matters or worst-case guarantee is needed.
- **Quick Sort**: General purpose, fastest in practice for most data.
- **Bubble Sort**: Educational purposes or tiny arrays.

Most languages' built-in sort (Timsort) is a hybrid of merge sort and insertion sort.`,
        codeExample: `# Sorting Algorithms Demo

# Bubble Sort
def bubble_sort(arr):
    arr = arr.copy()
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break  # optimization: already sorted
    return arr

# Merge Sort
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# Quick Sort
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    mid = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + mid + quick_sort(right)

# Test all three
data = [38, 27, 43, 3, 9, 82, 10]
print("Original: ", data)
print("Bubble:   ", bubble_sort(data))
print("Merge:    ", merge_sort(data))
print("Quick:    ", quick_sort(data))`,
        quiz: [
          {
            question: 'What is the worst-case time complexity of Quick Sort?',
            options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
            answer: 2,
          },
          {
            question: 'Which sorting algorithm is guaranteed O(n log n) in all cases?',
            options: ['Bubble Sort', 'Quick Sort', 'Merge Sort', 'Selection Sort'],
            answer: 2,
          },
          {
            question: 'What does "stable" mean for a sorting algorithm?',
            options: [
              'It never crashes',
              'Equal elements maintain their original relative order',
              'It uses constant space',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'Searching Algorithms',
        order: 3,
        duration: 10,
        codeLanguage: 'python',
        content: `## Searching Algorithms

Searching is the process of finding a target element in a collection. The two fundamental approaches are **linear search** and **binary search**.

### Linear Search — O(n)

Check every element one by one:

\`\`\`python
def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1
\`\`\`

- Works on **unsorted** arrays.
- Simple but slow for large datasets.

### Binary Search — O(log n)

Requires a **sorted** array. Repeatedly divide the search space in half:

\`\`\`python
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
\`\`\`

### Binary Search Variations

Binary search is not just for "find target" — it can solve many problems:

1. **Find first/last occurrence** of a value.
2. **Find insertion position** (\`bisect_left\`).
3. **Search on answer**: Binary search the answer space (e.g., minimum capacity to ship packages in D days).
4. **Search in rotated sorted array**.

### Binary Search on Answer

\`\`\`python
# Find minimum speed to eat all bananas in h hours
def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        mid = (lo + hi) // 2
        hours = sum((p + mid - 1) // mid for p in piles)
        if hours <= h:
            hi = mid
        else:
            lo = mid + 1
    return lo
\`\`\`

### Comparison

| Feature | Linear | Binary |
|---------|--------|--------|
| Time | O(n) | O(log n) |
| Sorted required? | No | Yes |
| Space | O(1) | O(1) |
| Simplicity | Very simple | Moderate |

### When to Use Binary Search

- The array is sorted (or can be sorted).
- You need to find a boundary (first/last occurrence).
- The problem asks for "minimum/maximum value that satisfies a condition" — classic binary search on answer.

Binary search is one of the most powerful algorithmic techniques. It reduces O(n) problems to O(log n) and appears in countless interview questions.`,
        codeExample: `# Searching Algorithms Demo

# Linear Search
def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1

# Binary Search (iterative)
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

# Find first occurrence using binary search
def first_occurrence(arr, target):
    lo, hi = 0, len(arr) - 1
    result = -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            result = mid
            hi = mid - 1  # keep searching left
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return result

# Binary search on answer — square root
def integer_sqrt(n):
    lo, hi = 0, n
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid == n:
            return mid
        elif mid * mid < n:
            lo = mid + 1
        else:
            hi = mid - 1
    return hi  # floor of sqrt

# Demo
data = [1, 3, 5, 7, 9, 11, 13, 15]
print("Linear search for 7:", linear_search(data, 7))   # 3
print("Binary search for 7:", binary_search(data, 7))   # 3
print("Binary search for 6:", binary_search(data, 6))   # -1

repeated = [1, 2, 2, 2, 3, 4]
print("First occurrence of 2:", first_occurrence(repeated, 2))  # 1

print("sqrt(49):", integer_sqrt(49))   # 7
print("sqrt(50):", integer_sqrt(50))   # 7 (floor)`,
        quiz: [
          {
            question: 'What is required for binary search to work?',
            options: ['A hash map', 'A sorted array', 'A linked list', 'A queue'],
            answer: 1,
          },
          {
            question: 'How many comparisons does binary search need for an array of 1,000,000 elements?',
            options: ['1,000,000', '500,000', 'About 20', 'About 100'],
            answer: 2,
          },
          {
            question: 'What is "binary search on answer"?',
            options: [
              'Searching for a specific element',
              'Binary searching the answer space for an optimal value',
              'Using two binary searches',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'Recursion & Backtracking',
        order: 4,
        duration: 12,
        codeLanguage: 'python',
        content: `## Recursion & Backtracking

**Recursion** is when a function calls itself to solve smaller instances of the same problem. **Backtracking** extends recursion by exploring all possible solutions and "backing up" when a path doesn't work.

### Anatomy of Recursion

Every recursive function needs:

1. **Base case** — when to stop.
2. **Recursive case** — how to reduce the problem.

\`\`\`python
def factorial(n):
    if n <= 1:      # base case
        return 1
    return n * factorial(n - 1)  # recursive case
\`\`\`

### The Call Stack

Each recursive call adds a frame to the call stack. Too many calls cause a **stack overflow**. Python's default recursion limit is ~1000.

### Common Recursive Patterns

1. **Divide & Conquer**: Split → Solve → Combine (merge sort).
2. **Decrease & Conquer**: Reduce by one (factorial).
3. **Tree Recursion**: Multiple branches (Fibonacci).

### Memoization

Cache results of overlapping subproblems to avoid redundant work:

\`\`\`python
from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)
\`\`\`

This takes Fibonacci from O(2ⁿ) to O(n).

### Backtracking

Backtracking systematically explores all possibilities and prunes invalid paths:

\`\`\`python
def permutations(nums):
    result = []
    def backtrack(path, remaining):
        if not remaining:
            result.append(path[:])
            return
        for i in range(len(remaining)):
            path.append(remaining[i])
            backtrack(path, remaining[:i] + remaining[i+1:])
            path.pop()  # backtrack
    backtrack([], nums)
    return result
\`\`\`

### Classic Backtracking Problems

- **N-Queens**: Place N queens on an N×N board.
- **Sudoku Solver**: Fill in the grid.
- **Subsets/Combinations**: Generate all subsets.
- **Word Search**: Find a word in a 2D grid.

### Key Insight

Recursion = thinking about the problem in terms of smaller versions of itself. Backtracking = recursion + pruning. If you can define "what's the next choice?" and "when do I stop?", you can write a backtracking solution.`,
        codeExample: `# Recursion & Backtracking Demo
from functools import lru_cache

# 1. Factorial (simple recursion)
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(f"5! = {factorial(5)}")  # 120

# 2. Fibonacci with memoization
@lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

print(f"fib(30) = {fib(30)}")  # 832040

# 3. Generate all subsets (backtracking)
def subsets(nums):
    result = []
    def backtrack(start, path):
        result.append(path[:])
        for i in range(start, len(nums)):
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()  # undo choice
    backtrack(0, [])
    return result

print(f"Subsets of [1,2,3]: {subsets([1, 2, 3])}")

# 4. N-Queens (backtracking)
def solve_n_queens(n):
    solutions = []
    def backtrack(row, cols, diag1, diag2, board):
        if row == n:
            solutions.append(["".join(r) for r in board])
            return
        for col in range(n):
            if col in cols or (row - col) in diag1 or (row + col) in diag2:
                continue
            board[row][col] = "Q"
            backtrack(row + 1, cols | {col}, diag1 | {row - col}, diag2 | {row + col}, board)
            board[row][col] = "."
    backtrack(0, set(), set(), set(), [["." for _ in range(n)] for _ in range(n)])
    return solutions

queens = solve_n_queens(4)
print(f"4-Queens solutions: {len(queens)}")
for sol in queens:
    for row in sol:
        print("  " + row)
    print()`,
        quiz: [
          {
            question: 'What are the two essential parts of a recursive function?',
            options: [
              'Loop and condition',
              'Base case and recursive case',
              'Input and output',
            ],
            answer: 1,
          },
          {
            question: 'What technique optimizes Fibonacci from O(2^n) to O(n)?',
            options: ['Sorting', 'Memoization', 'Binary search', 'Backtracking'],
            answer: 1,
          },
          {
            question: 'What does "backtracking" do when it hits an invalid state?',
            options: [
              'Crashes the program',
              'Undoes the last choice and tries another',
              'Restarts from scratch',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'Greedy Algorithms vs Dynamic Programming',
        order: 5,
        duration: 15,
        codeLanguage: 'python',
        content: `## Greedy Algorithms vs Dynamic Programming

These are two fundamental paradigms for optimization problems. Understanding when to use each is crucial.

### Greedy Algorithms

A greedy algorithm makes the **locally optimal choice at each step**, hoping it leads to a globally optimal solution.

**When greedy works:**
- The problem has **optimal substructure**.
- The problem has a **greedy choice property** — a local optimum leads to a global optimum.

### Classic Greedy Examples

1. **Activity Selection**: Pick the activity that ends earliest.
2. **Fractional Knapsack**: Take the most valuable items per unit weight.
3. **Huffman Coding**: Build optimal prefix codes.
4. **Coin Change (specific denominations)**: Use largest coin first.

\`\`\`python
# Activity Selection — greedy by end time
def activity_selection(activities):
    activities.sort(key=lambda x: x[1])  # sort by end time
    selected = [activities[0]]
    for start, end in activities[1:]:
        if start >= selected[-1][1]:
            selected.append((start, end))
    return selected
\`\`\`

### Dynamic Programming (DP)

DP solves problems by breaking them into **overlapping subproblems** and storing results to avoid recomputation.

**Two approaches:**
- **Top-down** (memoization): Recursion + cache.
- **Bottom-up** (tabulation): Iteratively fill a table.

### Classic DP Examples

1. **0/1 Knapsack**: Maximize value with weight constraint.
2. **Longest Common Subsequence (LCS)**.
3. **Coin Change (minimum coins)**.
4. **Climbing Stairs**.
5. **Edit Distance**.

\`\`\`python
# Coin Change — DP (minimum coins)
def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i:
                dp[i] = min(dp[i], dp[i - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
\`\`\`

### When to Use Which?

| Feature | Greedy | DP |
|---------|--------|----|
| Approach | Local best choice | Try all subproblems |
| Guarantee | Only if greedy property holds | Always optimal |
| Complexity | Usually O(n log n) | Usually O(n²) or O(n × W) |
| Overlapping subproblems | Not needed | Required |

### Key Insight

- If making the best local choice always works → **Greedy**.
- If you need to consider all combinations / the greedy choice can fail → **DP**.
- When in doubt, try greedy first (it's simpler). If it fails, switch to DP.`,
        codeExample: `# Greedy vs Dynamic Programming Demo

# --- GREEDY: Activity Selection ---
def activity_selection(activities):
    """Select maximum non-overlapping activities."""
    activities.sort(key=lambda x: x[1])  # sort by end time
    selected = [activities[0]]
    for start, end in activities[1:]:
        if start >= selected[-1][1]:
            selected.append((start, end))
    return selected

acts = [(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11)]
print("Activities selected:", activity_selection(acts))

# --- DP: Coin Change (minimum coins) ---
def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for coin in coins:
            if coin <= i and dp[i - coin] + 1 < dp[i]:
                dp[i] = dp[i - coin] + 1
    return dp[amount] if dp[amount] != float('inf') else -1

print("Coins for 11:", coin_change([1, 5, 6, 9], 11))  # 2 (5+6)

# --- DP: Longest Common Subsequence ---
def lcs(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    return dp[m][n]

print("LCS('abcde','ace'):", lcs("abcde", "ace"))  # 3

# --- DP: Climbing Stairs ---
def climb_stairs(n):
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b

print("Ways to climb 10 stairs:", climb_stairs(10))  # 89`,
        quiz: [
          {
            question: 'When does a greedy algorithm guarantee an optimal solution?',
            options: [
              'Always',
              'When the problem has the greedy choice property',
              'When there are no constraints',
            ],
            answer: 1,
          },
          {
            question: 'What are the two approaches to dynamic programming?',
            options: [
              'Brute force and optimization',
              'Top-down (memoization) and Bottom-up (tabulation)',
              'Recursion and iteration',
            ],
            answer: 1,
          },
          {
            question: 'Which paradigm should you try first for an optimization problem?',
            options: ['Always DP', 'Always Greedy', 'Greedy first (simpler), then DP if greedy fails'],
            answer: 2,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COURSE 7: Web Development Basics
  // ─────────────────────────────────────────────
  {
    title: 'Web Development Basics',
    slug: 'web-development-basics',
    description:
      'Learn to build websites from scratch using HTML, CSS, and JavaScript. This course takes you from zero to your first interactive web project.',
    difficulty: 'Beginner' as const,
    tags: ['Web', 'HTML', 'CSS', 'JavaScript'],
    isPublished: true,
    lessons: [
      {
        title: 'HTML Foundations',
        order: 1,
        duration: 10,
        codeLanguage: 'html',
        content: `## HTML Foundations

**HTML (HyperText Markup Language)** is the backbone of every web page. It defines the **structure and content** — headings, paragraphs, images, links, and more.

### Document Structure

Every HTML page follows this basic structure:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
\`\`\`

### Essential Tags

| Tag | Purpose |
|-----|---------|
| \`<h1>\` to \`<h6>\` | Headings (h1 is the largest) |
| \`<p>\` | Paragraph |
| \`<a href="...">\` | Hyperlink |
| \`<img src="..." alt="...">\` | Image |
| \`<ul>\`, \`<ol>\`, \`<li>\` | Lists |
| \`<div>\` | Generic container (block) |
| \`<span>\` | Generic container (inline) |

### Semantic HTML

Use semantic elements for better accessibility and SEO:

\`\`\`html
<header>Site header</header>
<nav>Navigation links</nav>
<main>
    <article>Blog post content</article>
    <aside>Sidebar</aside>
</main>
<footer>Site footer</footer>
\`\`\`

### Forms

Forms collect user input:

\`\`\`html
<form action="/submit" method="POST">
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>
    <button type="submit">Sign Up</button>
</form>
\`\`\`

### Tables

\`\`\`html
<table>
    <thead>
        <tr><th>Name</th><th>Score</th></tr>
    </thead>
    <tbody>
        <tr><td>Alice</td><td>95</td></tr>
    </tbody>
</table>
\`\`\`

### Key Principles

- Always include \`alt\` attributes on images for accessibility.
- Use semantic tags instead of generic \`<div>\` where possible.
- Validate your HTML at validator.w3.org.
- Keep content and presentation separate (HTML for structure, CSS for style).`,
        codeExample: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Portfolio</title>
</head>
<body>
    <header>
        <h1>Jane Doe</h1>
        <nav>
            <a href="#about">About</a> |
            <a href="#projects">Projects</a> |
            <a href="#contact">Contact</a>
        </nav>
    </header>

    <main>
        <section id="about">
            <h2>About Me</h2>
            <p>I'm a web developer passionate about building beautiful, accessible websites.</p>
            <img src="https://via.placeholder.com/200" alt="Profile photo of Jane Doe">
        </section>

        <section id="projects">
            <h2>Projects</h2>
            <ul>
                <li><strong>Portfolio Site</strong> — This page!</li>
                <li><strong>Todo App</strong> — Built with vanilla JavaScript</li>
                <li><strong>Weather Dashboard</strong> — Uses a public API</li>
            </ul>
        </section>

        <section id="contact">
            <h2>Contact</h2>
            <form>
                <label for="name">Name:</label><br>
                <input type="text" id="name" name="name" required><br><br>
                <label for="message">Message:</label><br>
                <textarea id="message" name="message" rows="4" cols="40"></textarea><br><br>
                <button type="submit">Send</button>
            </form>
        </section>
    </main>

    <footer>
        <p>&copy; 2024 Jane Doe. All rights reserved.</p>
    </footer>
</body>
</html>`,
        quiz: [
          {
            question: 'What does HTML stand for?',
            options: [
              'Hyper Tool Markup Language',
              'HyperText Markup Language',
              'Home Text Making Language',
            ],
            answer: 1,
          },
          {
            question: 'Which tag is used for the most important heading?',
            options: ['<heading>', '<h6>', '<h1>', '<title>'],
            answer: 2,
          },
          {
            question: 'Why should you use semantic HTML elements?',
            options: [
              'They look better',
              'They improve accessibility and SEO',
              'They are required by browsers',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'CSS Styling & Layout',
        order: 2,
        duration: 12,
        codeLanguage: 'css',
        content: `## CSS Styling & Layout

**CSS (Cascading Style Sheets)** controls how HTML elements look — colors, fonts, spacing, and layout.

### Adding CSS

Three ways to add CSS:

1. **Inline**: \`<p style="color: red;">Text</p>\`
2. **Internal**: \`<style>\` tag in the head.
3. **External**: \`<link rel="stylesheet" href="styles.css">\` (recommended).

### Selectors

\`\`\`css
h1 { color: navy; }              /* element selector */
.card { padding: 20px; }         /* class selector */
#header { background: #333; }    /* ID selector */
a:hover { text-decoration: none; } /* pseudo-class */
\`\`\`

### The Box Model

Every element is a box with: **content → padding → border → margin**.

\`\`\`css
.box {
    width: 200px;
    padding: 20px;
    border: 2px solid #333;
    margin: 10px;
}
\`\`\`

Use \`box-sizing: border-box;\` so width includes padding and border.

### Flexbox

The most powerful layout tool for 1-dimensional layouts:

\`\`\`css
.container {
    display: flex;
    justify-content: center;    /* horizontal alignment */
    align-items: center;        /* vertical alignment */
    gap: 16px;
}
\`\`\`

### CSS Grid

For 2-dimensional layouts:

\`\`\`css
.grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}
\`\`\`

### Responsive Design

Use **media queries** to adapt layouts to different screen sizes:

\`\`\`css
@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
\`\`\`

### CSS Variables

\`\`\`css
:root {
    --primary: #3b82f6;
    --spacing: 16px;
}
.btn {
    background: var(--primary);
    padding: var(--spacing);
}
\`\`\`

### Key Principles

- Use \`rem\` and \`em\` for font sizes (not \`px\`).
- Mobile-first design: start with small screens, add complexity with media queries.
- Use Flexbox for components, Grid for page layout.`,
        codeExample: `/* CSS Styling & Layout Demo */

/* Reset & base */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

:root {
    --primary: #3b82f6;
    --dark: #1e293b;
    --light: #f1f5f9;
    --radius: 8px;
}

body {
    font-family: 'Segoe UI', system-ui, sans-serif;
    line-height: 1.6;
    color: var(--dark);
    background: var(--light);
}

/* Navigation with Flexbox */
.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--dark);
    color: white;
}

.nav-links {
    display: flex;
    gap: 1.5rem;
    list-style: none;
}

.nav-links a {
    color: white;
    text-decoration: none;
}

.nav-links a:hover {
    color: var(--primary);
}

/* Card Grid with CSS Grid */
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 2rem;
}

.card {
    background: white;
    border-radius: var(--radius);
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
}

.card:hover {
    transform: translateY(-4px);
}

/* Button */
.btn {
    display: inline-block;
    background: var(--primary);
    color: white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
        gap: 1rem;
    }
}`,
        quiz: [
          {
            question: 'What does the CSS box model consist of?',
            options: [
              'Content, padding, border, margin',
              'Header, body, footer, sidebar',
              'Width, height, color, font',
            ],
            answer: 0,
          },
          {
            question: 'Which CSS layout system is best for 2-dimensional layouts?',
            options: ['Flexbox', 'Float', 'CSS Grid', 'Inline-block'],
            answer: 2,
          },
          {
            question: 'What does box-sizing: border-box do?',
            options: [
              'Adds extra borders',
              'Includes padding and border in the element\'s width/height',
              'Removes margins',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'JavaScript for the Web',
        order: 3,
        duration: 12,
        codeLanguage: 'javascript',
        content: `## JavaScript for the Web

JavaScript brings **interactivity** to web pages. It can manipulate the DOM, respond to user events, make API calls, and dynamically update content without reloading.

### Selecting Elements

\`\`\`javascript
const el = document.querySelector('.my-class');      // first match
const all = document.querySelectorAll('.item');       // all matches
const byId = document.getElementById('main');        // by ID
\`\`\`

### Modifying the DOM

\`\`\`javascript
el.textContent = "New text";
el.innerHTML = "<strong>Bold</strong> text";
el.style.color = "blue";
el.classList.add("active");
el.classList.toggle("hidden");
\`\`\`

### Event Listeners

\`\`\`javascript
const btn = document.querySelector('#submit');
btn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Form submitted!');
});
\`\`\`

### Creating & Removing Elements

\`\`\`javascript
// Create
const card = document.createElement('div');
card.className = 'card';
card.textContent = 'New card';
document.querySelector('.container').appendChild(card);

// Remove
card.remove();
\`\`\`

### Fetching Data from APIs

\`\`\`javascript
async function loadPosts() {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts');
    const posts = await res.json();
    posts.slice(0, 5).forEach(post => {
        const li = document.createElement('li');
        li.textContent = post.title;
        document.querySelector('#post-list').appendChild(li);
    });
}
\`\`\`

### Local Storage

Store data in the browser that persists across sessions:

\`\`\`javascript
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme');
localStorage.removeItem('theme');
\`\`\`

### Form Handling

\`\`\`javascript
const form = document.querySelector('#signup');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const email = formData.get('email');
    console.log('Email:', email);
});
\`\`\`

### Key Practices

- Use \`defer\` or put scripts at the end of \`<body>\`.
- Prefer \`textContent\` over \`innerHTML\` (XSS prevention).
- Use event delegation for dynamic lists.
- Always handle fetch errors with try/catch.`,
        codeExample: `// JavaScript for the Web — Interactive Todo List

// --- DOM Elements ---
// const form = document.querySelector('#todo-form');
// const input = document.querySelector('#todo-input');
// const list = document.querySelector('#todo-list');

// --- Todo App Logic (runs in browser) ---
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos') || '[]');
    }

    add(text) {
        const todo = { id: Date.now(), text, done: false };
        this.todos.push(todo);
        this.save();
        return todo;
    }

    toggle(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) todo.done = !todo.done;
        this.save();
    }

    remove(id) {
        this.todos = this.todos.filter(t => t.id !== id);
        this.save();
    }

    save() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    getAll() {
        return this.todos;
    }
}

// Demo (works in Node too)
const app = new TodoApp();
app.add("Learn HTML");
app.add("Learn CSS");
app.add("Learn JavaScript");
app.toggle(app.todos[0].id);

console.log("All Todos:");
app.getAll().forEach(t => {
    console.log(\`  [\${t.done ? 'x' : ' '}] \${t.text}\`);
});

// --- Fetch API Example ---
async function fetchUsers() {
    try {
        const res = await fetch('https://jsonplaceholder.typicode.com/users');
        const users = await res.json();
        users.slice(0, 3).forEach(u => {
            console.log(\`  \${u.name} (\${u.email})\`);
        });
    } catch (err) {
        console.error("Failed to fetch:", err.message);
    }
}

// fetchUsers();  // Uncomment to run`,
        quiz: [
          {
            question: 'Which method prevents a form from reloading the page on submit?',
            options: ['stopPropagation()', 'preventDefault()', 'return false', 'cancelEvent()'],
            answer: 1,
          },
          {
            question: 'Why is textContent preferred over innerHTML for setting text?',
            options: [
              'textContent is faster',
              'innerHTML can introduce XSS vulnerabilities',
              'textContent supports HTML tags',
            ],
            answer: 1,
          },
          {
            question: 'What does localStorage persist across?',
            options: [
              'Only the current page view',
              'Browser sessions (until cleared)',
              'Different browsers',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'Building Your First Project',
        order: 4,
        duration: 15,
        codeLanguage: 'html',
        content: `## Building Your First Project

The best way to learn web development is by **building something real**. In this lesson, we'll combine HTML, CSS, and JavaScript to build a complete interactive project: a **Weather Dashboard**.

### Project Planning

Before writing code, plan your project:

1. **Define features**: Search by city, display temperature, show weather icon.
2. **Sketch the UI**: Header, search bar, result cards.
3. **Choose an API**: OpenWeatherMap (free tier).
4. **Set up files**: \`index.html\`, \`styles.css\`, \`app.js\`.

### Project Structure

\`\`\`
weather-dashboard/
├── index.html
├── styles.css
└── app.js
\`\`\`

### Step 1: HTML Structure

Create the skeleton — header, search form, and results area.

### Step 2: CSS Styling

Style the components with Flexbox, CSS variables, and responsive media queries.

### Step 3: JavaScript Logic

- Listen for form submissions.
- Fetch data from the weather API.
- Dynamically create DOM elements to display results.
- Handle errors gracefully (city not found, network issues).

### Key Concepts Applied

- **Semantic HTML**: \`<header>\`, \`<main>\`, \`<form>\`
- **CSS Flexbox/Grid**: Responsive card layout
- **DOM Manipulation**: \`createElement\`, \`appendChild\`, \`textContent\`
- **Fetch API**: \`async/await\` for API calls
- **Error Handling**: \`try/catch\` around network requests

### Debugging Tips

- Use **DevTools Console** (F12) for JavaScript errors.
- Use **DevTools Network tab** to inspect API requests.
- Use **DevTools Elements tab** to inspect the DOM.
- \`console.log()\` everything during development.

### Deploying Your Project

Free hosting options:
- **GitHub Pages**: Push to a repo, enable Pages.
- **Netlify**: Drag and drop your folder.
- **Vercel**: Connect your GitHub repo.

### Next Steps

After completing your first project:
- Add local storage to save favorite cities.
- Add a 5-day forecast view.
- Make it a Progressive Web App (PWA).
- Build more projects: Todo app, calculator, quiz app.

The key to becoming a web developer is **building, deploying, and iterating**. Every project teaches you something new.`,
        codeExample: `<!-- Weather Dashboard — Complete Mini Project -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather Dashboard</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            color: white;
            padding: 2rem;
        }
        h1 { margin-bottom: 1.5rem; font-size: 2rem; }
        .search-form {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 2rem;
        }
        .search-form input {
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            width: 250px;
        }
        .search-form button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            background: #f59e0b;
            color: white;
            font-size: 1rem;
            cursor: pointer;
        }
        .weather-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            min-width: 300px;
        }
        .temp { font-size: 3rem; font-weight: bold; }
        .desc { font-size: 1.2rem; margin-top: 0.5rem; }
        .error { color: #fca5a5; margin-top: 1rem; }
    </style>
</head>
<body>
    <h1>Weather Dashboard</h1>
    <form class="search-form" id="search-form">
        <input type="text" id="city-input" placeholder="Enter city name..." required>
        <button type="submit">Search</button>
    </form>
    <div id="result"></div>

    <script>
        const form = document.getElementById('search-form');
        const input = document.getElementById('city-input');
        const result = document.getElementById('result');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const city = input.value.trim();
            if (!city) return;

            // NOTE: Replace YOUR_API_KEY with a real key from openweathermap.org
            const API_KEY = 'YOUR_API_KEY';
            const url = \`https://api.openweathermap.org/data/2.5/weather?q=\${city}&units=metric&appid=\${API_KEY}\`;

            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error('City not found');
                const data = await res.json();

                result.innerHTML = \`
                    <div class="weather-card">
                        <h2>\${data.name}, \${data.sys.country}</h2>
                        <div class="temp">\${Math.round(data.main.temp)}°C</div>
                        <div class="desc">\${data.weather[0].description}</div>
                        <p>Humidity: \${data.main.humidity}% | Wind: \${data.wind.speed} m/s</p>
                    </div>
                \`;
            } catch (err) {
                result.innerHTML = \`<p class="error">Error: \${err.message}</p>\`;
            }
        });
    </script>
</body>
</html>`,
        quiz: [
          {
            question: 'What is the recommended project file structure for a basic web project?',
            options: [
              'One single HTML file with everything',
              'Separate HTML, CSS, and JS files',
              'Only JavaScript files',
            ],
            answer: 1,
          },
          {
            question: 'Which DevTools tab should you check for API request issues?',
            options: ['Elements', 'Console', 'Network', 'Sources'],
            answer: 2,
          },
          {
            question: 'Which service allows free static site hosting from a GitHub repository?',
            options: ['AWS EC2', 'GitHub Pages', 'Heroku', 'Docker Hub'],
            answer: 1,
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // COURSE 8: Competitive Programming Guide
  // ─────────────────────────────────────────────
  {
    title: 'Competitive Programming Guide',
    slug: 'competitive-programming-guide',
    description:
      'Level up your competitive programming skills. Learn fast I/O tricks, common problem-solving patterns, graph algorithms, and dynamic programming techniques used in contests.',
    difficulty: 'Advanced' as const,
    tags: ['Competitive Programming', 'Advanced'],
    isPublished: true,
    lessons: [
      {
        title: 'Fast I/O & Time Complexity Tricks',
        order: 1,
        duration: 8,
        codeLanguage: 'cpp',
        content: `## Fast I/O & Time Complexity Tricks

In competitive programming, the difference between Accepted (AC) and Time Limit Exceeded (TLE) often comes down to I/O speed and constant-factor optimizations.

### Fast I/O in C++

\`\`\`cpp
ios_base::sync_with_stdio(false);
cin.tie(NULL);
\`\`\`

This disables synchronization between C and C++ I/O streams, making \`cin\`/\`cout\` much faster. **Never mix \`printf\`/\`scanf\` with \`cin\`/\`cout\` after this.**

### Fast I/O in Python

\`\`\`python
import sys
input = sys.stdin.readline
\`\`\`

### Fast I/O in Java

\`\`\`java
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
PrintWriter out = new PrintWriter(new BufferedOutputStream(System.out));
\`\`\`

### Estimating Time Complexity

A modern computer does ~10⁸ simple operations per second. Use this rule:

| n | Max Acceptable Complexity |
|---|--------------------------|
| ≤ 10 | O(n!) |
| ≤ 20 | O(2ⁿ) |
| ≤ 500 | O(n³) |
| ≤ 5,000 | O(n²) |
| ≤ 10⁶ | O(n log n) |
| ≤ 10⁸ | O(n) |

### Common Tricks

1. **Use \`\\n\` instead of \`endl\`** — \`endl\` flushes the buffer, \`\\n\` doesn't.
2. **Pre-size arrays** — avoid dynamic allocation in hot loops.
3. **Use \`int\` over \`long long\`** when possible — faster arithmetic.
4. **Bit manipulation** — \`n & 1\` instead of \`n % 2\`.
5. **Avoid unnecessary copies** — pass by reference.

### Template for C++ Competitive Programming

\`\`\`cpp
#include <bits/stdc++.h>
using namespace std;
typedef long long ll;
typedef vector<int> vi;
typedef pair<int,int> pii;
#define pb push_back
#define all(x) (x).begin(),(x).end()

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // your code here
    return 0;
}
\`\`\`

### Debugging in Contests

- Use \`#ifdef LOCAL\` blocks for debug output.
- Test edge cases: n=0, n=1, negative numbers, maximum constraints.
- Check for integer overflow — use \`long long\` when products can exceed 2×10⁹.`,
        codeExample: `#include <bits/stdc++.h>
using namespace std;
typedef long long ll;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Example: Read n numbers, find max and sum
    int n;
    cin >> n;

    // If no input provided, use sample data
    if (cin.fail()) {
        vector<int> data = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3};
        n = data.size();

        ll sum = 0;
        int mx = INT_MIN;
        for (int x : data) {
            sum += x;
            mx = max(mx, x);
        }
        cout << "n = " << n << "\\n";
        cout << "sum = " << sum << "\\n";
        cout << "max = " << mx << "\\n";

        // Bit manipulation tricks
        cout << "\\nBit tricks:\\n";
        cout << "Is 6 even? " << !(6 & 1) << "\\n";        // 1 (true)
        cout << "Is 7 even? " << !(7 & 1) << "\\n";        // 0 (false)
        cout << "2^10 = " << (1 << 10) << "\\n";           // 1024
        cout << "Floor log2(100) = " << __lg(100) << "\\n"; // 6

        // Measuring time
        auto start = chrono::high_resolution_clock::now();
        ll big_sum = 0;
        for (int i = 0; i < 100000000; i++) big_sum += i;
        auto end = chrono::high_resolution_clock::now();
        auto ms = chrono::duration_cast<chrono::milliseconds>(end - start).count();
        cout << "\\n10^8 additions took " << ms << " ms\\n";
    }

    return 0;
}`,
        quiz: [
          {
            question: 'Why should you avoid endl in competitive programming?',
            options: [
              'It causes a compile error',
              'It flushes the output buffer, slowing I/O',
              'It adds extra characters',
            ],
            answer: 1,
          },
          {
            question: 'For n = 10^6, what is the maximum acceptable time complexity?',
            options: ['O(n²)', 'O(n log n)', 'O(n³)', 'O(2^n)'],
            answer: 1,
          },
          {
            question: 'What does `n & 1` compute?',
            options: ['n divided by 2', 'n modulo 2 (checks odd/even)', 'n times 2'],
            answer: 1,
          },
        ],
      },
      {
        title: 'Common Patterns: Two Pointers & Sliding Window',
        order: 2,
        duration: 12,
        codeLanguage: 'python',
        content: `## Common Patterns: Two Pointers & Sliding Window

These two techniques transform O(n²) brute-force solutions into elegant O(n) algorithms. They are among the most frequently tested patterns in competitive programming and interviews.

### Two Pointers

Place one pointer at the start and one at the end, and move them inward based on conditions.

**Classic use cases:**
- **Pair with target sum** (sorted array).
- **Container with most water**.
- **Remove duplicates in-place**.
- **Palindrome check**.

\`\`\`python
def two_sum_sorted(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        s = arr[left] + arr[right]
        if s == target:
            return [left, right]
        elif s < target:
            left += 1
        else:
            right -= 1
    return [-1, -1]
\`\`\`

### Fast & Slow Pointers

A variant where one pointer moves faster than the other:
- **Cycle detection** (Floyd's algorithm).
- **Find middle of linked list**.
- **Happy number** check.

### Sliding Window

Maintain a "window" of elements and slide it across the array. Two types:

**Fixed-size window:**
\`\`\`python
def max_sum_subarray(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)
    return max_sum
\`\`\`

**Variable-size window:**
\`\`\`python
def longest_unique_substring(s):
    seen = {}
    left = max_len = 0
    for right, char in enumerate(s):
        if char in seen and seen[char] >= left:
            left = seen[char] + 1
        seen[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
\`\`\`

### When to Use

| Pattern | Signal |
|---------|--------|
| Two Pointers | Sorted array + pair/triplet sum |
| Sliding Window (fixed) | "Subarray of size k" |
| Sliding Window (variable) | "Longest/shortest subarray with condition" |

### Key Insight

Both patterns work by avoiding redundant work. Instead of checking every possible pair/subarray (O(n²)), they maintain just enough state to compute the answer in a single pass.`,
        codeExample: `# Two Pointers & Sliding Window Patterns

# 1. Two Pointers — Container With Most Water
def max_area(heights):
    left, right = 0, len(heights) - 1
    best = 0
    while left < right:
        w = right - left
        h = min(heights[left], heights[right])
        best = max(best, w * h)
        if heights[left] < heights[right]:
            left += 1
        else:
            right -= 1
    return best

print("Max area:", max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]))  # 49

# 2. Two Pointers — 3Sum (find triplets summing to 0)
def three_sum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]:
            continue
        left, right = i + 1, len(nums) - 1
        while left < right:
            s = nums[i] + nums[left] + nums[right]
            if s == 0:
                result.append([nums[i], nums[left], nums[right]])
                while left < right and nums[left] == nums[left+1]: left += 1
                while left < right and nums[right] == nums[right-1]: right -= 1
                left += 1; right -= 1
            elif s < 0:
                left += 1
            else:
                right -= 1
    return result

print("3Sum:", three_sum([-1, 0, 1, 2, -1, -4]))

# 3. Sliding Window — Max sum subarray of size k
def max_sum_k(arr, k):
    window = sum(arr[:k])
    best = window
    for i in range(k, len(arr)):
        window += arr[i] - arr[i - k]
        best = max(best, window)
    return best

print("Max sum (k=3):", max_sum_k([2, 1, 5, 1, 3, 2], 3))  # 9

# 4. Sliding Window — Longest substring without repeating chars
def length_of_longest_unique(s):
    seen = {}
    left = result = 0
    for right, ch in enumerate(s):
        if ch in seen and seen[ch] >= left:
            left = seen[ch] + 1
        seen[ch] = right
        result = max(result, right - left + 1)
    return result

print("Longest unique:", length_of_longest_unique("abcabcbb"))  # 3`,
        quiz: [
          {
            question: 'What time complexity does the two-pointer technique typically achieve?',
            options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(log n)'],
            answer: 2,
          },
          {
            question: 'When should you use a sliding window?',
            options: [
              'Finding pairs in unsorted arrays',
              'Problems involving contiguous subarrays or substrings',
              'Tree traversal problems',
            ],
            answer: 1,
          },
          {
            question: 'In a variable-size sliding window, how do you shrink the window?',
            options: [
              'Move the right pointer left',
              'Move the left pointer right',
              'Reset both pointers',
            ],
            answer: 1,
          },
        ],
      },
      {
        title: 'Graph Algorithms: BFS, DFS & Shortest Path',
        order: 3,
        duration: 15,
        codeLanguage: 'python',
        content: `## Graph Algorithms: BFS, DFS & Shortest Path

Graphs model relationships between entities — social networks, maps, dependencies, and more. Mastering graph traversal is essential for competitive programming.

### Graph Representations

1. **Adjacency List** (most common): \`graph[u] = [v1, v2, ...]\`
2. **Adjacency Matrix**: \`matrix[u][v] = 1\` if edge exists.
3. **Edge List**: List of (u, v, weight) tuples.

### BFS — Breadth-First Search

Explores nodes level by level using a **queue**. Finds the **shortest path in unweighted graphs**.

\`\`\`python
from collections import deque

def bfs(graph, start):
    visited = {start}
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

**Time: O(V + E)** where V = vertices, E = edges.

### DFS — Depth-First Search

Explores as deep as possible before backtracking, using a **stack** (or recursion).

\`\`\`python
def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    visited.add(start)
    for neighbor in graph[start]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)
    return visited
\`\`\`

**Applications of DFS:**
- Cycle detection
- Topological sort
- Connected components
- Path finding

### Dijkstra's Algorithm — Shortest Path (weighted)

For graphs with **non-negative weights**, Dijkstra finds the shortest path from a source to all other nodes.

\`\`\`python
import heapq

def dijkstra(graph, start):
    dist = {start: 0}
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, float('inf')):
            continue
        for v, w in graph[u]:
            new_dist = d + w
            if new_dist < dist.get(v, float('inf')):
                dist[v] = new_dist
                heapq.heappush(pq, (new_dist, v))
    return dist
\`\`\`

**Time: O((V + E) log V)** with a priority queue.

### When to Use Which

| Algorithm | Use Case | Time |
|-----------|----------|------|
| BFS | Shortest path (unweighted) | O(V + E) |
| DFS | Connectivity, cycles, topological sort | O(V + E) |
| Dijkstra | Shortest path (weighted, non-negative) | O((V+E) log V) |
| Bellman-Ford | Shortest path (negative edges) | O(V × E) |`,
        codeExample: `# Graph Algorithms — BFS, DFS, Dijkstra
from collections import deque, defaultdict
import heapq

# Build an unweighted graph
unweighted = defaultdict(list)
edges = [(0,1), (0,2), (1,3), (2,3), (3,4), (2,5)]
for u, v in edges:
    unweighted[u].append(v)
    unweighted[v].append(u)

# --- BFS with shortest path tracking ---
def bfs_shortest(graph, start, end):
    queue = deque([(start, [start])])
    visited = {start}
    while queue:
        node, path = queue.popleft()
        if node == end:
            return path
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    return []

print("BFS path 0->4:", bfs_shortest(unweighted, 0, 4))

# --- DFS (iterative) ---
def dfs_iterative(graph, start):
    visited = set()
    stack = [start]
    order = []
    while stack:
        node = stack.pop()
        if node in visited:
            continue
        visited.add(node)
        order.append(node)
        for neighbor in reversed(graph[node]):
            if neighbor not in visited:
                stack.append(neighbor)
    return order

print("DFS order from 0:", dfs_iterative(unweighted, 0))

# --- Dijkstra's shortest path ---
weighted = defaultdict(list)
w_edges = [(0,1,4), (0,2,1), (2,1,2), (1,3,1), (2,3,5), (3,4,3)]
for u, v, w in w_edges:
    weighted[u].append((v, w))
    weighted[v].append((u, w))

def dijkstra(graph, start):
    dist = {start: 0}
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, float('inf')):
            continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(pq, (nd, v))
    return dist

distances = dijkstra(weighted, 0)
print("Dijkstra from 0:", dict(sorted(distances.items())))`,
        quiz: [
          {
            question: 'Which algorithm finds the shortest path in an unweighted graph?',
            options: ['DFS', 'BFS', 'Dijkstra', 'Bellman-Ford'],
            answer: 1,
          },
          {
            question: 'What data structure does BFS use?',
            options: ['Stack', 'Queue', 'Priority Queue', 'Linked List'],
            answer: 1,
          },
          {
            question: "What is the time complexity of Dijkstra's algorithm with a priority queue?",
            options: ['O(V²)', 'O(V + E)', 'O((V + E) log V)', 'O(V × E)'],
            answer: 2,
          },
        ],
      },
      {
        title: 'Dynamic Programming Techniques',
        order: 4,
        duration: 15,
        codeLanguage: 'python',
        content: `## Dynamic Programming Techniques

Dynamic Programming (DP) is one of the most powerful and frequently tested topics in competitive programming. It solves optimization problems by breaking them into overlapping subproblems.

### The DP Recipe

1. **Define the state**: What does \`dp[i]\` (or \`dp[i][j]\`) represent?
2. **Find the recurrence**: How does \`dp[i]\` depend on smaller subproblems?
3. **Set base cases**: What are the starting values?
4. **Determine the order**: Fill the table so dependencies are satisfied.
5. **Extract the answer**: Where in the table is the final answer?

### Common DP Patterns

#### 1. Linear DP

\`\`\`python
# Climbing Stairs: dp[i] = ways to reach step i
dp[0] = 1
dp[1] = 1
dp[i] = dp[i-1] + dp[i-2]
\`\`\`

#### 2. Knapsack DP

\`\`\`python
# 0/1 Knapsack: dp[i][w] = max value using first i items with capacity w
for i in range(1, n+1):
    for w in range(W+1):
        if weight[i] <= w:
            dp[i][w] = max(dp[i-1][w], dp[i-1][w-weight[i]] + value[i])
        else:
            dp[i][w] = dp[i-1][w]
\`\`\`

#### 3. String DP

\`\`\`python
# Longest Common Subsequence
if s1[i-1] == s2[j-1]:
    dp[i][j] = dp[i-1][j-1] + 1
else:
    dp[i][j] = max(dp[i-1][j], dp[i][j-1])
\`\`\`

#### 4. Interval DP

Used for problems on subarrays or subsequences where the answer depends on subranges.

#### 5. Bitmask DP

When the state involves subsets of elements:
\`dp[mask]\` where \`mask\` is a bitmask representing which elements are chosen.

### Space Optimization

Many DP tables only depend on the previous row. Reduce O(n × W) space to O(W):

\`\`\`python
# 1D knapsack
dp = [0] * (W + 1)
for i in range(n):
    for w in range(W, weight[i]-1, -1):  # reverse order!
        dp[w] = max(dp[w], dp[w - weight[i]] + value[i])
\`\`\`

### Recognizing DP Problems

- The problem asks for **optimal** (max/min) or **count** of ways.
- It has **overlapping subproblems** (same sub-computations repeat).
- It has **optimal substructure** (optimal solution built from optimal sub-solutions).

### Common Mistakes

- Wrong base case.
- Off-by-one errors in loop bounds.
- Wrong iteration order (especially in space-optimized knapsack).
- Not handling edge cases (empty input, single element).`,
        codeExample: `# Dynamic Programming Techniques

# 1. 0/1 Knapsack (space optimized)
def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [0] * (capacity + 1)
    for i in range(n):
        for w in range(capacity, weights[i] - 1, -1):
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i])
    return dp[capacity]

weights = [2, 3, 4, 5]
values  = [3, 4, 5, 6]
print("Knapsack(capacity=8):", knapsack(weights, values, 8))  # 10

# 2. Longest Increasing Subsequence (LIS) — O(n log n)
import bisect

def lis(nums):
    tails = []
    for num in nums:
        pos = bisect.bisect_left(tails, num)
        if pos == len(tails):
            tails.append(num)
        else:
            tails[pos] = num
    return len(tails)

print("LIS:", lis([10, 9, 2, 5, 3, 7, 101, 18]))  # 4

# 3. Edit Distance
def edit_distance(s1, s2):
    m, n = len(s1), len(s2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if s1[i-1] == s2[j-1]:
                dp[i][j] = dp[i-1][j-1]
            else:
                dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    return dp[m][n]

print("Edit distance('kitten','sitting'):", edit_distance("kitten", "sitting"))  # 3

# 4. Coin Change (min coins)
def coin_change(coins, amount):
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for i in range(1, amount + 1):
        for c in coins:
            if c <= i and dp[i - c] + 1 < dp[i]:
                dp[i] = dp[i - c] + 1
    return dp[amount] if dp[amount] != float('inf') else -1

print("Coin change(11):", coin_change([1, 5, 6, 9], 11))  # 2

# 5. Longest Palindromic Subsequence
def lps(s):
    n = len(s)
    dp = [[0] * n for _ in range(n)]
    for i in range(n):
        dp[i][i] = 1
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            if s[i] == s[j]:
                dp[i][j] = dp[i+1][j-1] + 2
            else:
                dp[i][j] = max(dp[i+1][j], dp[i][j-1])
    return dp[0][n-1]

print("LPS('bbbab'):", lps("bbbab"))  # 4`,
        quiz: [
          {
            question: 'What are the two key properties needed for a DP solution?',
            options: [
              'Sorted input and binary search',
              'Overlapping subproblems and optimal substructure',
              'Greedy choice and no cycles',
            ],
            answer: 1,
          },
          {
            question: 'In the space-optimized 0/1 knapsack, why do we iterate weights in reverse?',
            options: [
              'For faster execution',
              'To prevent using the same item twice in one pass',
              'To sort the items',
            ],
            answer: 1,
          },
          {
            question: 'What is the time complexity of the O(n log n) LIS algorithm?',
            options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(2^n)'],
            answer: 1,
          },
        ],
      },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    console.log(`👤 Using admin: ${admin.username} (${admin._id})`);

    let count = 0;
    for (const course of COURSES) {
      // Add order to lessons if not already set
      const lessonsWithOrder = course.lessons.map((lesson, idx) => ({
        ...lesson,
        order: lesson.order ?? idx + 1,
      }));

      const result = await Course.findOneAndUpdate(
        { slug: course.slug },
        { ...course, lessons: lessonsWithOrder, createdBy: admin._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      count++;
      console.log(
        `  📘 [${count}/${COURSES.length}] Upserted: "${result.title}" (${result.lessons.length} lessons)`
      );
    }

    console.log(`\n🎉 Successfully seeded ${count} courses with ${COURSES.reduce((s, c) => s + c.lessons.length, 0)} total lessons.`);
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seed();
