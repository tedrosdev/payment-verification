'use client';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { BatchDto, BatchStatus } from '@payment-verification/types';
import { Layers, Plus, Ticket, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  // New batch form state
  const [name, setName] = useState('');
  const [ticketPrice, setTicketPrice] = useState('100');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const loadBatches = () => {
    setLoading(true);
    fetchApi<BatchDto[]>('/batches')
      .then((data) => setBatches(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      await fetchApi<BatchDto>('/batches', {
        method: 'POST',
        body: JSON.stringify({
          name,
          ticketPrice: parseFloat(ticketPrice),
          description,
        }),
      });

      setShowModal(false);
      setName('');
      setDescription('');
      loadBatches();
    } catch (err: any) {
      setError(err.message || 'Failed to create batch');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (batchId: string, currentStatus: BatchStatus) => {
    const nextStatus: BatchStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      await fetchApi(`/batches/${batchId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadBatches();
    } catch (err: any) {
      alert(err.message || 'Failed to update batch status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Giveaway Batches</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Manage active promotion campaign batches and ticket pricing tiers.
          </p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>Create New Batch</span>
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '16px', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {/* Batches Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading batches...
          </div>
        ) : !batches.length ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No batches created yet. Click "Create New Batch" to get started.
          </div>
        ) : (
          batches.map((batch) => (
            <div key={batch.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{batch.name}</h3>
                <span className={`badge badge-${batch.status === 'ACTIVE' ? 'active' : 'rejected'}`}>
                  {batch.status}
                </span>
              </div>

              {batch.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>{batch.description}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(0, 0, 0, 0.2)', padding: '12px', borderRadius: '10px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ticket Price</span>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{batch.ticketPrice} ETB</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Tickets Issued</span>
                  <div style={{ fontWeight: 800, color: 'var(--accent-purple)', fontSize: '1.1rem' }}>{batch.totalTicketsIssued ?? 0}</div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Created {new Date(batch.createdAt).toLocaleDateString()}
                </span>

                <button
                  onClick={() => handleToggleStatus(batch.id, batch.status)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Set as {batch.status === 'ACTIVE' ? 'Closed' : 'Active'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Creating New Batch */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>Create New Batch</h2>

            <form onSubmit={handleCreateBatch}>
              <div className="form-group">
                <label className="form-label">Batch Campaign Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Summer Festival 2026 Batch 1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ticket Price (ETB per Ticket)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="form-input"
                  placeholder="100"
                  value={ticketPrice}
                  onChange={(e) => setTicketPrice(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'vertical' }}
                  placeholder="Optional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Creating...' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
