'use client';
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// ─── Types ────────────────────────────────────────────────────────────────

export type RoomStatus = 'LOBBY' | 'STARTING' | 'IN_PROGRESS' | 'COMPLETED';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'all';
export type SelectionMode = 'random' | 'specific';

export interface LobbySettings {
  difficulty: Difficulty;
  questionCount: number;
  timeLimitMinutes: number;
  selectionMode: SelectionMode;
  specificQuestionIds: string[];
}

export interface ProblemMeta {
  _id: string;
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string;
  hints: string[];
  starterTemplates: Record<string, string>;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
}

export interface LobbyState {
  roomId: string;
  hostId: string;
  hostUsername?: string;
  opponentId: string;
  opponentUsername?: string;
  settings: LobbySettings;
  status: RoomStatus;
  currentQuestions: string[];
  scores: { hostScore: number; opponentScore: number };
}

export interface OpponentTestUpdate {
  problemId: string;
  passedCount: number;
  totalCount: number;
  isAccepted: boolean;
}

export interface MatchEndedPayload {
  winnerId?: string;
  winnerUsername?: string;
  forfeitedUserId?: string;
  reason?: 'SOLVED' | 'TIMEOUT' | 'FORFEIT';
  message?: string;
}

// ─── Store Interface ──────────────────────────────────────────────────────

interface VersusState {
  socket: Socket | null;
  connected: boolean;
  roomId: string | null;
  lobby: LobbyState | null;
  problems: ProblemMeta[];
  startTimestamp: number | null;
  endTimestamp: number | null;
  isStarting: boolean;
  startsAt: number | null;
  countdownSeconds: number;
  opponentTyping: boolean;
  opponentUpdate: OpponentTestUpdate | null;
  opponentViolations: number;
  error: string | null;
  hostDisconnectTimeout: number | null;
  matchEnded: boolean;
  matchResult: MatchEndedPayload | null;

  // Actions
  connectSocket: (token?: string) => void;
  disconnectSocket: () => void;
  createRoom: (settings?: Partial<LobbySettings>, username?: string) => void;
  joinRoom: (roomId: string, username?: string) => void;
  updateSettings: (settings: Partial<LobbySettings>) => void;
  startChallenge: () => void;
  sendTyping: () => void;
  sendTestUpdate: (data: {
    problemId: string;
    passedCount: number;
    totalCount: number;
    isAccepted: boolean;
  }) => void;
  sendForfeit: (reason?: string) => void;
  sendViolation: (violationsCount: number, type: string) => void;
  clearError: () => void;
  reset: () => void;
}

// ─── Socket URL Resolution ────────────────────────────────────────────────

function getSocketUrl(): string {
  if (typeof window === 'undefined') return '';
  return window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : window.location.origin;
}

// ─── Store ────────────────────────────────────────────────────────────────

export const useVersusStore = create<VersusState>((set, get) => ({
  socket: null,
  connected: false,
  roomId: null,
  lobby: null,
  problems: [],
  startTimestamp: null,
  endTimestamp: null,
  isStarting: false,
  startsAt: null,
  countdownSeconds: 4,
  opponentTyping: false,
  opponentUpdate: null,
  opponentViolations: 0,
  error: null,
  hostDisconnectTimeout: null,
  matchEnded: false,
  matchResult: null,

  connectSocket: (token?: string) => {
    const { socket } = get();
    if (socket?.connected) return;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }

    // Read token from sessionStorage if not provided
    const authToken =
      token ??
      (typeof window !== 'undefined' ? sessionStorage.getItem('cf_token') ?? undefined : undefined);

    const sock = io(getSocketUrl(), {
      path: '/socket.io',
      auth: authToken ? { token: authToken } : {},
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ── Connection lifecycle ───────────────────────────────────────────────
    sock.on('connect', () => set({ connected: true, error: null }));
    sock.on('disconnect', () => set({ connected: false }));
    sock.on('connect_error', (err) =>
      set({ error: `Connection failed: ${err.message}` })
    );

    // ── Room events ────────────────────────────────────────────────────────
    sock.on('room:created', ({ roomId, lobby }: { roomId: string; lobby: LobbyState }) => {
      set({ roomId, lobby, error: null });
    });

    sock.on('room:joined', ({ lobby }: { lobby: LobbyState }) => {
      set({ roomId: lobby.roomId, lobby, error: null });
    });

    sock.on('room:updated', ({ lobby }: { lobby: LobbyState }) => {
      set({ lobby });
    });

    sock.on('room:settings-changed', ({ settings }: { settings: LobbySettings }) => {
      set((s) => ({
        lobby: s.lobby ? { ...s.lobby, settings } : s.lobby,
      }));
    });

    sock.on('room:host-disconnected', ({ timeout }: { timeout: number }) => {
      set({ hostDisconnectTimeout: timeout });
      // Countdown
      const interval = setInterval(() => {
        set((s) => {
          const next = (s.hostDisconnectTimeout ?? 0) - 1;
          if (next <= 0) clearInterval(interval);
          return { hostDisconnectTimeout: next > 0 ? next : null };
        });
      }, 1000);
    });

    sock.on(
      'room:host-changed',
      ({ newHostId, lobby }: { newHostId: string; lobby: LobbyState }) => {
        set({ lobby, hostDisconnectTimeout: null });
      }
    );

    sock.on('room:host-reconnected', () => {
      set({ hostDisconnectTimeout: null });
    });

    sock.on('room:closed', () => {
      set({
        lobby: null,
        roomId: null,
        problems: [],
        startTimestamp: null,
        endTimestamp: null,
        error: 'Room was closed.',
      });
    });

    sock.on('room:error', ({ message }: { message: string }) => {
      set({ error: message });
    });

    // ── Match events ───────────────────────────────────────────────────────
    sock.on(
      'match:starting',
      ({
        lobby,
        problems,
        startsAt,
        countdownSeconds,
      }: {
        lobby: LobbyState;
        problems: ProblemMeta[];
        startsAt: number;
        countdownSeconds: number;
      }) => {
        set({
          lobby,
          problems,
          isStarting: true,
          startsAt,
          countdownSeconds: countdownSeconds || 4,
        });
      }
    );

    sock.on(
      'match:started',
      ({
        lobby,
        problems,
        startTimestamp,
        endTimestamp,
      }: {
        lobby: LobbyState;
        problems: ProblemMeta[];
        startTimestamp: number;
        endTimestamp: number;
      }) => {
        set({
          lobby,
          problems,
          isStarting: false,
          startsAt: null,
          startTimestamp,
          endTimestamp,
        });
      }
    );

    sock.on('match:opponent-typing', () => {
      set({ opponentTyping: true });
      setTimeout(() => set({ opponentTyping: false }), 2000);
    });

    sock.on('match:test-update', (data: OpponentTestUpdate) => {
      set({ opponentUpdate: data });
    });

    sock.on('match:opponent-violation', (data: { violationsCount: number }) => {
      set({ opponentViolations: data.violationsCount });
    });

    sock.on('match:ended', (data?: MatchEndedPayload) => {
      set({ matchEnded: true, matchResult: data || null });
    });

    set({ socket: sock });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false, lobby: null, roomId: null });
  },

  createRoom: (settings, username) => {
    get().socket?.emit('room:create', { settings: settings ?? {}, username });
  },

  joinRoom: (roomId, username) => {
    get().socket?.emit('room:join', { roomId, username });
  },

  updateSettings: (settings) => {
    const { socket, roomId } = get();
    if (socket && roomId) socket.emit('room:update-settings', { roomId, settings });
  },

  startChallenge: () => {
    const { socket, roomId } = get();
    if (socket && roomId) socket.emit('room:start-match', { roomId });
  },

  sendTyping: () => {
    const { socket, roomId } = get();
    if (socket && roomId) socket.emit('match:typing', { roomId });
  },

  sendTestUpdate: (data) => {
    const { socket, roomId } = get();
    if (socket && roomId) socket.emit('match:test-update', { roomId, ...data });
  },

  sendForfeit: (reason?: string) => {
    const { socket, roomId } = get();
    if (socket && roomId) socket.emit('match:forfeit', { roomId, reason });
  },

  sendViolation: (violationsCount: number, type: string) => {
    const { socket, roomId } = get();
    if (socket && roomId) socket.emit('match:violation', { roomId, violationsCount, type });
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      roomId: null,
      lobby: null,
      problems: [],
      startTimestamp: null,
      endTimestamp: null,
      isStarting: false,
      startsAt: null,
      countdownSeconds: 4,
      opponentTyping: false,
      opponentUpdate: null,
      opponentViolations: 0,
      error: null,
      hostDisconnectTimeout: null,
      matchEnded: false,
      matchResult: null,
    }),
}));
