'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthenticatedSupabaseClient, createSupabaseClient, UserProfile } from '@/lib/supabase'
import { ArrowLeft, User, DollarSign, Repeat, Trash2, RefreshCw } from 'lucide-react'
import { useToastFallback } from '@/components/notifications/Toast'

export default function Settings() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [hourlyWage, setHourlyWage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bankConnected, setBankConnected] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const { showToast, ToastContainer } = useToastFallback()
  const router = useRouter()

  const fetchProfile = async () => {
    try {
      const authClient = await getAuthenticatedSupabaseClient()
      
      if (!authClient) {
        showToast('ログインが必要です', 'error')
        router.push('/')
        return
      }
      
      const { supabase, user } = authClient

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) throw profileError

      setProfile(profileData)
      setHourlyWage(profileData.hourly_wage.toString())

      // Check bank connection
      const { data: tokenData } = await supabase
        .from('user_moneytree_tokens')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      
      setBankConnected(!!tokenData)
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveHourlyWage = async () => {
    if (!profile) return

    const wage = parseInt(hourlyWage)
    if (isNaN(wage) || wage < 100 || wage > 10000) {
      showToast('時給は100円〜10,000円の間で入力してください', 'warning')
      return
    }

    setSaving(true)
    try {
      const authClient = await getAuthenticatedSupabaseClient()
      if (!authClient) {
        showToast('ログインが必要です', 'error')
        return
      }
      
      const { supabase } = authClient
      const { error } = await supabase
        .from('user_profile')
        .update({ hourly_wage: wage, updated_at: new Date().toISOString() })
        .eq('user_id', profile.user_id)

      if (error) throw error

      showToast('時給を更新しました', 'success')
      setProfile({ ...profile, hourly_wage: wage })
    } catch (error) {
      console.error('Error updating hourly wage:', error)
      showToast('時給の更新中にエラーが発生しました', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRestartWizard = () => {
    if (confirm('設定ウィザードをやり直しますか？現在の設定は上書きされます。')) {
      router.push('/')
    }
  }

  const handleDisconnectBank = async () => {
    if (!confirm('銀行連携を解除しますか？取引データは保持されますが、自動同期が停止します。')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const authClient = await getAuthenticatedSupabaseClient()
      if (!authClient) {
        showToast('ログインが必要です', 'error')
        return
      }

      const { supabase, user } = authClient
      const { error } = await supabase
        .from('user_moneytree_tokens')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      setBankConnected(false)
      showToast('銀行連携を解除しました', 'success')
    } catch (error) {
      console.error('Error disconnecting bank:', error)
      showToast('銀行連携の解除中にエラーが発生しました', 'error')
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleBankConnect = async () => {
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
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">設定を読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">プロフィールが見つかりません</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6">
        <div className="max-w-md mx-auto flex items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-gray-400 hover:text-gray-600 mr-3"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">設定</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Profile Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-bold text-gray-900">プロフィール情報</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">扶養タイプ</span>
                <span className="font-medium">
                  {profile.is_student ? '学生' : '一般'}
                  {profile.support_type === 'full' && '・完全扶養'}
                  {profile.support_type === 'partial' && '・部分扶養'}
                  {profile.support_type === 'none' && '・非扶養'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">扶養上限</span>
                <span className="font-medium">{profile.fuyou_line.toLocaleString()}円</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">週労働時間</span>
                <span className="font-medium">{profile.weekly_hours}時間</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">保険</span>
                <span className="font-medium">
                  {profile.insurance === 'national' && '国民健康保険'}
                  {profile.insurance === 'employee' && '社員健康保険'}
                  {profile.insurance === 'none' && '不明'}
                </span>
              </div>
            </div>
            <button
              onClick={handleRestartWizard}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <Repeat className="h-4 w-4 mr-2" />
              設定をやり直す
            </button>
          </div>

          {/* Hourly Wage */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-bold text-gray-900">時給設定</h3>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(e.target.value)}
                placeholder="1200"
                min="100"
                max="10000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <span className="text-gray-600 font-medium">円</span>
              <button
                onClick={handleSaveHourlyWage}
                disabled={saving}
                className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              時給は100円〜10,000円の間で設定してください
            </p>
          </div>

          {/* Bank Connection */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-4">
              <RefreshCw className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="font-bold text-gray-900">銀行連携</h3>
            </div>
            
            {bankConnected ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600 font-medium">銀行アカウント連携済み</span>
                </div>
                <p className="text-sm text-gray-600">
                  自動で収入データを同期しています。必要に応じてダッシュボードから手動同期も可能です。
                </p>
                <button
                  onClick={handleDisconnectBank}
                  disabled={isDisconnecting}
                  className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50 flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDisconnecting ? '解除中...' : '連携を解除'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  銀行アカウントを連携すると、収入を自動で追跡できます。
                </p>
                <button
                  onClick={handleBankConnect}
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  銀行アカウントを連携
                </button>
              </div>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="font-bold text-red-900 mb-2">危険な操作</h3>
            <p className="text-sm text-red-700 mb-4">
              以下の操作は慎重に行ってください。
            </p>
            <button
              onClick={() => {
                if (confirm('本当にアカウントからログアウトしますか？')) {
                  const supabase = createSupabaseClient()
                  if (supabase) {
                    supabase.auth.signOut()
                  }
                  router.push('/')
                }
              }}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </div>
  )
}