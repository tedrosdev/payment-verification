'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { TicketDto, BatchDto } from '@payment-verification/types';
import { Ticket, Search, Copy, Check } from 'lucide-react';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchApi<TicketDto[]>('/tickets'),
      fetchApi<BatchDto[]>('/batches'),
    ])
      .then(([tData, bData]) => {
        setTickets(tData);
        setBatches(bData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filtered = tickets.filter((t) => {
    const matchesBatch = selectedBatchId === 'ALL' || t.batchId === selectedBatchId;
    const matchesSearch =
      !searchTerm ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.participantPhone.includes(searchTerm) ||
      (t.participantName && t.participantName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesBatch && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Ticket Code Ledger</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          View and export generated ticket codes for giveaway draws and customer relay.
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
            placeholder="Search by ticket code or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '200px' }}
          value={selectedBatchId}
          onChange={(e) => setSelectedBatchId(e.target.value)}
        >
          <option value="ALL">All Batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '16px', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {/* Tickets Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading tickets ledger...
          </div>
        ) : !filtered.length ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No tickets found for current filters.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket Code</th>
                <th>Ticket #</th>
                <th>Participant Phone</th>
                <th>Participant Name</th>
                <th>Issued At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="ticket-chip" style={{ fontSize: '1rem', padding: '4px 12px' }}>
                      {t.code}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{t.ticketNumber}</td>
                  <td style={{ fontWeight: 600 }}>{t.participantPhone}</td>
                  <td>{t.participantName || <span style={{ color: 'var(--text-dim)' }}>-</span>}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <button
                      onClick={() => handleCopyCode(t.code)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      {copiedCode === t.code ? <Check size={14} style={{ color: 'var(--primary)' }} /> : <Copy size={14} />}
                      <span>{copiedCode === t.code ? 'Copied!' : 'Copy'}</span>
                    </button>
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
