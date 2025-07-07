'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, Clock, Check, X } from 'lucide-react'
import { saveMonthlyIncome, getMonthlyIncomeData, getCurrentYearMonth } from '@/lib/income-manager'
import { getAuthenticatedSupabaseClient } from '@/lib/supabase'
import { useToastFallback } from '@/components/notifications/Toast'

interface PaydayIncomeInputProps {
  onSave?: () => void
  className?: string
}

interface PaydayEntry {
  id: string
  payday: string // YYYY-MM-DD format
  amount: number
  description?: string
  deductions?: {
    tax: number
    socialInsurance: number
    other: number
  }
}

export default function PaydayIncomeInput({ onSave, className = '' }: PaydayIncomeInputProps) {
  const [entries, setEntries] = useState<PaydayEntry[]>([])
  const [newEntry, setNewEntry] = useState<Partial<PaydayEntry>>({
    payday: '',
    amount: 0,
    description: '',
    deductions: { tax: 0, socialInsurance: 0, other: 0 }
  })
  const [showDeductions, setShowDeductions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const { showToast, ToastContainer } = useToastFallback()

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    const authClient = await getAuthenticatedSupabaseClient()
    if (authClient) {
      setUserId(authClient.user.id)
      loadExistingEntries(authClient.user.id)
    }
  }

  const loadExistingEntries = async (userId: string) => {
    try {
      const { year } = getCurrentYearMonth()
      const monthlyData = await getMonthlyIncomeData(userId, year)
      
      // Convert monthly data to payday entries (simplified)
      const existingEntries: PaydayEntry[] = monthlyData.map((month, index) => ({
        id: `existing-${month.id || index}`,
        payday: `${year}-${month.month.toString().padStart(2, '0')}-25`, // Assume 25th payday
        amount: month.income_amount,
        description: `${month.month}月分収入`,
        deductions: { tax: 0, socialInsurance: 0, other: 0 }
      }))
      
      setEntries(existingEntries)
    } catch (error) {
      console.error('Failed to load existing entries:', error)
    }
  }

  const classifyPaydayToMonth = (payday: string): number => {
    const payDate = new Date(payday)
    const payDay = payDate.getDate()
    
    // If paid before 15th, consider it for previous month's work
    if (payDay <= 15) {
      const month = payDate.getMonth()
      return month === 0 ? 12 : month
    } else {
      // If paid after 15th, consider it for current month's work
      return payDate.getMonth() + 1
    }
  }

  const calculateNetAmount = (entry: Partial<PaydayEntry>): number => {
    const gross = entry.amount || 0
    const deductions = entry.deductions || { tax: 0, socialInsurance: 0, other: 0 }
    return gross - deductions.tax - deductions.socialInsurance - deductions.other
  }

  const addEntry = () => {
    if (!newEntry.payday || !newEntry.amount || newEntry.amount <= 0) {
      showToast('給料日と金額を正しく入力してください', 'error')
      return
    }

    const entry: PaydayEntry = {
      id: `new-${Date.now()}`,
      payday: newEntry.payday,
      amount: newEntry.amount,
      description: newEntry.description || '',
      deductions: newEntry.deductions || { tax: 0, socialInsurance: 0, other: 0 }
    }

    setEntries([...entries, entry])
    setNewEntry({
      payday: '',
      amount: 0,
      description: '',
      deductions: { tax: 0, socialInsurance: 0, other: 0 }
    })
    setShowDeductions(false)
  }

  const removeEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id))
  }

  const saveAllEntries = async () => {
    if (!userId) {
      showToast('認証エラー：ログインしてください', 'error')
      return
    }

    setLoading(true)
    try {
      // Group entries by month and calculate totals
      const monthlyTotals: { [month: number]: number } = {}
      
      entries.forEach(entry => {
        const month = classifyPaydayToMonth(entry.payday)
        const netAmount = calculateNetAmount(entry)
        monthlyTotals[month] = (monthlyTotals[month] || 0) + netAmount
      })

      // Save each month's total
      const { year } = getCurrentYearMonth()
      const savePromises = Object.entries(monthlyTotals).map(([month, amount]) =>
        saveMonthlyIncome(userId, year, parseInt(month), {
          income_amount: amount,
          is_estimated: false,
          input_method: 'manual'
        })
      )

      await Promise.all(savePromises)
      
      showToast('給料データを保存しました', 'success')
      onSave?.()
    } catch (error) {
      console.error('Failed to save entries:', error)
      showToast('保存に失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className={`bg-white rounded-2xl shadow-xl p-6 ${className}`}>
      <h3 className="font-bold text-gray-900 mb-4 flex items-center">
        <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
        給料日ベース収入入力
      </h3>

      {/* New Entry Form */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-700 mb-3">新しい給料を追加</h4>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Payday */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              給料日
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={newEntry.payday}
                onChange={(e) => setNewEntry({ ...newEntry, payday: e.target.value })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支給額（税込み）
            </label>
            <input
              type="number"
              value={newEntry.amount || ''}
              onChange={(e) => setNewEntry({ ...newEntry, amount: parseInt(e.target.value) || 0 })}
              placeholder="例: 150000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Optional: Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              備考（任意）
            </label>
            <input
              type="text"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              placeholder="例: アルバイト代、時給1000円×150時間"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Toggle Deductions */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowDeductions(!showDeductions)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showDeductions ? '控除項目を隠す' : '控除項目を表示'}
            </button>
          </div>

          {/* Deductions (Optional) */}
          {showDeductions && (
            <div className="grid grid-cols-3 gap-3 p-3 bg-gray-100 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">所得税</label>
                <input
                  type="number"
                  value={newEntry.deductions?.tax || ''}
                  onChange={(e) => setNewEntry({ 
                    ...newEntry, 
                    deductions: { 
                      ...newEntry.deductions!, 
                      tax: parseInt(e.target.value) || 0 
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">社会保険</label>
                <input
                  type="number"
                  value={newEntry.deductions?.socialInsurance || ''}
                  onChange={(e) => setNewEntry({ 
                    ...newEntry, 
                    deductions: { 
                      ...newEntry.deductions!, 
                      socialInsurance: parseInt(e.target.value) || 0 
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">その他</label>
                <input
                  type="number"
                  value={newEntry.deductions?.other || ''}
                  onChange={(e) => setNewEntry({ 
                    ...newEntry, 
                    deductions: { 
                      ...newEntry.deductions!, 
                      other: parseInt(e.target.value) || 0 
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Net Amount Preview */}
          {(newEntry.amount || 0) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>支給額（税込み）:</span>
                  <span>{formatCurrency(newEntry.amount || 0)}</span>
                </div>
                {showDeductions && (
                  <>
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>控除合計:</span>
                      <span>-{formatCurrency(
                        (newEntry.deductions?.tax || 0) + 
                        (newEntry.deductions?.socialInsurance || 0) + 
                        (newEntry.deductions?.other || 0)
                      )}</span>
                    </div>
                    <hr className="my-1 border-blue-200" />
                  </>
                )}
                <div className="flex justify-between font-medium">
                  <span>手取り額:</span>
                  <span>{formatCurrency(calculateNetAmount(newEntry))}</span>
                </div>
                <div className="text-xs mt-1">
                  分類先: {classifyPaydayToMonth(newEntry.payday || '')}月分収入
                </div>
              </div>
            </div>
          )}

          <button
            onClick={addEntry}
            disabled={!newEntry.payday || !newEntry.amount || newEntry.amount <= 0}
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>
      </div>

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 mb-3">入力済み給料一覧</h4>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center text-sm font-medium text-gray-900">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(entry.payday)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {entry.description && `${entry.description} • `}
                    手取り: {formatCurrency(calculateNetAmount(entry))} 
                    （{classifyPaydayToMonth(entry.payday)}月分）
                  </div>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="ml-3 p-1 text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      {entries.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {entries.length}件の給料データ
          </div>
          <button
            onClick={saveAllEntries}
            disabled={loading}
            className="bg-green-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </button>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}