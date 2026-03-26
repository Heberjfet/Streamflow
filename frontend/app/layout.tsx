import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StreamFlow - AI Video Anthology Streaming',
  description: 'Plataforma de streaming autohospedada para antologías de video corto generadas por IA',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
