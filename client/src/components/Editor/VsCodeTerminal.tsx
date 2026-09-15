'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Square,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './VsCodeTerminal.module.css';
import TestCaseResults from './TestCaseResults';

export interface TerminalOutputEntry {
  type: 'stdout' | 'stderr' | 'system' | 'prompt' | 'input';
  text: string;
}

interface VsCodeTerminalProps {
  language: string;
  isRunning: boolean;
  outputStream?: TerminalOutputEntry[];
  output?: {
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    runtime?: number;
    status?: string;
    testResults?: any[];
    passedCount?: number;
    totalCount?: number;
  } | null;
  onSendInput?: (text: string) => void;
  onKill?: () => void;
  onClear: () => void;
  onClose?: () => void;
  onRestart?: () => void;
}

export default function VsCodeTerminal({
  language,
  isRunning,
  outputStream,
  output,
  onSendInput,
  onKill,
  onClear,
  onClose,
  onRestart,
}: VsCodeTerminalProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'output' | 'problems' | 'results'>('terminal');
  const [typedInput, setTypedInput] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localShellEntries, setLocalShellEntries] = useState<TerminalOutputEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputInputRef = useRef<HTMLInputElement>(null);

  // Clear local shell entries and input when a new program execution starts
  useEffect(() => {
    if (isRunning) {
      setLocalShellEntries([]);
      setTypedInput('');
    }
  }, [isRunning]);

  // Switch to results tab if testResults are provided (e.g. on submit)
  useEffect(() => {
    if (output?.testResults && output.testResults.length > 0) {
      setActiveTab('results');
    }
  }, [output?.testResults]);

  // Focus the input when clicking in the terminal body (unless user is highlighting text to copy)
  const handleFocusInput = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return;
    }
    inputInputRef.current?.focus();
  };

  // Scroll to bottom whenever stream changes
  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [outputStream, localShellEntries, output, isRunning, activeTab]);

  const handleShellCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) {
      setLocalShellEntries((prev) => [
        ...prev,
        { type: 'prompt', text: 'codecampus@sandbox:~/workspace$ \n' },
      ]);
      return;
    }

    if (trimmed === 'clear' || trimmed === 'cls') {
      setLocalShellEntries([]);
      onClear();
      return;
    }

    if (
      trimmed === 'run' ||
      trimmed === './a.out' ||
      trimmed === './main' ||
      trimmed === 'python' ||
      trimmed === 'python3' ||
      trimmed === 'node' ||
      trimmed === 'java' ||
      trimmed.startsWith('python ') ||
      trimmed.startsWith('node ') ||
      trimmed.startsWith('gcc ') ||
      trimmed.startsWith('g++ ') ||
      trimmed.startsWith('javac ')
    ) {
      setLocalShellEntries([]);
      if (onRestart) {
        onRestart();
      } else {
        toast('Running code in terminal...');
      }
      return;
    }

    if (trimmed === 'ls' || trimmed === 'dir') {
      const fileList =
        language === 'c'
          ? 'main.c  a.out  Makefile'
          : language === 'cpp'
          ? 'main.cpp  a.out  Makefile'
          : language === 'java'
          ? 'Main.java  Main.class'
          : language === 'python'
          ? 'main.py'
          : language === 'javascript'
          ? 'main.js  package.json'
          : language === 'typescript'
          ? 'main.ts  tsconfig.json'
          : 'src/  workspace/';
      setLocalShellEntries((prev) => [
        ...prev,
        { type: 'prompt', text: `codecampus@sandbox:~/workspace$ ${cmdStr}\n` },
        { type: 'stdout', text: `${fileList}\n` },
      ]);
      return;
    }

    if (trimmed === 'help') {
      setLocalShellEntries((prev) => [
        ...prev,
        { type: 'prompt', text: `codecampus@sandbox:~/workspace$ ${cmdStr}\n` },
        {
          type: 'stdout',
          text: `CodeCampus Sandbox Shell\nCommands:\n  run    - Execute active file\n  clear  - Clear terminal screen (Ctrl+L)\n  ls     - List workspace files\n  help   - Show this help menu\n`,
        },
      ]);
      return;
    }

    if (trimmed.startsWith('echo ')) {
      setLocalShellEntries((prev) => [
        ...prev,
        { type: 'prompt', text: `codecampus@sandbox:~/workspace$ ${cmdStr}\n` },
        { type: 'stdout', text: `${cmdStr.slice(5)}\n` },
      ]);
      return;
    }

    setLocalShellEntries((prev) => [
      ...prev,
      { type: 'prompt', text: `codecampus@sandbox:~/workspace$ ${cmdStr}\n` },
      { type: 'stderr', text: `bash: ${trimmed}: command not found (type 'run' to execute code)\n` },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = typedInput;
      setTypedInput('');
      setHistoryIndex(-1);

      if (isRunning) {
        if (onSendInput) {
          onSendInput(val);
        }
      } else {
        if (val.trim()) {
          setCommandHistory((prev) => [...prev, val]);
        }
        handleShellCommand(val);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setTypedInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < commandHistory.length) {
          setHistoryIndex(nextIdx);
          setTypedInput(commandHistory[nextIdx]);
        } else {
          setHistoryIndex(-1);
          setTypedInput('');
        }
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      if (isRunning && onKill) {
        onKill();
        toast('Execution cancelled (^C)');
      } else {
        const val = typedInput;
        setTypedInput('');
        setLocalShellEntries((prev) => [
          ...prev,
          { type: 'prompt', text: `codecampus@sandbox:~/workspace$ ${val}^C\n` },
        ]);
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLocalShellEntries([]);
      onClear();
    }
  };

  const handleCopy = () => {
    let fullText = '';
    const all = [...(outputStream || []), ...localShellEntries];
    if (all.length > 0) {
      fullText = all.map((item) => item.text).join('');
    } else if (output) {
      fullText = `${output.stdout || ''}\n${output.stderr || ''}`;
    }
    if (!fullText) return;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Terminal output copied');
  };

  const allEntries = [...(outputStream || []), ...localShellEntries];
  const errorCount = (output?.stderr ? 1 : 0) + (allEntries.some((s) => s.type === 'stderr') ? 1 : 0);

  return (
    <div
      className={styles.terminalContainer}
      style={isMaximized ? { position: 'fixed', inset: '56px 0 0 0', zIndex: 9999 } : undefined}
    >
      {/* ── VS Code Terminal Header ── */}
      <div className={styles.terminalHeader}>
        <div className={styles.headerTabs}>
          <button
            className={`${styles.tabButton} ${activeTab === 'terminal' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('terminal')}
          >
            <TerminalIcon size={13} />
            <span>Terminal</span>
          </button>

          {output?.testResults && output.testResults.length > 0 && (
            <button
              className={`${styles.tabButton} ${activeTab === 'results' ? styles.tabButtonActive : ''}`}
              onClick={() => setActiveTab('results')}
            >
              <CheckCircle2 size={13} />
              <span>Test Results</span>
              <span className={`${styles.badge} ${output.status === 'Accepted' ? styles.badgeSuccess : styles.badgeError}`}>
                {output.passedCount !== undefined && output.totalCount !== undefined
                  ? `${output.passedCount}/${output.totalCount}`
                  : output.status || 'Done'}
              </span>
            </button>
          )}

          <button
            className={`${styles.tabButton} ${activeTab === 'output' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('output')}
          >
            <FileText size={13} />
            <span>Output</span>
          </button>

          <button
            className={`${styles.tabButton} ${activeTab === 'problems' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('problems')}
          >
            <AlertCircle size={13} />
            <span>Problems</span>
            {errorCount > 0 && <span className={`${styles.badge} ${styles.badgeError}`}>{errorCount}</span>}
          </button>
        </div>

        {/* Toolbar Tools */}
        <div className={styles.headerActions}>
          <div className={styles.envTag}>
            <TerminalIcon size={12} />
            <span>bash: {language}</span>
            {isRunning && (
              <span className={styles.runningBadge}>
                <span className={styles.runningDot} />
                running
              </span>
            )}
          </div>

          {isRunning && onKill && (
            <button
              className={`${styles.actionIconBtn} ${styles.stopBtn}`}
              onClick={onKill}
              title="Stop Execution (Ctrl+C)"
            >
              <Square size={12} fill="currentColor" />
            </button>
          )}

          {onRestart && (
            <button className={styles.actionIconBtn} onClick={onRestart} title="Rerun Program">
              <RotateCcw size={12} />
            </button>
          )}

          <button className={styles.actionIconBtn} onClick={handleCopy} title="Copy Terminal Output">
            {copied ? <Check size={13} style={{ color: '#3fb950' }} /> : <Copy size={13} />}
          </button>

          <button
            className={styles.actionIconBtn}
            onClick={() => {
              setLocalShellEntries([]);
              onClear();
            }}
            title="Clear Terminal (Ctrl+L)"
          >
            <Trash2 size={13} />
          </button>

          <button
            className={styles.actionIconBtn}
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Panel' : 'Maximize Panel'}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {onClose && (
            <button className={styles.actionIconBtn} onClick={onClose} title="Close Terminal Panel">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Tab 1: VS Code Native Terminal Screen ── */}
      {activeTab === 'terminal' && (
        <div className={styles.screen} onClick={handleFocusInput}>
          {/* Welcome Boot Banner */}
          <div className={styles.sysNotice}>
            CodeCampus Sandbox Terminal [Environment: {language}]
            <br />
            Type commands or input directly into the terminal below.
          </div>

          {/* Render Stream Entries */}
          <div className={styles.logFlow}>
            {allEntries.map((entry, i) => {
              if (entry.type === 'prompt') {
                return (
                  <div key={i} className={styles.promptLine}>
                    <span className={styles.promptUser}>codecampus@sandbox</span>
                    <span className={styles.promptSeparator}>:</span>
                    <span className={styles.promptDir}>~/workspace</span>
                    <span className={styles.promptSymbol}>$&nbsp;</span>
                    <span className={styles.promptCmd}>{entry.text.replace(/^codecampus@sandbox:~\/workspace\$\s*/, '')}</span>
                  </div>
                );
              }
              if (entry.type === 'input') {
                return (
                  <span key={i} className={styles.userEcho}>
                    {entry.text}
                  </span>
                );
              }
              if (entry.type === 'stderr') {
                return (
                  <span key={i} className={styles.stderrText}>
                    {entry.text}
                  </span>
                );
              }
              if (entry.type === 'system') {
                return (
                  <div key={i} className={styles.systemStatusText}>
                    {entry.text}
                  </div>
                );
              }
              return (
                <span key={i} className={styles.stdoutText}>
                  {entry.text}
                </span>
              );
            })}

            {/* Static Output Fallback when no stream */}
            {!outputStream && output && (
              <>
                <div className={styles.promptLine}>
                  <span className={styles.promptUser}>codecampus@sandbox</span>
                  <span className={styles.promptSeparator}>:</span>
                  <span className={styles.promptDir}>~/workspace</span>
                  <span className={styles.promptSymbol}>$&nbsp;</span>
                  <span className={styles.promptCmd}>run {language}</span>
                </div>
                {output.stdout && <span className={styles.stdoutText}>{output.stdout}\n</span>}
                {output.stderr && <span className={styles.stderrText}>{output.stderr}\n</span>}
                <div className={styles.systemStatusText}>
                  {output.exitCode === 0
                    ? `\n✓ Process exited with code 0 (${output.runtime ?? 0}ms)\n`
                    : `\n✕ Process exited with code ${output.exitCode ?? 1} (${output.runtime ?? 0}ms)\n`}
                </div>
              </>
            )}

            {/* Active input line - always renders on the next line */}
            <div className={styles.terminalActiveLine}>
              {!isRunning && (
                <span className={styles.promptLineInline}>
                  <span className={styles.promptUser}>codecampus@sandbox</span>
                  <span className={styles.promptSeparator}>:</span>
                  <span className={styles.promptDir}>~/workspace</span>
                  <span className={styles.promptSymbol}>$&nbsp;</span>
                </span>
              )}
              <input
                ref={inputInputRef}
                type="text"
                className={styles.realTerminalInput}
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

          <div ref={terminalEndRef} />
        </div>
      )}

      {/* ── Tab 2: Test Results ── */}
      {activeTab === 'results' && output?.testResults && (
        <div className={styles.screen} style={{ padding: 0 }}>
          <TestCaseResults
            testResults={output.testResults}
            passedCount={output.passedCount}
            totalCount={output.totalCount}
            stderr={output.stderr}
            status={output.status}
          />
        </div>
      )}

      {/* ── Tab 3: Raw Output ── */}
      {activeTab === 'output' && (
        <div className={styles.screen}>
          <pre className={styles.rawOutput}>
            {outputStream ? outputStream.map((s) => s.text).join('') : output?.stdout || 'No output.'}
          </pre>
        </div>
      )}

      {/* ── Tab 4: Problems / Diagnostics ── */}
      {activeTab === 'problems' && (
        <div className={styles.screen}>
          {errorCount > 0 ? (
            <div style={{ color: '#f85149', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 8 }}>
                <AlertCircle size={15} /> Diagnostics ({errorCount})
              </div>
              {output?.stderr || outputStream?.filter((s) => s.type === 'stderr').map((s) => s.text).join('')}
            </div>
          ) : (
            <div style={{ color: '#3fb950', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> Zero compilation or runtime errors detected.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
