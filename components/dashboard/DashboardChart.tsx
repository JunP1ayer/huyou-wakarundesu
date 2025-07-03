'use client'

import { useMemo } from 'react'
import { UserStats, UserProfile } from '@/lib/supabase'
import { getThresholdStatus } from '@/utils/threshold'

interface DashboardChartProps {
  stats: UserStats
  profile: UserProfile
}

/**
 * ダッシュボード用進捗チャートコンポーネント
 * 重いレンダリング処理を含むため、dynamic importで遅延読み込み
 */
export default function DashboardChart({ stats, profile }: DashboardChartProps) {
  const thresholdStatus = useMemo(() => 
    getThresholdStatus(stats.ytd_income, profile.fuyou_line),
    [stats.ytd_income, profile.fuyou_line]
  )

  const progressPercentage = useMemo(() => {
    if (profile.fuyou_line <= 0) return 0
    return Math.min((stats.ytd_income / profile.fuyou_line) * 100, 100)
  }, [stats.ytd_income, profile.fuyou_line])

  const remainingAmount = useMemo(() => 
    Math.max(profile.fuyou_line - stats.ytd_income, 0),
    [profile.fuyou_line, stats.ytd_income]
  )

  const getProgressColor = () => {
    if (progressPercentage >= 95) return 'bg-red-500'
    if (progressPercentage >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusColor = () => {
    switch (thresholdStatus.severity) {
      case 'low': return 'text-green-700 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* ステータスカード */}
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">扶養範囲ステータス</h3>
          <span className="text-sm font-medium">
            {thresholdStatus.severity === 'low' && '安全'}
            {thresholdStatus.severity === 'medium' && '注意'}
            {thresholdStatus.severity === 'high' && '危険'}
          </span>
        </div>
        <p className="text-sm">{thresholdStatus.message}</p>
      </div>

      {/* 進捗バー */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">今年の収入進捗</span>
          <span className="text-sm text-gray-600">
            {progressPercentage.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>¥{stats.ytd_income.toLocaleString()}</span>
          <span>¥{profile.fuyou_line.toLocaleString()}</span>
        </div>
      </div>

      {/* 残り金額 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">残り可能収入</p>
          <p className="text-xl font-bold text-gray-900">
            ¥{remainingAmount.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">残り可能時間</p>
          <p className="text-xl font-bold text-gray-900">
            {stats.remaining_hours}時間
          </p>
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>データ更新: {new Date(stats.updated_at).toLocaleString('ja-JP')}</p>
      </div>
    </div>
  )
}