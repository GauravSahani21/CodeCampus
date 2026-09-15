'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import InstructorSidebar from '@/components/Instructor/InstructorSidebar';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { user, loadFromStorage } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  // Role guard — uncomment when real auth is wired up
  // useEffect(() => {
  //   if (user && user.role !== 'instructor' && user.role !== 'admin') {
  //     router.push('/');
  //   }
  // }, [user]);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
      <InstructorSidebar />
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {(!user || (user.role !== 'instructor' && user.role !== 'admin')) && (
          <div
            style={{
              background: 'rgba(227, 179, 65, 0.1)',
              borderBottom: '1px solid rgba(227, 179, 65, 0.25)',
              padding: '10px 24px',
              fontSize: '0.84rem',
              color: 'var(--accent-yellow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={15} />
              <span>
                <strong>Instructor session required:</strong> Please sign in with an instructor account (<code>instructor@codecampus.com</code>) to save and publish problems.
              </span>
            </span>
            <a
              href="/auth/login"
              className="btn btn-sm btn-primary"
              style={{ padding: '4px 12px', fontSize: '0.78rem' }}
            >
              Sign In
            </a>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
