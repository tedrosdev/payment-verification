import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'Payment Verification & Ticketing Admin',
  description: 'Admin tool for manual payment verification via Verify.ET and instant ticket code generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="main-layout">{children}</main>
      </body>
    </html>
  );
}
