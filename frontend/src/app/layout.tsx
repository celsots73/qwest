import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'Qwest — Quizzes em Tempo Real',
  description: 'Plataforma gamificada de quizzes interativos ao vivo.',
  manifest: '/manifest.json',
  themeColor: '#6657FF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { background: '#131220', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
