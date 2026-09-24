'use client';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

const PROTECTED_PREFIXES = ['/problems/', '/versus', '/admin', '/instructor', '/student'];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadFromStorage, user, isLoading, isInitialized } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isInitialized) return;

    const isProtected = pathname === '/profile' || PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
    
    if (isProtected && !user && !isLoading) {
      const token = typeof window !== 'undefined'
        ? sessionStorage.getItem('cf_token')
        : null;
      if (!token && !pathname.startsWith('/auth')) {
        router.push('/auth/login');
      }
    }
  }, [user, isLoading, isInitialized, pathname, router]);

  return <>{children}</>;
}
