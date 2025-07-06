'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Check, Edit2, Save, X, RefreshCw, Database, Wifi, WifiOff } from 'lucide-react'
import { 
  getActiveThresholds,
  checkThresholdSystemHealth,
  invalidateThresholdCache,
  DynamicThreshold,
  ThresholdMap 
} from '@/lib/thresholdRepo'
import { 
  getThresholdSystemStatus,
  previewThresholdsForYear,
  analyzeThresholdImpact,
  formatCurrencyV2 
} from '@/lib/fuyouClassifierV2'
import { useToastFallback } from '@/components/notifications/Toast'

interface ThresholdSystemHealth {
  isHealthy: boolean
  source: 'database' | 'fallback' | 'env_fallback'
  thresholdCount: number
  availableThresholds: string[]
}

interface EditingThreshold {
  key: string
  yen: number
  label: string
}

export default function ThresholdManager() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [thresholds, setThresholds] = useState<ThresholdMap>({})
  const [systemHealth, setSystemHealth] = useState<ThresholdSystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingThreshold, setEditingThreshold] = useState<EditingThreshold | null>(null)
  const [tempValue, setTempValue] = useState<string>('')
  const [refreshing, setRefreshing] = useState(false)
  const { showToast, ToastContainer } = useToastFallback()

  // Available years for management
  const availableYears = [2024, 2025, 2026]
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    loadData()
  }, [selectedYear])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load thresholds for selected year
      const thresholdsData = await getActiveThresholds(selectedYear)
      setThresholds(thresholdsData)

      // Load system health
      const healthData = await getThresholdSystemStatus()
      setSystemHealth(healthData)

      console.log(`✅ Loaded ${Object.keys(thresholdsData).length} thresholds for year ${selectedYear}`)
    } catch (error) {
      console.error('Failed to load threshold data:', error)
      showToast('データの読み込みに失敗しました', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      invalidateThresholdCache()
      await loadData()
      showToast('データを更新しました', 'success')
    } catch (error) {
      console.error('Failed to refresh data:', error)
      showToast('データの更新に失敗しました', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const startEditing = (threshold: DynamicThreshold) => {
    setEditingThreshold({
      key: threshold.key,
      yen: threshold.yen,
      label: threshold.label
    })
    setTempValue(threshold.yen.toString())
  }

  const cancelEditing = () => {
    setEditingThreshold(null)
    setTempValue('')
  }

  const saveThreshold = async () => {
    if (!editingThreshold) return

    const newYen = parseInt(tempValue)
    if (isNaN(newYen) || newYen <= 0) {
      showToast('有効な金額を入力してください', 'error')
      return
    }

    try {
      // Here you would call the API to update the threshold
      console.log(`Would update ${editingThreshold.key} to ${newYen} yen for year ${selectedYear}`)
      
      // For demo purposes, update local state
      setThresholds(prev => ({
        ...prev,
        [editingThreshold.key]: {
          ...prev[editingThreshold.key],
          yen: newYen
        }
      }))

      showToast(`${editingThreshold.label}を${formatCurrencyV2(newYen)}に更新しました`, 'success')
      setEditingThreshold(null)
      setTempValue('')
    } catch (error) {
      console.error('Failed to save threshold:', error)
      showToast('保存に失敗しました', 'error')
    }
  }

  const activateYear = async (year: number) => {
    try {
      // Here you would call the API to activate thresholds for the year
      console.log(`Would activate thresholds for year ${year}`)
      showToast(`${year}年の閾値を有効化しました`, 'success')
      await loadData()
    } catch (error) {
      console.error('Failed to activate year:', error)
      showToast('年度の有効化に失敗しました', 'error')
    }
  }

  const getHealthIcon = () => {
    if (!systemHealth) return <Database className="h-5 w-5 text-gray-400" />
    
    switch (systemHealth.source) {
      case 'database':
        return <Wifi className="h-5 w-5 text-green-500" />
      case 'fallback':
      case 'env_fallback':
        return <WifiOff className="h-5 w-5 text-yellow-500" />
      default:
        return <Database className="h-5 w-5 text-gray-400" />
    }
  }

  const getHealthColor = () => {
    if (!systemHealth) return 'text-gray-500'
    
    switch (systemHealth.source) {
      case 'database':
        return 'text-green-600'
      case 'fallback':
      case 'env_fallback':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getHealthMessage = () => {
    if (!systemHealth) return 'システム状態を確認中...'
    
    switch (systemHealth.source) {
      case 'database':
        return 'データベースから正常に読み込み中'
      case 'fallback':
        return 'フォールバック値を使用中（データベース接続なし）'
      case 'env_fallback':
        return '環境変数のフォールバック値を使用中'
      default:
        return 'システム状態不明'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">読み込み中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            {getHealthIcon()}
            <h3 className="text-lg font-semibold ml-2">システム状態</h3>
          </div>
          <div className="space-y-2">
            <div className={`text-sm ${getHealthColor()}`}>
              {getHealthMessage()}
            </div>
            <div className="text-sm text-gray-600">
              閾値数: {systemHealth?.thresholdCount || 0}
            </div>
            <div className="text-sm text-gray-600">
              対象年: {selectedYear}年
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">管理年度</h3>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {year}年
                {year === currentYear && (
                  <span className="ml-1 text-xs">(現在)</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Thresholds Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedYear}年 扶養閾値一覧
            </h3>
            {selectedYear > currentYear && (
              <button
                onClick={() => activateYear(selectedYear)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
              >
                この年度を有効化
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {Object.keys(thresholds).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedYear}年の閾値データがありません
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(thresholds).map((threshold) => (
                <div 
                  key={threshold.key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {threshold.label}
                    </div>
                    <div className="text-sm text-gray-600">
                      種別: {threshold.kind === 'tax' ? '税制' : '社会保険'} | 
                      キー: {threshold.key}
                    </div>
                    {threshold.description && (
                      <div className="text-sm text-gray-500 mt-1">
                        {threshold.description}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-4">
                    {editingThreshold?.key === threshold.key ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="金額（円）"
                        />
                        <button
                          onClick={saveThreshold}
                          className="p-1 text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-lg">
                          {formatCurrencyV2(threshold.yen)}
                        </span>
                        <button
                          onClick={() => startEditing(threshold)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Preview Changes for Future Years */}
      {selectedYear > currentYear && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-900 mb-2">
                {selectedYear}年度変更プレビュー
              </h4>
              <p className="text-sm text-blue-700 mb-4">
                この年度の閾値は現在無効化されています。有効化すると以下の変更が適用されます。
              </p>
              
              {/* Here you would show the impact analysis */}
              <div className="text-sm text-blue-600">
                ※ 実際の運用では、変更による影響分析が表示されます
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  )
}