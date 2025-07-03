import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from 'nextjs-google-analytics';
import { GA_ID } from '@/lib/gtag';
import ServiceWorkerTracker from '@/components/analytics/ServiceWorkerTracker';
import ErrorBoundary from '@/components/ErrorBoundary';
import SupabaseProvider from '@/components/providers/SupabaseProvider';
import Header from '@/components/navigation/Header';
import { getServerSession } from '@/lib/supabase-server-session';
import "./globals.css";
import '@/lib/debugAuth';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "扶養わかるんです。",
  description: "扶養控除の計算とリアルタイム通知で年収管理をサポート",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "扶養わかる",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export function generateViewport() {
  return {
    themeColor: "#4f46e5",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch initial session on server for SSR with error handling
  let initialSession = null
  try {
    initialSession = await getServerSession()
  } catch (error) {
    console.error('🔴 SSR Session fetch failed, using null:', error)
    // Fall back to null - client will handle authentication
  }
  
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {GA_ID && <GoogleAnalytics trackPageViews />}
        <ServiceWorkerTracker />
        <ErrorBoundary>
          <SupabaseProvider initialSession={initialSession}>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
          </SupabaseProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
