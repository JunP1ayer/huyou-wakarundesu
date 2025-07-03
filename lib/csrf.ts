/**
 * CSRF（Cross-Site Request Forgery）保護機能
 * トークンベースのCSRF攻撃防止システム
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// CSRF設定
const CSRF_CONFIG = {
  tokenName: 'csrf-token',
  headerName: 'x-csrf-token',
  cookieName: '_csrf',
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 60 * 60 * 24, // 24時間
    path: '/'
  }
} as const

/**
 * 暗号学的に安全なランダムトークン生成
 */
export function generateCSRFToken(): string {
  // Web Crypto API を使用して安全なランダム値を生成
  const array = new Uint8Array(CSRF_CONFIG.tokenLength)
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else if (typeof require !== 'undefined') {
    // Node.js環境（SSR時）
    const nodeCrypto = require('crypto')
    const buffer = nodeCrypto.randomBytes(CSRF_CONFIG.tokenLength)
    array.set(buffer)
  } else {
    // フォールバック（推奨されない）
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  
  // Base64URL エンコード（URL安全）
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * CSRFトークンをCookieに設定
 */
export async function setCSRFCookie(response: NextResponse, token?: string): Promise<string> {
  const csrfToken = token || generateCSRFToken()
  
  // HTTP-Onlyクッキーとして設定
  response.cookies.set(CSRF_CONFIG.cookieName, csrfToken, CSRF_CONFIG.cookieOptions)
  
  return csrfToken
}

/**
 * リクエストからCSRFトークンを取得
 */
export function getCSRFTokenFromRequest(request: NextRequest): {
  headerToken: string | null
  cookieToken: string | null
} {
  const headerToken = request.headers.get(CSRF_CONFIG.headerName)
  const cookieToken = request.cookies.get(CSRF_CONFIG.cookieName)?.value || null
  
  return { headerToken, cookieToken }
}

/**
 * Server Component用のCSRFトークン取得
 */
export async function getCSRFTokenForServer(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(CSRF_CONFIG.cookieName)?.value || null
  } catch (error) {
    console.warn('🟡 CSRF token retrieval failed:', error)
    return null
  }
}

/**
 * CSRFトークンの検証
 */
export function validateCSRFToken(headerToken: string | null, cookieToken: string | null): boolean {
  // 両方のトークンが存在することを確認
  if (!headerToken || !cookieToken) {
    return false
  }
  
  // トークンの長さチェック
  if (headerToken.length < 16 || cookieToken.length < 16) {
    return false
  }
  
  // 単純な文字列比較（タイミング攻撃を防ぐため定数時間比較を推奨）
  return constantTimeCompare(headerToken, cookieToken)
}

/**
 * 定数時間文字列比較（タイミング攻撃防止）
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * CSRFミドルウェア関数
 */
export function createCSRFMiddleware() {
  return (request: NextRequest): {
    isValid: boolean
    shouldGenerateToken: boolean
    error?: string
  } => {
    const method = request.method.toUpperCase()
    
    // GET, HEAD, OPTIONS は CSRF 検証をスキップ
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return { isValid: true, shouldGenerateToken: false }
    }
    
    // POST, PUT, DELETE, PATCH は CSRF 検証が必要
    const { headerToken, cookieToken } = getCSRFTokenFromRequest(request)
    
    // 開発環境ではCSRF検証をより緩くする
    if (process.env.NODE_ENV === 'development') {
      // 開発環境でもトークンがあれば検証
      if (headerToken && cookieToken) {
        const isValid = validateCSRFToken(headerToken, cookieToken)
        return { 
          isValid, 
          shouldGenerateToken: !isValid,
          error: isValid ? undefined : 'CSRF token mismatch in development'
        }
      }
      
      // 開発環境では警告のみ
      console.warn('🟡 CSRF token missing in development mode')
      return { isValid: true, shouldGenerateToken: true }
    }
    
    // 本番環境では厳格に検証
    if (!headerToken || !cookieToken) {
      return { 
        isValid: false, 
        shouldGenerateToken: true,
        error: 'CSRF token is required for state-changing requests'
      }
    }
    
    const isValid = validateCSRFToken(headerToken, cookieToken)
    return { 
      isValid, 
      shouldGenerateToken: !isValid,
      error: isValid ? undefined : 'CSRF token validation failed'
    }
  }
}

/**
 * API Route用のCSRF保護ヘルパー
 */
export async function withCSRFProtection<T>(
  request: NextRequest,
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  const csrfMiddleware = createCSRFMiddleware()
  const validation = csrfMiddleware(request)
  
  if (!validation.isValid) {
    return NextResponse.json(
      { 
        error: 'CSRF Protection',
        message: validation.error || 'CSRF token validation failed',
        code: 'CSRF_TOKEN_INVALID'
      },
      { status: 403 }
    )
  }
  
  return handler()
}

/**
 * CSRFトークンAPIエンドポイント用
 */
export function createCSRFTokenResponse(): NextResponse {
  const token = generateCSRFToken()
  
  const response = NextResponse.json({
    token,
    config: {
      headerName: CSRF_CONFIG.headerName,
      fieldName: CSRF_CONFIG.tokenName
    }
  })
  
  // Cookieに設定
  response.cookies.set(CSRF_CONFIG.cookieName, token, CSRF_CONFIG.cookieOptions)
  
  return response
}

/**
 * フロントエンド用のCSRFトークン取得ヘルパー
 */
export const CSRFHelpers = {
  /**
   * CSRFトークンをAPIから取得
   */
  async fetchToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/csrf-token')
      if (!response.ok) throw new Error('Failed to fetch CSRF token')
      
      const data = await response.json()
      return data.token
    } catch (error) {
      console.error('🔴 CSRF token fetch failed:', error)
      return null
    }
  },

  /**
   * fetchリクエストにCSRFトークンを追加
   */
  async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.fetchToken()
    
    if (!token) {
      throw new Error('CSRF token not available')
    }
    
    const headers = new Headers(options.headers)
    headers.set(CSRF_CONFIG.headerName, token)
    headers.set('Content-Type', 'application/json')
    
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Cookieを含める
    })
  },

  /**
   * フォーム用のhidden inputとして使用するトークン取得
   */
  async getTokenForForm(): Promise<{ name: string, value: string } | null> {
    const token = await this.fetchToken()
    if (!token) return null
    
    return {
      name: CSRF_CONFIG.tokenName,
      value: token
    }
  }
}

/**
 * React Hook用のCSRFトークン管理
 */
export function useCSRFToken() {
  // NOTE: これはクライアントサイドでのみ使用される想定
  if (typeof window === 'undefined') {
    return { token: null, loading: true, fetchToken: () => Promise.resolve(null) }
  }
  
  // 簡易実装（実際のReact Hookとして使用する場合は useState, useEffect を使用）
  return {
    token: null as string | null,
    loading: false,
    fetchToken: CSRFHelpers.fetchToken
  }
}

/**
 * CSRF設定の取得（デバッグ用）
 */
export function getCSRFConfig() {
  return {
    ...CSRF_CONFIG,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production'
  }
}