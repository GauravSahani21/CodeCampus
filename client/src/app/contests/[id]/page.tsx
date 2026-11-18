'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Group, Panel, Separator } from 'react-resizable-panels';
import api from '@/lib/api';
import LanguageSelector from '@/components/Editor/LanguageSelector';
import VsCodeTerminal from '@/components/Editor/VsCodeTerminal';
import FileLanguageIcon from '@/components/Editor/FileLanguageIcon';
import LeetCodeConsole from '@/components/Editor/LeetCodeConsole';
import {
  Trophy, Clock, Send, ShieldAlert, ShieldCheck, Shield,
  Sparkles, AlertCircle, FileCode, CheckCircle2, ChevronRight,
  ArrowLeft, Loader2, Maximize, Minimize, AlertTriangle,
  EyeOff, Copy, ClipboardX, Info, Bell, Lock, X, Play,
  ChevronUp, ChevronDown, ListChecks, HelpCircle, Check,
  RotateCcw, Bookmark, Terminal, Code2, CheckSquare,
  FileText, GitBranch, Terminal as TerminalIcon
} from 'lucide-react';
import styles from './exam.module.css';

const CodeEditor = dynamic(() => import('@/components/Editor/CodeEditor'), { ssr: false });

const LANG_FILE_MAP: Record<string, string> = {
  python: 'Solution.py',
  javascript: 'solution.js',
  typescript: 'solution.ts',
  cpp: 'Solution.cpp',
  c: 'solution.c',
  java: 'Solution.java',
  go: 'main.go',
  csharp: 'Solution.cs',
};

interface ContestProblem {
  problemId: {
    _id: string;
    title: string;
    slug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    description: string;
    tags?: string[];
    inputFormat?: string;
    outputFormat?: string;
    constraints?: string;
    starterTemplates?: Record<string, string>;
    exampleTestCases?: Array<{ input: string; expectedOutput: string; explanation?: string }>;
  };
  points: number;
  order: number;
}

interface ContestMCQ {
  question: string;
  options: string[];
  points: number;
  order: number;
}

interface ContestData {
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  contestType?: 'standard' | 'superset';
  allowCodeExecution?: boolean;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  problems: ContestProblem[];
  mcqQuestions?: ContestMCQ[];
  allowedLanguages: string[];
  totalPoints: number;
  aiEvaluationEnabled: boolean;
}

interface ViolationEvent {
  type: string;
  timestamp: string;
  detail?: string;
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  python: `class Solution:\n    def solve(self, *args):\n        # Your code here\n        pass\n`,
  javascript: `function solve(...args) {\n    // Your code here\n}\n`,
  cpp: `class Solution {\npublic:\n    void solve() {\n        // Your code here\n    }\n};\n`,
  java: `class Solution {\n    public void solve() {\n        // Your code here\n    }\n}\n`,
};

function cleanClientTemplate(lang: string, code?: string): string {
  if (!code) return '';
  const trimmed = code.trim();

  if (lang === 'python') {
    if (trimmed.includes('def reverseList')) {
      const defIdx = trimmed.indexOf('def reverseList');
      const afterDef = trimmed.substring(defIdx);
      const lines = afterDef.split('\n');
      const defLines = [lines[0]];
      for (let i = 1; i < lines.length; i++) {
        const l = lines[i];
        if (l.trim() === '' || l.startsWith('    ') || l.startsWith('\t')) {
          defLines.push(l);
        } else break;
      }
      return (
        '# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\n\n' +
        defLines.join('\n').trim()
      );
    }

    const sysMatch = trimmed.search(
      /(?:^|\n)(import sys|from sys|data = sys\.stdin|if __name__|lines = sys\.stdin|s = sys\.stdin)/
    );
    if (sysMatch > 0) {
      return trimmed.substring(0, sysMatch).trim();
    }
    if (sysMatch === 0 || (sysMatch > 0 && trimmed.indexOf('def ') > sysMatch)) {
      const defIdx = trimmed.indexOf('def ');
      if (defIdx >= 0) {
        const afterDef = trimmed.substring(defIdx);
        const lines = afterDef.split('\n');
        const defLines = [lines[0]];
        for (let i = 1; i < lines.length; i++) {
          const l = lines[i];
          if (l.trim() === '' || l.startsWith('    ') || l.startsWith('\t')) {
            defLines.push(l);
          } else break;
        }
        return defLines.join('\n').trim();
      }
    }
    const fnMatch = trimmed.match(/(def\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*:(?:\n[ \t]+[^\n]+)+)/);
    if (fnMatch) return fnMatch[1].trim();
  }

  if (lang === 'java') {
    if (trimmed.includes('public static void main')) {
      const mainIdx = trimmed.indexOf('public static void main');
      const beforeMain = trimmed.substring(0, mainIdx).trim();
      let methodPart = beforeMain;
      methodPart = methodPart.replace(/^import\s+[^;]+;\s*/gm, '');
      methodPart = methodPart.replace(/public\s+class\s+[A-Za-z0-9_]+\s*\{/, '');
      methodPart = methodPart.trim();
      const lines = methodPart
        .split('\n')
        .map((l) => (l.startsWith('    ') ? l : '    ' + l))
        .join('\n');
      return `class Solution {\n${lines}\n}`;
    }
  }

  if (lang === 'cpp') {
    const mainIdx = trimmed.indexOf('int main(');
    if (mainIdx > 0) {
      let codePart = trimmed.substring(0, mainIdx).trim();
      codePart = codePart.replace(/^#include\s+<[^>]+>\s*/gm, '');
      codePart = codePart.replace(/^using\s+namespace\s+std;\s*/gm, '');
      return codePart.trim();
    }
  }

  if (lang === 'javascript') {
    const fnMatch = trimmed.match(/(function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{[\s\S]*?\n\s*\})/);
    if (fnMatch) return fnMatch[1].trim();
  }

  return trimmed;
}

export default function ContestExamPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params?.id as string;

  const [contest, setContest] = useState<ContestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedProblemIdx, setSelectedProblemIdx] = useState(0);

  // Solutions map: problemId -> { code, language, codesByLang }
  const [solutions, setSolutions] = useState<Record<string, { code: string; language: string; codesByLang?: Record<string, string> }>>({});
  const [existingSubmission, setExistingSubmission] = useState<any>(null);

  // Section switcher for SuperSet mode: 'coding' | 'mcq'
  const [activeSection, setActiveSection] = useState<'coding' | 'mcq'>('coding');

  // MCQ state: questionIndex -> selectedOption (-1 means unselected)
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, number>>({});
  const [currentMcqIdx, setCurrentMcqIdx] = useState<number>(0);
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});

  // SuperSet Code Execution states
  const [runningCode, setRunningCode] = useState(false);
  const [testConsoleOpen, setTestConsoleOpen] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [terminalOutput, setTerminalOutput] = useState<{
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    runtime?: number;
    status?: string;
    testResults?: any[];
    passedCount?: number;
    totalCount?: number;
  } | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [activeCaseTab, setActiveCaseTab] = useState<number>(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState<string>('');
  const [customResult, setCustomResult] = useState<any>(null);
  const [activeTestMode, setActiveTestMode] = useState<'cases' | 'custom'>('cases');
  const [consoleOutput, setConsoleOutput] = useState<{
    stdout?: string;
    stderr?: string;
    status?: string;
    runtime?: number;
    testResults?: any[];
    passedCount?: number;
    totalCount?: number;
  } | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result'>('testcase');

  // Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(3600);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Submitting modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0);

  // ── Proctoring States ──
  const [hasStartedExam, setHasStartedExam] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [showProctorInfoModal, setShowProctorInfoModal] = useState(false);

  const [tabSwitches, setTabSwitches] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [violationLogs, setViolationLogs] = useState<ViolationEvent[]>([]);
  const [proctorToast, setProctorToast] = useState<string | null>(null);

  // ── Auto Disqualification & Cheating States & Refs ──
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isCheating, setIsCheating] = useState(false);
  const [disqualificationReason, setDisqualificationReason] = useState('');

  const resumingCooldownRef = useRef(false);
  const lastTabSwitchTimeRef = useRef(0);
  const tabSwitchesRef = useRef(0);
  const violationsCountRef = useRef(0);
  const isDisqualifiedRef = useRef(false);
  const solutionsRef = useRef(solutions);
  solutionsRef.current = solutions;
  const mcqAnswersRef = useRef(mcqAnswers);
  mcqAnswersRef.current = mcqAnswers;
  const timeSpentRef = useRef(timeSpentSeconds);
  timeSpentRef.current = timeSpentSeconds;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleTextareaScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);
  const toastTimerRef = useRef<any>(null);

  // Synthesizer Beep for Security Alert
  const triggerAlertSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio context may be restricted
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setProctorToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setProctorToast(null);
    }, 2800);
  }, []);

  // Enter Fullscreen Function
  const requestFullscreenMode = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        await (el as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenWarning(false);
    } catch (err) {
      console.warn('Fullscreen request denied or not allowed yet:', err);
    }
  };

  // Start exam from gateway
  const handleStartExam = async () => {
    await requestFullscreenMode();
    setHasStartedExam(true);
    showToast('Proctored exam session active. Good luck!');
  };

  // Hide global navbar/footer during exam, restore on leave
  useEffect(() => {
    document.body.classList.add('exam-mode');
    return () => {
      document.body.classList.remove('exam-mode');
    };
  }, []);

  // Load contest & past submission
  useEffect(() => {
    if (!contestId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/contests/${contestId}`);
        setContest(data);

        // Initialize solutions
        const initialSols: Record<string, { code: string; language: string }> = {};
        data.problems?.forEach((p: ContestProblem) => {
          const prob = p?.problemId;
          if (!prob || !prob._id) return;
          const defaultLang = 'python';
          const starterCode = cleanClientTemplate(
            defaultLang,
            prob?.starterTemplates?.[defaultLang] || DEFAULT_TEMPLATES[defaultLang] || ''
          );
          initialSols[prob._id] = {
            code: starterCode,
            language: defaultLang,
            codesByLang: {
              [defaultLang]: starterCode,
            },
          } as any;
        });
        setSolutions(initialSols);

        // Initialize timer (default from contest duration)
        const durationSecs = (data.durationMinutes || 60) * 60;
        setTimeLeftSeconds(durationSecs);

        // Check if user already submitted
        try {
          const subRes = await api.get(`/contests/${contestId}/my-submission`);
          if (subRes.data?.submission) {
            const sub = subRes.data.submission;
            setExistingSubmission(sub);
            if (sub.isCheating || sub.isDisqualified || sub.status === 'Cheating' || sub.status === 'Disqualified') {
              setIsDisqualified(true);
              setIsCheating(true);
              isDisqualifiedRef.current = true;
              setDisqualificationReason(
                sub.cheatingReason ||
                sub.disqualificationReason ||
                'Academic integrity violation: Exceeded maximum allowed violations (3/3). Contest terminated and flagged as cheating.'
              );
            }
            setHasStartedExam(true); // already finished, no gate needed
          }
        } catch {
          // not logged in or not submitted yet
        }
      } catch (err: any) {
        console.error('Failed to load contest:', err);
        setErrorMsg(err.response?.data?.error || 'Failed to load contest');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [contestId]);

  // Countdown timer
  useEffect(() => {
    if (loading || submitting || !hasStartedExam) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
      setTimeSpentSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting, hasStartedExam]);

  const handleResumeFromTabSwitch = () => {
    resumingCooldownRef.current = true;
    setShowTabSwitchWarning(false);
    try {
      window.focus();
    } catch {}
    setTimeout(() => {
      resumingCooldownRef.current = false;
    }, 1500);
  };

  const handleAutoDisqualify = useCallback(async (customReason?: string) => {
    if (isDisqualifiedRef.current) return;
    isDisqualifiedRef.current = true;
    setIsDisqualified(true);
    setIsCheating(true);
    const reasonText =
      customReason ||
      'Academic integrity violation: Exceeded maximum allowed proctoring violations (3/3). Contest terminated and flagged as cheating with score of 0.';
    setDisqualificationReason(reasonText);
    setShowTabSwitchWarning(false);
    setShowFullscreenWarning(false);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch {}

    triggerAlertSound();

    try {
      const mcqArray = (contest?.mcqQuestions || []).map((_, idx) => ({
        questionIndex: idx,
        selectedOption: typeof mcqAnswersRef.current[idx] === 'number' ? mcqAnswersRef.current[idx] : -1,
      }));

      const finalLogs = [
        {
          type: 'Contest Terminated - Flagged as Cheating (3/3 Violations)',
          timestamp: new Date().toLocaleTimeString(),
          detail: 'Maximum 3 proctoring violations reached. Contest terminated and flagged as cheating with score 0.',
        },
        ...violationLogs,
      ];

      const payload = {
        timeSpentSeconds: timeSpentRef.current,
        solutions: Object.entries(solutionsRef.current).map(([probId, data]) => ({
          problemId: probId,
          language: data.language,
          code: data.code,
        })),
        mcqAnswers: mcqArray,
        proctoringData: {
          tabSwitches: tabSwitchesRef.current,
          fullscreenExits,
          copyPasteAttempts,
          violationsCount: Math.max(3, violationsCountRef.current),
          violationLogs: finalLogs,
        },
        isDisqualified: true,
        isCheating: true,
        status: 'Cheating',
        disqualificationReason: reasonText,
        cheatingReason: reasonText,
      };

      await api.post(`/contests/${contestId}/submit`, payload);
    } catch (err) {
      console.error('Failed to submit cheating status to server:', err);
    }
  }, [contest, contestId, fullscreenExits, copyPasteAttempts, violationLogs, triggerAlertSound]);

  const recordViolation = useCallback((type: string, detail: string, isTabSwitch = false) => {
    if (!hasStartedExam || submitting || isDisqualifiedRef.current) return;
    if (isTabSwitch && resumingCooldownRef.current) return;

    violationsCountRef.current += 1;
    const currentViolations = violationsCountRef.current;
    setViolationsCount(currentViolations);

    const logEntry: ViolationEvent = {
      type: `${type} (${currentViolations}/3)`,
      timestamp: new Date().toLocaleTimeString(),
      detail:
        currentViolations >= 3
          ? `${detail} — Maximum violations limit reached (3/3). Contest terminated and flagged as cheating.`
          : `${detail} (Violation ${currentViolations} of 3 recorded).`,
    };

    setViolationLogs((prev) => [logEntry, ...prev]);
    triggerAlertSound();

    if (currentViolations >= 3) {
      handleAutoDisqualify(
        `Academic integrity violation: Exceeded maximum allowed violations limit (3/3) due to ${type.toLowerCase()}. Contest terminated and flagged as cheating.`
      );
    } else {
      if (isTabSwitch) {
        setShowTabSwitchWarning(true);
      }
      showToast(`Security Alert (${currentViolations}/3): ${type} detected!`);
    }
  }, [hasStartedExam, submitting, triggerAlertSound, showToast, handleAutoDisqualify]);

  // ── PROCTORING EVENT LISTENERS ──
  useEffect(() => {
    if (!hasStartedExam || submitting || existingSubmission || isDisqualified) return;

    // 1. Fullscreen Change Detection
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(active);

      if (!active) {
        setShowFullscreenWarning(true);
        setFullscreenExits((prev) => prev + 1);
        recordViolation('Fullscreen Exited', 'Candidate exited fullscreen mode');
      }
    };

    // 2. Window Blur / Tab Switch Detection
    const handleWindowBlur = () => {
      if (!hasStartedExam || submitting || isDisqualifiedRef.current || resumingCooldownRef.current) return;

      const now = Date.now();
      if (now - lastTabSwitchTimeRef.current < 1500) return; // 1.5s debounce prevents double event from blur + visibilitychange
      lastTabSwitchTimeRef.current = now;

      tabSwitchesRef.current += 1;
      setTabSwitches(tabSwitchesRef.current);
      recordViolation('Window / Tab Switch', 'Exam window lost focus or candidate switched tabs/applications', true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleWindowBlur();
      }
    };

    // 3. Prevent Copy, Cut, Paste
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyPasteAttempts((prev) => prev + 1);
      recordViolation('Copy Blocked', 'Attempted to copy exam contents to clipboard');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyPasteAttempts((prev) => prev + 1);
      recordViolation('Cut Blocked', 'Attempted to cut exam text');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyPasteAttempts((prev) => prev + 1);
      recordViolation('Paste Blocked', 'Attempted to paste external content into editor');
    };

    // 4. Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showToast('Right-click context menu is disabled in exam mode.');
    };

    // 5. Block Key Combinations (Ctrl+C, Ctrl+V, DevTools F12/Ctrl+Shift+I)
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Block Copy / Paste / Cut hotkeys
      if (isCtrlOrMeta && (key === 'c' || key === 'v' || key === 'x')) {
        e.preventDefault();
        setCopyPasteAttempts((prev) => prev + 1);
        recordViolation(`Blocked Shortcut (Ctrl+${key.toUpperCase()})`, `Attempted clipboard shortcut Ctrl+${key.toUpperCase()}`);
      }

      // Block Developer Tools (F12, Ctrl+Shift+I/J/C)
      if (
        e.key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (isCtrlOrMeta && key === 'u')
      ) {
        e.preventDefault();
        recordViolation('Developer Tools Blocked', `Attempted to open developer tools (key: ${e.key})`);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [hasStartedExam, submitting, existingSubmission, isDisqualified, recordViolation, showToast]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${hours > 0 ? pad(hours) + ':' : ''}${pad(minutes)}:${pad(seconds)}`;
  };

  const currentProb = contest?.problems?.[selectedProblemIdx]?.problemId;
  const currentPoints = contest?.problems?.[selectedProblemIdx]?.points || 100;
  const currentSol = currentProb ? solutions[currentProb._id] : null;

  const isInteractiveMode = contest?.contestType === 'superset';
  const canRunCode = isInteractiveMode && contest?.allowCodeExecution !== false;

  const handleCodeChange = (newCode: string) => {
    if (!currentProb) return;
    setSolutions((prev) => {
      const current = prev[currentProb._id] || { code: '', language: 'python', codesByLang: {} };
      const currentLang = current.language || 'python';
      return {
        ...prev,
        [currentProb._id]: {
          ...current,
          code: newCode,
          codesByLang: {
            ...(current.codesByLang || {}),
            [currentLang]: newCode,
          },
        },
      };
    });
  };

  const handleLanguageChange = (lang: string) => {
    if (!currentProb) return;
    setSolutions((prev) => {
      const current = prev[currentProb._id] || { code: '', language: 'python', codesByLang: {} };
      const currentLang = current.language || 'python';
      const existingCodes: Record<string, string> = {
        ...(current.codesByLang || {}),
        [currentLang]: current.code,
      };

      // If user already typed code for the new language, load it;
      // otherwise, grab and clean the problem's starter template for this language.
      let nextCode = existingCodes[lang];
      if (nextCode === undefined) {
        const rawTemplate = currentProb.starterTemplates?.[lang] || DEFAULT_TEMPLATES[lang] || '';
        nextCode = cleanClientTemplate(lang, rawTemplate);
        existingCodes[lang] = nextCode;
      }

      return {
        ...prev,
        [currentProb._id]: {
          code: nextCode,
          language: lang,
          codesByLang: existingCodes,
        },
      };
    });
    setTerminalOutput(null);
  };

  // Plain Editor: Intercept Tab key to indent with 4 spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = target.value;

      const updated = val.substring(0, start) + '    ' + val.substring(end);
      handleCodeChange(updated);

      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Interactive Mode: Run Code against example test cases or custom input
  const handleRunCode = async (overrideStdin?: string) => {
    if (!canRunCode || !contest || !currentProb) return;
    try {
      setRunningCode(true);
      setIsConsoleOpen(true);
      setTestConsoleOpen(true);
      setActiveConsoleTab('result');
      setRunError(null);

      const effectiveCustomInput = typeof overrideStdin === 'string'
        ? overrideStdin
        : (customInput.trim() ? customInput : undefined);

      const res = await api.post(`/contests/${contestId}/run`, {
        problemId: currentProb._id,
        language: currentSol?.language || 'python',
        code: currentSol?.code || '',
        customInput: effectiveCustomInput,
      });

      if (res.data.custom) {
        setCustomResult(res.data);
        const hasErr = Boolean(res.data.error || (res.data.exitCode && res.data.exitCode !== 0));
        setConsoleOutput({
          stdout: res.data.output || '',
          stderr: res.data.error || '',
          status: hasErr ? 'Runtime Error' : 'Accepted',
          runtime: res.data.executionTimeMs,
          testResults: [{
            passed: !hasErr,
            input: res.data.input || effectiveCustomInput || '',
            expected: '',
            actual: res.data.output || (hasErr ? res.data.error : '(no output)'),
            runtime: res.data.executionTimeMs,
          }],
          passedCount: !hasErr ? 1 : 0,
          totalCount: 1,
        });
        setTerminalOutput({
          stdout: res.data.output || '',
          stderr: res.data.error || '',
          exitCode: res.data.exitCode ?? (res.data.error ? 1 : 0),
          runtime: res.data.executionTimeMs,
          status: res.data.exitCode === 0 && !res.data.error ? 'Success' : 'Error',
        });
      } else {
        const tests = res.data.testResults || [];
        setTestResults(tests);
        setActiveCaseTab(0);
        const passedCount = tests.filter((t: any) => t.passed).length;
        const firstErr = tests.find((t: any) => t.error)?.error;
        const allPassed = res.data.allPassed;
        setConsoleOutput({
          status: allPassed ? 'Accepted' : (firstErr ? 'Runtime Error' : 'Wrong Answer'),
          runtime: tests[0]?.executionTimeMs,
          passedCount,
          totalCount: tests.length,
          stderr: firstErr || undefined,
          testResults: tests.map((t: any) => ({
            passed: t.passed,
            input: t.input,
            expected: t.expectedOutput,
            actual: t.actualOutput,
            runtime: t.executionTimeMs,
          })),
        });
        setTerminalOutput({
          stdout: res.data.allPassed
            ? `All ${tests.length} example test cases passed successfully.`
            : `Testing completed: ${passedCount}/${tests.length} test cases passed.`,
          stderr: firstErr || '',
          exitCode: res.data.allPassed ? 0 : 1,
          status: res.data.allPassed ? 'Accepted' : 'Wrong Answer',
          passedCount,
          totalCount: tests.length,
          testResults: tests.map((t: any) => ({
            input: t.input,
            expectedOutput: t.expectedOutput,
            actualOutput: t.actualOutput,
            passed: t.passed,
            status: t.passed ? 'Passed' : (t.error ? 'Runtime Error' : 'Wrong Answer'),
          })),
        });
      }
    } catch (err: any) {
      console.error('Failed to run code:', err);
      const msg = err.response?.data?.error || 'Failed to execute code';
      setRunError(msg);
      setConsoleOutput({
        stdout: '',
        stderr: msg,
        status: 'Runtime Error',
      });
      setTerminalOutput({
        stdout: '',
        stderr: msg,
        exitCode: 1,
        status: 'Error',
      });
      showToast(msg);
    } finally {
      setRunningCode(false);
    }
  };

  // MCQ handlers
  const handleSelectOption = (qIdx: number, optIdx: number) => {
    setMcqAnswers((prev) => ({
      ...prev,
      [qIdx]: prev[qIdx] === optIdx ? -1 : optIdx,
    }));
  };

  const handleToggleReview = (qIdx: number) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx],
    }));
  };

  const handleClearOption = (qIdx: number) => {
    setMcqAnswers((prev) => ({
      ...prev,
      [qIdx]: -1,
    }));
  };

  const handleSubmitContest = async () => {
    try {
      setSubmitting(true);
      setSubmitStep(1); // Test execution

      const mcqArray = (contest?.mcqQuestions || []).map((_, idx) => ({
        questionIndex: idx,
        selectedOption: typeof mcqAnswers[idx] === 'number' ? mcqAnswers[idx] : -1,
      }));

      const payload = {
        timeSpentSeconds,
        solutions: Object.entries(solutions).map(([probId, data]) => ({
          problemId: probId,
          language: data.language,
          code: data.code,
        })),
        mcqAnswers: mcqArray,
        proctoringData: {
          tabSwitches,
          fullscreenExits,
          copyPasteAttempts,
          violationsCount,
          violationLogs,
        },
      };

      setTimeout(() => setSubmitStep(2), 1800); // AI Evaluation

      await api.post(`/contests/${contestId}/submit`, payload);
      setSubmitStep(3); // Done

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      setTimeout(() => {
        router.push(`/contests/${contestId}/results`);
      }, 800);
    } catch (err: any) {
      console.error('Failed to submit contest:', err);
      alert(err.response?.data?.error || 'Failed to submit contest solutions');
      setSubmitting(false);
      setConfirmModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          color: '#c9d1d9',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <Loader2 size={36} className="animate-spin text-green" style={{ color: 'var(--accent-green)' }} />
        <p>Entering Secure Exam Environment...</p>
      </div>
    );
  }

  if (errorMsg || !contest) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <AlertCircle size={48} style={{ color: 'var(--accent-red)' }} />
        <h2 style={{ color: '#fff' }}>Contest Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{errorMsg || 'Contest not found'}</p>
        <Link href="/contests" style={{ color: 'var(--accent-green)', textDecoration: 'underline' }}>
          Return to Contests
        </Link>
      </div>
    );
  }

  // If user already submitted this contest assessment, show completed summary view
  if (existingSubmission && contest) {
    const isSubCheating = Boolean(
      existingSubmission.isCheating ||
      existingSubmission.isDisqualified ||
      existingSubmission.status === 'Cheating' ||
      existingSubmission.status === 'Disqualified' ||
      (existingSubmission.proctoringData?.violationsCount || 0) >= 3
    );

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            background: 'var(--bg-card, #161b22)',
            border: isSubCheating ? '1px solid rgba(248, 81, 73, 0.4)' : '1px solid var(--border-color, #30363d)',
            borderRadius: '16px',
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: isSubCheating ? '0 20px 50px rgba(248, 81, 73, 0.25)' : '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: isSubCheating ? 'rgba(248, 81, 73, 0.15)' : 'rgba(57, 211, 83, 0.12)',
              border: isSubCheating ? '1px solid rgba(248, 81, 73, 0.4)' : '1px solid rgba(57, 211, 83, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: isSubCheating ? 'var(--accent-red)' : 'var(--accent-green, #39d353)',
            }}
          >
            {isSubCheating ? <ShieldAlert size={36} /> : <CheckCircle2 size={36} />}
          </div>

          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '9999px',
              background: isSubCheating ? 'rgba(248, 81, 73, 0.2)' : 'rgba(57, 211, 83, 0.15)',
              color: isSubCheating ? 'var(--accent-red)' : 'var(--accent-green, #39d353)',
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
            }}
          >
            {isSubCheating ? 'FLAGGED AS CHEATING' : 'Assessment Completed'}
          </span>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            {contest.title}
          </h1>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary, #8b949e)', lineHeight: 1.6, marginBottom: '24px' }}>
            {isSubCheating
              ? 'This assessment was terminated and permanently flagged as cheating due to exceeding the maximum limit of 3 proctoring violations. All marks have been revoked and set to 0.'
              : 'You have already attended and submitted your solutions for this contest assessment. Solutions have been locked and evaluated.'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '16px',
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              border: isSubCheating ? '1px solid rgba(248, 81, 73, 0.25)' : '1px solid var(--border-color, #30363d)',
              marginBottom: '28px',
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #6e7681)', textTransform: 'uppercase', fontWeight: 600 }}>
                Score Achieved
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isSubCheating ? 'var(--accent-red)' : 'var(--accent-green, #39d353)', marginTop: '2px' }}>
                {isSubCheating ? 0 : (existingSubmission.totalScore ?? 0)} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6e7681)' }}>/ {existingSubmission.maxScore || contest.totalPoints || 100}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #6e7681)', textTransform: 'uppercase', fontWeight: 600 }}>
                Accuracy / Percentage
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isSubCheating ? 'var(--accent-red)' : '#fff', marginTop: '2px' }}>
                {isSubCheating ? '0%' : `${existingSubmission.percentage ?? 0}%`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #6e7681)', textTransform: 'uppercase', fontWeight: 600 }}>
                Submission Time
              </div>
              <div style={{ fontSize: '0.82rem', color: '#c9d1d9', marginTop: '4px' }}>
                {existingSubmission.submittedAt ? new Date(existingSubmission.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Submitted'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #6e7681)', textTransform: 'uppercase', fontWeight: 600 }}>
                Proctoring Summary
              </div>
              <div style={{ fontSize: '0.82rem', color: isSubCheating ? 'var(--accent-red)' : (existingSubmission.proctoringData?.violationsCount ? 'var(--accent-amber, #d29922)' : 'var(--accent-green, #39d353)'), marginTop: '4px', fontWeight: 600 }}>
                {isSubCheating ? 'Flagged as Cheating (3/3 Violations)' : (existingSubmission.proctoringData?.violationsCount ? `${existingSubmission.proctoringData.violationsCount} infractions logged` : 'Clean integrity record')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href={`/contests/${contestId}/results`}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '11px 20px',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                background: isSubCheating ? 'var(--accent-red)' : undefined,
                borderColor: isSubCheating ? 'var(--accent-red)' : undefined,
              }}
            >
              {isSubCheating ? (
                <>
                  <ShieldAlert size={16} /> View Cheating Audit &amp; Details
                </>
              ) : (
                <>
                  <Sparkles size={16} /> View AI Performance &amp; Recommendations
                </>
              )}
            </Link>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setExistingSubmission(null);
                setHasStartedExam(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} /> Retake Assessment
            </button>

            <Link
              href="/contests"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={15} /> Back to Contests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lineCount = Math.max(1, (currentSol?.code || '').split('\n').length);
  const linesArray = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={styles.examContainer}>
      {/* ── Proctoring Floating Toast ── */}
      {proctorToast && (
        <div className={styles.proctorToast}>
          <ShieldAlert size={16} />
          <span>{proctorToast}</span>
        </div>
      )}

      {/* ── Exam Start Proctoring Clearance Gate ── */}
      {!hasStartedExam && !existingSubmission && (
        <div className={styles.securityOverlay}>
          <div className={styles.gateCard}>
            <div className={styles.gateHeader}>
              <div className={styles.securityIconWrap} style={{ margin: 0 }}>
                <Shield size={32} style={{ color: 'var(--accent-green)' }} />
              </div>
              <div>
                <h2 className={styles.gateTitle}>Proctored Assessment Clearance</h2>
                <div className={styles.gateSub}>{contest.title} · Strictly Monitored</div>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#c9d1d9', lineHeight: 1.55 }}>
              This coding assessment uses automated proctoring to maintain integrity. Please review and acknowledge the exam constraints before proceeding:
            </p>

            <div className={styles.proctorRules}>
              <div className={styles.ruleItem}>
                <Maximize size={18} style={{ color: 'var(--accent-green)' }} className={styles.ruleIcon} />
                <div>
                  <strong>Mandatory Fullscreen Mode:</strong> The assessment must be completed entirely in fullscreen mode. Exiting fullscreen is flagged as a violation.
                </div>
              </div>

              <div className={styles.ruleItem}>
                <EyeOff size={18} style={{ color: 'var(--accent-amber)' }} className={styles.ruleIcon} />
                <div>
                  <strong>Window &amp; Tab Lock:</strong> Switching to other browser tabs, secondary monitors, or external applications is logged as an unauthorized action.
                </div>
              </div>

              <div className={styles.ruleItem}>
                <ClipboardX size={18} style={{ color: 'var(--accent-red)' }} className={styles.ruleIcon} />
                <div>
                  <strong>No Copy &amp; Paste:</strong> Clipboard access (Copy, Cut, Paste) and context menus are completely blocked. All code must be typed organically.
                </div>
              </div>

              <div className={styles.ruleItem}>
                <Sparkles size={18} style={{ color: 'var(--accent-blue)' }} className={styles.ruleIcon} />
                <div>
                  <strong>AI Diagnostic Evaluation:</strong> Upon submission, AI will evaluate your algorithms and diagnose logical flaws and runtime bottlenecks.
                </div>
              </div>
            </div>

            <div className={styles.gateActions}>
              <Link href="/contests" className={styles.cancelModalBtn} style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Cancel &amp; Exit
              </Link>
              <button className={styles.startExamBtn} onClick={handleStartExam}>
                <ShieldCheck size={16} /> Enter Fullscreen &amp; Start Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Exit Warning Alert ── */}
      {hasStartedExam && showFullscreenWarning && !submitting && (
        <div className={styles.securityOverlay}>
          <div className={styles.securityCard}>
            <div className={styles.securityIconWrap}>
              <AlertTriangle size={36} style={{ color: 'var(--accent-red)' }} />
            </div>
            <h3 className={styles.securityTitle}>Proctoring Alert: Fullscreen Exited!</h3>
            <p className={styles.securityText}>
              Exiting fullscreen mode is a strict proctoring violation. This event has been recorded in your exam audit log. Please return to fullscreen immediately to continue your assessment.
            </p>
            <button className={styles.securityActionBtn} onClick={requestFullscreenMode}>
              <Maximize size={16} /> Return to Fullscreen Mode
            </button>
          </div>
        </div>
      )}

      {/* ── Tab Switch / Window Blur Warning Alert ── */}
      {hasStartedExam && showTabSwitchWarning && !showFullscreenWarning && !submitting && !isDisqualified && (
        <div className={styles.securityOverlay}>
          <div className={`${styles.securityCard} ${styles.securityCardWarning}`}>
            <div className={`${styles.securityIconWrap} ${styles.securityIconWarn}`}>
              <EyeOff size={36} style={{ color: 'var(--accent-amber)' }} />
            </div>
            <h3 className={styles.securityTitle}>
              {violationsCount <= 1
                ? 'Warning (1/3 Violations): Proctoring Alert'
                : 'FINAL WARNING (2/3 Violations): Proctoring Alert!'}
            </h3>
            <p className={styles.securityText}>
              {violationsCount <= 1 ? (
                <>
                  A proctoring infraction was detected. You are permitted a maximum of <strong>3 violations</strong>. You have <strong style={{ color: 'var(--accent-amber)' }}>2 warnings remaining</strong> before your exam is automatically closed and flagged as cheating.
                </>
              ) : (
                <>
                  <strong style={{ color: 'var(--accent-red)' }}>CRITICAL ACADEMIC INTEGRITY ALERT:</strong> You have reached <strong>2 of 3 allowed violations</strong>. If you commit <strong>1 more violation</strong> (tab switch, exiting fullscreen, copy-paste, etc.), your contest will be <strong style={{ color: 'var(--accent-red)' }}>immediately terminated and FLAGGED AS CHEATING with a score of 0</strong>.
                </>
              )}
            </p>
            <div
              style={{
                marginBottom: '18px',
                fontSize: '0.82rem',
                color: 'var(--accent-amber)',
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              Total Infractions: <strong>{violationsCount} / 3</strong> · Violations Remaining: <strong>{Math.max(0, 3 - violationsCount)}</strong>
            </div>
            <button
              className={styles.securityActionBtn}
              style={{
                background: '#f59e0b',
                color: '#0d1117',
                fontWeight: 800,
                fontSize: '0.92rem',
                cursor: 'pointer',
                border: 'none',
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
              }}
              onClick={handleResumeFromTabSwitch}
            >
              <CheckCircle2 size={16} /> {violationsCount <= 1 ? 'I Understand & Resume Exam (2 Left)' : 'I Acknowledge Final Warning & Resume (1 Left)'}
            </button>
          </div>
        </div>
      )}

      {/* ── Auto Disqualification Modal (3/3 Violations -> Flagged as Cheating) ── */}
      {isDisqualified && (
        <div className={styles.securityOverlay} style={{ zIndex: 10000, background: 'rgba(13, 17, 23, 0.96)' }}>
          <div
            className={styles.securityCard}
            style={{
              maxWidth: '560px',
              border: '1px solid rgba(248, 81, 73, 0.6)',
              boxShadow: '0 0 60px rgba(248, 81, 73, 0.4)',
              background: '#161b22',
            }}
          >
            <div
              className={styles.securityIconWrap}
              style={{
                background: 'rgba(248, 81, 73, 0.18)',
                border: '1px solid rgba(248, 81, 73, 0.5)',
                margin: '0 auto 16px',
              }}
            >
              <ShieldAlert size={44} style={{ color: 'var(--accent-red)' }} />
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: '9999px',
                background: 'rgba(248, 81, 73, 0.25)',
                color: 'var(--accent-red)',
                fontSize: '0.78rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '12px',
                border: '1px solid rgba(248, 81, 73, 0.4)',
              }}
            >
              CONTEST OVER · FLAGGED AS CHEATING
            </div>

            <h2 className={styles.securityTitle} style={{ color: '#fff', fontSize: '1.45rem', marginBottom: '12px' }}>
              Contest Over — Flagged as Cheating
            </h2>

            <p className={styles.securityText} style={{ color: '#c9d1d9', fontSize: '0.88rem', lineHeight: 1.6 }}>
              You reached the maximum limit of <strong>3 proctoring violations</strong> during this assessment. As per academic integrity policies, your exam session has ended and has been <strong>permanently flagged as cheating</strong>. Your final score is <strong>0</strong>.
            </p>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(248, 81, 73, 0.25)',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '22px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Infraction Limit</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: 700 }}>3 of 3 Violations (Limit Exceeded)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Infractions Recorded</span>
                <span style={{ color: '#ff7b72', fontWeight: 600 }}>
                  {tabSwitches > 0 && `${tabSwitches} Tab Switch `}
                  {fullscreenExits > 0 && `${fullscreenExits} Fullscreen Exit `}
                  {copyPasteAttempts > 0 && `${copyPasteAttempts} Clipboard Blocked `}
                  {tabSwitches === 0 && fullscreenExits === 0 && copyPasteAttempts === 0 && `${violationsCount} Violations`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>Exam Result</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: 900 }}>FLAGGED AS CHEATING · 0 PTS</span>
              </div>
            </div>

            <Link
              href={`/contests/${contestId}/results`}
              className={styles.securityActionBtn}
              style={{
                background: 'var(--accent-red)',
                color: '#fff',
                textDecoration: 'none',
                width: '100%',
                fontWeight: 800,
                fontSize: '0.92rem',
                boxShadow: '0 0 20px rgba(248, 81, 73, 0.4)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ShieldAlert size={16} /> View Cheating Audit &amp; Results
            </Link>
          </div>
        </div>
      )}

      {/* ── Proctoring Info & Log Modal ── */}
      {showProctorInfoModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard} style={{ maxWidth: '520px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} style={{ color: 'var(--accent-green)' }} />
                <h3 className={styles.modalTitle} style={{ margin: 0 }}>Proctoring Session Audit</h3>
              </div>
              <button
                onClick={() => setShowProctorInfoModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{tabSwitches}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Tab Switches</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-red)' }}>{fullscreenExits}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Fullscreen Exits</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>{copyPasteAttempts}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Copy/Paste Blocks</div>
              </div>
            </div>

            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Live Security Event Log:
            </div>

            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
              {violationLogs.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)', padding: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Clean exam session. No violations recorded.
                </div>
              ) : (
                violationLogs.map((v, idx) => (
                  <div key={idx} className={styles.logItem}>
                    <div>
                      <strong style={{ color: '#ff7b72' }}>{v.type}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.detail}</div>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                      {v.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>

            <button
              className={styles.cancelModalBtn}
              style={{ width: '100%' }}
              onClick={() => setShowProctorInfoModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Top Navbar with Proctoring HUD ── */}
      <header className={styles.examNavbar}>
        <div className={styles.navLeft}>
          <Link href="/contests" style={{ color: 'var(--text-muted)', display: 'flex' }} title="Exit Exam">
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.contestPill}>
            <Trophy size={13} /> {contest.contestType === 'superset' ? 'Interactive Exam' : 'Assessment'}
          </div>
          <h1 className={styles.contestTitle} title={contest.title}>
            {contest.title}
          </h1>
        </div>

        <div className={styles.navCenter}>
          {/* Proctoring HUD Badges */}
          <div className={styles.proctorBadge} title="Automated Proctoring Active">
            <div className={styles.proctorPulse} />
            <Shield size={12} />
            <span>Proctoring Active</span>
          </div>

          <button
            className={`${styles.violationsBadge} ${
              violationsCount === 0
                ? styles.violationsBadgeClean
                : violationsCount < 3
                ? styles.violationsBadgeWarn
                : styles.violationsBadgeCrit
            }`}
            onClick={() => setShowProctorInfoModal(true)}
            title="Click to view Proctoring Violations Log"
          >
            <ShieldAlert size={13} />
            <span>
              Violations: {violationsCount}
            </span>
          </button>

          {/* Timer */}
          <div className={`${styles.timerBadge} ${timeLeftSeconds < 300 ? styles.timerCritical : ''}`}>
            <Clock size={16} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {existingSubmission && (
            <Link
              href={`/contests/${contestId}/results`}
              style={{
                fontSize: '0.76rem',
                color: 'var(--accent-blue)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
              }}
            >
              <Sparkles size={12} /> View AI Report
            </Link>
          )}
        </div>

        <div className={styles.navRight}>
          <button
            className={styles.submitBtn}
            onClick={() => setConfirmModalOpen(true)}
            disabled={submitting}
          >
            <Send size={14} /> Submit Solutions
          </button>
        </div>
      </header>

      {/* ── Main Exam Area ── */}
      {activeSection === 'mcq' && contest.mcqQuestions && contest.mcqQuestions.length > 0 ? (
        /* SuperSet MCQ Assessment View */
        <div className={styles.mcqAssessmentLayout}>
          {/* Main Question Pane */}
          <section className={styles.mcqMainPane}>
            {contest.contestType === 'superset' && contest.mcqQuestions && contest.mcqQuestions.length > 0 && (
              <div className={styles.leftSidebarSectionTabs} style={{ marginBottom: '16px', borderRadius: '8px', border: '1px solid #30363d' }}>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${(activeSection as string) === 'coding' ? styles.sectionTabActive : ''}`}
                  onClick={() => setActiveSection('coding')}
                >
                  <FileCode size={13} /> Coding <span className={styles.badgeCount}>{contest.problems.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${(activeSection as string) === 'mcq' ? styles.sectionTabActiveBlue : ''}`}
                  onClick={() => setActiveSection('mcq')}
                >
                  <ListChecks size={13} /> MCQs <span className={styles.badgeCount}>{contest.mcqQuestions.length}</span>
                </button>
              </div>
            )}
            {(() => {
              const currentQ = contest.mcqQuestions[currentMcqIdx] || contest.mcqQuestions[0];
              const letters = ['A', 'B', 'C', 'D'];
              const currentSelectedOpt = mcqAnswers[currentMcqIdx];
              const isMarked = markedForReview[currentMcqIdx];

              return (
                <div className={styles.mcqQuestionBox}>
                  <div className={styles.mcqMetaRow}>
                    <div className={styles.mcqQNum}>
                      <HelpCircle size={16} /> Question {currentMcqIdx + 1} of {contest.mcqQuestions.length}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={styles.pointsPill}>{currentQ.points || 10} Points</span>
                      <button
                        type="button"
                        className={styles.sectionTab}
                        style={isMarked ? { color: 'var(--accent-amber)', borderColor: 'var(--accent-amber)', background: 'rgba(210, 153, 34, 0.15)' } : {}}
                        onClick={() => handleToggleReview(currentMcqIdx)}
                      >
                        <Bookmark size={13} /> {isMarked ? 'Marked for Review' : 'Mark for Review'}
                      </button>
                    </div>
                  </div>

                  <h2 className={styles.mcqPrompt}>{currentQ.question}</h2>

                  <div className={styles.mcqChoicesGrid}>
                    {currentQ.options.map((optText, optIdx) => {
                      const isSelected = currentSelectedOpt === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`${styles.mcqChoiceCard} ${isSelected ? styles.mcqChoiceCardSelected : ''}`}
                          onClick={() => handleSelectOption(currentMcqIdx, optIdx)}
                        >
                          <div className={`${styles.mcqChoiceLetter} ${isSelected ? styles.mcqChoiceLetterSelected : ''}`}>
                            {letters[optIdx] || optIdx + 1}
                          </div>
                          <div className={styles.mcqChoiceText}>{optText}</div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={styles.mcqActionFooter}>
                    <button
                      type="button"
                      className={styles.sectionTab}
                      disabled={currentMcqIdx === 0}
                      onClick={() => setCurrentMcqIdx((prev) => Math.max(0, prev - 1))}
                    >
                      ← Previous
                    </button>

                    <button
                      type="button"
                      className={styles.sectionTab}
                      style={{ color: 'var(--text-muted)' }}
                      onClick={() => handleClearOption(currentMcqIdx)}
                    >
                      <RotateCcw size={13} /> Clear Choice
                    </button>

                    <button
                      type="button"
                      className={`${styles.sectionTab} ${styles.sectionTabActive}`}
                      onClick={() => {
                        if (currentMcqIdx < contest.mcqQuestions!.length - 1) {
                          setCurrentMcqIdx((prev) => prev + 1);
                        } else {
                          setConfirmModalOpen(true);
                        }
                      }}
                    >
                      {currentMcqIdx < contest.mcqQuestions.length - 1 ? 'Save & Next →' : 'Review & Submit'}
                    </button>
                  </div>
                </div>
              );
            })()}
          </section>

          {/* Side Question Palette */}
          <aside className={styles.mcqSidePalette}>
            <div className={styles.paletteTitle}>Question Palette</div>
            <div className={styles.paletteGrid}>
              {contest.mcqQuestions.map((_, idx) => {
                const isAnswered = typeof mcqAnswers[idx] === 'number' && mcqAnswers[idx] >= 0;
                const isMarked = markedForReview[idx];
                const isCurrent = currentMcqIdx === idx;

                let btnClass = styles.paletteBtn;
                if (isCurrent) btnClass += ` ${styles.paletteBtnCurrent}`;
                if (isAnswered) btnClass += ` ${styles.paletteBtnAnswered}`;
                if (isMarked) btnClass += ` ${styles.paletteBtnMarked}`;

                return (
                  <button
                    key={idx}
                    type="button"
                    className={btnClass}
                    onClick={() => setCurrentMcqIdx(idx)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className={styles.paletteLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: 'var(--accent-green)' }} />
                <span>Answered ({Object.values(mcqAnswers).filter((v) => v >= 0).length})</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: 'var(--accent-amber)' }} />
                <span>Marked for Review ({Object.values(markedForReview).filter(Boolean).length})</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendDot} style={{ background: 'var(--border-color)' }} />
                <span>Unanswered ({contest.mcqQuestions.length - Object.values(mcqAnswers).filter((v) => v >= 0).length})</span>
              </div>
            </div>
          </aside>
        </div>
      ) : isInteractiveMode ? (
        /* Interactive Coding Exam Body (VS Code & Integrated Terminal layout) */
        <Group orientation="horizontal" className={styles.splitLayout}>
          {/* LEFT PANEL: Problem Details & Examples */}
          <Panel defaultSize={45} minSize={25} className={styles.leftPanel}>
            {/* Section Switcher in Left Sidebar */}
            {contest.contestType === 'superset' && contest.mcqQuestions && contest.mcqQuestions.length > 0 && (
              <div className={styles.leftSidebarSectionTabs}>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${activeSection === 'coding' ? styles.sectionTabActive : ''}`}
                  onClick={() => setActiveSection('coding')}
                >
                  <FileCode size={13} /> Coding <span className={styles.badgeCount}>{contest.problems.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.sectionTab} ${activeSection === 'mcq' ? styles.sectionTabActiveBlue : ''}`}
                  onClick={() => setActiveSection('mcq')}
                >
                  <ListChecks size={13} /> MCQs <span className={styles.badgeCount}>{contest.mcqQuestions.length}</span>
                </button>
              </div>
            )}

            {/* Problem Navigation Tabs across top of left panel */}
            <div className={styles.problemTabs}>
              {contest.problems.map((p, idx) => (
                <button
                  key={p.problemId?._id || idx}
                  className={`${styles.probTab} ${selectedProblemIdx === idx ? styles.probTabActive : ''}`}
                  onClick={() => {
                    setSelectedProblemIdx(idx);
                    setConsoleOutput(null);
                    setCustomInput('');
                    setActiveConsoleTab('testcase');
                  }}
                >
                  <span>Q{idx + 1}. {p.problemId?.title || `Problem ${idx + 1}`}</span>
                  <span className={styles.pointsPill}>({p.points} pts)</span>
                </button>
              ))}
            </div>

            {/* Sub-tab header */}
            <div className={styles.leftTabs}>
              <div className={`${styles.leftTab} ${styles.activeTab}`}>
                <FileText size={14} /> Description
              </div>
            </div>

            <div className={`${styles.leftContent} ${styles.unselectable}`} data-lenis-prevent="true">
              {currentProb ? (
                <>
                  <div className={styles.problemHeader}>
                    <h1 className={styles.title}>{currentProb.title}</h1>
                  </div>

                  <div className={styles.badges}>
                    <span
                      className={`${styles.badge} ${
                        currentProb.difficulty === 'Easy'
                          ? styles.badgeEasy
                          : currentProb.difficulty === 'Medium'
                          ? styles.badgeMedium
                          : styles.badgeHard
                      }`}
                    >
                      {currentProb.difficulty}
                    </span>
                    {currentProb.tags && currentProb.tags.length > 0 ? (
                      currentProb.tags.map((t) => (
                        <span key={t} className={styles.badgeTopic}>{t}</span>
                      ))
                    ) : (
                      <>
                        <span className={styles.badgeTopic}>Algorithms</span>
                        <span className={styles.badgeTopic}>Data Structures</span>
                      </>
                    )}
                    <span className={styles.pointsPill}>{currentPoints} Points</span>
                  </div>

                  <div className={styles.markdownBody}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentProb.description ? currentProb.description.replace(/\\n/g, '\n').replace(/\\r/g, '') : ''}
                    </ReactMarkdown>
                  </div>

                  {currentProb.inputFormat && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f6fc', marginBottom: '6px' }}>
                        Input Format
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#c9d1d9' }}>{currentProb.inputFormat}</div>
                    </div>
                  )}

                  {currentProb.outputFormat && (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f0f6fc', marginBottom: '6px' }}>
                        Output Format
                      </div>
                      <div style={{ fontSize: '0.84rem', color: '#c9d1d9' }}>{currentProb.outputFormat}</div>
                    </div>
                  )}

                  {/* Example Test Cases */}
                  {currentProb.exampleTestCases && currentProb.exampleTestCases.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      {currentProb.exampleTestCases.map((ex, i) => (
                        <div key={i} className={styles.exampleCard}>
                          <div className={styles.exampleTitle}>Example {i + 1}:</div>
                          <div className={styles.exampleBody}>
                            <div>
                              <strong>Input:</strong> <code>{ex.input}</code>
                            </div>
                            <div>
                              <strong>Output:</strong> <code>{ex.expectedOutput}</code>
                            </div>
                            {ex.explanation && (
                              <div style={{ marginTop: '4px', fontSize: '0.8rem', color: '#8b949e' }}>
                                <strong>Explanation:</strong> {ex.explanation}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints */}
                  {currentProb.constraints && (
                    <div className={styles.constraintsSection}>
                      <div className={styles.constraintsTitle}>Constraints:</div>
                      <ul className={styles.constraintsList}>
                        {currentProb.constraints
                          .split('\n')
                          .filter((c) => c.trim().length > 0)
                          .map((c, i) => (
                            <li key={i}>{c.replace(/^-\s*/, '')}</li>
                          ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', padding: '20px' }}>
                  No problem details available.
                </div>
              )}
            </div>
          </Panel>

          <Separator className={styles.resizeHandle} />

          {/* RIGHT PANEL - VS Code Editor & Integrated Terminal */}
          <Panel defaultSize={55} minSize={30} className={styles.rightPanel}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>
              {/* VS Code Tabs Bar */}
              <div className={styles.tabsBar}>
                <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  <div className={styles.tabItem}>
                    <FileLanguageIcon
                      language={currentSol?.language || 'python'}
                      filename={LANG_FILE_MAP[currentSol?.language || 'python'] || 'Solution'}
                      size={14}
                    />
                    <span>{LANG_FILE_MAP[currentSol?.language || 'python'] || 'Solution'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8 }}>
                  <LanguageSelector
                    value={currentSol?.language || 'python'}
                    onChange={handleLanguageChange}
                  />

                  <button
                    className={styles.headerIconBtn}
                    title="Reset to starter template"
                    onClick={() => {
                      if (!currentProb) return;
                      const lang = currentSol?.language || 'python';
                      const rawTemplate = currentProb.starterTemplates?.[lang] || DEFAULT_TEMPLATES[lang] || '';
                      handleCodeChange(cleanClientTemplate(lang, rawTemplate));
                      showToast('Code reset to default starter template');
                    }}
                  >
                    <RotateCcw size={13} />
                  </button>

                  <button
                    className={styles.headerIconBtn}
                    title="Toggle Integrated Terminal"
                    onClick={() => setIsConsoleOpen((prev) => !prev)}
                    style={isConsoleOpen ? { color: '#38bdf8' } : undefined}
                  >
                    <TerminalIcon size={13} />
                  </button>

                  <button
                    className={styles.runButton}
                    onClick={() => handleRunCode()}
                    disabled={runningCode}
                    title="Run code against test cases"
                  >
                    {runningCode ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                    <span>{runningCode ? 'Running...' : 'Run'}</span>
                  </button>

                  <button
                    className={styles.submitButton}
                    onClick={() => setConfirmModalOpen(true)}
                    title="Submit Contest Assessment"
                  >
                    <Send size={12} />
                    <span>Submit</span>
                  </button>
                </div>
              </div>

              {/* Breadcrumbs Bar */}
              <div className={styles.breadcrumbsBar}>
                <span className={styles.breadcrumbItem}>contests</span>
                <span>›</span>
                <span className={styles.breadcrumbItem}>{contest.slug}</span>
                <span>›</span>
                <span className={styles.breadcrumbItem}>{currentProb?.slug || 'problem'}</span>
                <span>›</span>
                <span className={`${styles.breadcrumbItem} ${styles.breadcrumbActive}`}>
                  <FileLanguageIcon
                    language={currentSol?.language || 'python'}
                    filename={LANG_FILE_MAP[currentSol?.language || 'python'] || 'Solution'}
                    size={12}
                  />
                  {LANG_FILE_MAP[currentSol?.language || 'python'] || 'Solution'}
                </span>
              </div>

              {/* Resizable Vertical Editor & Terminal */}
              <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {isConsoleOpen ? (
                  <Group orientation="vertical" style={{ height: '100%', width: '100%' }}>
                    <Panel defaultSize={55} minSize={25} style={{ display: 'flex', flexDirection: 'column' }}>
                      <div className={styles.editorContainer}>
                        <CodeEditor
                          value={currentSol?.code || ''}
                          onChange={(val) => handleCodeChange(val)}
                          language={currentSol?.language || 'python'}
                          height="100%"
                          onCursorChange={(line, col) => setCursorPos({ line, col })}
                        />
                      </div>
                    </Panel>

                    <Separator className={styles.resizeHandleHorizontal} />

                    <Panel defaultSize={45} minSize={20} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }} data-lenis-prevent="true">
                      <LeetCodeConsole
                        problem={currentProb}
                        output={consoleOutput}
                        isRunning={runningCode}
                        customInput={customInput}
                        onCustomInputChange={setCustomInput}
                        onRun={() => handleRunCode()}
                        onClose={() => setIsConsoleOpen(false)}
                        activeTab={activeConsoleTab}
                        setActiveTab={setActiveConsoleTab}
                      />
                    </Panel>
                  </Group>
                ) : (
                  <div className={styles.editorContainer}>
                    <CodeEditor
                      value={currentSol?.code || ''}
                      onChange={(val) => handleCodeChange(val)}
                      language={currentSol?.language || 'python'}
                      height="100%"
                      onCursorChange={(line, col) => setCursorPos({ line, col })}
                    />
                  </div>
                )}
              </div>

              {/* VS Code Bottom Status Bar */}
              <div className={styles.statusBar}>
                <div className={styles.statusLeft}>
                  <div className={styles.statusItem}>
                    <GitBranch size={11} />
                    <span>main*</span>
                  </div>
                  <div className={styles.statusItem}>
                    <AlertCircle size={11} />
                    <span>0</span>
                  </div>
                  <div
                    className={`${styles.statusItem} ${styles.statusItemInteractive}`}
                    onClick={() => setIsConsoleOpen((prev) => !prev)}
                  >
                    <TerminalIcon size={11} />
                    <span>Terminal</span>
                  </div>
                </div>

                <div className={styles.statusRight}>
                  <span className={styles.statusItem}>
                    Ln {cursorPos.line}, Col {cursorPos.col}
                  </span>
                  <span className={styles.statusItem}>Spaces: 4</span>
                  <span className={styles.statusItem}>UTF-8</span>
                  <span className={styles.statusItem} style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                    {currentSol?.language || 'PYTHON'}
                  </span>
                </div>
              </div>
            </div>
          </Panel>
        </Group>
      ) : (
        /* Regular Split Coding Exam Body */
        <div className={styles.examBody}>
          {/* Left Sidebar: Problem Navigator */}
          <aside className={styles.blankExamSidebar} data-lenis-prevent="true">
            <div className={styles.blankSidebarHeader}>
              <div className={styles.blankSidebarTitle}>
                <ListChecks size={15} style={{ color: 'var(--accent-green)' }} />
                <span>Questions</span>
              </div>
              <span className={styles.blankSidebarBadge}>{contest.problems.length} Problems</span>
            </div>

            {/* Section Switcher in Left Sidebar */}
            {contest.contestType === 'superset' && contest.mcqQuestions && contest.mcqQuestions.length > 0 && (
              <div className={styles.sidebarSectionSwitcher}>
                <button
                  type="button"
                  className={`${styles.sidebarSectionBtn} ${activeSection === 'coding' ? styles.sidebarSectionBtnActive : ''}`}
                  onClick={() => setActiveSection('coding')}
                >
                  <FileCode size={13} /> Coding <span className={styles.badgeCount}>{contest.problems.length}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.sidebarSectionBtn} ${activeSection === 'mcq' ? styles.sidebarSectionBtnActiveBlue : ''}`}
                  onClick={() => setActiveSection('mcq')}
                >
                  <ListChecks size={13} /> MCQs <span className={styles.badgeCount}>{contest.mcqQuestions.length}</span>
                </button>
              </div>
            )}

            {/* Problem Navigation List */}
            <div className={styles.blankSidebarList} data-lenis-prevent="true">
              {contest.problems.map((p, idx) => {
                const isSelected = selectedProblemIdx === idx;
                const sol = solutions[p.problemId?._id];
                const hasCode = Boolean(sol?.code && sol.code.trim().length > 0);

                return (
                  <button
                    key={p.problemId?._id || idx}
                    type="button"
                    className={`${styles.blankSidebarCard} ${isSelected ? styles.blankSidebarCardActive : ''}`}
                    onClick={() => {
                      setSelectedProblemIdx(idx);
                      setConsoleOutput(null);
                      setCustomInput('');
                      setActiveConsoleTab('testcase');
                    }}
                  >
                    <div className={styles.blankSidebarCardTop}>
                      <span className={`${styles.blankSidebarNumPill} ${hasCode ? styles.blankSidebarNumPillSolved : ''}`}>
                        {hasCode ? <Check size={11} strokeWidth={3} /> : idx + 1}
                      </span>
                      <span className={styles.blankSidebarProbTitle}>
                        {p.problemId?.title || `Problem ${idx + 1}`}
                      </span>
                    </div>

                    <div className={styles.blankSidebarCardMeta}>
                      <span
                        className={
                          p.problemId?.difficulty === 'Easy'
                            ? styles.diffEasy
                            : p.problemId?.difficulty === 'Medium'
                            ? styles.diffMedium
                            : styles.diffHard
                        }
                      >
                        {p.problemId?.difficulty || 'Medium'}
                      </span>
                      <span className={styles.blankSidebarPoints}>{p.points} pts</span>
                      {hasCode && (
                        <span className={styles.attemptedBadge}>
                          <CheckCircle2 size={10} /> Attempted
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sidebar Summary Footer */}
            <div className={styles.blankSidebarFooter}>
              <div className={styles.sidebarProgressRow}>
                <span>Completed:</span>
                <strong style={{ color: 'var(--accent-green)' }}>
                  {contest.problems.filter((p) => Boolean(solutions[p.problemId?._id]?.code?.trim())).length} / {contest.problems.length}
                </strong>
              </div>
            </div>
          </aside>

          {/* Middle Pane: Problem Description (Non-selectable to prevent cheating) */}
          <section className={styles.problemPane} data-lenis-prevent="true">
            {/* Problem Content (Protected against text selection) */}
            <div className={`${styles.probContent} ${styles.unselectable}`} data-lenis-prevent="true">
              {currentProb ? (
                <>
                  <div className={styles.probHeader}>
                    <h2 className={styles.probTitle}>{currentProb.title}</h2>
                    <div className={styles.probTags}>
                      <span
                        className={
                          currentProb.difficulty === 'Easy'
                            ? styles.diffEasy
                            : currentProb.difficulty === 'Medium'
                            ? styles.diffMedium
                            : styles.diffHard
                        }
                      >
                        {currentProb.difficulty}
                      </span>
                      <span className={styles.pointsPill}>{currentPoints} Points</span>
                    </div>
                  </div>

                  <div className={styles.descSection}>
                    <div className={styles.sectionHeader}>Problem Description</div>
                    <div className={styles.probText}>{currentProb.description}</div>
                  </div>

                  {currentProb.inputFormat && (
                    <div className={styles.descSection}>
                      <div className={styles.sectionHeader}>Input Format</div>
                      <div className={styles.probText}>{currentProb.inputFormat}</div>
                    </div>
                  )}

                  {currentProb.outputFormat && (
                    <div className={styles.descSection}>
                      <div className={styles.sectionHeader}>Output Format</div>
                      <div className={styles.probText}>{currentProb.outputFormat}</div>
                    </div>
                  )}

                  {currentProb.constraints && (
                    <div className={styles.descSection}>
                      <div className={styles.sectionHeader}>Constraints</div>
                      <div className={styles.probText}>{currentProb.constraints}</div>
                    </div>
                  )}

                  {/* Example Test Cases */}
                  {currentProb.exampleTestCases && currentProb.exampleTestCases.length > 0 && (
                    <div className={styles.descSection}>
                      <div className={styles.sectionHeader}>Example Test Cases</div>
                      {currentProb.exampleTestCases.map((ex, i) => (
                        <div key={i} className={styles.exampleCard}>
                          <div className={styles.exampleTitle}>Example {i + 1}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Input:</div>
                          <pre className={styles.codeBlock}>{ex.input}</pre>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            Expected Output:
                          </div>
                          <pre className={styles.codeBlock}>{ex.expectedOutput}</pre>
                          {ex.explanation && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                              <em>Note: {ex.explanation}</em>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', padding: '20px' }}>
                  No problem details available.
                </div>
              )}
            </div>
          </section>

          {/* Right Pane: Code Editor */}
          <section className={styles.editorPane}>
            {/* Editor Header */}
            <div className={styles.editorToolbar}>
              <div className={styles.langSelectWrap}>
                <span className={styles.langLabel}>Language:</span>
                <select
                  className={styles.langSelect}
                  value={currentSol?.language || 'python'}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="cpp">C++ (GCC 13)</option>
                  <option value="java">Java 22</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Run Code Button (Interactive Mode Only) */}
                {canRunCode && (
                  <button
                    type="button"
                    className={styles.runBtn}
                    onClick={() => handleRunCode()}
                    disabled={runningCode}
                    title="Run solution against sample test cases"
                  >
                    {runningCode ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
                    <span>{runningCode ? 'Executing...' : 'Run Code'}</span>
                  </button>
                )}

                <div className={styles.editorNotice}>
                  <Lock size={12} style={{ color: 'var(--accent-green)' }} /> Proctored Editor · Copy/Paste Disabled
                </div>
              </div>
            </div>

            {/* Plain Editor Body: Line numbers + Textarea */}
            <div className={styles.plainEditorWrapper} data-lenis-prevent="true">
              <div ref={lineNumbersRef} className={styles.lineNumbers} data-lenis-prevent="true">
                {linesArray.map((line) => (
                  <div key={line} className={styles.lineNum}>
                    {line}
                  </div>
                ))}
              </div>

              <textarea
                ref={textareaRef}
                className={styles.plainTextarea}
                data-lenis-prevent="true"
                value={currentSol?.code || ''}
                onChange={(e) => handleCodeChange(e.target.value)}
                onScroll={handleTextareaScroll}
                onKeyDown={handleKeyDown}
                onPaste={(e) => {
                  e.preventDefault();
                  setCopyPasteAttempts((p) => p + 1);
                  recordViolation('Paste Blocked', 'Attempted to paste external content into editor');
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  setCopyPasteAttempts((p) => p + 1);
                  recordViolation('Copy Blocked', 'Attempted to copy exam contents to clipboard');
                }}
                onCut={(e) => {
                  e.preventDefault();
                  setCopyPasteAttempts((p) => p + 1);
                  recordViolation('Cut Blocked', 'Attempted to cut exam text');
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  showToast('Drag & Drop is disabled!');
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                placeholder="Write your algorithmic solution here..."
              />
            </div>

            {/* Test Runner Console (Interactive Mode Only) */}
            {canRunCode && (
              <div className={`${styles.testConsoleDrawer} ${!testConsoleOpen ? styles.testConsoleDrawerClosed : ''}`}>
                <div className={styles.testConsoleBar} onClick={() => setTestConsoleOpen((prev) => !prev)}>
                  <div className={styles.testConsoleTitle}>
                    <Terminal size={14} style={{ color: 'var(--accent-green)' }} />
                    <span>Test Results &amp; Console</span>
                    {testResults.length > 0 && (
                      <span style={{ fontSize: '0.72rem', color: testResults.every((t) => t.passed) ? 'var(--accent-green)' : 'var(--accent-amber)', marginLeft: '6px' }}>
                        ({testResults.filter((t) => t.passed).length}/{testResults.length} Cases Passed)
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {testConsoleOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </div>
                </div>

                {testConsoleOpen && (
                  <>
                    <div className={styles.testCasesNav}>
                      {testResults.map((tr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`${styles.testCasePill} ${activeCaseTab === idx && activeTestMode === 'cases' ? styles.testCasePillActive : ''}`}
                          onClick={() => {
                            setActiveCaseTab(idx);
                            setActiveTestMode('cases');
                          }}
                        >
                          {tr.passed ? (
                            <Check size={11} style={{ color: 'var(--accent-green)' }} />
                          ) : (
                            <X size={11} style={{ color: 'var(--accent-red)' }} />
                          )}
                          <span>Case {tr.caseNumber || idx + 1}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        className={`${styles.testCasePill} ${activeTestMode === 'custom' ? styles.testCasePillActive : ''}`}
                        onClick={() => setActiveTestMode('custom')}
                      >
                        <span>Custom Input</span>
                      </button>
                    </div>

                    <div className={styles.testConsoleBody}>
                      {runningCode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                          <Loader2 size={14} className="animate-spin" /> Executing code on test cases...
                        </div>
                      ) : runError ? (
                        <div style={{ color: 'var(--accent-red)' }}>
                          <strong>Error:</strong> {runError}
                        </div>
                      ) : activeTestMode === 'custom' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div className={styles.testField}>
                            <span className={styles.testFieldLabel}>Standard Input:</span>
                            <textarea
                              className={styles.plainTextarea}
                              style={{ minHeight: '50px', background: 'rgba(0,0,0,0.5)', padding: '6px 8px', fontSize: '0.78rem' }}
                              placeholder="Enter custom input here..."
                              value={customInput}
                              onChange={(e) => setCustomInput(e.target.value)}
                            />
                          </div>
                          {customResult && (
                            <div className={styles.testField}>
                              <span className={styles.testFieldLabel}>Program Output:</span>
                              <div className={styles.testFieldVal}>
                                {customResult.error ? (
                                  <span style={{ color: 'var(--accent-red)' }}>{customResult.error}</span>
                                ) : (
                                  customResult.output || '(No output produced)'
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : testResults.length > 0 && testResults[activeCaseTab] ? (
                        <div className={styles.testCaseDetail}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: testResults[activeCaseTab].passed ? 'var(--accent-green)' : 'var(--accent-red)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              {testResults[activeCaseTab].passed ? (
                                <>
                                  <CheckCircle2 size={13} /> Test Case Passed
                                </>
                              ) : (
                                <>
                                  <AlertCircle size={13} /> Test Case Failed
                                </>
                              )}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {testResults[activeCaseTab].executionTimeMs || 0}ms
                            </span>
                          </div>
                          <div className={styles.testField}>
                            <span className={styles.testFieldLabel}>Input:</span>
                            <div className={styles.testFieldVal}>{testResults[activeCaseTab].input}</div>
                          </div>
                          <div className={styles.testField}>
                            <span className={styles.testFieldLabel}>Expected Output:</span>
                            <div className={styles.testFieldVal}>{testResults[activeCaseTab].expectedOutput}</div>
                          </div>
                          <div className={styles.testField}>
                            <span className={styles.testFieldLabel}>Your Output:</span>
                            <div className={styles.testFieldVal} style={{ color: testResults[activeCaseTab].passed ? 'var(--accent-green)' : '#ff7b72' }}>
                              {testResults[activeCaseTab].error ? (
                                <span style={{ color: 'var(--accent-red)' }}>{testResults[activeCaseTab].error}</span>
                              ) : (
                                testResults[activeCaseTab].actualOutput || '(Empty output)'
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)' }}>
                          Click <strong>Run Code</strong> above to test your code against sample test cases before final submission.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Editor Footer */}
            <div className={styles.editorFooter}>
              <span>
                {lineCount} lines · {(currentSol?.code || '').length} chars
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={12} style={{ color: 'var(--accent-green)' }} /> Proctored Input · Tab = 4 spaces
              </span>
            </div>
          </section>
        </div>
      )}

      {/* Confirmation & Submission Modal */}
      {confirmModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            {!submitting ? (
              <>
                <Trophy size={36} style={{ color: 'var(--accent-green)', margin: '0 auto 12px' }} />
                <h3 className={styles.modalTitle}>Submit Contest Solution?</h3>
                <p className={styles.modalDesc}>
                  Are you ready to finalize and submit your solutions? Your code will be evaluated against test cases, scored, and analyzed by AI for algorithmic feedback.
                </p>

                {/* Question Completion Summary */}
                {contest && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    margin: '16px 0',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    textAlign: 'left',
                    fontSize: '0.84rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <Code2 size={14} style={{ color: 'var(--accent-green)' }} /> Coding Problems:
                      </span>
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {contest.problems?.filter((p) => (solutions[p.problemId?._id]?.code || '').trim().length > 0).length || 0} / {contest.problems?.length || 0} Attempted
                      </strong>
                    </div>

                    {(contest.contestType === 'superset' || (contest.mcqQuestions && contest.mcqQuestions.length > 0)) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <CheckSquare size={14} style={{ color: 'var(--accent-blue)' }} /> Multiple Choice (MCQs):
                        </span>
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {Object.keys(mcqAnswers).filter((k) => (mcqAnswers as any)[k] !== undefined && (mcqAnswers as any)[k] !== -1).length} / {contest.mcqQuestions?.length || 0} Answered
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {violationsCount > 0 && (
                  <div
                    style={{
                      background: 'rgba(248, 81, 73, 0.1)',
                      border: '1px solid rgba(248, 81, 73, 0.3)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      fontSize: '0.8rem',
                      color: '#ff7b72',
                      textAlign: 'left',
                    }}
                  >
                    <strong>Notice:</strong> {violationsCount} proctoring event(s) recorded during your session will be attached to your submission report.
                  </div>
                )}

                <div className={styles.modalButtons}>
                  <button className={styles.cancelModalBtn} onClick={() => setConfirmModalOpen(false)}>
                    Keep Working
                  </button>
                  <button className={styles.confirmSubmitBtn} onClick={handleSubmitContest}>
                    Confirm &amp; Submit
                  </button>
                </div>
              </>
            ) : (
              <>
                <Loader2
                  size={36}
                  className="animate-spin text-green"
                  style={{ color: 'var(--accent-green)', margin: '0 auto 12px' }}
                />
                <h3 className={styles.modalTitle}>Evaluating Your Submission...</h3>
                <p className={styles.modalDesc}>
                  Please do not close this window while AI is analyzing your algorithms.
                </p>

                <div className={styles.loadingSteps}>
                  <div className={`${styles.stepRow} ${submitStep >= 1 ? styles.stepActive : ''}`}>
                    {submitStep > 1 ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                    ) : (
                      <Loader2 size={16} className="animate-spin text-green" />
                    )}
                    <span>1. Executing code across test cases</span>
                  </div>

                  <div className={`${styles.stepRow} ${submitStep >= 2 ? styles.stepActive : ''}`}>
                    {submitStep > 2 ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                    ) : submitStep === 2 ? (
                      <Loader2 size={16} className="animate-spin text-green" />
                    ) : (
                      <div style={{ width: 16 }} />
                    )}
                    <span>2. AI diagnosing mistakes &amp; edge case gaps</span>
                  </div>

                  <div className={`${styles.stepRow} ${submitStep >= 3 ? styles.stepActive : ''}`}>
                    {submitStep >= 3 ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
                    ) : (
                      <div style={{ width: 16 }} />
                    )}
                    <span>3. Curating algorithmic diagnosis and feedback</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
