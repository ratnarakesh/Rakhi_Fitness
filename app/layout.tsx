import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import BottomNav from '@/components/BottomNav';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { GlobalProvider } from '@/context/GlobalContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  applicationName: 'Rakhi Fitness',
  title: {
    default: 'Rakhi Fitness',
    template: '%s · Rakhi Fitness',
  },
  description:
    'High-performance dark-theme fitness tracker — training volume, body metrics, and strict dietary compliance.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rakhi Fitness',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-white antialiased">
        <GlobalProvider>
          <main className="mx-auto min-h-screen w-full max-w-md pb-24">
            {children}
          </main>
          <BottomNav />
        </GlobalProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
