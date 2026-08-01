'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi, setStoredToken } from '@/lib/api';
import { AuthResponse } from '@payment-verification/types';
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@verify.et');
  const [password, setPassword] = useState('AdminPass123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setStoredToken(res.accessToken);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      width: '100%',
      padding: '20px',
      background: '#090D16',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        borderRadius: '20px',
        background: 'rgba(17, 24, 39, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.1)',
        backdropFilter: 'blur(16px)',
        color: '#F9FAFB',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#FFFFFF',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
          }}>
            <ShieldCheck size={36} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#F9FAFB', letterSpacing: '-0.02em', margin: 0 }}>
            Payment Verification & Ticketing
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '8px' }}>
            Sign in to access admin verification console
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#F87171',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            marginBottom: '24px',
            lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9CA3AF' }}>Email Address</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', color: '#6B7280', pointerEvents: 'none' }} />
              <input
                type="email"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  background: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#F9FAFB',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@verify.et"
              />
            </div>
          </div>

          {/* Password input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9CA3AF' }}>Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', color: '#6B7280', pointerEvents: 'none' }} />
              <input
                type="password"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  background: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#F9FAFB',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '1rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            {!loading && <ArrowRight size={20} />}
          </button>
        </form>

        {/* Credentials Footer */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#9CA3AF',
        }}>
          Default seed credentials: <code style={{ color: '#34D399', fontWeight: 700 }}>admin@verify.et</code> / <code style={{ color: '#34D399', fontWeight: 700 }}>AdminPass123!</code>
        </div>
      </div>
    </div>
  );
}
