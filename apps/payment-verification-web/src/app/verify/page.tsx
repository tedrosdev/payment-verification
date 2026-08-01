'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { BatchDto, BankType, SubmissionResponseDto } from '@payment-verification/types';
import { CheckCircle2, Copy, Check, AlertCircle, RefreshCw, ShieldCheck, Ticket } from 'lucide-react';

export default function VerifyPaymentPage() {
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [bank, setBank] = useState<BankType>('CBE');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [participantPhone, setParticipantPhone] = useState('');
  const [participantName, setParticipantName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmissionResponseDto | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchApi<BatchDto[]>('/batches')
      .then((data) => {
        const active = data.filter((b) => b.status === 'ACTIVE');
        setBatches(active);
        if (active.length > 0) {
          setSelectedBatchId(active[0].id);
        }
      })
      .catch((err) => setError('Failed to load active batches'));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await fetchApi<SubmissionResponseDto>(`/batches/${selectedBatchId}/submissions`, {
        method: 'POST',
        body: JSON.stringify({
          bank,
          referenceNumber,
          participantPhone,
          participantName: participantName || undefined,
        }),
      });

      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Verification process encountered an error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTickets = () => {
    if (!result || !result.tickets.length) return;
    const codes = result.tickets.map((t) => t.code).join(', ');
    navigator.clipboard.writeText(codes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetForm = () => {
    setReferenceNumber('');
    setParticipantPhone('');
    setParticipantName('');
    setResult(null);
    setError('');
  };

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Payment Verification & Ticket Generator</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Enter customer payment details received over Telegram/WhatsApp/Imo to verify deposit and issue instant ticket codes.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
        {/* Verification Form */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
            Payment Submission
          </h2>

          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Active Giveaway Batch</label>
              <select
                className="form-select"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                required
              >
                {!batches.length && <option value="">No active batches found</option>}
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.ticketPrice} ETB / ticket)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bank Channel</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {(['CBE', 'TELEBIRR', 'BOA'] as BankType[]).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBank(b)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: `1px solid ${bank === b ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: bank === b ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: bank === b ? '#34D399' : 'var(--text-muted)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Transaction Reference Number</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. FT260731ABCD or 0911XXXXXX"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Participant Phone Number</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="0912345678"
                value={participantPhone}
                onChange={(e) => setParticipantPhone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Participant Name (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Customer Name"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedBatchId}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              {loading ? 'Verifying Deposit...' : 'Verify & Issue Tickets'}
            </button>
          </form>
        </div>

        {/* Verification Result Display */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={20} style={{ color: 'var(--accent-purple)' }} />
            Verification Output
          </h2>

          {!result && !loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-dim)', padding: '32px' }}>
              <CheckCircle2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontWeight: 600 }}>Awaiting Verification</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Submit a reference number to process and view instant tickets.</p>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={36} className="spin" style={{ marginBottom: '16px', color: 'var(--primary)' }} />
              <p style={{ fontWeight: 600 }}>Communicating with Bank Verification Network...</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Checking transaction settlement and deduplication rules</p>
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                background: result.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${result.status === 'VERIFIED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge badge-${result.status.toLowerCase()}`}>
                    {result.status}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{result.amount} ETB</span>
                </div>

                {result.rejectionReason && (
                  <p style={{ color: '#F87171', fontSize: '0.85rem', marginTop: '10px' }}>
                    <strong>Reason:</strong> {result.rejectionReason}
                  </p>
                )}
              </div>

              {result.status === 'VERIFIED' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Issued Tickets ({result.tickets.length})
                    </span>

                    <button onClick={handleCopyTickets} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                      {copied ? <Check size={14} style={{ color: 'var(--primary)' }} /> : <Copy size={14} />}
                      <span>{copied ? 'Copied Codes!' : 'Copy Ticket Codes'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {result.tickets.map((t) => (
                      <div key={t.id} className="ticket-chip" style={{ fontSize: '1.1rem', padding: '10px 16px' }}>
                        {t.code}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                <span>Ref: {result.referenceNumber}</span>
                <span>Phone: {result.participantPhone}</span>
              </div>

              <button onClick={handleResetForm} className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }}>
                Verify Another Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
