import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import Problem from '../models/Problem.model';
import {
  createLobby,
  getLobby,
  updateLobbySettings,
  joinLobby,
  startLobbyMatch,
  updateLobbyStatus,
  migrateHost,
  deleteLobby,
} from '../services/redisService';
import type {
  RoomCreateEvent,
  RoomJoinEvent,
  RoomUpdateSettingsEvent,
  RoomStartMatchEvent,
  MatchTypingEvent,
  MatchTestUpdateEvent,
} from '../types/versus';

const disconnectTimers = new Map<string, NodeJS.Timeout>();
const matchTimers = new Map<string, NodeJS.Timeout>();

// ─── Socket Auth Helper (already set during io.use middleware) ────────────
function getUserId(socket: Socket): string {
  return (socket as unknown as { userId: string }).userId ?? `guest_${socket.id}`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────

export function registerVersusHandler(io: Server, socket: Socket): void {
  const userId = getUserId(socket);

  // ── room:create ──────────────────────────────────────────────────────────
  // Generates a unique 8-char uppercase room code, initialises Redis state,
  // and emits `room:created` back to the host.
  socket.on('room:create', async (data?: RoomCreateEvent) => {
    try {
      const roomId = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
      let lobby = await createLobby(roomId, userId);

      if (data?.settings && Object.keys(data.settings).length > 0) {
        const updated = await updateLobbySettings(roomId, data.settings);
        if (updated) lobby = updated;
      }

      socket.join(`room:${roomId}`);
      socket.emit('room:created', { roomId, lobby });
    } catch (err) {
      console.error('[room:create]', err);
      socket.emit('room:error', { message: 'Failed to create room' });
    }
  });

  // ── room:join ────────────────────────────────────────────────────────────
  // Validates room existence and vacancy, registers opponent in Redis,
  // broadcasts `room:updated` to all occupants.
  socket.on('room:join', async ({ roomId }: RoomJoinEvent) => {
    try {
      if (!roomId || typeof roomId !== 'string') {
        socket.emit('room:error', { message: 'Invalid room ID' });
        return;
      }

      const code = roomId.trim().toUpperCase();
      const lobby = await getLobby(code);

      if (!lobby) {
        socket.emit('room:error', { message: 'Room not found. Check the code and try again.' });
        return;
      }
      if (lobby.status !== 'LOBBY') {
        socket.emit('room:error', { message: 'This match is already in progress.' });
        return;
      }

      // Host re-joining (e.g., page refresh)
      if (lobby.hostId === userId) {
        // Cancel any pending host disconnect timer
        const timer = disconnectTimers.get(code);
        if (timer) {
          clearTimeout(timer);
          disconnectTimers.delete(code);
          io.to(`room:${code}`).emit('room:host-reconnected');
        }
        socket.join(`room:${code}`);
        socket.emit('room:joined', { lobby });
        return;
      }

      // Opponent re-joining
      if (lobby.opponentId === userId) {
        socket.join(`room:${code}`);
        socket.emit('room:joined', { lobby });
        return;
      }

      // New opponent
      if (lobby.opponentId && lobby.opponentId !== '') {
        socket.emit('room:error', { message: 'Room is full.' });
        return;
      }

      const updated = await joinLobby(code, userId);
      socket.join(`room:${code}`);
      socket.emit('room:joined', { lobby: updated });
      io.to(`room:${code}`).emit('room:updated', { lobby: updated });
    } catch (err) {
      console.error('[room:join]', err);
      socket.emit('room:error', { message: 'Failed to join room' });
    }
  });

  // ── room:update-settings ─────────────────────────────────────────────────
  // Validates the sender is the host, merges settings in Redis,
  // broadcasts `room:settings-changed` to all occupants.
  socket.on('room:update-settings', async ({ roomId, settings }: RoomUpdateSettingsEvent) => {
    try {
      const lobby = await getLobby(roomId);
      if (!lobby) { socket.emit('room:error', { message: 'Room not found' }); return; }
      if (lobby.hostId !== userId) {
        socket.emit('room:error', { message: 'Only the host can change settings.' });
        return;
      }

      const updated = await updateLobbySettings(roomId, settings);
      io.to(`room:${roomId}`).emit('room:settings-changed', { settings: updated?.settings });
    } catch (err) {
      console.error('[room:update-settings]', err);
      socket.emit('room:error', { message: 'Failed to update settings' });
    }
  });

  // ── room:start-match ─────────────────────────────────────────────────────
  // Validates host authority, fetches problems (random via $sample or specific
  // by IDs), persists question IDs, transitions status → IN_PROGRESS,
  // broadcasts `match:started` with absolute countdown timestamps.
  socket.on('room:start-match', async ({ roomId }: RoomStartMatchEvent) => {
    try {
      const lobby = await getLobby(roomId);
      if (!lobby) { socket.emit('room:error', { message: 'Room not found' }); return; }
      if (lobby.hostId !== userId) {
        socket.emit('room:error', { message: 'Only the host can start the match.' });
        return;
      }
      if (!lobby.opponentId) {
        socket.emit('room:error', { message: 'Waiting for an opponent to join first.' });
        return;
      }
      if (lobby.status !== 'LOBBY') {
        socket.emit('room:error', { message: 'Match has already started.' });
        return;
      }

      const { settings } = lobby;
      let problems: any[] = [];

      if (settings.selectionMode === 'random') {
        const matchFilter: Record<string, unknown> = { isPublished: true };
        if (settings.difficulty !== 'all') {
          matchFilter.difficulty =
            settings.difficulty.charAt(0).toUpperCase() + settings.difficulty.slice(1);
        }
        problems = await Problem.aggregate([
          { $match: matchFilter },
          { $sample: { size: Math.min(settings.questionCount, 10) } },
          {
            $project: {
              _id: 1, title: 1, slug: 1, difficulty: 1, tags: 1,
              description: 1, examples: 1, constraints: 1, hints: 1,
              starterTemplates: 1, testCases: 1,
            },
          },
        ]);
      } else {
        // Specific mode: fetch by provided IDs
        const ids = settings.specificQuestionIds.slice(0, 10);
        problems = await Problem.find(
          { _id: { $in: ids }, isPublished: true },
          {
            _id: 1, title: 1, slug: 1, difficulty: 1, tags: 1,
            description: 1, examples: 1, constraints: 1, hints: 1,
            starterTemplates: 1, testCases: 1,
          }
        ).limit(settings.questionCount);
      }

      if (problems.length === 0) {
        socket.emit('room:error', {
          message: 'No published problems found matching the selected criteria. Try changing difficulty or mode.',
        });
        return;
      }

      const questionIds = problems.map((p) => (p._id as { toString(): string }).toString());
      await startLobbyMatch(roomId, questionIds);

      const now = Date.now();
      const endTimestamp = now + settings.timeLimitMinutes * 60 * 1000;
      const updatedLobby = await getLobby(roomId);

      io.to(`room:${roomId}`).emit('match:started', {
        lobby: updatedLobby,
        problems,
        startTimestamp: now,
        endTimestamp,
      });

      // Start match timer
      const timeoutMs = settings.timeLimitMinutes * 60 * 1000;
      const timer = setTimeout(async () => {
        matchTimers.delete(roomId);
        await updateLobbyStatus(roomId, 'COMPLETED');
        io.to(`room:${roomId}`).emit('match:ended', { message: 'Time is up!' });
      }, timeoutMs);
      matchTimers.set(roomId, timer);
    } catch (err) {
      console.error('[room:start-match]', err);
      socket.emit('room:error', { message: 'Failed to start match. Please try again.' });
    }
  });

  // ── match:typing ─────────────────────────────────────────────────────────
  // Forwards a typing indicator to the opponent (debounce is client-side).
  socket.on('match:typing', ({ roomId }: MatchTypingEvent) => {
    socket.to(`room:${roomId}`).emit('match:opponent-typing', { userId });
  });

  // ── match:test-update ────────────────────────────────────────────────────
  // Broadcasts real-time compilation/test progress to the opposing player.
  socket.on('match:test-update', (data: MatchTestUpdateEvent) => {
    if (!data.roomId) return;
    socket.to(`room:${data.roomId}`).emit('match:test-update', {
      userId,
      problemId: data.problemId,
      passedCount: data.passedCount,
      totalCount: data.totalCount,
      isAccepted: data.isAccepted,
    });
  });

  // ── disconnect ───────────────────────────────────────────────────────────
  // Graceful teardown: if host → start 60s migration timer before destroying.
  // If opponent → remove from lobby and notify host.
  socket.on('disconnect', async () => {
    const rooms = Array.from(socket.rooms).filter((r) => r.startsWith('room:'));

    for (const roomChannel of rooms) {
      const roomId = roomChannel.replace('room:', '');
      try {
        const lobby = await getLobby(roomId);
        if (!lobby) continue;

        if (lobby.hostId === userId) {
          // Notify opponent and start 60s grace timer
          io.to(roomChannel).emit('room:host-disconnected', { timeout: 60 });

          const timer = setTimeout(async () => {
            const current = await getLobby(roomId);
            if (!current) return;

            if (current.opponentId) {
              // Migrate host to opponent
              await migrateHost(roomId, current.opponentId);
              const migrated = await getLobby(roomId);
              io.to(roomChannel).emit('room:host-changed', {
                newHostId: current.opponentId,
                lobby: migrated,
              });
            } else {
              // No one left, destroy room
              await deleteLobby(roomId);
              io.to(roomChannel).emit('room:closed', { message: 'Host disconnected. Room closed.' });
              
              if (matchTimers.has(roomId)) {
                clearTimeout(matchTimers.get(roomId)!);
                matchTimers.delete(roomId);
              }
            }
            disconnectTimers.delete(roomId);
          }, 60_000);

          disconnectTimers.set(roomId, timer);
        } else if (lobby.opponentId === userId) {
          // Opponent left — clear their slot and notify host
          const updated = { ...lobby, opponentId: '' };
          io.to(roomChannel).emit('room:updated', { lobby: updated });
        }
      } catch (err) {
        console.error('[disconnect]', err);
      }
    }
  });
}
