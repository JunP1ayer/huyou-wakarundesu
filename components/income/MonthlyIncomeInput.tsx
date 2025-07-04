'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { 
  getMonthlyIncomeData, 
  saveMonthlyIncome, 
  calculateYearlyStats, 
  getCurrentYearMonth,
  getMonthName,
  formatCurrency,
  checkFuyouAlert,
  generateEstimatedIncome
} from '@/lib/income-manager'
import { UserMonthlyIncome } from '@/lib/supabase'

export default function MonthlyIncomeInput() {
  const { user } = useAuth()
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [monthlyData, setMonthlyData] = useState<UserMonthlyIncome[]>([])
  const [editingMonth, setEditingMonth] = useState<number | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { month: currentMonth } = getCurrentYearMonth()

  // Load monthly data
  useEffect(() => {
    if (user) {
      loadMonthlyData()
    }
  }, [user, currentYear])

  const loadMonthlyData = async () => {
    if (!user) return

    setLoading(true)
    try {
      const data = await getMonthlyIncomeData(user.id, currentYear)
      setMonthlyData(data)
    } catch (err) {
      setError('データの読み込みに失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (month: number) => {
    const existingData = monthlyData.find(item => item.month === month)
    setEditingMonth(month)
    setInputValue(existingData ? existingData.income_amount.toString() : '')
  }

  const handleSave = async () => {
    if (!user || editingMonth === null) return

    const amount = parseInt(inputValue) || 0
    if (amount < 0) {
      setError('収入額は0円以上で入力してください')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await saveMonthlyIncome(user.id, currentYear, editingMonth, {
        income_amount: amount,
        is_estimated: false,
        input_method: 'manual'
      })

      await loadMonthlyData()
      setEditingMonth(null)
      setInputValue('')
    } catch (err) {
      setError('保存に失敗しました')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingMonth(null)
    setInputValue('')
    setError(null)
  }

  const addEstimatedIncome = async (month: number) => {
    if (!user) return

    const estimatedAmount = generateEstimatedIncome(monthlyData, month)
    
    try {
      await saveMonthlyIncome(user.id, currentYear, month, {
        income_amount: estimatedAmount,
        is_estimated: true,
        input_method: 'estimated'
      })
      await loadMonthlyData()
    } catch (err) {
      setError('予測値の設定に失敗しました')
    }
  }

  // Calculate statistics
  const stats = calculateYearlyStats(monthlyData, currentYear)
  const alert = checkFuyouAlert(stats)

  // Generate month rows
  const monthRows = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const data = monthlyData.find(item => item.month === month)
    const isPastMonth = month < currentMonth
    const isCurrentMonth = month === currentMonth
    const isFutureMonth = month > currentMonth

    return {
      month,
      data,
      isPastMonth,
      isCurrentMonth,
      isFutureMonth,
      canEdit: isPastMonth || isCurrentMonth,
      canEstimate: isFutureMonth && !data
    }
  })

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">収入データを読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Year Selector */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentYear}年の収入管理
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentYear(currentYear - 1)}
            className="px-3 py-1 text-gray-600 hover:text-gray-900"
          >
            ← {currentYear - 1}年
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={() => setCurrentYear(currentYear + 1)}
            disabled={currentYear >= new Date().getFullYear()}
            className="px-3 py-1 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {currentYear + 1}年 →
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert.level !== 'safe' && (
        <div className={`mb-6 p-4 rounded-lg border ${
          alert.level === 'danger' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-start">
            <div className="mr-3">
              {alert.level === 'danger' ? '⚠️' : '🔔'}
            </div>
            <div>
              <p className="font-medium">{alert.message}</p>
              <p className="text-sm mt-1">{alert.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">年初から今月まで</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.ytd_total)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">月平均</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.average_monthly)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">年間予測</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats.projected_annual)}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">残り稼げる額</div>
          <div className={`text-2xl font-bold ${
            stats.remaining_allowance < 100000 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(stats.remaining_allowance)}
          </div>
        </div>
      </div>

      {/* Monthly Input Grid */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">月別収入入力</h3>
          <p className="text-sm text-gray-600 mt-1">
            1月〜先月までの実際の収入を入力してください。今月以降は予測値も設定できます。
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthRows.map(({ month, data, isPastMonth, isCurrentMonth, isFutureMonth, canEdit, canEstimate }) => (
              <div
                key={month}
                className={`border rounded-lg p-4 ${
                  isCurrentMonth ? 'border-blue-300 bg-blue-50' :
                  isPastMonth ? 'border-gray-200' :
                  'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {getMonthName(month)}
                    {isCurrentMonth && <span className="ml-1 text-xs text-blue-600">(今月)</span>}
                  </h4>
                  {data?.is_estimated && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      予測
                    </span>
                  )}
                </div>

                {editingMonth === month ? (
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="収入額（円）"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 border border-gray-300 text-gray-700 text-sm py-2 px-3 rounded hover:bg-gray-50"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold text-gray-900 mb-2">
                      {data ? formatCurrency(data.income_amount) : '未入力'}
                    </div>
                    
                    <div className="flex space-x-2">
                      {canEdit && (
                        <button
                          onClick={() => handleEdit(month)}
                          className="flex-1 text-sm bg-gray-100 text-gray-700 py-2 px-3 rounded hover:bg-gray-200"
                        >
                          {data ? '編集' : '入力'}
                        </button>
                      )}
                      
                      {canEstimate && (
                        <button
                          onClick={() => addEstimatedIncome(month)}
                          className="flex-1 text-sm bg-yellow-100 text-yellow-700 py-2 px-3 rounded hover:bg-yellow-200"
                        >
                          予測値設定
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 使い方のヒント</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>過去の月：</strong> 実際に稼いだ金額を入力してください</li>
          <li>• <strong>今月：</strong> 現在までの収入や予想収入を入力できます</li>
          <li>• <strong>未来の月：</strong> 「予測値設定」で直近の平均から自動計算できます</li>
          <li>• <strong>扶養限度額：</strong> 年間103万円を超えないよう注意しましょう</li>
        </ul>
      </div>
    </div>
  )
}