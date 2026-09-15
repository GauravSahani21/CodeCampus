import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'CodeCampus — Code. Learn. Conquer.',
  description: 'A next-generation coding platform with a full online compiler, LeetCode-style challenges (full code, no stubs), structured learning hub, and GitHub-style streak tracking.',
  keywords: ['coding platform', 'online compiler', 'coding challenges', 'learn to code', 'programming'],
  openGraph: {
    title: 'CodeCampus',
    description: 'Code. Learn. Conquer.',
    type: 'website',
  },
};

import SmoothScroll from '@/components/Providers/SmoothScroll';
import AuthProvider from '@/components/Providers/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <SmoothScroll>
            <Navbar />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </SmoothScroll>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#21262d',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#39d353', secondary: '#000' } },
              error: { iconTheme: { primary: '#f85149', secondary: '#fff' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
