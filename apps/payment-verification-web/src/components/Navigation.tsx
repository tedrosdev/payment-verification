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

      {/* Mobile Slide-Over Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-logo">
                <div className="brand-icon">
                  <ShieldCheck size={20} />
                </div>
                <span>Navigation Menu</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <nav className="mobile-drawer-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-drawer-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mobile-drawer-footer">
              <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%' }}>
                <LogOut size={18} />
                <span>Logout Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Quick-Access Bar (Fixed on Mobile Phones) */}
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
          className={`mobile-tab-item ${mobileMenuOpen ? 'active' : ''}`}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
