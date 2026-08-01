import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
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
        <AlertTriangle size={32} />
      </div>

      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '8px', maxWidth: '400px' }}>
        The requested page does not exist or has been moved.
      </p>

      <Link href="/" className="btn btn-primary" style={{ marginTop: '24px' }}>
        <ArrowLeft size={18} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
