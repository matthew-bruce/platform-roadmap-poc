import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technology Roadmap PoC',
  description: 'Executive north-star roadmap with drag-drop planning canvas'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
