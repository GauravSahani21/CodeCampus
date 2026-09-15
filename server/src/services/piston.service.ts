import axios from 'axios';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const WANDBOX_API = 'https://wandbox.org/api/compile.json';

// Since Piston went whitelist-only, we gracefully fallback to Wandbox.org API
export const LANGUAGE_RUNTIMES: Record<string, { compiler: string }> = {
  python: { compiler: 'cpython-3.14.0' },
  javascript: { compiler: 'nodejs-20.17.0' },
  typescript: { compiler: 'nodejs-20.17.0' }, // Wandbox doesn't do pure TS readily, falling back to JS for demo
  cpp: { compiler: 'gcc-13.2.0' },
  c: { compiler: 'gcc-13.2.0-c' },
  java: { compiler: 'openjdk-jdk-22+36' },
  go: { compiler: 'go-1.23.2' },
  rust: { compiler: 'rust-1.82.0' },
  csharp: { compiler: 'mono-6.12.0.199' },
  php: { compiler: 'php-8.3.12' },
  ruby: { compiler: 'ruby-4.0.2' },
  swift: { compiler: 'swift-6.0.1' },
};

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtime: number; // in milliseconds
}

export const executeCode = async (
  language: string,
  sourceCode: string,
  stdin: string = ''
): Promise<ExecuteResult> => {
  const runtime = LANGUAGE_RUNTIMES[language];
  if (!runtime) throw new Error(`Language '${language}' is not supported`);

  const startTime = Date.now();

  let finalCode = sourceCode;

  if (language === 'python') {
    const hasRunner = finalCode.includes('if __name__ == "__main__":') || (finalCode.includes('print(') && !finalCode.includes('class Solution'));
    if (!hasRunner) {
      finalCode += `\n
import sys, json
if __name__ == "__main__":
    try:
        func = None
        if "Solution" in globals():
            sol = Solution()
            methods = [m for m in dir(sol) if not m.startswith('_')]
            if methods:
                func = getattr(sol, methods[0])
        if not func:
            for fname in ['twoSum', 'containsDuplicate', 'isAnagram', 'solve']:
                if fname in globals() and callable(globals()[fname]):
                    func = globals()[fname]
                    break
        if not func:
            import types
            funcs = [v for k, v in list(globals().items()) if isinstance(v, types.FunctionType) and not k.startswith('_')]
            if funcs:
                func = funcs[-1]

        if func:
            raw_input = sys.stdin.read().strip()
            args = []
            if raw_input:
                for line in raw_input.split('\\n'):
                    line = line.strip()
                    if line:
                        try:
                            args.append(json.loads(line))
                        except Exception:
                            args.append(line)

            result = func(*args)
            if isinstance(result, bool):
                print(str(result).lower())
            elif result is not None:
                print(json.dumps(result, separators=(',', ' ')))
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
`;
    }
  } else if (language === 'javascript' || language === 'typescript') {
    const hasConsoleLog = finalCode.includes('console.log(') || finalCode.includes('process.stdin');
    if (!hasConsoleLog) {
      finalCode += `\n
const fs = require('fs');
try {
    let fn = null;
    if (typeof Solution !== 'undefined') {
        const sol = new Solution();
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(sol)).filter(m => m !== 'constructor' && typeof sol[m] === 'function');
        if (methods.length > 0) fn = sol[methods[0]].bind(sol);
    }
    if (!fn) {
        const candidates = ['twoSum', 'containsDuplicate', 'isAnagram', 'solve', 'solveProblem'];
        for (const name of candidates) {
            try {
                if (typeof eval(name) === 'function') { fn = eval(name); break; }
            } catch (e) {}
        }
    }
    if (!fn) {
        try {
            const defined = Object.keys(global).filter(k => typeof global[k] === 'function');
            if (defined.length > 0) fn = global[defined[defined.length - 1]];
        } catch (e) {}
    }

    if (fn) {
        const raw = fs.readFileSync(0, 'utf-8').trim();
        const args = [];
        if (raw) {
            for (const line of raw.split('\\n')) {
                const trimmed = line.trim();
                if (trimmed) {
                    try {
                        args.push(JSON.parse(trimmed));
                    } catch (e) {
                        args.push(trimmed);
                    }
                }
            }
        }
        const result = fn(...args);
        if (typeof result === 'boolean') {
            console.log(result ? 'true' : 'false');
        } else if (result !== undefined) {
            console.log(JSON.stringify(result));
        }
    }
} catch (e) {
    console.error(e);
    process.exit(1);
}
`;
    }
  } else if (language === 'java') {
    if (finalCode.includes('class Solution') && !finalCode.includes('public static void main')) {
      finalCode = finalCode.replace(/public\s+class\s+/g, 'class ');
      finalCode += `\n
class Main {
    public static void main(String[] args) throws Exception {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        java.util.ArrayList<String> lines = new java.util.ArrayList<>();
        while (sc.hasNextLine()) {
            String line = sc.nextLine().trim();
            if (!line.isEmpty()) lines.add(line);
        }
        
        Solution sol = new Solution();
        java.lang.reflect.Method[] methods = Solution.class.getDeclaredMethods();
        java.lang.reflect.Method target = null;
        for (java.lang.reflect.Method m : methods) {
            if (!m.getName().equals("main") && !m.getName().contains("init") && !m.getName().contains("wait") && !m.getName().contains("equals") && !m.getName().contains("hashCode") && !m.getName().contains("getClass") && !m.getName().contains("notify")) {
                target = m;
                break;
            }
        }
        
        if (target == null) System.exit(0);
        
        Object[] parsedArgs = new Object[target.getParameterCount()];
        Class<?>[] paramTypes = target.getParameterTypes();

        for (int i = 0; i < paramTypes.length; i++) {
            if (i >= lines.size()) break;
            String val = lines.get(i);
            Class<?> type = paramTypes[i];

            if (type == int.class || type == Integer.class) {
                parsedArgs[i] = Integer.parseInt(val);
                continue;
            }

            if (type == String.class) {
                if (val.length() >= 2 && val.charAt(0) == '"' && val.charAt(val.length() - 1) == '"') {
                    parsedArgs[i] = val.substring(1, val.length() - 1);
                } else {
                    parsedArgs[i] = val;
                }
                continue;
            }

            if (type == boolean.class || type == Boolean.class) {
                parsedArgs[i] = Boolean.parseBoolean(val);
                continue;
            }

            if (type == int[].class) {
                String tmp = val.trim();
                // If input includes a bracketed array somewhere (e.g. "nums = [2,3]") extract inner content
                if (tmp.contains("[")) {
                    int sIdx = tmp.indexOf('[');
                    int eIdx = tmp.lastIndexOf(']');
                    if (eIdx == -1) eIdx = tmp.length();
                    if (eIdx > sIdx) {
                        tmp = tmp.substring(sIdx + 1, eIdx);
                    }
                } else if (tmp.startsWith("[") && tmp.endsWith("]") && tmp.length() >= 2) {
                    tmp = tmp.substring(1, tmp.length() - 1);
                }
                if (tmp.isEmpty()) {
                    parsedArgs[i] = new int[0];
                } else {
                    String[] parts = tmp.split(",");
                    int[] arr = new int[parts.length];
                    for (int j = 0; j < parts.length; j++) arr[j] = Integer.parseInt(parts[j].trim());
                    parsedArgs[i] = arr;
                }
                continue;
            }

            if (type == String[].class) {
                String tmp = val.trim();
                if (tmp.contains("[")) {
                    int sIdx = tmp.indexOf('[');
                    int eIdx = tmp.lastIndexOf(']');
                    if (eIdx == -1) eIdx = tmp.length();
                    if (eIdx > sIdx) {
                        tmp = tmp.substring(sIdx + 1, eIdx);
                    }
                } else if (tmp.startsWith("[") && tmp.endsWith("]") && tmp.length() >= 2) tmp = tmp.substring(1, tmp.length() - 1);
                if (tmp.isEmpty()) {
                    parsedArgs[i] = new String[0];
                } else {
                    String[] parts = tmp.split(",");
                    String[] arr = new String[parts.length];
                    for (int j = 0; j < parts.length; j++) {
                        String p = parts[j].trim();
                        if (p.length() >= 2 && p.charAt(0) == '"' && p.charAt(p.length() - 1) == '"') p = p.substring(1, p.length() - 1);
                        arr[j] = p;
                    }
                    parsedArgs[i] = arr;
                }
                continue;
            }

            if (type == int[][].class) {
                String tmp = val.trim();
                if (tmp.contains("[")) {
                    int sIdx = tmp.indexOf('[');
                    int eIdx = tmp.lastIndexOf(']');
                    if (eIdx == -1) eIdx = tmp.length();
                    if (eIdx > sIdx) tmp = tmp.substring(sIdx + 1, eIdx);
                } else if (tmp.startsWith("[") && tmp.endsWith("]") && tmp.length() >= 2) tmp = tmp.substring(1, tmp.length() - 1);
                tmp = tmp.replace("],[", "]|;|[");
                tmp = tmp.replace("], [", "]|;|[");
                String[] rows = tmp.split(java.util.regex.Pattern.quote("|;|"));
                java.util.List<int[]> list = new java.util.ArrayList<>();
                for (String r : rows) {
                    String rowStr = r.replace("[", "").replace("]", "").trim();
                    if (!rowStr.isEmpty()) {
                        String[] parts = rowStr.split(",");
                        int[] arr = new int[parts.length];
                        for (int j = 0; j < parts.length; j++) arr[j] = Integer.parseInt(parts[j].trim());
                        list.add(arr);
                    }
                }
                parsedArgs[i] = list.toArray(new int[0][]);
                continue;
            }
        }
        
        // Ensure primitive parameters are not null (avoid NPE on unboxing)
        for (int k = 0; k < paramTypes.length; k++) {
            if (paramTypes[k].isPrimitive() && parsedArgs[k] == null) {
                if (paramTypes[k] == int.class) parsedArgs[k] = 0;
                else if (paramTypes[k] == boolean.class) parsedArgs[k] = false;
                else if (paramTypes[k] == long.class) parsedArgs[k] = 0L;
                else if (paramTypes[k] == double.class) parsedArgs[k] = 0.0;
                else if (paramTypes[k] == float.class) parsedArgs[k] = 0.0f;
                else if (paramTypes[k] == short.class) parsedArgs[k] = (short) 0;
                else if (paramTypes[k] == byte.class) parsedArgs[k] = (byte) 0;
                else if (paramTypes[k] == char.class) parsedArgs[k] = '\u0000';
            }
        }

        Object result;
        try {
            result = target.invoke(sol, parsedArgs);
        } catch (IllegalArgumentException iae) {
            System.err.println("Argument type mismatch or missing argument for method: " + iae.getMessage());
            iae.printStackTrace(System.err);
            System.exit(1);
            return;
        } catch (java.lang.reflect.InvocationTargetException ite) {
            // unwrap the target exception
            Throwable cause = ite.getCause();
            if (cause != null) {
                cause.printStackTrace(System.err);
            } else {
                ite.printStackTrace(System.err);
            }
            System.exit(1);
            return;
        }
        
        if (result instanceof int[]) {
            int[] arr = (int[]) result;
            System.out.print("[");
            for (int i = 0; i < arr.length; i++) {
                System.out.print(arr[i] + (i < arr.length - 1 ? "," : ""));
            }
            System.out.println("]");
        } else if (result instanceof boolean[] || result instanceof Boolean || result instanceof Boolean[]) {
            System.out.println(String.valueOf(result).toLowerCase());
        } else if (result instanceof java.util.List) {
            System.out.println(result.toString().replaceAll("\\s+", ""));
        } else {
            System.out.println(result);
        }
    }
}
`;
    } else {
      finalCode = finalCode.replace(/public\s+class\s+/g, 'class ');
    }
  } else if (language === 'cpp' || language === 'c') {
    if (finalCode.includes('class Solution') && !finalCode.includes('int main')) {
      finalCode += `\n
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>
#include <unordered_set>
#include <unordered_map>
#include <type_traits>

using namespace std;

static vector<int> parseVectorInt(string s) {
    vector<int> res;
    s.erase(remove(s.begin(), s.end(), '['), s.end());
    s.erase(remove(s.begin(), s.end(), ']'), s.end());
    stringstream ss(s);
    string item;
    while (getline(ss, item, ',')) {
        if (!item.empty()) res.push_back(stoi(item));
    }
    return res;
}

template <typename T, typename = void> struct has_containsDuplicate : false_type {};
template <typename T> struct has_containsDuplicate<T, void_t<decltype(declval<T>().containsDuplicate(declval<vector<int>&>()))>> : true_type {};

template <typename T, typename = void> struct has_twoSum : false_type {};
template <typename T> struct has_twoSum<T, void_t<decltype(declval<T>().twoSum(declval<vector<int>&>(), declval<int>()))>> : true_type {};

template <typename T, typename = void> struct has_isAnagram : false_type {};
template <typename T> struct has_isAnagram<T, void_t<decltype(declval<T>().isAnagram(declval<string>(), declval<string>()))>> : true_type {};

template <typename Sol>
void runSolution(Sol& sol, vector<string>& lines) {
    if constexpr (has_containsDuplicate<Sol>::value) {
        if (!lines.empty()) {
            auto vec = parseVectorInt(lines[0]);
            bool res = sol.containsDuplicate(vec);
            cout << (res ? "true" : "false") << endl;
        }
    }
    else if constexpr (has_twoSum<Sol>::value) {
        if (lines.size() >= 2) {
            auto vec = parseVectorInt(lines[0]);
            int target = stoi(lines[1]);
            auto res = sol.twoSum(vec, target);
            cout << "[";
            for (size_t i = 0; i < res.size(); i++) {
                cout << res[i] << (i + 1 < res.size() ? "," : "");
            }
            cout << "]" << endl;
        }
    }
    else if constexpr (has_isAnagram<Sol>::value) {
        if (lines.size() >= 2) {
            string s1 = lines[0], s2 = lines[1];
            s1.erase(remove(s1.begin(), s1.end(), '"'), s1.end());
            s2.erase(remove(s2.begin(), s2.end(), '"'), s2.end());
            bool res = sol.isAnagram(s1, s2);
            cout << (res ? "true" : "false") << endl;
        }
    }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    vector<string> lines;
    string line;
    while (getline(cin, line)) {
        if (!line.empty()) lines.push_back(line);
    }
    if (lines.empty()) return 0;

    Solution sol;
    runSolution(sol, lines);
    return 0;
}
`;
    }
  }




  // 1. Try Custom Docker Code Compiler Microservice first
  try {
    const dockerCompilerUrl = process.env.DOCKER_COMPILER_URL || 'http://localhost:2000';
    const dockerRes = await axios.post(
      `${dockerCompilerUrl}/compile`,
      {
        language,
        sourceCode: finalCode,
        stdin,
        timeout: 15000,
      },
      { timeout: 18000 }
    );

    if (dockerRes.data && (dockerRes.data.stdout !== undefined || dockerRes.data.stderr !== undefined)) {
      return {
        stdout: dockerRes.data.stdout || '',
        stderr: dockerRes.data.stderr || '',
        exitCode: dockerRes.data.exitCode ?? 0,
        runtime: dockerRes.data.runtime ?? (Date.now() - startTime),
      };
    }
  } catch (dockerErr) {
    // Custom docker compiler unavailable, fallback to wandbox or local
  }

  // 2. Try Wandbox execution
  try {
    const response = await axios.post(
      WANDBOX_API,
      {
        compiler: runtime.compiler,
        code: finalCode,
        stdin: stdin,
      },
      { timeout: 15000 }
    );

    const elapsed = Date.now() - startTime;
    const data = response.data;

    // Check if wandbox returned internal error (e.g. exit status 125, Failed to get uid)
    if (typeof data === 'string' && (data.includes('Failed to get uid') || data.includes('exit status: 125'))) {
      return await executeLocally(language, finalCode, stdin);
    }

    if (data.compiler_error) {
      return {
        stdout: '',
        stderr: data.compiler_error.trim(),
        exitCode: 1,
        runtime: elapsed,
      };
    }

    // Normalize output: trim each line and the whole string to avoid invisible whitespace mismatches
    const normalizeOutput = (s: string) =>
      s.split('\n').map((l) => l.trimEnd()).join('\n').trim();

    return {
      stdout: normalizeOutput(data.program_output || ''),
      stderr: (data.program_error || '').trim(),
      exitCode: parseInt(data.status || '0', 10),
      runtime: elapsed,
    };
  } catch (err) {
    // If Wandbox is unreachable or errors out, fallback to robust local execution
    return await executeLocally(language, finalCode, stdin);
  }
};

const runProcess = (
  cmd: string,
  args: string[],
  stdin: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
      resolve({ stdout, stderr: stderr + '\nExecution timed out.', exitCode: 124 });
    }, timeoutMs);

    if (child.stdin) {
      if (stdin) child.stdin.write(stdin);
      child.stdin.end();
    }

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if (!killed) {
        resolve({ stdout, stderr: stderr + '\n' + err.message, exitCode: 1 });
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (!killed) {
        resolve({ stdout, stderr, exitCode: code ?? 0 });
      }
    });
  });
};

export const executeLocally = async (
  language: string,
  code: string,
  stdin: string = ''
): Promise<ExecuteResult> => {
  const startTime = Date.now();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codecampus-'));

  try {
    let cmd = '';
    let args: string[] = [];

    if (language === 'python') {
      const filePath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(filePath, code, 'utf-8');
      cmd = 'python3';
      args = [filePath];
    } else if (language === 'javascript' || language === 'typescript') {
      const filePath = path.join(tempDir, 'solution.js');
      fs.writeFileSync(filePath, code, 'utf-8');
      cmd = 'node';
      args = [filePath];
    } else if (language === 'cpp') {
      const srcPath = path.join(tempDir, 'solution.cpp');
      const binPath = path.join(tempDir, 'solution.out');
      fs.writeFileSync(srcPath, code, 'utf-8');
      const compileRes = await runProcess('clang++', ['-std=c++17', '-O2', srcPath, '-o', binPath], '', 10000);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileRes.stderr || 'Compilation error',
          exitCode: compileRes.exitCode,
          runtime: Date.now() - startTime,
        };
      }
      cmd = binPath;
      args = [];
    } else if (language === 'c') {
      const srcPath = path.join(tempDir, 'solution.c');
      const binPath = path.join(tempDir, 'solution.out');
      fs.writeFileSync(srcPath, code, 'utf-8');
      const compileRes = await runProcess('clang', [srcPath, '-o', binPath], '', 10000);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileRes.stderr || 'Compilation error',
          exitCode: compileRes.exitCode,
          runtime: Date.now() - startTime,
        };
      }
      cmd = binPath;
      args = [];
    } else if (language === 'java') {
      const match = code.match(/(?:public\s+)?class\s+(\w+)/);
      const className = match ? match[1] : 'Main';
      const srcPath = path.join(tempDir, `${className}.java`);
      fs.writeFileSync(srcPath, code, 'utf-8');
      const compileRes = await runProcess('javac', [srcPath], '', 10000);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileRes.stderr || 'Java compilation error',
          exitCode: compileRes.exitCode,
          runtime: Date.now() - startTime,
        };
      }
      cmd = 'java';
      args = ['-cp', tempDir, className];
    } else {
      throw new Error(`Language '${language}' is not supported for execution on this sandbox`);
    }

    const execRes = await runProcess(cmd, args, stdin, 15000);
    return {
      stdout: execRes.stdout.trim(),
      stderr: execRes.stderr.trim(),
      exitCode: execRes.exitCode,
      runtime: Date.now() - startTime,
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
};

