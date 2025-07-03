/**
 * レートリミット機能 - Vercel Edge Runtime 最適化
 * IPアドレスベースの分散レートリミッター
 */

interface RateLimitOptions {
  interval: number     // ウィンドウサイズ（ミリ秒）
  uniqueTokenPerInterval: number // インターバル内の許可トークン数
  skipSuccessfulRequests?: boolean // 成功したリクエストをカウントしないか
  skipFailedRequests?: boolean     // 失敗したリクエストをカウントしないか
  keyGenerator?: (identifier: string) => string // カスタムキー生成
}

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  totalHits: number
  retryAfter?: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
  totalHits: number
}

class MemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // 5分ごとに期限切れエントリを削除
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || entry.resetTime <= now) {
      // 新しいウィンドウまたは期限切れ
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + windowMs,
        totalHits: (entry?.totalHits || 0) + 1
      }
      this.store.set(key, newEntry)

      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: newEntry.resetTime,
        totalHits: newEntry.totalHits
      }
    }

    // 既存のウィンドウ内
    entry.count++
    entry.totalHits++

    if (entry.count > limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: entry.resetTime,
        totalHits: entry.totalHits,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }

    return {
      success: true,
      limit,
      remaining: limit - entry.count,
      reset: entry.resetTime,
      totalHits: entry.totalHits
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// グローバルレートリミッターインスタンス
const globalRateLimiter = new MemoryRateLimiter()

/**
 * レートリミット設定プリセット
 */
export const RateLimitPresets = {
  // 厳格（ログイン、重要なAPI）
  strict: {
    interval: 15 * 60 * 1000, // 15分
    uniqueTokenPerInterval: 5   // 15分で5回
  },
  
  // 標準（通常のAPI）
  standard: {
    interval: 60 * 1000,    // 1分
    uniqueTokenPerInterval: 60  // 1分で60回
  },
  
  // 緩い（公開API、静的コンテンツ）
  loose: {
    interval: 60 * 1000,    // 1分
    uniqueTokenPerInterval: 300  // 1分で300回
  },

  // ダッシュボード（データ取得）
  dashboard: {
    interval: 60 * 1000,    // 1分
    uniqueTokenPerInterval: 30   // 1分で30回
  },

  // 認証関連
  auth: {
    interval: 5 * 60 * 1000,  // 5分
    uniqueTokenPerInterval: 10  // 5分で10回
  },

  // バッチAPI（重い処理）
  batch: {
    interval: 60 * 1000,    // 1分
    uniqueTokenPerInterval: 10   // 1分で10回
  }
} as const

/**
 * メインレートリミット関数
 */
export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = RateLimitPresets.standard
): Promise<RateLimitResult> {
  
  const keyGenerator = options.keyGenerator || ((id: string) => `rate_limit:${id}`)
  const key = keyGenerator(identifier)

  return globalRateLimiter.check(
    key,
    options.uniqueTokenPerInterval,
    options.interval
  )
}

/**
 * IPアドレス取得ユーティリティ
 */
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare環境での実際のIP取得
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  // フォールバック（開発環境）
  return 'unknown'
}

/**
 * ユーザー識別子生成
 */
export function getUserIdentifier(request: Request, userId?: string): string {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // 認証済みユーザーの場合はuser_idを使用
  if (userId) {
    return `user:${userId}`
  }
  
  // 匿名ユーザーはIP + User-Agentのハッシュ
  const identifier = `${ip}:${userAgent.slice(0, 100)}`
  return `anon:${Buffer.from(identifier).toString('base64').slice(0, 32)}`
}

/**
 * レートリミットミドルウェア for API Routes
 */
export function createRateLimitMiddleware(
  options: RateLimitOptions = RateLimitPresets.standard
) {
  return async (request: Request, userId?: string): Promise<{
    success: boolean
    headers: Record<string, string>
    status?: number
    message?: string
  }> => {
    const identifier = getUserIdentifier(request, userId)
    const result = await rateLimit(identifier, options)

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.reset).toISOString(),
      'X-RateLimit-Total-Hits': result.totalHits.toString()
    }

    if (!result.success && result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString()
      return {
        success: false,
        headers,
        status: 429,
        message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`
      }
    }

    return {
      success: true,
      headers
    }
  }
}

/**
 * レートリミット統計取得
 */
export function getRateLimitStats(): {
  totalKeys: number
  memoryUsage: string
  topLimitedIPs: Array<{ ip: string, hits: number }>
} {
  const entries = Array.from((globalRateLimiter as any).store.entries())
  
  // 上位制限対象を取得
  const topLimited = entries
    .map(([key, entry]: [string, RateLimitEntry]) => ({
      ip: key,
      hits: entry.totalHits
    }))
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10)

  return {
    totalKeys: entries.length,
    memoryUsage: `${((entries.length * 100) / 1024).toFixed(2)} KB`,
    topLimitedIPs: topLimited
  }
}

/**
 * 特定のキーのレートリミットをリセット
 */
export function resetRateLimit(identifier: string): boolean {
  const key = `rate_limit:${identifier}`;
  return (globalRateLimiter as any).store.delete(key)
}

/**
 * 全てのレートリミットをクリア（開発/テスト用）
 */
export function clearAllRateLimits(): void {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    (globalRateLimiter as any).store.clear()
  }
}

// プロセス終了時のクリーンアップ（Node.js環境のみ）
if (typeof process !== 'undefined' && process.on && typeof process.on === 'function') {
  try {
    process.on('exit', () => {
      globalRateLimiter.destroy()
    })
  } catch (error) {
    // Edge runtime環境では無視
    console.warn('Process event listener not available in Edge runtime')
  }
}