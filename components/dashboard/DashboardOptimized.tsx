'use client'

import { useState, useMemo, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { AlertTriangle, Settings, Banknote, Clock, Info, TrendingUp } from 'lucide-react'
import ExportCsvButton from '@/components/ExportCsvButton'
import RequestPermission from '@/components/notifications/RequestPermission'
import { useThresholdNotifier } from '@/hooks/useThresholdNotifier'
import { calculateRemaining } from '@/lib/fuyouClassifier'
import { useToastFallback } from '@/components/notifications/Toast'
import LoginPrompt from '@/components/auth/LoginPrompt'
import { demoStorage } from '@/lib/demo-data'
import { useDashboardData } from '@/hooks/useDashboardData'
import DashboardSkeleton, { ChartSkeleton, BankConnectionSkeleton } from './DashboardSkeleton'

// 🚀 Dynamic Imports でコードスプリッティング
const DashboardChart = dynamic(
  () => import('./DashboardChart'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false // クライアントサイドレンダリングで軽量化
  }
)

const BankConnectionManager = dynamic(
  () => import('./BankConnectionManager'),
  { 
    loading: () => <BankConnectionSkeleton />,
    ssr: false
  }
)

// 設定モーダルも遅延読み込み
const SettingsModal = dynamic(
  () => import('./SettingsModal'),
  { ssr: false }
)

/**
 * 最適化されたダッシュボードコンポーネント
 * - バッチAPI使用で並列データ取得
 * - Dynamic importでコードスプリッティング
 * - Memoizationでリレンダリング最適化
 */
export default function DashboardOptimized() {
  const [showSettings, setShowSettings] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const { showToast, ToastContainer } = useToastFallback()

  // 🚀 最適化されたデータ取得（バッチAPI使用）
  const {
    data,
    bankConnected,
    bankInfo,
    loading,
    error,
    authError,
    performance,
    refetch
  } = useDashboardData()

  // デモモード処理
  const isDemoMode = useMemo(() => 
    typeof window !== 'undefined' && window.__demo_mode,
    []
  )

  // デモデータの取得（memoized）
  const demoData = useMemo(() => {
    if (!isDemoMode) return null
    return {
      profile: demoStorage.getProfile(),
      stats: demoStorage.getStats()
    }
  }, [isDemoMode])

  // 実際に使用するデータ（本番またはデモ）
  const currentData = isDemoMode ? demoData : data

  // Threshold notification monitoring（memoized）
  const { showTestNotification } = useThresholdNotifier(
    currentData?.stats.ytd_income || 0,
    currentData?.profile.fuyou_line || 1030000
  )

  // 残り収入計算（memoized）
  const remainingCalculation = useMemo(() => {
    if (!currentData?.profile || !currentData?.stats) return null
    
    return calculateRemaining(
      currentData.stats.ytd_income,
      currentData.profile.fuyou_line,
      currentData.profile.hourly_wage
    )
  }, [currentData?.profile, currentData?.stats])

  // パフォーマンス表示（開発環境のみ）
  const performanceIndicator = useMemo(() => {
    if (process.env.NODE_ENV !== 'development' || !performance) return null

    const isSlowLoad = performance.execution_time_ms > 1000
    
    return (
      <div className={`fixed top-4 right-4 px-3 py-1 rounded-full text-xs font-mono z-50 ${
        isSlowLoad ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
      }`}>
        <TrendingUp className="w-3 h-3 inline mr-1" />
        {performance.execution_time_ms}ms
      </div>
    )
  }, [performance])

  // 認証エラー処理
  if (authError) {
    return <LoginPrompt />
  }

  // ローディング状態
  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <DashboardSkeleton />
        {performanceIndicator}
      </div>
    )
  }

  // エラー状態
  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h3 className="font-semibold text-red-900 mb-2">エラーが発生しました</h3>
          <p className="text-sm text-red-700 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            再試行
          </button>
        </div>
        {performanceIndicator}
      </div>
    )
  }

  // データ不足の場合
  if (!currentData?.profile || !currentData?.stats) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Info className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <h3 className="font-semibold text-yellow-900 mb-2">セットアップが必要です</h3>
          <p className="text-sm text-yellow-700">
            プロフィール情報を設定してください。
          </p>
        </div>
        {performanceIndicator}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      {/* パフォーマンス表示（開発環境） */}
      {performanceIndicator}

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          {isDemoMode && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              デモモード
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* メインチャート（Dynamic Import） */}
      <Suspense fallback={<ChartSkeleton />}>
        <DashboardChart
          stats={currentData.stats}
          profile={currentData.profile}
        />
      </Suspense>

      {/* 残り収入情報 */}
      {remainingCalculation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            収入予測
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>残り可能収入: ¥{remainingCalculation.remainingAmount.toLocaleString()}</p>
            {remainingCalculation.remainingHours > 0 && (
              <p>推定可能労働時間: {remainingCalculation.remainingHours.toFixed(1)}時間</p>
            )}
          </div>
        </div>
      )}

      {/* 銀行連携管理（Dynamic Import） */}
      {!isDemoMode && (
        <Suspense fallback={<BankConnectionSkeleton />}>
          <BankConnectionManager
            bankConnected={bankConnected}
            bankInfo={bankInfo}
            onConnectionChange={refetch}
            showToast={showToast}
          />
        </Suspense>
      )}

      {/* 通知設定 */}
      <RequestPermission />

      {/* アクションボタン */}
      <div className="flex flex-col space-y-3">
        <ExportCsvButton />
        
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={showTestNotification}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>テスト通知</span>
          </button>
        )}
      </div>

      {/* 設定モーダル（Dynamic Import） */}
      {showSettings && (
        <Suspense fallback={<div>設定を読み込み中...</div>}>
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            currentData={currentData}
            onUpdate={refetch}
          />
        </Suspense>
      )}

      {/* Toast Container */}
      <ToastContainer />

      {/* パフォーマンス情報（開発環境） */}
      {process.env.NODE_ENV === 'development' && performance && (
        <div className="mt-8 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <div className="font-mono">
            <div>サーバー処理: {performance.execution_time_ms}ms</div>
            <div>並列リクエスト: {performance.parallel_requests}件</div>
            {performance.client_total_time_ms && (
              <div>クライアント総時間: {performance.client_total_time_ms}ms</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}