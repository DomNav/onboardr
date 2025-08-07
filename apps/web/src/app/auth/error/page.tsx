'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthError() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main app after a brief delay
    setTimeout(() => {
      router.push('/soro');
    }, 100);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p>Redirecting...</p>
      </div>
    </div>
  );
}