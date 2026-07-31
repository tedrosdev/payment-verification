'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { DashboardStatsDto } from '@payment-verification/types';
import { ShieldCheck, Layers, Ticket, CheckCircle2, AlertTriangle, ArrowUpRight, Plus, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApi<DashboardStatsDto>('/dashboard/stats')
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>Verification Overview</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Monitor real-time payment verifications, batch statuses, and ticket allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/verify" className="btn btn-primary">
            <CheckCircle2 size={18} />
            <span>Verify New Payment</span>
          </Link>
          <Link href="/batches" className="btn btn-secondary">
            <Plus size={18} />
            <span>Create Batch</span>
          </Link>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '16px', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Batches</span>
            <Layers size={20} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
            {loading ? '...' : stats?.activeBatchesCount ?? 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Submissions</span>
            <ShieldCheck size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--text-main)' }}>
            {loading ? '...' : stats?.totalSubmissionsCount ?? 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Verified Submissions</span>
            <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--primary)' }}>
            {loading ? '...' : stats?.verifiedSubmissionsCount ?? 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tickets Issued</span>
            <Ticket size={20} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-purple)' }}>
            {loading ? '...' : stats?.totalTicketsIssuedCount ?? 0}
          </div>
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Recent Submissions Activity</h2>
          <Link href="/submissions" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ArrowUpRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading recent submissions...</div>
        ) : !stats?.recentSubmissions.length ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No payment submissions recorded yet. Click "Verify New Payment" to submit your first reference number.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Bank & Ref</th>
                <th>Participant</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Tickets Issued</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSubmissions.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{sub.referenceNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{sub.bank}</div>
                  </td>
                  <td>
                    <div>{sub.participantPhone}</div>
                    {sub.participantName && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.participantName}</div>}
                  </td>
                  <td style={{ fontWeight: 700 }}>{sub.amount} ETB</td>
                  <td>
                    <span className={`badge badge-${sub.status.toLowerCase()}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td>
                    {sub.tickets.length > 0 ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {sub.tickets.map((t) => (
                          <span key={t.id} className="ticket-chip" style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
                            {t.code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>None</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(sub.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
