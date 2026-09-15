// ─── TypeScript Type Definitions for Versus (Real-Time Multiplayer) ──────────

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

export interface LobbyScores {
  hostScore: number;
  opponentScore: number;
}

export interface LobbyState {
  roomId: string;
  hostId: string;
  opponentId: string;
  settings: LobbySettings;
  status: RoomStatus;
  currentQuestions: string[];
  scores: LobbyScores;
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
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean; explanation?: string }>;
}

// ─── Client → Server Events ────────────────────────────────────────────────

export interface RoomCreateEvent {
  settings?: Partial<LobbySettings>;
}

export interface RoomJoinEvent {
  roomId: string;
}

export interface RoomUpdateSettingsEvent {
  roomId: string;
  settings: Partial<LobbySettings>;
}

export interface RoomStartMatchEvent {
  roomId: string;
}

export interface MatchTypingEvent {
  roomId: string;
}

export interface MatchTestUpdateEvent {
  roomId: string;
  problemId: string;
  passedCount: number;
  totalCount: number;
  isAccepted: boolean;
}

// ─── Server → Client Payloads ──────────────────────────────────────────────

export interface RoomCreatedPayload {
  roomId: string;
  lobby: LobbyState;
}

export interface RoomJoinedPayload {
  lobby: LobbyState;
}

export interface RoomUpdatedPayload {
  lobby: LobbyState;
}

export interface RoomSettingsChangedPayload {
  settings: LobbySettings;
}

export interface MatchStartedPayload {
  lobby: LobbyState;
  problems: ProblemMeta[];
  startTimestamp: number;
  endTimestamp: number;
}

export interface MatchTestUpdatePayload {
  userId: string;
  problemId: string;
  passedCount: number;
  totalCount: number;
  isAccepted: boolean;
}

export interface RoomErrorPayload {
  message: string;
}

export interface RoomHostDisconnectedPayload {
  timeout: number; // seconds remaining for host to reconnect
}
