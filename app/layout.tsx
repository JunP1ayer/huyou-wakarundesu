export const dynamic = 'force-dynamic';   // ビルド時の実行をスキップ
export const runtime = 'nodejs';          // Edge ではなく Node.js ランタイムで動かす

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GA_ID } from '@/lib/gtag';
import ServiceWorkerTracker from '@/components/analytics/ServiceWorkerTracker';
import CookieConsent from '@/components/privacy/CookieConsent';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorHandler';
import AuthProvider from '@/components/providers/AuthProvider';
import Header from '@/components/navigation/Header';
import { getServerSession } from '@/lib/supabase-server-session';
import Script from 'next/script';
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
        suppressHydrationWarning     // ← 追加：サーバ/クライアント class 差分を抑制
      >
        {/* Privacy-first Google Analytics with consent mode */}
        {GA_ID && (
          <>
            <Script
              id="gtag-base"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('consent', 'default', {
                    'analytics_storage': 'denied',
                    'ad_storage': 'denied',
                    'ad_user_data': 'denied',
                    'ad_personalization': 'denied'
                  });
                  gtag('config', '${GA_ID}', {
                    anonymize_ip: true,
                    allow_google_signals: false,
                    allow_ad_personalization_signals: false
                  });
                `,
              }}
            />
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
          </>
        )}
        <ServiceWorkerTracker />
        <GlobalErrorBoundary>
          <AuthProvider initialSession={initialSession}>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <CookieConsent />
          </AuthProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
