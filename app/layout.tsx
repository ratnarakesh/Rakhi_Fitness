import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';
import BottomNav from '@/components/BottomNav';
import ReminderScheduler from '@/components/ReminderScheduler';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { AuthProvider } from '@/context/AuthContext';
import { GlobalProvider } from '@/context/GlobalContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rakhi-fitness.pages.dev'),
  applicationName: 'Rakhi Fitness',
  title: {
    default: 'Rakhi Fitness',
    template: '%s · Rakhi Fitness',
  },
  description:
    'Track. Train. Transform. Your all-in-one gym companion — log workouts with live muscle maps, follow a personalised weekly plan, and track bodyweight, supplements, water and progress. Fast, free, and works offline.',
  keywords: [
    'fitness',
    'gym',
    'workout tracker',
    'training volume',
    'muscle map',
    'weekly plan',
    'supplement tracker',
    'progress',
    'PWA',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Rakhi Fitness',
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Rakhi Fitness',
    title: 'Rakhi Fitness',
    description:
      'Track. Train. Transform. 💪 Workouts with live muscle maps, a weekly plan, plus bodyweight, supplements, alcohol & progress tracking — your free fitness PWA.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Rakhi Fitness' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rakhi Fitness',
    description:
      'Track. Train. Transform. 💪 Workouts with live muscle maps, a weekly plan, plus bodyweight, supplements, alcohol & progress tracking — your free fitness PWA.',
    images: ['/og.png'],
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
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans text-white antialiased"
        suppressHydrationWarning
      >
        <AuthProvider>
          <GlobalProvider>
            <main className="mx-auto min-h-screen w-full max-w-md pb-24">
              {children}
            </main>
            <BottomNav />
            <ReminderScheduler />
          </GlobalProvider>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
