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
    if (problemId) {
      const problem = await Problem.findById(problemId);
      if (problem) {
        effectiveSourceCode = wrapCodeWithDriver(language, sourceCode, problem);
      }
    }

    const result = await executeCode(language, effectiveSourceCode, stdin || '');
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

export const reviewCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { language, sourceCode, problemTitle, problemDescription } = req.body;
    if (!sourceCode || typeof sourceCode !== 'string') {
      res.status(400).json({ error: 'sourceCode is required' });
      return;
    }
    const { generateAICodeReview } = await import('../services/aiCodeReview.service');
    const review = generateAICodeReview(language || 'python', sourceCode, {
      problemTitle,
      problemDescription,
    });
    res.json(review);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI Code Review failed' });
  }
};

