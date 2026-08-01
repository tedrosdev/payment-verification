'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { SubmissionResponseDto, SubmissionStatus } from '@payment-verification/types';
import { Terminal, Code, RefreshCw, X, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, Search } from 'lucide-react';

interface ExtendedSubmissionDto extends SubmissionResponseDto {
  verifyEtRawResponse?: any;
}

export default function ApiLogsPage() {
  const [logs, setLogs] = useState<ExtendedSubmissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<ExtendedSubmissionDto | null>(null);

  const loadLogs = () => {
    setLoading(true);
    fetchApi<ExtendedSubmissionDto[]>('/submissions')
      .then((data) => setLogs(data))
      .catch((err) => setError(err.message || 'Failed to fetch API logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = filterStatus === 'ALL' || log.status === filterStatus;
    const matchesSearch =
      log.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.participantPhone && log.participantPhone.includes(searchTerm)) ||
      (log.verifyEtRequestId && log.verifyEtRequestId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const verifiedCount = logs.filter((l) => l.status === 'VERIFIED').length;
  const rejectedCount = logs.filter((l) => l.status === 'REJECTED').length;
  const duplicateCount = logs.filter((l) => l.status === 'DUPLICATE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={28} style={{ color: 'var(--primary)' }} />
            Bank Verification API Audit Logs
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Inspect full outgoing deposit verification requests and raw incoming responses.
          </p>
        </div>

        <button onClick={loadLogs} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '16px', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Total API Requests</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '8px' }}>{logs.length}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Verified (200 OK)</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34D399', marginTop: '8px' }}>{verifiedCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Rejected / Errors</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F87171', marginTop: '8px' }}>{rejectedCount}</div>
        </div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Duplicates</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FBBF24', marginTop: '8px' }}>{duplicateCount}</div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'VERIFIED', 'REJECTED', 'DUPLICATE'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className="btn btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                borderColor: filterStatus === st ? 'var(--primary)' : 'var(--border-color)',
                color: filterStatus === st ? 'var(--primary)' : 'var(--text-muted)',
                background: filterStatus === st ? 'rgba(16, 185, 129, 0.15)' : undefined,
              }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: '12px', fontSize: '0.85rem' }}
            placeholder="Search reference, bank, request ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Bank</th>
              <th>Reference Number</th>
              <th>Status</th>
              <th>Deposited Amount</th>
              <th>Verification Request ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  No API request logs found matching criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{log.bank}</span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>{log.referenceNumber}</code>
                  </td>
                  <td>
                    <span className={`badge badge-${log.status.toLowerCase()}`}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{log.amount} ETB</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    {log.verifyEtRequestId || '-'}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      <Code size={14} />
                      <span>Inspect Payload</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Raw Payload Inspector Modal */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Code size={22} style={{ color: 'var(--primary)' }} />
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Verification Request & Response Payload</h2>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Ref: {selectedLog.referenceNumber} | Bank: {selectedLog.bank}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedLog.rejectionReason && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '14px', borderRadius: '10px', fontSize: '0.85rem' }}>
                  <strong>Rejection / Error Message:</strong>
                  <div style={{ marginTop: '4px' }}>{selectedLog.rejectionReason}</div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  API Endpoint URL & Method
                </h4>
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#34D399' }}>
                  POST /api/verify
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Raw Verification Response Body (JSON)
                </h4>
                <pre style={{
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  color: 'var(--text-main)',
                  overflowX: 'auto',
                  maxHeight: '300px',
                }}>
                  {JSON.stringify(selectedLog.verifyEtRawResponse || { note: 'No raw payload recorded for this request' }, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} className="btn btn-secondary">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
