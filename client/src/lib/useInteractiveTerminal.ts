'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '@/lib/api';

function getSocketUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : window.location.origin;
}

export interface TerminalEntry {
  type: 'stdout' | 'stderr' | 'system' | 'prompt' | 'input';
  text: string;
}

export function useInteractiveTerminal() {
  const [outputStream, setOutputStream] = useState<TerminalEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [lastExitCode, setLastExitCode] = useState<number | null>(null);
  const [lastRuntime, setLastRuntime] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const url = getSocketUrl();
    if (!url) return;

    const socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('terminal:output', (payload: { stream: 'stdout' | 'stderr'; text: string }) => {
      setOutputStream((prev) => [...prev, { type: payload.stream, text: payload.text }]);
    });

    socket.on('terminal:exit', (payload: { exitCode: number; runtime: number }) => {
      setIsRunning(false);
      setLastExitCode(payload.exitCode);
      setLastRuntime(payload.runtime);
      setOutputStream((prev) => [
        ...prev,
        {
          type: 'system',
          text: payload.exitCode === 0
            ? `\n✓ Process exited with code 0 (${payload.runtime}ms)\n`
            : `\n✕ Process exited with code ${payload.exitCode} (${payload.runtime}ms)\n`,
        },
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const startExecution = useCallback(async (language: string, sourceCode: string, filename?: string) => {
    setIsRunning(true);
    setLastExitCode(null);
    setLastRuntime(null);

    const initialCmd = language === 'python'
      ? `python3 ${filename || 'main.py'}`
      : language === 'javascript'
      ? `node ${filename || 'main.js'}`
      : language === 'typescript'
      ? `ts-node ${filename || 'main.ts'}`
      : language === 'java'
      ? `javac ${filename || 'Main.java'} && java Main`
      : language === 'cpp'
      ? `g++ ${filename || 'main.cpp'} -o a.out && ./a.out`
      : language === 'c'
      ? `gcc ${filename || 'main.c'} -o a.out && ./a.out`
      : `run ${filename || 'main'}`;

    setOutputStream((prev) => [
      ...prev,
      { type: 'prompt', text: `codecampus@sandbox:~/workspace$ ${initialCmd}\n` },
    ]);

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('terminal:start', { language, sourceCode, filename });
    } else {
      // Fallback via HTTP execute endpoint
      try {
        const startTime = Date.now();
        const { data } = await api.post('/execute', { language, sourceCode, stdin: '' });
        const elapsed = Date.now() - startTime;
        setIsRunning(false);
        setLastExitCode(data.exitCode ?? 0);
        setLastRuntime(data.runtime ?? elapsed);

        if (data.stdout) {
          setOutputStream((prev) => [...prev, { type: 'stdout', text: data.stdout + '\n' }]);
        }
        if (data.stderr) {
          setOutputStream((prev) => [...prev, { type: 'stderr', text: data.stderr + '\n' }]);
        }
        setOutputStream((prev) => [
          ...prev,
          {
            type: 'system',
            text: (data.exitCode ?? 0) === 0
              ? `\n✓ Process exited with code 0 (${data.runtime ?? elapsed}ms)\n`
              : `\n✕ Process exited with code ${data.exitCode ?? 1} (${data.runtime ?? elapsed}ms)\n`,
          },
        ]);
      } catch (err: unknown) {
        setIsRunning(false);
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Execution failed';
        setOutputStream((prev) => [
          ...prev,
          { type: 'stderr', text: `\nError: ${msg}\n` },
          { type: 'system', text: '\n✕ Process exited with code 1\n' },
        ]);
      }
    }
  }, []);

  const sendInput = useCallback((text: string) => {
    const cleanText = text.replace(/[\r\n]+$/, '');
    setOutputStream((prev) => [...prev, { type: 'input', text: `${cleanText}\n` }]);

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('terminal:input', { text: cleanText });
    }
  }, []);

  const killExecution = useCallback(() => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('terminal:kill');
    }
    setIsRunning(false);
  }, []);

  const clear = useCallback(() => {
    setOutputStream([]);
    setLastExitCode(null);
    setLastRuntime(null);
  }, []);

  return {
    outputStream,
    isRunning,
    startExecution,
    sendInput,
    killExecution,
    clear,
    lastExitCode,
    lastRuntime,
    connected,
  };
}
