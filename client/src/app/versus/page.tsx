'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useVersusStore } from '@/store/useVersusStore';
import { useAuthStore } from '@/store/authStore';
import styles from './versus.module.css';

export default function VersusLandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { socket, connected, roomId, lobby, error, connectSocket, createRoom, joinRoom, clearError } =
    useVersusStore();

  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Connect socket on mount
  useEffect(() => {
    connectSocket();
  }, []);

  // Navigate to room once created or joined
  useEffect(() => {
    if (roomId && lobby) {
      router.push(`/versus/${roomId}`);
    }
  }, [roomId, lobby, router]);

  const handleCreate = () => {
    if (!connected) return;
    setCreating(true);
    createRoom(undefined, user?.username);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !connected) return;
    setJoining(true);
    joinRoom(joinCode.trim().toUpperCase(), user?.username);
  };

  // Reset loading state on error
  useEffect(() => {
    if (error) {
      setCreating(false);
      setJoining(false);
    }
  }, [error]);

  return (
    <div className={styles.landingPage}>
      {/* Background orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.landingContainer}>
        <div className={styles.landingHeader}>
          <div className={styles.vsBadge}>Versus Mode</div>
          <h1 className={styles.landingTitle}>
            Challenge a friend to a{' '}
            <span className="gradient-text">Coding Duel</span>
          </h1>
          <p className={styles.landingSubtitle}>
            Real-time 1v1 competitive coding. Race against your opponent to solve the problem first!
          </p>
        </div>

        {!user && (
          <div className={styles.authBanner}>
            <span>You need to be logged in to track scores.</span>
            <Link href="/auth/login" className="btn btn-primary btn-sm">
              Login
            </Link>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner} onClick={clearError}>
            <span>{error}</span>
            <button className={styles.errorDismiss} aria-label="Dismiss error">
              <X size={14} />
            </button>
          </div>
        )}

        <div className={styles.landingCards}>
          {/* Create Room */}
          <div className={styles.modeCard}>
            <div className={styles.modeIcon}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 8v8M8 12h8"/></svg></div>
            <h2>Create a Room</h2>
            <p>Set up a 1v1 duel. Choose difficulty and time limit. The first player to solve wins!</p>
            <button
              className={`btn btn-primary ${styles.modeBtn}`}
              onClick={handleCreate}
              disabled={!connected || creating}
              id="create-room-btn"
            >
              {creating ? (
                <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating…</>
              ) : (
                'Create Room'
              )}
            </button>
            {!connected && (
              <span className={styles.connectingHint}>Connecting to server…</span>
            )}
          </div>

          {/* Divider */}
          <div className={styles.orDivider}>
            <div className={styles.orLine} />
            <span>OR</span>
            <div className={styles.orLine} />
          </div>

          {/* Join Room */}
          <div className={styles.modeCard}>
            <div className={styles.modeIcon}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
            <h2>Join a Room</h2>
            <p>Got an invite code? Enter it below to jump directly into your opponent's lobby.</p>
            <form onSubmit={handleJoin} className={styles.joinForm} id="join-room-form">
              <input
                className={`input ${styles.codeInput}`}
                placeholder="Enter room code (e.g. A3F9B2C1)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                id="join-code-input"
              />
              <button
                type="submit"
                className={`btn btn-blue ${styles.modeBtn}`}
                disabled={!connected || !joinCode.trim() || joining}
                id="join-room-btn"
              >
                {joining ? (
                  <><div className="spinner" style={{ width: 16, height: 16 }} /> Joining…</>
                ) : (
                  'Join Room'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* How it works */}
        <div className={styles.howItWorks}>
          <h3>How it works</h3>
          <div className={styles.steps}>
            {[
              { num: '1', text: 'Create a room & share the code' },
              { num: '2', text: 'Configure difficulty & problem count' },
              { num: '3', text: 'Host starts — solve problems faster than your opponent' },
              { num: '4', text: 'Watch live progress as they code' },
            ].map((s) => (
              <div key={s.num} className={styles.step}>
                <div className={styles.stepNum}>{s.num}</div>
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
