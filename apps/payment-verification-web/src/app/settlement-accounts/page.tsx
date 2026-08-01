'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { SettlementAccountDto, BankType } from '@payment-verification/types';
import { CreditCard, Edit3, CheckCircle2, XCircle, HelpCircle, Save, X } from 'lucide-react';

export default function SettlementAccountsPage() {
  const [accounts, setAccounts] = useState<SettlementAccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAccount, setEditingAccount] = useState<Partial<SettlementAccountDto> | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAccounts = () => {
    setLoading(true);
    fetchApi<SettlementAccountDto[]>('/settlement-accounts')
      .then((data) => setAccounts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleOpenEdit = (acc?: SettlementAccountDto, defaultBank: BankType = 'CBE') => {
    if (acc) {
      setEditingAccount({ ...acc });
    } else {
      setEditingAccount({
        bank: defaultBank,
        accountNumber: '',
        accountSuffix: '',
        accountHolderName: '',
        isActive: true,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount || !editingAccount.bank) return;
    setSaving(true);
    setError('');

    try {
      await fetchApi<SettlementAccountDto>('/settlement-accounts', {
        method: 'POST',
        body: JSON.stringify({
          bank: editingAccount.bank,
          accountNumber: editingAccount.accountNumber,
          accountSuffix: editingAccount.accountSuffix || undefined,
          accountHolderName: editingAccount.accountHolderName || undefined,
          isActive: editingAccount.isActive ?? true,
        }),
      });

      setEditingAccount(null);
      loadAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to update settlement account');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (acc: SettlementAccountDto) => {
    try {
      await fetchApi(`/settlement-accounts/${acc.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !acc.isActive }),
      });
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const banks: BankType[] = ['CBE', 'TELEBIRR', 'BOA'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Settlement Account Configuration</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
          Configure bank merchant accounts and <code style={{ color: 'var(--primary)' }}>accountSuffix</code> rules used for payment verification matching.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#F87171', padding: '16px', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      {/* Info Card explaining Settlement Suffix Matching */}
      <div className="glass-panel" style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#34D399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={18} />
          Bank Settlement Suffix Matching Rules
        </h3>
        <ul style={{ color: 'var(--text-muted)', fontSize: '0.88rem', paddingLeft: '24px', lineHeight: 1.6 }}>
          <li><strong>CBE & BOA</strong>: Require <code style={{ color: '#34D399' }}>accountSuffix</code> (e.g., the last 4 digits of your account) to ensure customer transfers arrived at your exact merchant account.</li>
          <li><strong>Telebirr</strong>: Matches via phone number / reference; accountSuffix is optional.</li>
        </ul>
      </div>

      {/* Bank Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {banks.map((bank) => {
          const acc = accounts.find((a) => a.bank === bank);
          return (
            <div key={bank} className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: 'var(--primary)',
                  }}>
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{bank}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {bank === 'TELEBIRR' ? 'No suffix required' : 'Suffix matching active'}
                    </span>
                  </div>
                </div>

                {acc && (
                  <span className={`badge badge-${acc.isActive ? 'verified' : 'rejected'}`}>
                    {acc.isActive ? 'Active' : 'Disabled'}
                  </span>
                )}
              </div>

              {acc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Account Number</span>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>{acc.accountNumber}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Account Suffix</span>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{acc.accountSuffix || 'N/A'}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Holder Name</span>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{acc.accountHolderName || '-'}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', marginBottom: '20px' }}>
                  No settlement account configured for {bank} yet.
                </div>
              )}

              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleOpenEdit(acc, bank)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '10px' }}
                >
                  <Edit3 size={16} />
                  <span>{acc ? 'Edit Config' : 'Configure Account'}</span>
                </button>

                {acc && (
                  <button
                    onClick={() => handleToggleActive(acc)}
                    className="btn btn-secondary"
                    style={{ padding: '10px' }}
                  >
                    {acc.isActive ? <XCircle size={16} style={{ color: '#F87171' }} /> : <CheckCircle2 size={16} style={{ color: '#34D399' }} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {editingAccount && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Configure {editingAccount.bank} Account</h2>
              <button onClick={() => setEditingAccount(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Bank</label>
                <input type="text" disabled className="form-input" value={editingAccount.bank} />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. 1000123456789 or 0911XXXXXX"
                  value={editingAccount.accountNumber || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Suffix (e.g. Last 4 Digits for CBE/BOA)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 6789"
                  value={editingAccount.accountSuffix || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountSuffix: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Used for <code style={{ color: 'var(--primary)' }}>accountSuffix</code> settlement verification.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Account Holder Name (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Merchant Company Name"
                  value={editingAccount.accountHolderName || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountHolderName: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditingAccount(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  <Save size={16} />
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
