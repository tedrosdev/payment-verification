'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredToken } from '@/lib/api';
import { ShieldCheck } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/login') {
      setIsAuthenticated(true);
      return;
    }

    const token = getStoredToken();
    if (!token) {
      setIsAuthenticated(false);
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <ShieldCheck size={40} className="spin" style={{ marginBottom: '16px', color: 'var(--primary)' }} />
        <p style={{ fontWeight: 600 }}>Checking admin authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
