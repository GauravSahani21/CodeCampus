import { Server, Socket } from 'socket.io';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

interface ActiveSession {
  proc: ChildProcess;
  tempDir: string;
  language: string;
  startTime: number;
  timer: NodeJS.Timeout;
}

const activeSessions = new Map<string, ActiveSession>();

export function registerTerminalHandler(io: Server, socket: Socket): void {
  const socketId = socket.id;

  const killSession = () => {
    const session = activeSessions.get(socketId);
    if (session) {
      clearTimeout(session.timer);
      try {
        session.proc.kill('SIGKILL');
      } catch {}
      try {
        fs.rmSync(session.tempDir, { recursive: true, force: true });
      } catch {}
      activeSessions.delete(socketId);
    }
  };

  // ─── Start Program Execution in Real-time Interactive Terminal ──────────────
  socket.on('terminal:start', async (payload: { language: string; sourceCode: string; filename?: string }) => {
    // Kill any existing session for this socket
    killSession();

    const { language, sourceCode } = payload;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `codecampus-term-${socketId}-`));
    const startTime = Date.now();

    try {
      let cmd = '';
      let args: string[] = [];

      if (language === 'python') {
        const filePath = path.join(tempDir, 'main.py');
        fs.writeFileSync(filePath, sourceCode, 'utf-8');
        cmd = 'python3';
        // -u flag forces stdin, stdout and stderr to be totally unbuffered
        args = ['-u', filePath];
      } else if (language === 'javascript' || language === 'typescript') {
        const filePath = path.join(tempDir, 'main.js');
        fs.writeFileSync(filePath, sourceCode, 'utf-8');
        cmd = 'node';
        args = [filePath];
      } else if (language === 'cpp') {
        const srcPath = path.join(tempDir, 'main.cpp');
        const binPath = path.join(tempDir, 'a.out');
        // Unbuffer stdout/stderr and sync with stdio so interactive prompts flush immediately
        const unbufferedCpp = `#include <iostream>\n#include <stdio.h>\nstruct _CfUnbuffer {\n    _CfUnbuffer() {\n        setvbuf(stdout, NULL, _IONBF, 0);\n        setvbuf(stderr, NULL, _IONBF, 0);\n        std::cin.tie(nullptr);\n        std::cout.setf(std::ios::unitbuf);\n        std::cerr.setf(std::ios::unitbuf);\n    }\n};\nstatic _CfUnbuffer _cf_unbuffer_instance;\n#line 1 "main.cpp"\n` + sourceCode;
        fs.writeFileSync(srcPath, unbufferedCpp, 'utf-8');

        socket.emit('terminal:output', { stream: 'stdout', text: 'Compiling C++ source...\n' });
        
        // Compile first synchronously
        const compileProc = spawn('clang++', ['-std=c++17', '-O2', srcPath, '-o', binPath]);
        let compileErr = '';
        compileProc.stderr.on('data', (d) => { compileErr += d.toString(); });
        
        const compileCode: number = await new Promise((res) => {
          compileProc.on('close', (code) => res(code ?? 1));
        });

        if (compileCode !== 0) {
          socket.emit('terminal:output', { stream: 'stderr', text: compileErr || 'Compilation failed\n' });
          socket.emit('terminal:exit', { exitCode: compileCode, runtime: Date.now() - startTime });
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
          return;
        }

        cmd = binPath;
        args = [];
      } else if (language === 'c') {
        const srcPath = path.join(tempDir, 'main.c');
        const binPath = path.join(tempDir, 'a.out');
        // Unbuffer stdout/stderr so prompts like printf("Enter: ") without trailing \n flush immediately
        const unbufferedC = `#include <stdio.h>\n__attribute__((constructor)) static void _cf_init(void) {\n    setvbuf(stdout, NULL, _IONBF, 0);\n    setvbuf(stderr, NULL, _IONBF, 0);\n}\n#line 1 "main.c"\n` + sourceCode;
        fs.writeFileSync(srcPath, unbufferedC, 'utf-8');

        socket.emit('terminal:output', { stream: 'stdout', text: 'Compiling C source...\n' });

        const compileProc = spawn('clang', [srcPath, '-o', binPath]);
        let compileErr = '';
        compileProc.stderr.on('data', (d) => { compileErr += d.toString(); });

        const compileCode: number = await new Promise((res) => {
          compileProc.on('close', (code) => res(code ?? 1));
        });

        if (compileCode !== 0) {
          socket.emit('terminal:output', { stream: 'stderr', text: compileErr || 'Compilation failed\n' });
          socket.emit('terminal:exit', { exitCode: compileCode, runtime: Date.now() - startTime });
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
          return;
        }

        cmd = binPath;
        args = [];
      } else if (language === 'java') {
        const match = sourceCode.match(/(?:public\s+)?class\s+(\w+)/);
        const className = match ? match[1] : 'Main';
        const srcPath = path.join(tempDir, `${className}.java`);
        fs.writeFileSync(srcPath, sourceCode, 'utf-8');

        socket.emit('terminal:output', { stream: 'stdout', text: `Compiling Java (${className}.java)...\n` });

        const compileProc = spawn('javac', [srcPath]);
        let compileErr = '';
        compileProc.stderr.on('data', (d) => { compileErr += d.toString(); });

        const compileCode: number = await new Promise((res) => {
          compileProc.on('close', (code) => res(code ?? 1));
        });

        if (compileCode !== 0) {
          socket.emit('terminal:output', { stream: 'stderr', text: compileErr || 'Java compilation failed\n' });
          socket.emit('terminal:exit', { exitCode: compileCode, runtime: Date.now() - startTime });
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
          return;
        }

        cmd = 'java';
        args = ['-cp', tempDir, className];
      } else {
        // ─── Fallback to Judge0 for unsupported-locally languages ─────────────
        const { runWithJudge0, isJudge0Supported } = await import('../services/judge0.service');

        if (!isJudge0Supported(language)) {
          socket.emit('terminal:output', { stream: 'stderr', text: `Language '${language}' is not supported.\n` });
          socket.emit('terminal:exit', { exitCode: 1, runtime: 0 });
          try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
          return;
        }

        socket.emit('terminal:output', { stream: 'stdout', text: `Running ${language} via Judge0 sandbox…\n` });

        try {
          const result = await runWithJudge0(language, sourceCode, '');
          if (result.stdout) socket.emit('terminal:output', { stream: 'stdout', text: result.stdout + '\n' });
          if (result.stderr) socket.emit('terminal:output', { stream: 'stderr', text: result.stderr + '\n' });
          socket.emit('terminal:exit', { exitCode: result.exitCode, runtime: result.runtime });
        } catch (err) {
          socket.emit('terminal:output', { stream: 'stderr', text: `Judge0 execution failed: ${(err as Error).message}\n` });
          socket.emit('terminal:exit', { exitCode: 1, runtime: 0 });
        }
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {};
        return;
      }

      // Spawn child process
      const proc = spawn(cmd, args, {
        cwd: tempDir,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: '1',
          NODE_NO_WARNINGS: '1',
        },
      });

      // 60-second execution guard
      const timer = setTimeout(() => {
        socket.emit('terminal:output', { stream: 'stderr', text: '\n[Execution timed out after 60 seconds]\n' });
        proc.kill('SIGKILL');
      }, 60000);

      activeSessions.set(socketId, {
        proc,
        tempDir,
        language,
        startTime,
        timer,
      });

      proc.stdout.on('data', (chunk) => {
        socket.emit('terminal:output', { stream: 'stdout', text: chunk.toString() });
      });

      proc.stderr.on('data', (chunk) => {
        socket.emit('terminal:output', { stream: 'stderr', text: chunk.toString() });
      });

      proc.on('error', (err) => {
        socket.emit('terminal:output', { stream: 'stderr', text: `\nProcess error: ${err.message}\n` });
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        activeSessions.delete(socketId);
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
        socket.emit('terminal:exit', { exitCode: code ?? 0, runtime: Date.now() - startTime });
      });

    } catch (err) {
      console.error('[terminal:start] error:', err);
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      socket.emit('terminal:output', { stream: 'stderr', text: `Failed to start process: ${err instanceof Error ? err.message : String(err)}\n` });
      socket.emit('terminal:exit', { exitCode: 1, runtime: Date.now() - startTime });
    }
  });

  // ─── Stream User Input to Process stdin ─────────────────────────────────────
  socket.on('terminal:input', (payload: { text: string }) => {
    const session = activeSessions.get(socketId);
    if (!session || !session.proc.stdin || session.proc.killed) {
      return;
    }

    try {
      const textToSend = payload.text.endsWith('\n') ? payload.text : `${payload.text}\n`;
      session.proc.stdin.write(textToSend);
    } catch (err) {
      console.error('[terminal:input] error:', err);
    }
  });

  // ─── Kill Running Process ───────────────────────────────────────────────────
  socket.on('terminal:kill', () => {
    killSession();
    socket.emit('terminal:output', { stream: 'stderr', text: '^C\n[Process terminated by user]\n' });
    socket.emit('terminal:exit', { exitCode: 130, runtime: 0 });
  });

  // ─── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    killSession();
  });
}
