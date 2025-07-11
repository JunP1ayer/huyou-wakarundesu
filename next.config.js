/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  sw: 'sw-custom.js',
  disable: process.env.NODE_ENV === 'development'
})

const nextConfig = {
  // React設定
  reactStrictMode: true,
  
  // 実験的機能
  experimental: {
    // Turbopack設定（旧turbo設定から移行）
    turbopack: {
      resolveAlias: {
        canvas: './empty-module.js',
      },
    }
  },

  // ビルド設定
  swcMinify: true,
  
  // 環境変数
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // 画像最適化
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google OAuth profile images
      'zbsjqsqytjjlbpchpacl.supabase.co', // Supabase storage
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // 認証コールバック用のCSP調整
        source: '/auth/callback',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-inline'; object-src 'none';",
          },
        ],
      },
    ]
  },

  // CORS設定（認証フロー用）
  async rewrites() {
    return [
      // Supabase認証フロー用のリライト
      {
        source: '/auth/:path*',
        destination: '/auth/:path*',
      },
    ]
  },

  // リダイレクト設定
  async redirects() {
    return [
      // ルートへのリダイレクト設定
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      // 認証エラー時のリダイレクト
      {
        source: '/auth/error',
        destination: '/login?error=auth_error',
        permanent: false,
      },
    ]
  },

  // Webpack設定
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Canvas.jsの問題解決
    config.resolve.alias.canvas = false
    
    // source-map-loader の警告を抑制
    config.module.rules.push({
      test: /\.js$/,
      enforce: 'pre',
      use: ['source-map-loader'],
      exclude: /node_modules/,
    })

    // dotenv対応
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      })
    )

    return config
  },

  // TypeScript設定
  typescript: {
    // 本番ビルド時にTypeScriptエラーを無視（CIで別途チェック）
    ignoreBuildErrors: false,
  },

  // ESLint設定
  eslint: {
    // 本番ビルド時にESLintエラーを無視（CIで別途チェック）
    ignoreDuringBuilds: false,
  },

  // 出力設定
  output: 'standalone',
  
  // トレース設定
  outputFileTracing: true,
}

module.exports = withPWA(nextConfig)