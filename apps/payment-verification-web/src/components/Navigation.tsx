'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredToken } from '@/lib/api';
import {
  ShieldCheck,
  LayoutDashboard,
  Layers,
  CheckCircle2,
  Ticket,
  CreditCard,
  Terminal,
  LogOut,
  Menu,
  X,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (pathname === '/login') return null;

  const handleLogout = () => {
    clearStoredToken();
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/verify', label: 'Verify Payment', icon: CheckCircle2 },
    { href: '/batches', label: 'Batches', icon: Layers },
    { href: '/submissions', label: 'Submissions', icon: ShieldCheck },
    { href: '/tickets', label: 'Tickets', icon: Ticket },
    { href: '/settlement-accounts', label: 'Settlement Config', icon: CreditCard },
    { href: '/api-logs', label: 'API Audit Logs', icon: Terminal },
  ];

  const primaryMobileTabs = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/verify', label: 'Verify', icon: CheckCircle2 },
    { href: '/batches', label: 'Batches', icon: Layers },
    { href: '/submissions', label: 'Submissions', icon: ShieldCheck },
  ];

  const secondaryMobileTabs = [
    { href: '/tickets', label: 'Tickets', icon: Ticket, desc: 'Search and inspect issued ticket codes' },
    { href: '/settlement-accounts', label: 'Settlement Config', icon: CreditCard, desc: 'Manage merchant bank account suffixes' },
    { href: '/api-logs', label: 'API Audit Logs', icon: Terminal, desc: 'View raw API requests and responses' },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="app-header">
        <Link href="/" className="brand-logo">
          <div className="brand-icon">
            <ShieldCheck size={22} />
          </div>
          <span className="brand-title">Payment Verification</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-links desktop-only">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleLogout}
            className="btn btn-secondary desktop-only"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-only-btn"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Action Sheet Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-handle-bar" />

            <div className="mobile-drawer-header">
              <div className="brand-logo">
                <div className="brand-icon">
                  <ShieldCheck size={20} />
                </div>
                <span>More Admin Actions</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="icon-btn" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div className="mobile-drawer-nav">
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Additional Tools
              </div>

              {secondaryMobileTabs.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} style={{ color: isActive ? 'var(--primary)' : 'var(--text-muted)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isActive ? '#34D399' : 'var(--text-main)' }}>{item.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{item.desc}</div>
                    </div>
                    <ChevronRight size={18} style={{ color: 'var(--text-dim)' }} />
                  </Link>
                );
              })}
            </div>

            <div className="mobile-drawer-footer">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="btn btn-secondary"
                style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#F87171' }}
              >
                <LogOut size={18} />
                <span>Logout Admin Console</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick-Access Bar */}
      <nav className="mobile-bottom-nav">
        {primaryMobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`mobile-tab-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`mobile-tab-item ${mobileMenuOpen || secondaryMobileTabs.some(t => pathname === t.href) ? 'active' : ''}`}
          type="button"
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
