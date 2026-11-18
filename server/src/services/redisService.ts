import Redis from 'ioredis';
import { LobbyState, LobbySettings, RoomStatus } from '../types/versus';

// ─── Default Settings ─────────────────────────────────────────────────────

const DEFAULT_SETTINGS: LobbySettings = {
  difficulty: 'all',
  questionCount: 1,
  timeLimitMinutes: 30,
  selectionMode: 'random',
  specificQuestionIds: [],
};

// ─── In-Memory Fallback (when Redis is unavailable in dev) ───────────────

const memoryStore = new Map<string, Record<string, string>>();
let useMemory = false;
let redisClient: Redis | null = null;

function initRedis(): Redis | null {
  if (useMemory) return null;
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(url, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // disable auto-retry
  });

  client.on('error', () => {
    if (!useMemory) {
      console.warn('⚠️  Redis unavailable — using in-memory lobby store (dev mode)');
      useMemory = true;
      redisClient = null;
    }
  });

  redisClient = client;
  return client;
}

// ─── Abstracted Hash Ops (Redis or Memory) ───────────────────────────────

async function hset(key: string, data: Record<string, string>): Promise<void> {
  const client = initRedis();
  if (client && !useMemory) {
    try {
      await client.hset(key, data);
      await client.expire(key, 3600); // 1h TTL
      return;
    } catch {
      useMemory = true;
    }
  }
  memoryStore.set(key, { ...(memoryStore.get(key) ?? {}), ...data });
}

async function hgetall(key: string): Promise<Record<string, string> | null> {
  const client = initRedis();
  if (client && !useMemory) {
    try {
      const result = await client.hgetall(key);
      return result && Object.keys(result).length > 0 ? result : null;
    } catch {
      useMemory = true;
    }
  }
  return memoryStore.get(key) ?? null;
}

async function del(key: string): Promise<void> {
  const client = initRedis();
  if (client && !useMemory) {
    try {
      await client.del(key);
      return;
    } catch {
      useMemory = true;
    }
  }
  memoryStore.delete(key);
}

// ─── Serialization ────────────────────────────────────────────────────────

function serializeLobby(roomId: string, raw: Record<string, string>): LobbyState {
  return {
    roomId,
    hostId: raw.hostId ?? '',
    opponentId: raw.opponentId ?? '',
    hostUsername: raw.hostUsername || '',
    opponentUsername: raw.opponentUsername || '',
    settings: raw.settings ? (JSON.parse(raw.settings) as LobbySettings) : { ...DEFAULT_SETTINGS },
    status: (raw.status as RoomStatus) ?? 'LOBBY',
    currentQuestions: raw.currentQuestions ? (JSON.parse(raw.currentQuestions) as string[]) : [],
    scores: raw.scores
      ? (JSON.parse(raw.scores) as { hostScore: number; opponentScore: number })
      : { hostScore: 0, opponentScore: 0 },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function createLobby(roomId: string, hostId: string, hostUsername?: string): Promise<LobbyState> {
  const raw: Record<string, string> = {
    hostId,
    opponentId: '',
    hostUsername: hostUsername || '',
    opponentUsername: '',
    settings: JSON.stringify(DEFAULT_SETTINGS),
    status: 'LOBBY',
    currentQuestions: JSON.stringify([]),
    scores: JSON.stringify({ hostScore: 0, opponentScore: 0 }),
  };
  await hset(`room:${roomId}`, raw);
  return serializeLobby(roomId, raw);
}

export async function getLobby(roomId: string): Promise<LobbyState | null> {
  const raw = await hgetall(`room:${roomId}`);
  if (!raw) return null;
  return serializeLobby(roomId, raw);
}

export async function updateLobbySettings(
  roomId: string,
  settings: Partial<LobbySettings>
): Promise<LobbyState | null> {
  const lobby = await getLobby(roomId);
  if (!lobby) return null;
  const merged: LobbySettings = { ...lobby.settings, ...settings, questionCount: 1 };
  await hset(`room:${roomId}`, { settings: JSON.stringify(merged) });
  lobby.settings = merged;
  return lobby;
}

export async function joinLobby(roomId: string, userId: string, opponentUsername?: string): Promise<LobbyState | null> {
  const lobby = await getLobby(roomId);
  if (!lobby) return null;
  const updates: Record<string, string> = { opponentId: userId };
  if (opponentUsername) {
    updates.opponentUsername = opponentUsername;
    lobby.opponentUsername = opponentUsername;
  }
  await hset(`room:${roomId}`, updates);
  lobby.opponentId = userId;
  return lobby;
}

export async function updateLobbyUsernames(
  roomId: string,
  usernames: { hostUsername?: string; opponentUsername?: string }
): Promise<LobbyState | null> {
  const lobby = await getLobby(roomId);
  if (!lobby) return null;
  const updates: Record<string, string> = {};
  if (usernames.hostUsername) {
    updates.hostUsername = usernames.hostUsername;
    lobby.hostUsername = usernames.hostUsername;
  }
  if (usernames.opponentUsername) {
    updates.opponentUsername = usernames.opponentUsername;
    lobby.opponentUsername = usernames.opponentUsername;
  }
  if (Object.keys(updates).length > 0) {
    await hset(`room:${roomId}`, updates);
  }
  return lobby;
}

export async function updateLobbyScores(
  roomId: string,
  hostScore: number,
  opponentScore: number
): Promise<void> {
  const lobby = await getLobby(roomId);
  if (!lobby) return;
  const newScores = { hostScore, opponentScore };
  await hset(`room:${roomId}`, { scores: JSON.stringify(newScores) });
}

export async function setLobbyStarting(
  roomId: string,
  questionIds: string[]
): Promise<LobbyState | null> {
  const lobby = await getLobby(roomId);
  if (!lobby) return null;
  await hset(`room:${roomId}`, {
    currentQuestions: JSON.stringify(questionIds),
    status: 'STARTING',
  });
  lobby.currentQuestions = questionIds;
  lobby.status = 'STARTING';
  return lobby;
}

export async function startLobbyMatch(
  roomId: string,
  questionIds: string[]
): Promise<LobbyState | null> {
  const lobby = await getLobby(roomId);
  if (!lobby) return null;
  await hset(`room:${roomId}`, {
    currentQuestions: JSON.stringify(questionIds),
    status: 'IN_PROGRESS',
  });
  lobby.currentQuestions = questionIds;
  lobby.status = 'IN_PROGRESS';
  return lobby;
}

export async function updateLobbyStatus(roomId: string, status: RoomStatus): Promise<void> {
  await hset(`room:${roomId}`, { status });
}

export async function migrateHost(roomId: string, newHostId: string, newHostUsername?: string): Promise<LobbyState | null> {
  const lobby = await getLobby(roomId);
  if (!lobby) return null;
  const updates: Record<string, string> = {
    hostId: newHostId,
    opponentId: '',
    status: 'LOBBY',
  };
  if (newHostUsername) updates.hostUsername = newHostUsername;
  else if (lobby.opponentUsername) updates.hostUsername = lobby.opponentUsername;
  updates.opponentUsername = '';

  await hset(`room:${roomId}`, updates);
  lobby.hostId = newHostId;
  lobby.hostUsername = updates.hostUsername || '';
  lobby.opponentId = '';
  lobby.opponentUsername = '';
  lobby.status = 'LOBBY';
  return lobby;
}

export async function deleteLobby(roomId: string): Promise<void> {
  await del(`room:${roomId}`);
}
