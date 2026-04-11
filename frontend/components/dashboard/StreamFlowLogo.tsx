'use client';

import Link from 'next/link';

export function StreamFlowLogo() {
  return (
    <Link 
      href="/dashboard" 
      className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight hover:opacity-80 transition-opacity"
    >
      StreamFlow
    </Link>
  );
}
