'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import MonthlyIncomeInput from '@/components/income/MonthlyIncomeInput'
import { getSupportTypeLabel, getInsuranceLabel } from '@/lib/profile-validation'
import { getCurrentYearMonth, formatCurrency } from '@/lib/income-manager'

export default function DashboardPage() {
  const { user, profile, profileComplete, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">ログインが必要です</h1>
          <p className="text-gray-600">このページにアクセスするにはログインしてください。</p>
        </div>
      </div>
    )
  }

  // Redirect to onboarding if profile is incomplete
  // Note: Let AuthProvider handle redirects to avoid loops
  if (!profileComplete) {
    console.log('🔄 Dashboard: Profile incomplete, showing loading state')
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">プロフィール設定を確認中...</p>
        </div>
      </div>
    )
  }

  const { month: currentMonth } = getCurrentYearMonth()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                扶養わかるんです
              </h1>
              <p className="text-gray-600 mt-1">
                こんにちは、{user.email}さん
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                現在: {new Date().getFullYear()}年{currentMonth}月
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Summary */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">あなたの設定</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">扶養状況</div>
                <div className="font-medium text-gray-900">
                  {profile ? getSupportTypeLabel(profile.support_type) : '未設定'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">健康保険</div>
                <div className="font-medium text-gray-900">
                  {profile ? getInsuranceLabel(profile.insurance) : '未設定'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">月収目標</div>
                <div className="font-medium text-gray-900">
                  {profile?.monthly_income_target ? formatCurrency(profile.monthly_income_target) : '未設定'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Income Management */}
        <div className="mb-8">
          <MonthlyIncomeInput />
        </div>

        {/* Quick Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            💡 扶養内で働くためのポイント
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">年収103万円の壁</h4>
              <p>この金額を超えると親の扶養から外れ、所得税がかかります。月平均約8.6万円が目安です。</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">収入の記録を忘れずに</h4>
              <p>毎月の収入をこまめに記録することで、年末に慌てることなく扶養範囲内で働けます。</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">予測値を活用しよう</h4>
              <p>未来の月の予測値を設定することで、年間の収入見込みを把握できます。</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">早めの調整が大切</h4>
              <p>限度額に近づいたら、働く時間を調整するか親御さんに相談しましょう。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}