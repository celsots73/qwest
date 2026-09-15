import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Qwest — Quizzes em Tempo Real',
  description: 'Plataforma gamificada de quizzes interativos ao vivo.',
  manifest: '/manifest.json',
  themeColor: '#9333ea',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#1f2937', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
