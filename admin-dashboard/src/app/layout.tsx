import './globals.css';
import type { Metadata } from 'next';
import Sidebar from '@/components/Sidebar';
import QueryProvider from '@/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'CommuteShare Admin',
  description: 'Admin Dashboard for CommuteShare GH',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f172a] min-h-screen flex text-gray-100">
        <QueryProvider>
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen overflow-y-auto bg-[#0f172a]">
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
