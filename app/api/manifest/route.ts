import { NextResponse } from 'next/server'

// Fallback API route to serve manifest.json
export async function GET() {
  const manifest = {
    name: "扶養わかるんです。",
    short_name: "扶養わかる",
    description: "扶養控除の計算とリアルタイム通知で年収管理をサポート",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5",
    orientation: "portrait-primary",
    scope: "/",
    lang: "ja",
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ],
    shortcuts: [
      {
        name: "ダッシュボード",
        short_name: "ダッシュボード",
        description: "収入状況をチェック",
        url: "/dashboard",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      },
      {
        name: "設定",
        short_name: "設定",
        description: "アプリ設定を変更",
        url: "/settings",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          }
        ]
      }
    ],
    categories: ["finance", "productivity"],
    prefer_related_applications: false
  }
  
  return new NextResponse(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}