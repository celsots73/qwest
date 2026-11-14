'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

const qc = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore(s => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ping backend on load so Render wakes up before the user submits a form
    fetch(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000'}/health`).catch(() => {});
    hydrate().finally(() => setReady(true));
  }, []);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}
