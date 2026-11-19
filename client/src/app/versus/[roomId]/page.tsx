'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import parse from 'html-react-parser';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '@/lib/api';
import { useVersusStore, LobbySettings, ProblemMeta } from '@/store/useVersusStore';
import { useAuthStore } from '@/store/authStore';
import LanguageSelector from '@/components/Editor/LanguageSelector';
import { Group, Panel, Separator } from 'react-resizable-panels';
import LeetCodeConsole from '@/components/Editor/LeetCodeConsole';
import { Clock, CheckCircle2, X, Play, Send, RotateCcw, Terminal, Loader2, Trophy, XCircle, Target, ShieldAlert, AlertTriangle, Shield, Crown, Award, ArrowLeft, Code2 } from 'lucide-react';
import styles from './versus.module.css';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Difficulty Badge ─────────────────────────────────────────────────────
function DiffBadge({ d }: { d: string }) {
  const cls = d === 'Easy' ? 'badge-easy' : d === 'Medium' ? 'badge-medium' : 'badge-hard';
  return <span className={`badge ${cls}`}>{d}</span>;
}

// ─── Countdown Timer ──────────────────────────────────────────────────────
function CountdownTimer({ endTimestamp }: { endTimestamp: number }) {
  const [remaining, setRemaining] = useState(Math.max(0, endTimestamp - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, endTimestamp - Date.now());
      setRemaining(left);
      if (left === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endTimestamp]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const danger = remaining < 5 * 60 * 1000;

  return (
    <div className={`${styles.timer} ${danger ? styles.timerDanger : ''}`}>
      <Clock size={14} style={{ marginRight: 6, display: 'inline' }} />
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}

// ─── Progress Sidebar ─────────────────────────────────────────────────────
function ProgressSidebar({
  label,
  problems,
  progress,
  isOpponent,
}: {
  label: string;
  problems: ProblemMeta[];
  progress: Record<string, { passed: number; total: number; accepted: boolean }>;
  isOpponent: boolean;
}) {
  return (
    <div className={`${styles.progressSidebar} ${isOpponent ? styles.opponentSidebar : styles.mySidebar}`}>
      <div className={styles.sidebarLabel}>{label}</div>
      <div className={styles.sidebarProblems}>
        {problems.map((p, idx) => {
          const prog = progress[p._id];
          return (
            <div key={p._id} className={styles.sidebarProblem}>
              <span className={styles.sidebarProblemNum}>P{idx + 1}</span>
              <span className={styles.sidebarProblemTitle}>{p.title}</span>
              <div className={styles.sidebarStatus}>
                {prog?.accepted ? (
                  <span className={styles.accepted} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <CheckCircle2 size={13} />
                  </span>
                ) : prog ? (
                  <span className={styles.partial}>{prog.passed}/{prog.total}</span>
                ) : (
                  <span className={styles.notStarted}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────
function SettingsPanel({
  settings,
  isHost,
  onUpdate,
}: {
  settings: LobbySettings;
  isHost: boolean;
  onUpdate: (s: Partial<LobbySettings>) => void;
}) {
  const [problemSearch, setProblemSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ _id: string; title: string; difficulty: string }[]>([]);
  const [searching, setSearching] = useState(false);

  const searchProblems = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const { data } = await api.get(`/problems?search=${encodeURIComponent(q)}&limit=8`);
      setSearchResults(data.problems ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProblems(problemSearch), 350);
    return () => clearTimeout(timer);
  }, [problemSearch, searchProblems]);

  const addSpecificId = (id: string) => {
    onUpdate({ specificQuestionIds: [id], questionCount: 1 });
    setProblemSearch('');
    setSearchResults([]);
  };

  const removeSpecificId = (id: string) => {
    onUpdate({ specificQuestionIds: [] });
  };

  const disabled = !isHost;

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.settingsTitle}>
        <span>Match Settings</span>
        {!isHost && <span className={styles.lockedBadge}>Host only</span>}
      </div>

      <div className={styles.settingsGrid}>
        {/* Difficulty */}
        <div className={styles.settingGroup}>
          <label className="label">Difficulty</label>
          <div className={styles.difficultyButtons}>
            {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                className={`btn btn-sm ${settings.difficulty === d ? styles.diffActive : 'btn-secondary'}`}
                onClick={() => !disabled && onUpdate({ difficulty: d })}
                disabled={disabled}
                id={`diff-${d}`}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Format / Problem Count */}
        <div className={styles.settingGroup}>
          <label className="label">Match Format: <strong>1 Problem (Sudden Death)</strong></label>
          <div className={styles.formatIndicator}>
            <Target size={16} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
            <span>First player to solve the problem wins the match immediately</span>
          </div>
        </div>

        {/* Time Limit */}
        <div className={styles.settingGroup}>
          <label className="label">Time Limit: <strong>{settings.timeLimitMinutes} min</strong></label>
          <input
            type="range" min={5} max={120} step={5} value={settings.timeLimitMinutes}
            disabled={disabled}
            onChange={(e) => onUpdate({ timeLimitMinutes: Number(e.target.value) })}
            className={styles.rangeInput}
            id="time-limit-slider"
          />
          <div className={styles.rangeLabels}><span>5m</span><span>120m</span></div>
        </div>

        {/* Selection Mode */}
        <div className={styles.settingGroup}>
          <label className="label">Problem Selection</label>
          <div className={styles.modeToggle}>
            <button
              className={`btn btn-sm ${settings.selectionMode === 'random' ? styles.modeActive : 'btn-secondary'}`}
              onClick={() => !disabled && onUpdate({ selectionMode: 'random' })}
              disabled={disabled}
              id="mode-random"
            >
              Random
            </button>
            <button
              className={`btn btn-sm ${settings.selectionMode === 'specific' ? styles.modeActive : 'btn-secondary'}`}
              onClick={() => !disabled && onUpdate({ selectionMode: 'specific' })}
              disabled={disabled}
              id="mode-specific"
            >
              Specific
            </button>
          </div>
        </div>

        {/* Specific Problem Search */}
        {settings.selectionMode === 'specific' && (
          <div className={styles.settingGroup} style={{ gridColumn: '1 / -1' }}>
            <label className="label">Search & add problems</label>
            <div className={styles.searchWrapper}>
              <input
                className="input"
                placeholder="Search by problem title…"
                value={problemSearch}
                onChange={(e) => setProblemSearch(e.target.value)}
                disabled={disabled}
                id="problem-search-input"
              />
              {searching && <div className={styles.searchSpinner}><div className="spinner" /></div>}
              {searchResults.length > 0 && (
                <div className={styles.searchDropdown}>
                  {searchResults.map((p) => (
                    <button
                      key={p._id}
                      className={styles.searchResult}
                      onClick={() => addSpecificId(p._id)}
                      disabled={settings.specificQuestionIds.includes(p._id)}
                    >
                      <span>{p.title}</span>
                      <DiffBadge d={p.difficulty} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {settings.specificQuestionIds.length > 0 && (
              <div className={styles.selectedProblems}>
                {settings.specificQuestionIds.map((id) => (
                  <div key={id} className={styles.selectedProblemChip}>
                    <span>{id}</span>
                    {isHost && (
                      <button onClick={() => removeSpecificId(id)} className={styles.chipRemove} aria-label="Remove problem">
                        <X size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Match Starting Countdown Screen ───────────────────────────────────────
function MatchStartingScreen({
  startsAt,
  countdownSeconds,
  problems,
  lobby,
  user,
  isHost,
}: {
  startsAt: number | null;
  countdownSeconds: number;
  problems: ProblemMeta[];
  lobby: any;
  user: any;
  isHost: boolean;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!startsAt) return countdownSeconds || 4;
    return Math.max(1, Math.ceil((startsAt - Date.now()) / 1000));
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (startsAt) {
        const remaining = Math.max(0, Math.ceil((startsAt - Date.now()) / 1000));
        setSecondsLeft(remaining);
      } else {
        setSecondsLeft((prev) => Math.max(0, prev - 1));
      }
    }, 200);

    return () => clearInterval(timer);
  }, [startsAt]);

  const otherRoleLabel = isHost ? 'OPPONENT' : 'HOST';
  const rawOtherName = isHost ? lobby?.opponentUsername : lobby?.hostUsername;
  const displayOtherName =
    rawOtherName && rawOtherName.trim() && rawOtherName.trim().toLowerCase() !== otherRoleLabel.toLowerCase()
      ? rawOtherName.trim()
      : isHost ? 'Challenger' : 'Room Creator';

  const problem = problems[0];

  return (
    <div className={styles.lobbyPage}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.startingContainer}>
        <div className={styles.startingTopBadge}>
          <div className={styles.startingPulseDot} />
          <span>Match Starting</span>
        </div>

        <h1 className={styles.startingTitle}>Prepare for Battle</h1>
        <p className={styles.startingSubtitle}>
          First coder to pass all test cases wins the duel immediately.
        </p>

        {/* Big Animated Countdown */}
        <div className={styles.countdownCircle}>
          <span className={styles.countdownNumber}>
            {secondsLeft > 0 ? secondsLeft : 'GO!'}
          </span>
        </div>

        {/* 1v1 Matchup Preview */}
        <div className={styles.startingVsGrid}>
          {/* Player (You) */}
          <div className={styles.startingPlayerBox}>
            <div className={`${styles.startingAvatar} ${styles.startingAvatarYou}`}>
              {user?.username?.[0]?.toUpperCase() || 'Y'}
            </div>
            <div className={styles.startingPlayerName}>{user?.username || 'You'}</div>
            <span className={styles.playerYou}>YOU</span>
          </div>

          <div className={styles.startingVsBadge}>VS</div>

          {/* Opponent */}
          <div className={styles.startingPlayerBox}>
            <div className={`${styles.startingAvatar} ${styles.startingAvatarOpp}`}>
              {displayOtherName[0]?.toUpperCase() || 'O'}
            </div>
            <div className={styles.startingPlayerName}>{displayOtherName}</div>
            <span className={isHost ? styles.playerOpponent : styles.playerHost}>
              {otherRoleLabel}
            </span>
          </div>
        </div>

        {/* Problem Info Preview */}
        {problem && (
          <div className={styles.startingProblemPreview}>
            <div className={styles.startingProblemMeta}>
              <Target size={18} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <div className={styles.startingProblemTitle}>{problem.title}</div>
                <div className={styles.startingFormatText}>1 Problem &bull; Sudden Death</div>
              </div>
            </div>
            <DiffBadge d={problem.difficulty} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function VersusRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.roomId as string | undefined) ?? '';
  const { user } = useAuthStore();

  const {
    socket, connected, lobby, problems, startTimestamp, endTimestamp,
    isStarting, startsAt, countdownSeconds,
    opponentTyping, opponentUpdate, opponentViolations, error, hostDisconnectTimeout, matchEnded, matchResult,
    connectSocket, joinRoom, updateSettings, startChallenge, clearError, reset, sendForfeit, sendViolation,
  } = useVersusStore();

  const [copied, setCopied] = useState(false);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [output, setOutput] = useState<{
    stdout?: string;
    stderr?: string;
    status?: string;
    runtime?: number;
    testResults?: any[];
    passedCount?: number;
    totalCount?: number;
  } | null>(null);
  const [running, setRunning] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [customInput, setCustomInput] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'testcase' | 'result'>('testcase');
  const [myProgress, setMyProgress] = useState<
    Record<string, { passed: number; total: number; accepted: boolean }>
  >({});
  const [opponentProgress, setOpponentProgress] = useState<
    Record<string, { passed: number; total: number; accepted: boolean }>
  >({});

  // ── Proctoring & Violations (Max 3) ──────────────────────────────────
  const [violationsCount, setViolationsCount] = useState(0);
  const violationsCountRef = useRef(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showDisqualifiedModal, setShowDisqualifiedModal] = useState(false);
  const [currentViolationType, setCurrentViolationType] = useState('');
  const [currentViolationDetail, setCurrentViolationDetail] = useState('');
  const isForfeitedRef = useRef(false);
  const resumingCooldownRef = useRef(false);
  const lastTabSwitchTimeRef = useRef(0);

  // Audio synthesizer beep for security alert
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
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }, []);

  const recordViolation = useCallback((type: string, detail: string, isTabSwitch = false) => {
    if (isForfeitedRef.current || matchEnded) return;
    if (isTabSwitch && resumingCooldownRef.current) return;

    violationsCountRef.current += 1;
    const current = violationsCountRef.current;
    setViolationsCount(current);
    setCurrentViolationType(type);
    setCurrentViolationDetail(detail);

    triggerAlertSound();
    sendViolation(current, type);

    if (current >= 3) {
      isForfeitedRef.current = true;
      setShowWarningModal(false);
      setShowDisqualifiedModal(true);
      sendForfeit(`Exceeded maximum 3 proctoring violations (${type})`);
      toast.error('Academic Integrity Violation: 3/3 violations reached. Match forfeited!');
    } else {
      setShowWarningModal(true);
      toast.error(`Security Alert (${current}/3): ${type} detected!`);
    }
  }, [matchEnded, triggerAlertSound, sendViolation, sendForfeit]);

  const resumeFromWarning = () => {
    resumingCooldownRef.current = true;
    setShowWarningModal(false);
    setTimeout(() => {
      resumingCooldownRef.current = false;
    }, 2000);
  };

  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const isHost = !!user && !!lobby && (lobby.hostId === user.id || lobby.hostId === (user as any)._id);
  const isInProgress = lobby?.status === 'IN_PROGRESS';
  const activeProblem = problems[activeProblemIdx] ?? null;

  // ── Connect and join room on mount ─────────────────────────────────────
  useEffect(() => {
    connectSocket();
  }, []);

  useEffect(() => {
    if (connected && roomId) joinRoom(roomId, user?.username);
  }, [connected, roomId, joinRoom, user?.username]);

  // ── Populate editor when problem changes ───────────────────────────────
  useEffect(() => {
    if (activeProblem?.starterTemplates) {
      const tmpl =
        activeProblem.starterTemplates[language] ??
        Object.values(activeProblem.starterTemplates)[0] ??
        '';
      setCode(tmpl);
      setOutput(null);
      setCustomInput('');
      setActiveConsoleTab('testcase');
    }
  }, [activeProblem, language]);

  // ── Track opponent updates ─────────────────────────────────────────────
  useEffect(() => {
    if (opponentUpdate) {
      setOpponentProgress((prev) => ({
        ...prev,
        [opponentUpdate.problemId]: {
          passed: opponentUpdate.passedCount,
          total: opponentUpdate.totalCount,
          accepted: opponentUpdate.isAccepted,
        },
      }));
    }
  }, [opponentUpdate]);

  // ── Error toast ───────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  // ── PROCTORING EVENT LISTENERS ───────────────────────────────────────
  useEffect(() => {
    if (!isInProgress || isForfeitedRef.current || matchEnded) return;

    const handleWindowBlur = () => {
      if (!isInProgress || isForfeitedRef.current || matchEnded || resumingCooldownRef.current) return;
      const now = Date.now();
      if (now - lastTabSwitchTimeRef.current < 1500) return;
      lastTabSwitchTimeRef.current = now;
      recordViolation('Window / Tab Switch', 'Duel window lost focus or candidate switched tabs/applications', true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleWindowBlur();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('Copy Blocked', 'Attempted to copy challenge contents to clipboard');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('Cut Blocked', 'Attempted to cut challenge text');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation('Paste Blocked', 'Attempted to paste external code into editor');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click context menu is disabled in duel mode.');
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (isCtrlOrMeta && (key === 'c' || key === 'v' || key === 'x')) {
        e.preventDefault();
        recordViolation(`Blocked Shortcut (Ctrl+${key.toUpperCase()})`, `Attempted clipboard shortcut Ctrl+${key.toUpperCase()}`);
      }

      if (
        e.key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (isCtrlOrMeta && key === 'u')
      ) {
        e.preventDefault();
        recordViolation('Developer Tools Blocked', `Attempted to open developer tools (${e.key})`);
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isInProgress, matchEnded, recordViolation]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomId);
    toast.success('Room code copied!');
  };

  const handleEditorChange = (val: string | undefined) => {
    setCode(val ?? '');
    // Typing indicator — debounced
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit('match:typing', { roomId });
    }, 400);
  };

  const runCode = async () => {
    if (!activeProblem || !code.trim()) return;
    setRunning(true);
    setOutput(null);
    setIsConsoleOpen(true);
    setActiveConsoleTab('result');
    try {
      const effectiveStdin = activeConsoleTab === 'testcase' && customInput.trim() ? customInput : undefined;
      const { data } = await api.post('/execute', {
        language,
        sourceCode: code,
        stdin: effectiveStdin,
        problemId: activeProblem._id,
      });
      setOutput(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setOutput({
        stdout: '',
        stderr: msg || 'Execution failed',
        status: 'Runtime Error',
      });
      toast.error(msg || 'Execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    if (!activeProblem || !code.trim() || !user) return;
    setRunning(true);
    setOutput(null);
    setIsConsoleOpen(true);
    setActiveConsoleTab('result');
    try {
      const { data } = await api.post('/submissions', {
        problemId: activeProblem._id,
        language,
        sourceCode: code,
      });
      setOutput(data);
      const accepted = data.status === 'Accepted';
      setMyProgress((prev) => ({
        ...prev,
        [activeProblem._id]: {
          passed: data.passedCount,
          total: data.totalCount,
          accepted,
        },
      }));
      socket?.emit('match:test-update', {
        roomId,
        problemId: activeProblem._id,
        passedCount: data.passedCount,
        totalCount: data.totalCount,
        isAccepted: accepted,
      });
      if (accepted) {
        toast.success('Problem Solved! You won the match!');
      } else {
        toast.error(`${data.passedCount}/${data.totalCount} tests passed`);
      }
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };


  // ── Loading state ─────────────────────────────────────────────────────
  if (!lobby && connected) {
    return (
      <div className={styles.loadingScreen}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p>Joining room {roomId}…</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className={styles.loadingScreen}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <p>Connecting…</p>
      </div>
    );
  }

  // ─── COMPLETED: Match Over ───────────────────────────────────────────
  if (matchEnded) {
    const isForfeit = matchResult?.reason === 'FORFEIT';
    const isForfeitedByMe = isForfeit && (
      matchResult?.forfeitedUserId === user?.id ||
      matchResult?.forfeitedUserId === (user as any)?._id ||
      violationsCount >= 3
    );

    const singleProblem = problems[0];
    const myStats = singleProblem ? myProgress[singleProblem._id] : null;
    const oppStats = singleProblem ? opponentProgress[singleProblem._id] : null;

    const myPassed = myStats?.passed ?? 0;
    const totalTests = myStats?.total ?? singleProblem?.testCases?.length ?? 0;
    const oppPassed = oppStats?.passed ?? 0;

    const iSolved = Boolean(myStats?.accepted);
    const oppSolved = Boolean(oppStats?.accepted);

    const iWon = isForfeit
      ? !isForfeitedByMe
      : matchResult?.winnerId
      ? matchResult.winnerId === user?.id || matchResult.winnerId === (user as any)?._id
      : iSolved && !oppSolved;

    const isTie = !isForfeit && !matchResult?.winnerId && !iSolved && !oppSolved;
    const oppWon = !iWon && !isTie;

    const otherRoleLabel = isHost ? 'OPPONENT' : 'HOST';
    const rawOtherName = isHost ? lobby?.opponentUsername : lobby?.hostUsername;
    const opponentName =
      rawOtherName && rawOtherName.trim() && rawOtherName.trim().toLowerCase() !== otherRoleLabel.toLowerCase()
        ? rawOtherName.trim()
        : isHost ? 'Challenger' : 'Room Creator';

    const outcomeType = isForfeit && isForfeitedByMe
      ? 'dq'
      : isForfeit && iWon
      ? 'dqVictory'
      : iWon
      ? 'victory'
      : isTie
      ? 'tie'
      : 'defeat';

    // heroGlowClass removed (glow effects removed from results screen)

    const titleClass =
      outcomeType === 'victory'
        ? styles.resultTitleVictory
        : outcomeType === 'dqVictory'
        ? styles.resultTitleDqVictory
        : outcomeType === 'defeat'
        ? styles.resultTitleDefeat
        : outcomeType === 'dq'
        ? styles.resultTitleDq
        : styles.resultTitleTie;

    const myPercent = totalTests > 0 ? Math.min(100, Math.round((myPassed / totalTests) * 100)) : 0;
    const oppPercent = totalTests > 0 ? Math.min(100, Math.round((oppPassed / totalTests) * 100)) : 0;

    return (
      <div className={styles.lobbyPage}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.lobbyContainer}>
          <div className={styles.resultContainer}>
            {/* Top Match Tag */}
            <div className={styles.resultTopTag}>
              <div
                className={styles.resultTopTagDot}
                style={{
                  background: outcomeType === 'victory' || outcomeType === 'dqVictory'
                    ? '#34d399'
                    : outcomeType === 'tie'
                    ? '#60a5fa'
                    : '#f87171',
                }}
              />
              <span>1v1 Sudden Death &bull; Duel Concluded</span>
            </div>

            {/* Hero Icon */}
            <div className={styles.resultHeroBox}>
              <div className={styles.resultHeroIconBubble}>
                {outcomeType === 'victory' ? (
                  <Trophy size={38} style={{ color: '#34d399' }} />
                ) : outcomeType === 'dqVictory' ? (
                  <Trophy size={38} style={{ color: '#38bdf8' }} />
                ) : outcomeType === 'tie' ? (
                  <Clock size={38} style={{ color: '#60a5fa' }} />
                ) : outcomeType === 'dq' ? (
                  <ShieldAlert size={38} style={{ color: '#ef4444' }} />
                ) : (
                  <XCircle size={38} style={{ color: '#f87171' }} />
                )}
              </div>
            </div>

            {/* Title */}
            <h1 className={`${styles.resultTitle} ${titleClass}`}>
              {outcomeType === 'dq'
                ? 'Disqualified!'
                : outcomeType === 'dqVictory'
                ? 'Victory by Disqualification!'
                : outcomeType === 'victory'
                ? 'Victory!'
                : outcomeType === 'tie'
                ? 'Time Expired'
                : 'Defeat'}
            </h1>

            {/* Subtitle description */}
            <p className={styles.resultSubtitle}>
              {outcomeType === 'dq'
                ? 'You were disqualified for exceeding the maximum allowed proctoring violations (3/3). Match forfeited.'
                : outcomeType === 'dqVictory'
                ? `${opponentName} was disqualified for proctoring violations (3/3). Victory awarded to you!`
                : outcomeType === 'victory'
                ? 'You solved all test cases first and won the duel!'
                : outcomeType === 'tie'
                ? 'Neither candidate completed all test suites before the timer expired.'
                : `${matchResult?.winnerUsername || opponentName} solved the problem first and claimed victory.`}
            </p>

            {/* Problem Info Pill */}
            {singleProblem && (
              <div className={styles.resultProblemPill}>
                <Target size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span>Problem: <span className={styles.resultProblemTitle}>{singleProblem.title}</span></span>
                <DiffBadge d={singleProblem.difficulty} />
              </div>
            )}

            {/* 1v1 Dual Player Cards Grid */}
            <div className={styles.resultPlayersGrid}>
              {/* You (Current User) */}
              <div
                className={`${styles.resultPlayerCard} ${
                  iWon ? styles.resultPlayerCardWinner : isForfeitedByMe ? styles.resultPlayerCardDq : ''
                }`}
              >
                <div className={styles.resultCardTopRow}>
                  <span className={styles.playerYou}>YOU</span>
                  {iWon ? (
                    <span className={styles.winnerRibbon}>
                      <Crown size={11} /> Winner
                    </span>
                  ) : isForfeitedByMe ? (
                    <span className={styles.dqRibbon}>
                      <ShieldAlert size={11} /> Disqualified
                    </span>
                  ) : (
                    <span className={styles.runnerRibbon}>Runner-up</span>
                  )}
                </div>

                <div className={styles.resultPlayerProfile}>
                  <div className={`${styles.resultAvatarCircle} ${styles.resultAvatarYou}`}>
                    {user?.username?.[0]?.toUpperCase() || 'Y'}
                  </div>
                  <div>
                    <div className={styles.resultPlayerName}>{user?.username || 'You'}</div>
                    <div className={styles.resultPlayerHandle}>@{user?.username?.toLowerCase() || 'player'}</div>
                  </div>
                </div>

                <div className={styles.resultStatusPillRow}>
                  {isForfeitedByMe ? (
                    <div className={`${styles.statusPill} ${styles.statusPillDq}`}>
                      <ShieldAlert size={12} /> Disqualified
                    </div>
                  ) : iSolved ? (
                    <div className={`${styles.statusPill} ${styles.statusPillSolved}`}>
                      <CheckCircle2 size={12} /> Solved
                    </div>
                  ) : iWon ? (
                    <div className={`${styles.statusPill} ${styles.statusPillAwarded}`}>
                      <Award size={12} /> Awarded Win
                    </div>
                  ) : (
                    <div className={`${styles.statusPill} ${styles.statusPillUnsolved}`}>
                      <X size={12} /> Unsolved
                    </div>
                  )}

                  <span className={styles.resultTestsText}>
                    {myPassed} / {totalTests} Passed
                  </span>
                </div>

                {/* Test Progress Bar */}
                <div className={styles.resultProgressTrack}>
                  <div
                    className={`${styles.resultProgressBar} ${
                      isForfeitedByMe
                        ? styles.resultProgressBarRed
                        : iSolved || iWon
                        ? styles.resultProgressBarGreen
                        : styles.resultProgressBarMuted
                    }`}
                    style={{ width: `${myPercent}%` }}
                  />
                </div>
              </div>

              {/* Opponent / Host Card */}
              <div
                className={`${styles.resultPlayerCard} ${
                  oppWon ? styles.resultPlayerCardWinner : isForfeit && !isForfeitedByMe ? styles.resultPlayerCardDq : ''
                }`}
              >
                <div className={styles.resultCardTopRow}>
                  <span className={isHost ? styles.playerOpponent : styles.playerHost}>
                    {otherRoleLabel}
                  </span>
                  {oppWon ? (
                    <span className={styles.winnerRibbon}>
                      <Crown size={11} /> Winner
                    </span>
                  ) : isForfeit && !isForfeitedByMe ? (
                    <span className={styles.dqRibbon}>
                      <ShieldAlert size={11} /> Disqualified
                    </span>
                  ) : (
                    <span className={styles.runnerRibbon}>Runner-up</span>
                  )}
                </div>

                <div className={styles.resultPlayerProfile}>
                  <div
                    className={`${styles.resultAvatarCircle} ${
                      isHost ? styles.resultAvatarOpp : styles.resultAvatarHost
                    }`}
                  >
                    {opponentName?.[0]?.toUpperCase() || 'O'}
                  </div>
                  <div>
                    <div className={styles.resultPlayerName}>{opponentName}</div>
                    <div className={styles.resultPlayerHandle}>@{opponentName.toLowerCase().replace(/\s+/g, '_')}</div>
                  </div>
                </div>

                <div className={styles.resultStatusPillRow}>
                  {isForfeit && !isForfeitedByMe ? (
                    <div className={`${styles.statusPill} ${styles.statusPillDq}`}>
                      <ShieldAlert size={12} /> Disqualified (3/3)
                    </div>
                  ) : oppSolved ? (
                    <div className={`${styles.statusPill} ${styles.statusPillSolved}`}>
                      <CheckCircle2 size={12} /> Solved
                    </div>
                  ) : oppWon ? (
                    <div className={`${styles.statusPill} ${styles.statusPillAwarded}`}>
                      <Award size={12} /> Awarded Win
                    </div>
                  ) : (
                    <div className={`${styles.statusPill} ${styles.statusPillUnsolved}`}>
                      <X size={12} /> Unsolved
                    </div>
                  )}

                  <span className={styles.resultTestsText}>
                    {oppPassed} / {totalTests} Passed
                  </span>
                </div>

                {/* Test Progress Bar */}
                <div className={styles.resultProgressTrack}>
                  <div
                    className={`${styles.resultProgressBar} ${
                      isForfeit && !isForfeitedByMe
                        ? styles.resultProgressBarRed
                        : oppSolved || oppWon
                        ? styles.resultProgressBarGreen
                        : styles.resultProgressBarMuted
                    }`}
                    style={{ width: `${oppPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Actions Row */}
            <div className={styles.resultActionsRow}>
              <button
                className={styles.resultPrimaryBtn}
                onClick={() => {
                  reset();
                  router.push('/versus');
                }}
              >
                <RotateCcw size={16} /> Back to Versus Lobby
              </button>
              <Link href="/problems" className={styles.resultSecondaryBtn}>
                <Code2 size={16} /> Practice Problems
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STARTING: Match Countdown Screen ──────────────────────────────────
  if ((lobby?.status === 'STARTING' || isStarting) && !matchEnded) {
    return (
      <MatchStartingScreen
        startsAt={startsAt}
        countdownSeconds={countdownSeconds}
        problems={problems}
        lobby={lobby}
        user={user}
        isHost={isHost}
      />
    );
  }

  // ─── IN_PROGRESS: Match Workspace ────────────────────────────────────
  if (isInProgress && problems.length > 0) {
    const langs = activeProblem ? Object.keys(activeProblem.starterTemplates) : ['python'];
    const myStats = activeProblem ? myProgress[activeProblem._id] : null;
    const oppStats = activeProblem ? opponentProgress[activeProblem._id] : null;

    return (
      <div className={styles.matchContainer}>
        {/* Top Header */}
        <div className={styles.matchHeader}>
          <div className={styles.matchHeaderLeft}>
            <div className={styles.playerInfo}>
              <span className={styles.playerYou}>YOU</span>
              <span className={styles.playerNameText}>{user?.username || 'Player 1'}</span>
            </div>
            {myStats && (
              <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                {myStats.passed} / {myStats.total} tests
              </span>
            )}
          </div>

          <div className={styles.matchHeaderCenter}>
            {endTimestamp && <CountdownTimer endTimestamp={endTimestamp} />}
            <div className={styles.proctorPillRow}>
              <span
                className={`${styles.proctorBadge} ${
                  violationsCount === 0
                    ? ''
                    : violationsCount < 3
                    ? styles.proctorBadgeWarn
                    : styles.proctorBadgeCrit
                }`}
                title="Integrity infractions recorded for candidate"
              >
                <Shield size={11} /> Violations: {violationsCount}/3
              </span>
              {opponentViolations > 0 && (
                <span className={styles.oppProctorBadge} title="Opponent security warnings">
                  Opponent: {opponentViolations}/3
                </span>
              )}
            </div>
          </div>

          <div className={styles.matchHeaderRight}>
            {oppStats && (
              <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                {oppStats.passed} / {oppStats.total} tests
              </span>
            )}
            <div className={styles.playerInfo}>
              <span className={isHost ? styles.playerOpponent : styles.playerHost}>
                {isHost ? 'OPPONENT' : 'HOST'}
              </span>
              <span className={styles.playerNameText}>
                {(() => {
                  const roleLabel = isHost ? 'OPPONENT' : 'HOST';
                  const rawName = isHost ? lobby?.opponentUsername : lobby?.hostUsername;
                  return rawName && rawName.trim() && rawName.trim().toLowerCase() !== roleLabel.toLowerCase()
                    ? rawName.trim()
                    : isHost ? 'Challenger' : 'Room Creator';
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Split Layout */}
        <div className={styles.matchSplit}>
          
          {/* Left Pane: Problem Description */}
          <div className={styles.leftPane} data-lenis-prevent="true">
            {activeProblem && (
              <>
                <div className={styles.problemTitle}>{activeProblem.title}</div>
                <div className={styles.problemTags}>
                  <span className={`${styles.tagBadge} ${activeProblem.difficulty === 'Easy' ? styles.tagEasy : activeProblem.difficulty === 'Medium' ? styles.tagMedium : styles.tagHard}`}>
                    {activeProblem.difficulty}
                  </span>
                  {activeProblem.tags && activeProblem.tags.length > 0
                    ? activeProblem.tags.map((tag: string) => (
                        <span key={tag} className={styles.tagBadge}>{tag}</span>
                      ))
                    : null}
                </div>
                
                <div className={`${styles.problemDescription} ${styles.markdownBody}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {activeProblem.description
                      ? (() => {
                          const text = activeProblem.description.replace(/\\n/g, '\n').replace(/\\r/g, '');
                          const escapedTitle = activeProblem.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          return text.replace(new RegExp(`^#+\\s*${escapedTitle}\\s*\\n*`, 'i'), '').trim();
                        })()
                      : ''}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </div>

          {/* Right Pane: Editor & LeetCode Console */}
          <div className={styles.rightPane}>
            <div className={styles.editorHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LanguageSelector value={language} onChange={setLanguage} />
                
                <button
                  className={styles.iconBtn}
                  title="Reset to default code"
                  onClick={() => setCode(activeProblem?.starterTemplates?.[language] || '')}
                >
                  <RotateCcw size={13} />
                </button>

                {opponentTyping && (
                  <span className={styles.typingIndicator}>Typing…</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className={styles.headerIconBtn}
                  title="Toggle Console"
                  onClick={() => setIsConsoleOpen((prev) => !prev)}
                  style={isConsoleOpen ? { color: '#38bdf8' } : undefined}
                >
                  <Terminal size={14} />
                </button>

                <button
                  className={styles.runBtn}
                  onClick={runCode}
                  disabled={running}
                  id="run-btn"
                  title="Run code against test cases"
                >
                  {running ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="currentColor" />}
                  <span>{running ? 'Running...' : 'Run'}</span>
                </button>

                <button
                  className={styles.submitBtn}
                  onClick={submitCode}
                  disabled={running || !user}
                  id="submit-btn"
                  title="Submit solution for judging"
                >
                  <Send size={12} />
                  <span>{running ? 'Judging...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              {isConsoleOpen ? (
                <Group orientation="vertical" style={{ height: '100%', width: '100%' }}>
                  <Panel defaultSize={55} minSize={25} style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className={styles.editorContainer}>
                      <MonacoEditor
                        height="100%"
                        language={language === 'python' ? 'python' : language === 'cpp' ? 'cpp' : language}
                        theme="vs-dark"
                        value={code}
                        onChange={handleEditorChange}
                        options={{
                          fontSize: 14,
                          fontFamily: 'JetBrains Mono, monospace',
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          wordWrap: 'on',
                        }}
                      />
                    </div>
                  </Panel>

                  <Separator className={styles.resizeHandleHorizontal}>
                    <div className={styles.handleBarHorizontal} />
                  </Separator>

                  <Panel defaultSize={45} minSize={20} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }} data-lenis-prevent="true">
                    <LeetCodeConsole
                      problem={activeProblem}
                      output={output}
                      isRunning={running}
                      customInput={customInput}
                      onCustomInputChange={setCustomInput}
                      onRun={runCode}
                      onClose={() => setIsConsoleOpen(false)}
                      activeTab={activeConsoleTab}
                      setActiveTab={setActiveConsoleTab}
                    />
                  </Panel>
                </Group>
              ) : (
                <div className={styles.editorContainer}>
                  <MonacoEditor
                    height="100%"
                    language={language === 'python' ? 'python' : language === 'cpp' ? 'cpp' : language}
                    theme="vs-dark"
                    value={code}
                    onChange={handleEditorChange}
                    options={{
                      fontSize: 14,
                      fontFamily: 'JetBrains Mono, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: 'on',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Violation Warning Modal (1/3 or 2/3) */}
        {showWarningModal && (
          <div className={styles.proctorModalBackdrop}>
            <div className={styles.proctorModalBox}>
              <div className={styles.proctorModalIcon}>
                <AlertTriangle size={48} style={{ color: '#d29922' }} />
              </div>
              <h2 className={styles.proctorModalTitle}>Security Alert: {currentViolationType}</h2>
              <p className={styles.proctorModalDesc}>{currentViolationDetail}</p>
              <div className={styles.proctorModalInfraction}>
                <span>Violation <strong>{violationsCount} of 3</strong> recorded</span>
                <span style={{ color: '#d29922', marginLeft: '6px' }}>
                  ({Math.max(0, 3 - violationsCount)} warning{3 - violationsCount === 1 ? '' : 's'} remaining)
                </span>
              </div>
              <button
                type="button"
                className={`btn btn-primary ${styles.proctorModalBtn}`}
                onClick={resumeFromWarning}
              >
                I Understand &amp; Resume Duel ({Math.max(0, 3 - violationsCount)} Left)
              </button>
            </div>
          </div>
        )}

        {/* Disqualified Modal (3/3) */}
        {showDisqualifiedModal && (
          <div className={styles.proctorModalBackdrop}>
            <div className={`${styles.proctorModalBox} ${styles.proctorModalBoxCrit}`}>
              <div className={styles.proctorModalIcon}>
                <ShieldAlert size={56} style={{ color: '#f85149' }} />
              </div>
              <h2 className={styles.proctorModalTitle} style={{ color: '#f85149' }}>
                Disqualified for Cheating
              </h2>
              <p className={styles.proctorModalDesc}>
                You exceeded the maximum allowed limit of <strong>3 proctoring violations</strong> during this duel.
                Your session has been terminated and the match has been forfeited.
              </p>
              <div className={styles.proctorModalInfraction} style={{ borderColor: 'rgba(248,81,73,0.3)', color: '#f85149' }}>
                <span>Infractions: <strong>3 / 3 (Disqualified)</strong></span>
              </div>
              <button
                type="button"
                className={`btn btn-secondary ${styles.proctorModalBtn}`}
                onClick={() => setShowDisqualifiedModal(false)}
              >
                View Match Summary
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LOBBY: Waiting Room ─────────────────────────────────────────────
  return (
    <div className={styles.lobbyPage}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.lobbyContainer}>
        {/* Room Header */}
        <div className={styles.roomHeader}>
          <div className={styles.roomHeaderLeft}>
            <span className={styles.vsLogo}>Versus</span>
            <div className={styles.roomIdChip}>
              <span className={styles.roomIdLabel}>Room Code</span>
              <code className={styles.roomIdCode}>{roomId}</code>
              <button className="btn btn-sm btn-ghost" onClick={copyCode} id="copy-code-btn">Copy</button>
            </div>
          </div>
          <div className={styles.roomHeaderRight}>
            <button className={`btn btn-sm btn-secondary`} onClick={copyLink} id="copy-link-btn">
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Host disconnect notice */}
        {hostDisconnectTimeout !== null && (
          <div className={styles.disconnectBanner}>
            Host disconnected. Room closes in <strong>{hostDisconnectTimeout}s</strong> unless they reconnect.
          </div>
        )}

        {/* Players */}
        <div className={styles.playersRow}>
          <div className={`${styles.playerCard} ${styles.hostCard}`}>
            <div className={styles.playerAvatar}>
              {isHost
                ? (user?.username?.[0]?.toUpperCase() || 'H')
                : (lobby?.hostUsername?.[0]?.toUpperCase() || 'H')}
            </div>
            <div className={styles.playerName}>
              {isHost
                ? (user?.username ? `${user.username} (Host)` : 'You (Host)')
                : (lobby?.hostUsername || 'Host')}
            </div>
            <div className={`badge badge-blue`}>Host</div>
          </div>

          <div className={styles.vsText}>VS</div>

          <div className={`${styles.playerCard} ${lobby?.opponentId ? styles.opponentReady : styles.waitingCard}`}>
            {lobby?.opponentId ? (
              <>
                <div className={styles.playerAvatar}>
                  {!isHost
                    ? (user?.username?.[0]?.toUpperCase() || 'O')
                    : (lobby?.opponentUsername?.[0]?.toUpperCase() || 'O')}
                </div>
                <div className={styles.playerName}>
                  {!isHost
                    ? (user?.username ? `${user.username} (You)` : 'You (Challenger)')
                    : (lobby?.opponentUsername && lobby.opponentUsername.toLowerCase() !== 'opponent' ? lobby.opponentUsername : 'Challenger')}
                </div>
                <div className="badge badge-purple">Ready</div>
              </>
            ) : (
              <>
                <div className={styles.playerAvatarEmpty}>?</div>
                <div className={styles.playerName}>Waiting…</div>
                <div className={`badge`} style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                  Share the code
                </div>
              </>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {lobby && (
          <SettingsPanel
            settings={lobby.settings}
            isHost={isHost}
            onUpdate={updateSettings}
          />
        )}

        {/* Start button */}
        {isHost && (
          <div className={styles.startRow}>
            <button
              className={`btn btn-primary btn-lg ${styles.startBtn}`}
              onClick={startChallenge}
              disabled={!lobby?.opponentId}
              id="start-match-btn"
            >
              {lobby?.opponentId
                ? 'Start Match'
                : 'Waiting for opponent...'}
            </button>
            {!lobby?.opponentId && (
              <p className={styles.waitHint}>
                Share the room code <strong>{roomId}</strong> with your opponent.
              </p>
            )}
          </div>
        )}

        {!isHost && lobby?.opponentId === user?.id && (
          <div className={styles.startRow}>
            <div className={styles.waitingForHost}>
              <div className="spinner" />
              <span>Waiting for the host to start the match…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
