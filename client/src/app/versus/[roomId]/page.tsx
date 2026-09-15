'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import parse from 'html-react-parser';
import api from '@/lib/api';
import { useVersusStore, LobbySettings, ProblemMeta } from '@/store/useVersusStore';
import { useAuthStore } from '@/store/authStore';
import LanguageSelector from '@/components/Editor/LanguageSelector';
import { Clock } from 'lucide-react';
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
                  <span className={styles.accepted}>✓</span>
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
    if (!settings.specificQuestionIds.includes(id)) {
      onUpdate({ specificQuestionIds: [...settings.specificQuestionIds, id] });
    }
    setProblemSearch('');
    setSearchResults([]);
  };

  const removeSpecificId = (id: string) => {
    onUpdate({ specificQuestionIds: settings.specificQuestionIds.filter((x) => x !== id) });
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

        {/* Question Count */}
        <div className={styles.settingGroup}>
          <label className="label">Number of Problems: <strong>{settings.questionCount}</strong></label>
          <input
            type="range" min={1} max={10} value={settings.questionCount}
            disabled={disabled}
            onChange={(e) => onUpdate({ questionCount: Number(e.target.value) })}
            className={styles.rangeInput}
            id="question-count-slider"
          />
          <div className={styles.rangeLabels}><span>1</span><span>10</span></div>
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
                      <button onClick={() => removeSpecificId(id)} className={styles.chipRemove}>✕</button>
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

// ─── Main Page ────────────────────────────────────────────────────────────
export default function VersusRoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = (params?.roomId as string | undefined) ?? '';
  const { user } = useAuthStore();

  const {
    socket, connected, lobby, problems, startTimestamp, endTimestamp,
    opponentTyping, opponentUpdate, error, hostDisconnectTimeout, matchEnded,
    connectSocket, joinRoom, updateSettings, startChallenge, clearError, reset,
  } = useVersusStore();

  const [copied, setCopied] = useState(false);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('java');
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(180);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [myProgress, setMyProgress] = useState<
    Record<string, { passed: number; total: number; accepted: boolean }>
  >({});
  const [opponentProgress, setOpponentProgress] = useState<
    Record<string, { passed: number; total: number; accepted: boolean }>
  >({});

  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const isHost = !!user && !!lobby && (lobby.hostId === user.id || lobby.hostId === (user as any)._id);
  const isInProgress = lobby?.status === 'IN_PROGRESS';
  const activeProblem = problems[activeProblemIdx] ?? null;

  // ── Connect and join room on mount ─────────────────────────────────────
  useEffect(() => {
    connectSocket();
  }, []);

  useEffect(() => {
    if (connected && roomId) joinRoom(roomId);
  }, [connected, roomId, joinRoom]);

  // ── Populate editor when problem changes ───────────────────────────────
  useEffect(() => {
    if (activeProblem?.starterTemplates) {
      const tmpl =
        activeProblem.starterTemplates[language] ??
        Object.values(activeProblem.starterTemplates)[0] ??
        '';
      setCode(tmpl);
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
    try {
      const sampleInput = activeProblem.testCases.find((tc) => !tc.isHidden)?.input ?? '';
      const { data } = await api.post('/execute', { language, sourceCode: code, stdin: sampleInput });
      setOutput(data.stdout || data.stderr || '(no output)');
    } catch {
      setOutput('Execution failed.');
    } finally {
      setRunning(false);
    }
  };

  const submitCode = async () => {
    if (!activeProblem || !code.trim() || !user) return;
    setRunning(true);
    try {
      const { data } = await api.post('/submissions', {
        problemId: activeProblem._id,
        language,
        sourceCode: code,
      });
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
        toast.success(`Problem ${activeProblemIdx + 1} Accepted!`);
        if (activeProblemIdx < problems.length - 1) setActiveProblemIdx(activeProblemIdx + 1);
      } else {
        toast.error(`${data.passedCount}/${data.totalCount} tests passed`);
      }
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const handleConsoleDrag = useCallback((e: MouseEvent) => {
    if (!isDraggingConsole) return;
    const windowHeight = window.innerHeight;
    const newHeight = windowHeight - e.clientY;
    setConsoleHeight(Math.max(100, Math.min(newHeight, windowHeight - 200)));
  }, [isDraggingConsole]);

  const stopConsoleDrag = useCallback(() => {
    setIsDraggingConsole(false);
  }, []);

  useEffect(() => {
    if (isDraggingConsole) {
      window.addEventListener('mousemove', handleConsoleDrag);
      window.addEventListener('mouseup', stopConsoleDrag);
    }
    return () => {
      window.removeEventListener('mousemove', handleConsoleDrag);
      window.removeEventListener('mouseup', stopConsoleDrag);
    };
  }, [isDraggingConsole, handleConsoleDrag, stopConsoleDrag]);

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
    const myScore = Object.values(myProgress).filter(p => p.accepted).length;
    const oppScore = Object.values(opponentProgress).filter(p => p.accepted).length;
    const iWon = myScore > oppScore;
    const isTie = myScore === oppScore;

    return (
      <div className={styles.lobbyPage}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.lobbyContainer}>
          <div className={styles.roomHeader} style={{ justifyContent: 'center', padding: '40px' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '3rem', marginBottom: '16px', color: isTie ? '#ccc' : iWon ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {isTie ? 'Tie!' : iWon ? 'You Won!' : 'You Lost!'}
              </h1>
              <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', alignItems: 'center', marginTop: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{user?.username || 'You'}</div>
                  <div style={{ fontSize: '4rem', fontWeight: 800 }}>{myScore}</div>
                </div>
                <div style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>-</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Opponent</div>
                  <div style={{ fontSize: '4rem', fontWeight: 800 }}>{oppScore}</div>
                </div>
              </div>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ marginTop: '48px' }}
                onClick={() => {
                  reset();
                  router.push('/versus');
                }}
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
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
              <span>{user?.username || 'Player 1'}</span>
            </div>
            {myStats && (
              <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                {myStats.passed} / {myStats.total} tests
              </span>
            )}
          </div>

          <div className={styles.matchHeaderCenter}>
            {endTimestamp && <CountdownTimer endTimestamp={endTimestamp} />}
          </div>

          <div className={styles.matchHeaderRight}>
            {oppStats && (
              <span style={{ fontSize: '0.85rem', color: '#ccc' }}>
                {oppStats.passed} / {oppStats.total} tests
              </span>
            )}
            <div className={styles.playerInfo}>
              <span>Opponent</span>
              <span className={styles.playerOpponent}>{lobby?.opponentId === user?.id ? 'Host' : 'Opponent'}</span>
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
                  <span className={styles.tagBadge}>Topics</span>
                  <span className={styles.tagBadge}>Company Tags</span>
                </div>
                
                <div className={`markdownBody ${styles.problemDescription}`}>
                  {parse(activeProblem.description || '')}
                </div>
              </>
            )}
          </div>

          {/* Right Pane: Editor */}
          <div className={styles.rightPane}>
            <div className={styles.editorHeader}>
              <LanguageSelector value={language} onChange={setLanguage} />
              
              <div className={styles.editorActions}>
                <button className={styles.iconBtn} title="Reset to default code" onClick={() => setCode(activeProblem?.starterTemplates?.[language] || '')}>
                  ↺
                </button>
                {opponentTyping && (
                  <span className={styles.typingIndicator}>Typing…</span>
                )}
              </div>
            </div>

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

            {/* Bottom Console Drawer */}
            <div className={styles.bottomDrawer}>
              <div 
                className={styles.dragHandle} 
                onMouseDown={() => setIsDraggingConsole(true)}
              />
              <div className={styles.drawerHeader}>
                <button className={styles.consoleToggle} onClick={() => {
                  const el = document.getElementById('consoleContent');
                  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                }}>
                  Console <span>▲</span>
                </button>
                <div className={styles.runControls}>
                  <button className={styles.runBtn} onClick={runCode} disabled={running} id="run-btn">
                    {running ? 'Running...' : 'Run'}
                  </button>
                  <button className={styles.submitBtn} onClick={submitCode} disabled={running || !user} id="submit-btn">
                    {running ? 'Judging...' : 'Submit'}
                  </button>
                </div>
              </div>
              <div id="consoleContent" className={styles.drawerContent} style={{ display: 'block', height: `${consoleHeight}px` }} data-lenis-prevent="true">
                <div style={{ color: '#ccc', fontFamily: 'monospace', whiteSpace: 'pre-wrap', height: '100%', overflowY: 'auto' }}>
                  {output || 'No output. Click Run or Submit to execute your code.'}
                </div>
              </div>
            </div>
            
          </div>
        </div>
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
            <div className={styles.playerAvatar}>H</div>
            <div className={styles.playerName}>
              {lobby?.hostId === user?.id || lobby?.hostId === (user as any)?._id ? 'You (Host)' : 'Host'}
            </div>
            <div className={`badge badge-blue`}>Host</div>
          </div>

          <div className={styles.vsText}>VS</div>

          <div className={`${styles.playerCard} ${lobby?.opponentId ? styles.opponentReady : styles.waitingCard}`}>
            {lobby?.opponentId ? (
              <>
                <div className={styles.playerAvatar}>P</div>
                <div className={styles.playerName}>
                  {lobby.opponentId === user?.id ? 'You (Opponent)' : 'Opponent'}
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
