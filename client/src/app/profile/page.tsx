'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isInitialized, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isInitialized) return;

    if (user?.username) {
      router.replace(`/profile/${user.username}`);
    } else {
      router.replace('/auth/login');
    }
  }, [user, isInitialized, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );
}
