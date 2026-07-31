'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled App Error:', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#F87171',
        marginBottom: '20px',
      }}>
        <AlertCircle size={32} />
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Something went wrong!</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '8px', maxWidth: '440px', fontSize: '0.9rem' }}>
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>

      <button onClick={() => reset()} className="btn btn-primary" style={{ marginTop: '24px' }}>
        <RefreshCw size={16} />
        <span>Try Again</span>
      </button>
    </div>
  );
}
