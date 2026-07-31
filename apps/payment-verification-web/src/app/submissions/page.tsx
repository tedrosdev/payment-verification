'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { SubmissionResponseDto, SubmissionStatus } from '@payment-verification/types';
import { ShieldCheck, Filter, Search, Copy, Check } from 'lucide-react';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadSubmissions = () => {
    setLoading(true);
    fetchApi<SubmissionResponseDto[]>('/submissions')
      .then((data) => setSubmissions(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const filtered = submissions.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      s.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.participantPhone.includes(searchTerm) ||
      (s.participantName && s.participantName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Payment Submissions Audit Log</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Historical record of all payment references processed through Verify.ET.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '44px' }}
            placeholder="Search by reference, phone, or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'VERIFIED', 'REJECTED', 'DUPLICATE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className="btn btn-secondary"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                background: statusFilter === st ? 'rgba(255, 255, 255, 0.15)' : undefined,
                borderColor: statusFilter === st ? 'var(--primary)' : undefined,
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '16px', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {/* Submissions Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading submissions audit log...
          </div>
        ) : !filtered.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No submissions matched your search criteria.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Bank & Ref</th>
                <th>Participant</th>
                <th>Amount</th>
                <th>Status & Details</th>
                <th>Issued Ticket Codes</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{s.referenceNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.bank}</div>
                  </td>
                  <td>
                    <div>{s.participantPhone}</div>
                    {s.participantName && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.participantName}</div>}
                  </td>
                  <td style={{ fontWeight: 800 }}>{s.amount} ETB</td>
                  <td>
                    <span className={`badge badge-${s.status.toLowerCase()}`}>
                      {s.status}
                    </span>
                    {s.rejectionReason && (
                      <div style={{ fontSize: '0.75rem', color: '#F87171', marginTop: '4px', maxWidth: '240px' }}>
                        {s.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td>
                    {s.tickets.length > 0 ? (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {s.tickets.map((t) => (
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
                    {new Date(s.createdAt).toLocaleString()}
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
