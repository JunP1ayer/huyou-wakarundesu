#!/usr/bin/env node

/**
 * Supabase & Google OAuth 設定検証スクリプト
 * 認証周りの設定ミスを事前に検出する
 */

const fs = require('fs')
const path = require('path')

// .env ファイルを読み込み
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
  require('dotenv').config({ path: path.join(process.cwd(), '.env') })
} catch (error) {
  // dotenvがインストールされていない場合は無視
  console.log('dotenv not installed, reading environment variables from process.env only')
}

// カラーコードの定義
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('')
  log('cyan', `${'='.repeat(60)}`)
  log('bright', `🔍 ${title}`)
  log('cyan', `${'='.repeat(60)}`)
}

function checkEnvironmentVariable(name, required = true, description = '') {
  const value = process.env[name]
  const exists = !!value
  
  console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? `${value.substring(0, 20)}...` : 'NOT SET'}`)
  if (description) {
    console.log(`     ${description}`)
  }
  
  if (required && !exists) {
    log('red', `     ⚠️  必須の環境変数が設定されていません`)
    return false
  }
  
  return exists
}

function validateSupabaseUrl(url) {
  if (!url) return false
  
  try {
    const parsed = new URL(url)
    return parsed.hostname.includes('supabase') && parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function validateRedirectUrls() {
  logSection('リダイレクトURL検証')
  
  const baseUrls = [
    'http://localhost:3000',
    'https://huyou-wakarundesu.vercel.app',
    'https://huyou-wakarundesu-*.vercel.app'
  ]
  
  console.log('設定すべきSupabaseリダイレクトURL:')
  baseUrls.forEach(baseUrl => {
    console.log(`  📍 ${baseUrl}/auth/callback`)
  })
  
  console.log('')
  log('yellow', '⚠️  これらのURLがSupabaseダッシュボードの「Authentication > URL Configuration」に設定されていることを確認してください')
}

function checkGoogleOAuthConfig() {
  logSection('Google OAuth設定確認')
  
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  
  checkEnvironmentVariable('NEXT_PUBLIC_GOOGLE_CLIENT_ID', true, 'Google OAuth Client ID (public)')
  checkEnvironmentVariable('GOOGLE_CLIENT_SECRET', true, 'Google OAuth Client Secret (private)')
  
  if (clientId) {
    console.log('  📋 Google OAuth設定確認項目:')
    console.log('     • Authorized JavaScript origins: http://localhost:3000, https://your-domain.vercel.app')
    console.log('     • Authorized redirect URIs: https://your-supabase-project.supabase.co/auth/v1/callback')
  }
}

function checkSupabaseConfig() {
  logSection('Supabase設定確認')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  const urlValid = checkEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL', true, 'Supabase Project URL')
  checkEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY', true, 'Supabase Anonymous Key')
  checkEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY', false, 'Supabase Service Role Key (optional)')
  
  if (supabaseUrl && !validateSupabaseUrl(supabaseUrl)) {
    log('red', '  ❌ Supabase URLの形式が正しくありません')
    console.log('     正しい形式: https://your-project.supabase.co')
  }
  
  if (supabaseAnonKey) {
    console.log(`  🔑 Anon Key長: ${supabaseAnonKey.length} 文字`)
    if (supabaseAnonKey.length < 100) {
      log('yellow', '  ⚠️  Anonymous Keyが短すぎる可能性があります')
    }
  }
}

function checkNextjsConfig() {
  logSection('Next.js設定確認')
  
  // next.config.js の確認
  const nextConfigPath = path.join(process.cwd(), 'next.config.js')
  const nextConfigMjsPath = path.join(process.cwd(), 'next.config.mjs')
  
  let hasNextConfig = false
  if (fs.existsSync(nextConfigPath)) {
    console.log('  ✅ next.config.js が存在')
    hasNextConfig = true
  } else if (fs.existsSync(nextConfigMjsPath)) {
    console.log('  ✅ next.config.mjs が存在')
    hasNextConfig = true
  } else {
    console.log('  ❌ next.config.js/mjs が見つかりません')
  }
  
  // .env ファイルの確認
  const envFiles = ['.env.local', '.env.production', '.env']
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file} が存在`)
    } else {
      console.log(`  ❌ ${file} が見つかりません`)
    }
  })
}

function checkVercelConfig() {
  logSection('Vercel設定確認')
  
  console.log('  📋 Vercel環境変数確認項目:')
  console.log('     • NEXT_PUBLIC_SUPABASE_URL')
  console.log('     • NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('     • NEXT_PUBLIC_GOOGLE_CLIENT_ID') 
  console.log('     • GOOGLE_CLIENT_SECRET')
  console.log('     • SUPABASE_SERVICE_ROLE_KEY (optional)')
  
  console.log('')
  log('blue', '💡 Vercel環境変数設定方法:')
  console.log('   1. Vercelダッシュボード → プロジェクト選択')
  console.log('   2. Settings → Environment Variables')
  console.log('   3. 上記の環境変数を追加')
  console.log('   4. Production, Preview, Development の全てにチェック')
}

function generateDiagnosticInfo() {
  logSection('診断情報')
  
  console.log('  📊 実行環境:')
  console.log(`     • Node.js: ${process.version}`)
  console.log(`     • Platform: ${process.platform}`)
  console.log(`     • PWD: ${process.cwd()}`)
  console.log(`     • NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`)
  console.log(`     • VERCEL_ENV: ${process.env.VERCEL_ENV || 'undefined'}`)
  
  console.log('')
  console.log('  🔗 有用なリンク:')
  console.log('     • Supabase Dashboard: https://supabase.com/dashboard')
  console.log('     • Google Cloud Console: https://console.cloud.google.com/')
  console.log('     • Vercel Dashboard: https://vercel.com/dashboard')
}

function main() {
  log('bright', '🚀 Supabase & Google OAuth 設定検証スクリプト')
  log('blue', 'huyou-wakarundesu プロジェクト認証設定を確認しています...')
  
  // 基本設定確認
  checkSupabaseConfig()
  checkGoogleOAuthConfig()
  validateRedirectUrls()
  checkNextjsConfig()
  checkVercelConfig()
  generateDiagnosticInfo()
  
  // 最終レポート
  logSection('検証完了')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ]
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length === 0) {
    log('green', '✅ すべての必須環境変数が設定されています！')
    log('green', '✅ 次のステップ: Supabase/Google Cloud Console での設定確認')
  } else {
    log('red', `❌ ${missingVars.length} 個の必須環境変数が不足しています:`)
    missingVars.forEach(varName => {
      console.log(`     • ${varName}`)
    })
  }
  
  console.log('')
  log('cyan', '📚 詳細なドキュメント: ./SUPABASE_REDIRECT_URLS.md')
  console.log('')
}

if (require.main === module) {
  main()
}

module.exports = { 
  checkSupabaseConfig, 
  checkGoogleOAuthConfig, 
  validateRedirectUrls,
  main 
}