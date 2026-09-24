'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentBrowseRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/problems');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
}
