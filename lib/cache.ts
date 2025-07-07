/**
 * 分散キャッシュシステム - Vercel Edge Runtime 最適化
 * メモリキャッシュ + TTL機能でパフォーマンス向上
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  hits: number
}

interface CacheStats {
  total_keys: number
  total_hits: number
  total_misses: number
  cache_hit_ratio: number
  memory_usage_mb: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  }

  /**
   * キャッシュに値を設定
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    const now = Date.now()
    
    // 古いエントリがあれば削除
    if (this.cache.has(key)) {
      this.stats.evictions++
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttlSeconds * 1000, // ミリ秒に変換
      hits: 0
    })

    this.stats.sets++
    
    // メモリ使用量制限（1000エントリまで）
    if (this.cache.size > 1000) {
      this.evictOldest()
    }
  }

  /**
   * キャッシュから値を取得
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    
    // TTL 期限切れチェック
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      this.stats.misses++
      this.stats.evictions++
      return null
    }

    // ヒット数更新
    entry.hits++
    this.stats.hits++
    
    return entry.data as T
  }

  /**
   * キャッシュを削除
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.evictions++
    }
    return deleted
  }

  /**
   * パターンマッチでキャッシュを削除
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'))
    let deleted = 0
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deleted++
        this.stats.evictions++
      }
    }
    
    return deleted
  }

  /**
   * 古いエントリを削除
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    
    // 最古の100エントリを削除
    for (let i = 0; i < Math.min(100, entries.length); i++) {
      this.cache.delete(entries[i][0])
      this.stats.evictions++
    }
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): CacheStats {
    const memoryUsageMB = (this.cache.size * 1024) / (1024 * 1024) // 概算
    const total = this.stats.hits + this.stats.misses
    
    return {
      total_keys: this.cache.size,
      total_hits: this.stats.hits,
      total_misses: this.stats.misses,
      cache_hit_ratio: total > 0 ? this.stats.hits / total : 0,
      memory_usage_mb: memoryUsageMB
    }
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0 }
  }
}

// グローバルキャッシュインスタンス
const globalCache = new MemoryCache()

/**
 * キャッシュキー生成ヘルパー
 */
export const CacheKeys = {
  userProfile: (userId: string) => `profile:${userId}`,
  userStats: (userId: string) => `stats:${userId}`,
  bankConnection: (userId: string) => `bank:${userId}`,
  dashboardBatch: (userId: string) => `dashboard:batch:${userId}`,
  thresholdStatus: (userId: string, income: number) => `threshold:${userId}:${income}`,
  
  // パターン削除用
  userPattern: (userId: string) => `*:${userId}`,
  allDashboard: () => 'dashboard:*'
}

/**
 * 高レベルキャッシュAPI
 */
export const AppCache = {
  /**
   * ダッシュボードデータのキャッシュ
   */
  async getDashboardData(userId: string) {
    return globalCache.get(CacheKeys.dashboardBatch(userId))
  },

  async setDashboardData(userId: string, data: unknown, ttlSeconds: number = 300) {
    globalCache.set(CacheKeys.dashboardBatch(userId), data, ttlSeconds)
  },

  /**
   * ユーザープロフィールのキャッシュ
   */
  async getUserProfile(userId: string) {
    return globalCache.get(CacheKeys.userProfile(userId))
  },

  async setUserProfile(userId: string, profile: unknown, ttlSeconds: number = 600) {
    globalCache.set(CacheKeys.userProfile(userId), profile, ttlSeconds)
  },

  /**
   * ユーザー統計のキャッシュ
   */
  async getUserStats(userId: string) {
    return globalCache.get(CacheKeys.userStats(userId))
  },

  async setUserStats(userId: string, stats: unknown, ttlSeconds: number = 180) {
    globalCache.set(CacheKeys.userStats(userId), stats, ttlSeconds)
  },

  /**
   * 銀行接続状況のキャッシュ
   */
  async getBankConnection(userId: string) {
    return globalCache.get(CacheKeys.bankConnection(userId))
  },

  async setBankConnection(userId: string, connection: unknown, ttlSeconds: number = 300) {
    globalCache.set(CacheKeys.bankConnection(userId), connection, ttlSeconds)
  },

  /**
   * ユーザー関連キャッシュの一括削除
   */
  async invalidateUser(userId: string): Promise<number> {
    return globalCache.deletePattern(CacheKeys.userPattern(userId))
  },

  /**
   * ダッシュボードキャッシュの一括削除
   */
  async invalidateDashboard(): Promise<number> {
    return globalCache.deletePattern(CacheKeys.allDashboard())
  },

  /**
   * キャッシュ統計取得
   */
  getStats(): CacheStats {
    return globalCache.getStats()
  },

  /**
   * キャッシュ全体をクリア
   */
  clear(): void {
    globalCache.clear()
  }
}

/**
 * キャッシュデコレータ - 関数結果をキャッシュ
 */
export function withCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlSeconds: number = 300
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = keyGenerator(...args)
    
    // キャッシュから取得を試行
    const cached = globalCache.get(cacheKey)
    if (cached !== null) {
      return cached
    }

    // キャッシュミス - 関数を実行
    const result = await fn(...args)
    
    // 結果をキャッシュに保存
    if (result !== null && result !== undefined) {
      globalCache.set(cacheKey, result, ttlSeconds)
    }

    return result
  }) as T
}

/**
 * キャッシュウォームアップ - 事前にキャッシュを準備
 */
export const CacheWarmup = {
  async preloadDashboardData(userId: string) {
    try {
      // ダッシュボードバッチAPIを事前実行してキャッシュ
      const response = await fetch(`/api/dashboard/batch`, {
        method: 'GET',
        headers: { 'X-User-ID': userId }
      })
      
      if (response.ok) {
        const data = await response.json()
        await AppCache.setDashboardData(userId, data, 300)
        return true
      }
    } catch (error) {
      console.warn('Cache warmup failed:', error)
    }
    return false
  }
}

// 開発環境用: キャッシュ監視
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // 5分ごとにキャッシュ統計をログ出力
  setInterval(() => {
    const stats = AppCache.getStats()
    if (stats.total_keys > 0) {
      console.log('📊 Cache Stats:', stats)
    }
  }, 5 * 60 * 1000)
}