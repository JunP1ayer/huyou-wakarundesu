'use client'

import { useState, useEffect } from 'react'
import { createSupabaseClient, UserProfile, UserStats } from '@/lib/supabase'
import { AlertTriangle, Settings, Banknote, Clock } from 'lucide-react'

interface DashboardData {
  profile: UserProfile
  stats: UserStats
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bankConnected, setBankConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleBankConnect = async () => {
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
      alert('銀行連携の開始中にエラーが発生しました')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSyncTransactions = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/moneytree/sync', {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to sync transactions')
      }
      
      const result = await response.json()
      alert(`${result.syncedTransactions}件の取引を同期しました`)
      
      // Refresh dashboard data
      await fetchDashboardData()
    } catch (error) {
      console.error('Error syncing transactions:', error)
      alert('取引の同期中にエラーが発生しました')
    } finally {
      setIsSyncing(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) throw profileError

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
            <h1 className="text-xl font-bold text-gray-900">扶養わかるんです</h1>
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
    </div>
  )
}