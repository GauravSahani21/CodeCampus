'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCoursePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/instructor/problems');
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
}
