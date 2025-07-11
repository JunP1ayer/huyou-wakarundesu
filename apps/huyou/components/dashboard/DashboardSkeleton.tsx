'use client'

/**
 * ダッシュボード読み込み中スケルトンコンポーネント
 * Dynamic import時のローディング表示に使用
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* ステータスカード スケルトン */}
      <div className="p-4 rounded-lg border bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <div className="h-5 bg-gray-300 rounded w-32"></div>
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
      </div>

      {/* 進捗バー スケルトン */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-300 rounded w-24"></div>
          <div className="h-4 bg-gray-300 rounded w-12"></div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="h-3 bg-gray-300 rounded-full w-1/2"></div>
        </div>
        
        <div className="flex justify-between">
          <div className="h-3 bg-gray-300 rounded w-16"></div>
          <div className="h-3 bg-gray-300 rounded w-20"></div>
        </div>
      </div>

      {/* 統計カード スケルトン */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-24"></div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-16"></div>
        </div>
      </div>

      {/* 詳細情報 スケルトン */}
      <div className="space-y-1">
        <div className="h-3 bg-gray-300 rounded w-40"></div>
        <div className="h-3 bg-gray-300 rounded w-36"></div>
      </div>
    </div>
  )
}

/**
 * チャートスケルトン（より軽量版）
 */
export function ChartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div className="h-3 bg-gray-300 rounded-full w-1/2"></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

/**
 * バンク接続スケルトン
 */
export function BankConnectionSkeleton() {
  return (
    <div className="animate-pulse p-4 border rounded-lg">
      <div className="flex items-center space-x-3 mb-3">
        <div className="h-5 w-5 bg-gray-300 rounded"></div>
        <div className="h-5 bg-gray-300 rounded w-24"></div>
      </div>
      <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
      <div className="h-8 bg-gray-300 rounded w-32"></div>
    </div>
  )
}