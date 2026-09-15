const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 2000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to execute child processes inside the Docker container
function runProcess(cmd, args, stdin, timeoutMs) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    const timer = setTimeout(() => {
      killed = true;
      child.kill('SIGKILL');
      resolve({ stdout, stderr: stderr + '\n[Execution timed out in container]', exitCode: 124 });
    }, timeoutMs || 15000);

    if (child.stdin) {
      if (stdin) child.stdin.write(stdin);
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
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
}

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'codecampus-docker-compiler',
    version: '1.0.0',
    container: true,
    languages: ['python', 'javascript', 'typescript', 'cpp', 'c', 'java', 'go'],
    timestamp: new Date().toISOString(),
  });
});

// ── Main Compile & Execute Endpoint ──────────────────────────────────────────
app.post('/compile', async (req, res) => {
  const { language, sourceCode, stdin = '', timeout = 15000 } = req.body;

  if (!language || typeof sourceCode !== 'string') {
    return res.status(400).json({ error: 'Missing language or sourceCode' });
  }

  const startTime = Date.now();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docker-sandbox-'));

  try {
    let cmd = '';
    let args = [];

    if (language === 'python') {
      const srcPath = path.join(tempDir, 'main.py');
      fs.writeFileSync(srcPath, sourceCode, 'utf-8');
      cmd = 'python3';
      args = ['-u', srcPath];
    } else if (language === 'javascript' || language === 'typescript') {
      const srcPath = path.join(tempDir, 'main.js');
      fs.writeFileSync(srcPath, sourceCode, 'utf-8');
      cmd = 'node';
      args = [srcPath];
    } else if (language === 'cpp') {
      const srcPath = path.join(tempDir, 'main.cpp');
      const binPath = path.join(tempDir, 'a.out');
      fs.writeFileSync(srcPath, sourceCode, 'utf-8');

      const compileRes = await runProcess('g++', ['-std=c++17', '-O2', srcPath, '-o', binPath], '', 10000);
      if (compileRes.exitCode !== 0) {
        return res.json({
          stdout: '',
          stderr: compileRes.stderr || 'Compilation error',
          exitCode: compileRes.exitCode,
          runtime: Date.now() - startTime,
          container: true,
        });
      }
      cmd = binPath;
      args = [];
    } else if (language === 'c') {
      const srcPath = path.join(tempDir, 'main.c');
      const binPath = path.join(tempDir, 'a.out');
      fs.writeFileSync(srcPath, sourceCode, 'utf-8');

      const compileRes = await runProcess('gcc', [srcPath, '-o', binPath], '', 10000);
      if (compileRes.exitCode !== 0) {
        return res.json({
          stdout: '',
          stderr: compileRes.stderr || 'Compilation error',
          exitCode: compileRes.exitCode,
          runtime: Date.now() - startTime,
          container: true,
        });
      }
      cmd = binPath;
      args = [];
    } else if (language === 'java') {
      const match = sourceCode.match(/(?:public\s+)?class\s+(\w+)/);
      const className = match ? match[1] : 'Main';
      const srcPath = path.join(tempDir, `${className}.java`);
      fs.writeFileSync(srcPath, sourceCode, 'utf-8');

      const compileRes = await runProcess('javac', [srcPath], '', 10000);
      if (compileRes.exitCode !== 0) {
        return res.json({
          stdout: '',
          stderr: compileRes.stderr || 'Java compilation error',
          exitCode: compileRes.exitCode,
          runtime: Date.now() - startTime,
          container: true,
        });
      }
      cmd = 'java';
      args = ['-cp', tempDir, className];
    } else if (language === 'go') {
      const srcPath = path.join(tempDir, 'main.go');
      fs.writeFileSync(srcPath, sourceCode, 'utf-8');
      cmd = 'go';
      args = ['run', srcPath];
    } else {
      return res.status(400).json({ error: `Language '${language}' is not supported` });
    }

    const execRes = await runProcess(cmd, args, stdin, timeout);
    const runtime = Date.now() - startTime;

    res.json({
      stdout: execRes.stdout.trim(),
      stderr: execRes.stderr.trim(),
      exitCode: execRes.exitCode,
      runtime,
      container: true,
    });
  } catch (err) {
    console.error('[compiler:error]', err);
    res.status(500).json({
      error: 'Container compilation failed',
      details: err.message,
      container: true,
    });
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`CodeCampus Docker Compiler Microservice running on port ${PORT}`);
});
