'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearStoredToken } from '@/lib/api';
import { ShieldCheck, LayoutDashboard, Layers, CheckCircle2, Ticket, CreditCard, Terminal, LogOut } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const handleLogout = () => {
    clearStoredToken();
    router.push('/login');
  };

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/verify', label: 'Verify Payment', icon: CheckCircle2 },
    { href: '/batches', label: 'Batches', icon: Layers },
    { href: '/settlement-accounts', label: 'Settlement Config', icon: CreditCard },
    { href: '/submissions', label: 'Submissions', icon: ShieldCheck },
    { href: '/api-logs', label: 'API Logs', icon: Terminal },
    { href: '/tickets', label: 'Tickets', icon: Ticket },
  ];

  return (
    <header className="app-header">
      <div className="brand-logo">
        <div className="brand-icon">
          <ShieldCheck size={22} />
        </div>
        <span>Verify.ET Ticketing</span>
      </div>

      <nav className="nav-links">
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

      <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </header>
  );
}
