'use client'

import { useState, useEffect } from 'react'
import { getAuthenticatedSupabaseClient, UserProfile, UserStats } from '@/lib/supabase'
import { AlertTriangle, Settings, Banknote, Clock, Info } from 'lucide-react'
import ExportCsvButton from '@/components/ExportCsvButton'
import RequestPermission from '@/components/notifications/RequestPermission'
import { useThresholdNotifier } from '@/hooks/useThresholdNotifier'
import { getThresholdStatus } from '@/utils/threshold'
import { calculateRemaining } from '@/lib/fuyouClassifier'
import { useToastFallback } from '@/components/notifications/Toast'
import LoginPrompt from '@/components/auth/LoginPrompt'
import EmptyState from '@/components/dashboard/EmptyState'
import { demoStorage } from '@/lib/demo-data'

interface DashboardData {
  profile: UserProfile
  stats: UserStats
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authError, setAuthError] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [bankConnected, setBankConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showWelcomeToast, setShowWelcomeToast] = useState(false)
  const { showToast, ToastContainer } = useToastFallback()

  // Threshold notification monitoring
  const { showTestNotification } = useThresholdNotifier(
    data?.stats.ytd_income || 0, 
    data?.profile.fuyou_line || 1030000
  )

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleBankConnect = async () => {
    // Check if in demo mode
    if (typeof window !== 'undefined' && window.__demo_mode) {
      showToast('デモモードでは銀行連携は利用できません', 'warning')
      return
    }
    
    setIsConnecting(true)
    try {
      const response = await fetch('/api/moneytree/connect', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to initiate bank connection')
      }
      
      const { authUrl } = await response.json()
      window.location.href = authUrl
    } catch (error) {
      console.error('Error connecting bank:', error)
      showToast('銀行連携の開始中にエラーが発生しました', 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSyncTransactions = async () => {
    // Check if in demo mode
    if (typeof window !== 'undefined' && window.__demo_mode) {
      showToast('デモモードでは同期機能は利用できません', 'warning')
      return
    }
    
    setIsSyncing(true)
    try {
      const response = await fetch('/api/moneytree/sync', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync transactions')
      }
      
      const result = await response.json()
      showToast(`${result.syncedTransactions}件の取引を同期しました`, 'success')
      
      // Refresh dashboard data
      await fetchDashboardData()
    } catch (error) {
      console.error('Error syncing transactions:', error)
      showToast('取引の同期中にエラーが発生しました', 'error')
    } finally {
      setIsSyncing(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      // Reset states
      setError(null)
      setAuthError(false)
      setNeedsSetup(false)
      
      // Check if we're in demo mode
      if (typeof window !== 'undefined' && window.__demo_mode) {
        // Use demo data
        const profile = demoStorage.getProfile()
        const stats = demoStorage.getStats()
        setData({ profile, stats })
        setBankConnected(false) // No bank connection in demo mode
        setLoading(false)
        return
      }
      
      const authClient = await getAuthenticatedSupabaseClient()
      
      if (!authClient) {
        setAuthError(true)
        setLoading(false)
        return
      }
      
      const { supabase, user } = authClient

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) {
        // If no profile exists, user needs to complete setup
        if (profileError.code === 'PGRST116') {
          setNeedsSetup(true)
          setLoading(false)
          return
        }
        throw profileError
      }

      // Check if bank is connected
      const { data: tokenData } = await supabase
        .from('user_moneytree_tokens')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      setBankConnected(!!tokenData)

      // Fetch user stats
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (statsError) {
        // If no stats exist yet, create default ones
        const defaultStats: Partial<UserStats> = {
          user_id: user.id,
          ytd_income: 0,
          remaining: profile.fuyou_line,
          remaining_hours: profile.fuyou_line / profile.hourly_wage
        }

        const { data: newStats, error: insertError } = await supabase
          .from('user_stats')
          .insert(defaultStats)
          .select()
          .single()

        if (insertError) throw insertError
        setData({ profile, stats: newStats })
      } else {
        setData({ profile, stats })
      }
      
      // Show welcome toast for new users or users with classification results
      const isNewUser = !stats || stats.ytd_income === 0
      if (isNewUser && profile.fuyou_line) {
        setShowWelcomeToast(true)
        setTimeout(() => setShowWelcomeToast(false), 6000) // Hide after 6 seconds
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('データの取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (authError) {
    return <LoginPrompt message="ダッシュボードを利用するにはログインが必要です" />
  }

  // Show setup prompt if user hasn't completed profile setup
  if (needsSetup) {
    return <EmptyState />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">{error || 'データが見つかりません'}</p>
        </div>
      </div>
    )
  }

  const { profile, stats } = data
  const remainingPercentage = (stats.remaining / profile.fuyou_line) * 100
  const isRiskZone = remainingPercentage < 10
  const isWarningZone = remainingPercentage >= 10 && remainingPercentage < 30
  
  // Get threshold status for notifications
  const thresholdStatus = getThresholdStatus(stats.ytd_income, profile.fuyou_line)

  const getProgressColor = () => {
    if (isRiskZone) return 'bg-red-500'
    if (isWarningZone) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatHours = (hours: number) => {
    return Math.floor(hours * 10) / 10 // Round to 1 decimal place
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">扶養わかるんです</h1>
              {process.env.NEXT_PUBLIC_APP_VERSION && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
                  v{process.env.NEXT_PUBLIC_APP_VERSION}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {profile.is_student ? '学生' : '一般'}扶養
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/settings'}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <Settings className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Big Numbers */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Banknote className="h-5 w-5 text-indigo-600 mr-1" />
                  <span className="text-sm font-medium text-gray-600">あと</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {Math.floor(stats.remaining / 10000)}
                </div>
                <div className="text-lg text-gray-600">万円</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-5 w-5 text-indigo-600 mr-1" />
                  <span className="text-sm font-medium text-gray-600">あと</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatHours(stats.remaining_hours)}
                </div>
                <div className="text-lg text-gray-600">時間</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>使用済み: {formatCurrency(stats.ytd_income)}</span>
                <span>上限: {formatCurrency(profile.fuyou_line)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${Math.min(100, 100 - remainingPercentage)}%` }}
                />
              </div>
              <div className="text-center mt-2">
                <span className={`text-sm font-medium ${
                  isRiskZone ? 'text-red-600' : 
                  isWarningZone ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  残り {Math.round(remainingPercentage)}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Card (shows when < 10% or risk of 106万円 line) */}
          {(isRiskZone || stats.ytd_income > 1000000) && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-red-900 mb-2">注意が必要です</h3>
                  <p className="text-sm text-red-800 mb-4">
                    {isRiskZone && '扶養控除の上限に近づいています。'}
                    {stats.ytd_income > 1000000 && ' 106万円を超えると社会保険の扶養から外れる可能性があります。'}
                  </p>
                  <div className="space-y-2">
                    <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors">
                      詳しく確認する
                    </button>
                    <button className="w-full bg-white text-red-600 py-2 px-4 rounded-lg font-medium border border-red-600 hover:bg-red-50 transition-colors">
                      労働時間を調整する
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start">
              <Info className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900 mb-2">あなたの扶養区分</h3>
                <p className="text-sm text-blue-800 mb-2">
                  上限額: <strong>{formatCurrency(profile.fuyou_line)}</strong>
                </p>
                <p className="text-xs text-blue-700">
                  あと <strong>{formatCurrency(calculateRemaining(stats.ytd_income, profile.fuyou_line))}</strong> 稼ぐことができます
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">今月の概要</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">時給</span>
                <span className="font-medium">{formatCurrency(profile.hourly_wage)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">週労働時間</span>
                <span className="font-medium">{profile.weekly_hours}時間</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">扶養上限</span>
                <span className="font-medium">{formatCurrency(profile.fuyou_line)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">今年の収入</span>
                <span className="font-medium text-indigo-600">{formatCurrency(stats.ytd_income)}</span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">通知設定</h3>
            <RequestPermission />
            {thresholdStatus.isOverThreshold && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>通知テスト:</strong>
                </p>
                <button 
                  onClick={showTestNotification}
                  className="mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200"
                >
                  テスト通知を送信
                </button>
              </div>
            )}
          </div>

          {/* Data Export */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">データエクスポート</h3>
                <p className="text-sm text-gray-600">
                  収入データをCSVファイルでダウンロード
                </p>
              </div>
              <ExportCsvButton />
            </div>
          </div>

          {/* Bank Connection Status */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">銀行連携</h3>
                <p className="text-sm text-gray-600">
                  {bankConnected ? '銀行アカウントが連携済み' : '自動で収入を追跡'}
                </p>
                {bankConnected && (
                  <div className="flex items-center mt-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-xs text-green-600 font-medium">連携中</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                {!bankConnected ? (
                  <button 
                    onClick={handleBankConnect}
                    disabled={isConnecting}
                    className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? '接続中...' : '連携する'}
                  </button>
                ) : (
                  <button 
                    onClick={handleSyncTransactions}
                    disabled={isSyncing}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? '同期中...' : '同期する'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Toast */}
      {showWelcomeToast && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="bg-green-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold mb-1">設定完了！</h4>
                <p className="text-sm">
                  あなたの上限は <strong>{data ? formatCurrency(data.profile.fuyou_line) : ''}</strong> です。
                  あと <strong>{data ? formatCurrency(calculateRemaining(data.stats.ytd_income, data.profile.fuyou_line)) : ''}</strong> 稼げます 🎉
                </p>
              </div>
              <button 
                onClick={() => setShowWelcomeToast(false)}
                className="text-white hover:text-green-200 ml-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer />
    </div>
  )
}