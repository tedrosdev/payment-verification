import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'Payment Verification & Ticketing Admin',
  description: 'Admin tool for manual bank payment verification and instant ticket code generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>
          <Navigation />
          <main className="main-layout">{children}</main>
        </AuthGuard>
      </body>
    </html>
  );
}
