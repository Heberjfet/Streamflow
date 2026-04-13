'use client';

import { UserNavbar } from '@/components/dashboard/UserNavbar';
import { UserSidebar } from '@/components/dashboard/UserSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <UserNavbar />
      <UserSidebar />
      <main className="ml-64 pt-16">
        {children}
      </main>
    </div>
  );
}
