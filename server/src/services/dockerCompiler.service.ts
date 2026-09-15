import axios from 'axios';
import { executeLocally, ExecuteResult } from './piston.service';

const DOCKER_COMPILER_URL = process.env.DOCKER_COMPILER_URL || 'http://localhost:2000';

export async function isDockerCompilerRunning(): Promise<boolean> {
  try {
    const res = await axios.get(`${DOCKER_COMPILER_URL}/health`, { timeout: 1500 });
    return res.data?.status === 'ok';
  } catch {
    return false;
  }
}

export async function executeWithDockerCompiler(
  language: string,
  sourceCode: string,
  stdin: string = ''
): Promise<ExecuteResult> {
  // 1. Try Custom Docker Compiler Microservice (if container is running)
  try {
    const isUp = await isDockerCompilerRunning();
    if (isUp) {
      const { data } = await axios.post(
        `${DOCKER_COMPILER_URL}/compile`,
        {
          language,
          sourceCode,
          stdin,
          timeout: 15000,
        },
        { timeout: 20000 }
      );

      return {
        stdout: data.stdout || '',
        stderr: data.stderr || '',
        exitCode: data.exitCode ?? 0,
        runtime: data.runtime ?? 0,
      };
    }
  } catch (err) {
    console.warn('[DockerCompiler] Container execution attempt failed, falling back:', (err as Error).message);
  }

  // 2. Fallback to native sandbox compiler
  return executeLocally(language, sourceCode, stdin);
}
