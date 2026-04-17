import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'StreamFlow - AI Video Anthology Streaming',
  description: 'Plataforma de streaming autohospedada para antologías de video corto generadas por IA',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${outfit.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
