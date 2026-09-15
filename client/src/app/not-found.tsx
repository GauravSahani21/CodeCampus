import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 120px)',
      textAlign: 'center', padding: '40px 24px', gap: '20px',
      background: 'radial-gradient(ellipse at center, rgba(88,166,255,0.05) 0%, transparent 70%)',
    }}>
      <div style={{ fontSize: '5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', lineHeight: 1, background: 'linear-gradient(135deg, #58a6ff, #39d353)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        404
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--text-muted)', maxWidth: 400 }}>
        Looks like you ventured into uncharted code territory. This page doesn&apos;t exist.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <Link href="/" className="btn btn-primary">Go Home</Link>
        <Link href="/problems" className="btn btn-secondary">Browse Problems</Link>
      </div>
      <div style={{ marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 20px' }}>
        <span style={{ color: 'var(--accent-red)' }}>Error:</span> Route not found → <span style={{ color: 'var(--accent-blue)' }}>undefined</span>
      </div>
    </div>
  );
}
