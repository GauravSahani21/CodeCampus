import axios from 'axios';

// ─── Judge0 Language ID Map ────────────────────────────────────────────────────
// https://ce.judge0.com/languages/
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  python:     71,   // Python 3.8.1
  javascript: 63,   // Node.js 12.14.0
  typescript: 74,   // TypeScript 3.7.4
  cpp:        54,   // C++ (GCC 9.2.0)
  c:          50,   // C (GCC 9.2.0)
  java:       62,   // Java (OpenJDK 13.0.1)
  go:         60,   // Go (1.13.5)
  rust:       73,   // Rust (1.40.0)
  csharp:     51,   // C# (Mono 6.6.0.161)
  php:        68,   // PHP 7.4.1
  ruby:       72,   // Ruby (2.7.0)
  swift:      83,   // Swift (5.2.3)
};

export interface Judge0Result {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtime: number; // ms
  status: string;
  compileOutput?: string;
}

// ─── Pick Judge0 base URL: prefer env var, else community free CE instance ─────
function getJudge0Url(): string {
  // If explicitly set in env, use that
  if (process.env.JUDGE0_API_URL) {
    return process.env.JUDGE0_API_URL.replace(/\/$/, '');
  }
  // Default: community-hosted CE (no key required, rate-limited)
  return 'https://ce.judge0.com';
}

function getHeaders(): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  // RapidAPI key is optional — only needed for the hosted rapidapi endpoint
  if (process.env.JUDGE0_API_KEY) {
    base['X-RapidAPI-Key']  = process.env.JUDGE0_API_KEY;
    base['X-RapidAPI-Host'] = process.env.JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';
  }
  return base;
}

// ─── Submit a token (batch=false) and poll until done ─────────────────────────
export async function executeWithJudge0(
  language: string,
  sourceCode: string,
  stdin: string = '',
  timeLimitSeconds = 10,
  memoryLimitKb    = 256 * 1024 // 256 MB
): Promise<Judge0Result> {
  const langId = JUDGE0_LANGUAGE_IDS[language];
  if (!langId) {
    throw new Error(`Language '${language}' is not supported by Judge0`);
  }

  const base    = getJudge0Url();
  const headers = getHeaders();
  const startMs = Date.now();

  // Step 1: Submit
  const submitRes = await axios.post(
    `${base}/submissions?base64_encoded=false&wait=false`,
    {
      source_code:   sourceCode,
      language_id:   langId,
      stdin:         stdin || '',
      cpu_time_limit: timeLimitSeconds,
      memory_limit:  memoryLimitKb,
    },
    { headers, timeout: 15000 }
  );

  const token: string = submitRes.data?.token;
  if (!token) throw new Error('Judge0: no token returned');

  // Step 2: Poll until status > 2 (1=In Queue, 2=Processing)
  let attempts = 0;
  const maxAttempts = 30; // 30 × 500 ms = 15 s max
  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 500));
    attempts++;

    const pollRes = await axios.get(
      `${base}/submissions/${token}?base64_encoded=false`,
      { headers, timeout: 10000 }
    );

    const data = pollRes.data;
    const statusId: number = data?.status?.id ?? 1;

    // Still queued or processing — keep polling
    if (statusId <= 2) continue;

    const runtime   = Math.round((parseFloat(data.time ?? '0')) * 1000); // seconds → ms
    const stdout    = (data.stdout    ?? '').trimEnd();
    const stderr    = (data.stderr    ?? '').trimEnd();
    const compileOut = (data.compile_output ?? '').trimEnd();
    const exitCode  = data.exit_code ?? (statusId === 3 ? 0 : 1);

    // Map Judge0 status to friendly string
    const STATUS_MAP: Record<number, string> = {
      3:  'Accepted',
      4:  'Wrong Answer',
      5:  'Time Limit Exceeded',
      6:  'Compilation Error',
      7:  'Runtime Error (SIGSEGV)',
      8:  'Runtime Error (SIGXFSZ)',
      9:  'Runtime Error (SIGFPE)',
      10: 'Runtime Error (SIGABRT)',
      11: 'Runtime Error (NZEC)',
      12: 'Runtime Error (Other)',
      13: 'Internal Error',
      14: 'Exec Format Error',
    };

    return {
      stdout,
      stderr:  compileOut ? `${compileOut}\n${stderr}`.trim() : stderr,
      exitCode,
      runtime: runtime || (Date.now() - startMs),
      status:  STATUS_MAP[statusId] ?? `Status ${statusId}`,
      compileOutput: compileOut || undefined,
    };
  }

  throw new Error('Judge0: execution timed out while polling');
}

// ─── Convenience wrapper matching the ExecuteResult shape used elsewhere ───────
export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  runtime: number;
}

export async function runWithJudge0(
  language: string,
  sourceCode: string,
  stdin: string = ''
): Promise<ExecuteResult> {
  const res = await executeWithJudge0(language, sourceCode, stdin);
  return {
    stdout:   res.stdout,
    stderr:   res.stderr,
    exitCode: res.exitCode,
    runtime:  res.runtime,
  };
}

export function isJudge0Supported(language: string): boolean {
  return !!JUDGE0_LANGUAGE_IDS[language];
}
