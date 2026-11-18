import { Request, Response } from 'express';
import { z } from 'zod';
import { runWithJudge0, isJudge0Supported, JUDGE0_LANGUAGE_IDS } from '../services/judge0.service';
import { executeWithDockerCompiler } from '../services/dockerCompiler.service';
import { executeLocally, LANGUAGE_RUNTIMES } from '../services/piston.service';
import { wrapCodeWithDriver } from '../services/driverWrapper.service';
import Problem from '../models/Problem.model';

const executeSchema = z.object({
  language:   z.string(),
  sourceCode: z.string().min(1).max(50000),
  stdin:      z.string().max(10000).optional(),
  problemId:  z.string().optional(),
});

// ─── Priority: Judge0 → Docker Compiler → Local Fallback ──────────────────────
async function executeCode(language: string, sourceCode: string, stdin: string) {
  // 1. Judge0 (primary — cloud sandbox, most reliable)
  if (isJudge0Supported(language)) {
    try {
      return await runWithJudge0(language, sourceCode, stdin);
    } catch (err) {
      console.warn('[Judge0] Failed, falling back to docker/local:', (err as Error).message);
    }
  }

  // 2. Custom Docker Compiler (local microservice)
  try {
    return await executeWithDockerCompiler(language, sourceCode, stdin);
  } catch (err) {
    console.warn('[DockerCompiler] Failed, falling back to local:', (err as Error).message);
  }

  // 3. Last resort — local native execution
  return executeLocally(language, sourceCode, stdin);
}

// Helper: robust comparison for outputs
function compareOutputs(actual: string, expected: string): boolean {
  const normActual = actual.trim();
  const normExpected = expected.trim();
  if (normActual === normExpected) return true;
  if (normActual.toLowerCase() === normExpected.toLowerCase()) return true;
  try {
    const actJson = JSON.parse(normActual);
    const expJson = JSON.parse(normExpected);
    if (JSON.stringify(actJson) === JSON.stringify(expJson)) return true;
  } catch {}
  const actLines = normActual.split('\n').map((l) => l.trim());
  const expLines = normExpected.split('\n').map((l) => l.trim());
  if (actLines.length === expLines.length) {
    const allMatch = actLines.every((l, idx) => {
      if (l === expLines[idx]) return true;
      return l.replace(/\s+/g, '') === expLines[idx].replace(/\s+/g, '');
    });
    if (allMatch) return true;
  }
  return false;
}

export const runCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, sourceCode, stdin, problemId } = executeSchema.parse(req.body);

    const allSupported = {
      ...LANGUAGE_RUNTIMES,
      ...Object.fromEntries(Object.keys(JUDGE0_LANGUAGE_IDS).map((k) => [k, { compiler: `judge0-${k}` }])),
    };

    if (!allSupported[language]) {
      res.status(400).json({
        error:     `Unsupported language: ${language}`,
        supported: Object.keys(allSupported),
      });
      return;
    }

    let effectiveSourceCode = sourceCode;

    // If problemId is provided and no custom stdin, evaluate against example test cases
    if (problemId && (!stdin || !stdin.trim())) {
      const problem = await Problem.findById(problemId);
      if (problem && problem.testCases && problem.testCases.length > 0) {
        effectiveSourceCode = wrapCodeWithDriver(language, sourceCode, problem);
        const testCasesToRun = problem.testCases.filter((tc) => tc.isExample);
        const effectiveTestCases = testCasesToRun.length > 0 ? testCasesToRun : problem.testCases.slice(0, 3);

        if (effectiveTestCases.length > 0) {
          const testResults = [];
          let totalRuntime = 0;
          let allPassed = true;
          let passedCount = 0;
          let globalStderr = '';

          for (let i = 0; i < effectiveTestCases.length; i++) {
            const tc = effectiveTestCases[i];
            const start = Date.now();
            const execResult = await executeCode(language, effectiveSourceCode, tc.input);
            const duration = (execResult.runtime !== undefined && execResult.runtime > 0) ? execResult.runtime : (Date.now() - start);
            totalRuntime += duration;
            const output = (execResult.stdout || '').trim();
            const hasError = execResult.exitCode !== 0 || Boolean(execResult.stderr && execResult.stderr.trim());
            if (hasError && !globalStderr) globalStderr = execResult.stderr || '';
            const passed = !hasError && compareOutputs(output, tc.expectedOutput);
            if (passed) passedCount++;
            else allPassed = false;

            testResults.push({
              passed,
              input: tc.input,
              expected: tc.expectedOutput,
              actual: output || (hasError ? execResult.stderr : '(no output)'),
              runtime: duration,
            });
          }

          let finalStatus = allPassed ? 'Accepted' : 'Wrong Answer';
          if (!allPassed && globalStderr) {
            const errText = globalStderr.toLowerCase();
            if (errText.includes('syntax') || errText.includes('compile') || errText.includes('error:')) {
              finalStatus = 'Compile Error';
            } else {
              finalStatus = 'Runtime Error';
            }
          }

          res.json({
            status: finalStatus,
            runtime: Math.round(totalRuntime / effectiveTestCases.length),
            passedCount,
            totalCount: effectiveTestCases.length,
            stderr: globalStderr || undefined,
            testResults,
          });
          return;
        }
      }
    }

    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        effectiveSourceCode = wrapCodeWithDriver(language, sourceCode, problem);
      }
    }

    const result = await executeCode(language, effectiveSourceCode, stdin || '');

    if (problemId && stdin && stdin.trim()) {
      const hasError = result.exitCode !== 0 || Boolean(result.stderr && result.stderr.trim());
      res.json({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        runtime: result.runtime,
        status: hasError ? 'Error' : 'Finished',
        passedCount: hasError ? 0 : 1,
        totalCount: 1,
        testResults: [{
          passed: !hasError,
          input: stdin,
          expected: '',
          actual: (result.stdout || '').trim() || (hasError ? result.stderr : '(no output)'),
          runtime: result.runtime,
        }],
      });
      return;
    }

    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    console.error('Execution Error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Execution failed. Please try again.' });
  }
};

export const getSupportedLanguages = (_req: Request, res: Response): void => {
  const languages = [
    ...new Set([
      ...Object.keys(JUDGE0_LANGUAGE_IDS),
      ...Object.keys(LANGUAGE_RUNTIMES),
    ]),
  ].map((lang) => ({ id: lang, engine: isJudge0Supported(lang) ? 'judge0' : 'local' }));

  res.json(languages);
};

