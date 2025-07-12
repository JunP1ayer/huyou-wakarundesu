'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Save, RefreshCw, AlertTriangle } from 'lucide-react'

// ユーザー設定の型定義
export interface UserPreferences {
  fuyouLine: number
  isStudent: boolean
  workSchedule: 'partTime' | 'fullTime' | 'irregular'
  notificationEnabled: boolean
  thresholdWarning: number // 扶養限度額の何%で警告するか
  autoSync: boolean
  currency: 'JPY'
  language: 'ja' | 'en'
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentSettings: UserPreferences
  onSave: (settings: UserPreferences) => Promise<void>
}

const defaultSettings: UserPreferences = {
  fuyouLine: 1030000, // 103万円
  isStudent: false,
  workSchedule: 'partTime',
  notificationEnabled: true,
  thresholdWarning: 80, // 80%で警告
  autoSync: true,
  currency: 'JPY',
  language: 'ja',
}

export default function SettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSave
}: SettingsModalProps) {
  const [settings, setSettings] = useState<UserPreferences>(currentSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const modalRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLSelectElement>(null)

  // 設定変更の検出
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(currentSettings)
    setHasChanges(changed)
  }, [settings, currentSettings])

  // フォーカス管理とキーボードナビゲーション
  useEffect(() => {
    if (isOpen) {
      firstInputRef.current?.focus()
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // スクロールを無効化
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, handleClose])

  // フォーカストラップ（アクセシビリティ対応）
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (!focusableElements || focusableElements.length === 0) return
      
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }
  }

  const validateSettings = (newSettings: UserPreferences): Record<string, string> => {
    const newErrors: Record<string, string> = {}
    
    if (newSettings.fuyouLine < 500000 || newSettings.fuyouLine > 5000000) {
      newErrors.fuyouLine = '扶養限度額は50万円〜500万円の範囲で設定してください'
    }
    
    if (newSettings.thresholdWarning < 50 || newSettings.thresholdWarning > 100) {
      newErrors.thresholdWarning = '警告閾値は50%〜100%の範囲で設定してください'
    }
    
    return newErrors
  }

  const handleSave = async () => {
    const validationErrors = validateSettings(settings)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    
    setIsSaving(true)
    setErrors({})
    
    try {
      await onSave(settings)
      onClose()
    } catch (error) {
      console.error('設定の保存に失敗:', error)
      setErrors({ general: '設定の保存に失敗しました。もう一度お試しください。' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (confirm('変更が保存されていません。閉じてもよろしいですか？')) {
        setSettings(currentSettings) // 変更を破棄
        onClose()
      }
    } else {
      onClose()
    }
  }, [hasChanges, currentSettings, onClose])

  const handleReset = () => {
    if (confirm('すべての設定をデフォルトに戻しますか？')) {
      setSettings(defaultSettings)
    }
  }

  const handleInputChange = (key: keyof UserPreferences, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    // エラーをクリア
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        onKeyDown={handleKeyDown}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="settings-modal-title"
        aria-describedby="settings-modal-description"
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 id="settings-modal-title" className="text-xl font-semibold text-gray-900">
              設定
            </h2>
            <p id="settings-modal-description" className="text-sm text-gray-500 mt-1">
              扶養管理に関する設定を変更できます
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="設定を閉じる"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* エラー表示 */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{errors.general}</span>
            </div>
          )}

          {/* 基本設定 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">基本設定</h3>
            
            {/* 扶養限度額 */}
            <div>
              <label htmlFor="fuyou-line" className="block text-sm font-medium text-gray-700 mb-1">
                扶養限度額
              </label>
              <select
                id="fuyou-line"
                ref={firstInputRef}
                value={settings.fuyouLine}
                onChange={(e) => handleInputChange('fuyouLine', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1030000}>103万円（所得税の扶養控除）</option>
                <option value={1060000}>106万円（社会保険の扶養・大企業）</option>
                <option value={1300000}>130万円（社会保険の扶養・一般）</option>
                <option value={1500000}>150万円（配偶者特別控除）</option>
              </select>
              {errors.fuyouLine && (
                <p className="text-red-600 text-sm mt-1">{errors.fuyouLine}</p>
              )}
            </div>

            {/* 学生かどうか */}
            <div className="flex items-center space-x-2">
              <input
                id="is-student"
                type="checkbox"
                checked={settings.isStudent}
                onChange={(e) => handleInputChange('isStudent', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is-student" className="text-sm text-gray-700">
                学生です（勤労学生控除の適用対象）
              </label>
            </div>

            {/* 働き方 */}
            <div>
              <label htmlFor="work-schedule" className="block text-sm font-medium text-gray-700 mb-1">
                働き方
              </label>
              <select
                id="work-schedule"
                value={settings.workSchedule}
                onChange={(e) => handleInputChange('workSchedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="partTime">アルバイト・パート</option>
                <option value="fullTime">正社員・契約社員</option>
                <option value="irregular">不定期・単発</option>
              </select>
            </div>
          </div>

          {/* 通知設定 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">通知設定</h3>
            
            <div className="flex items-center space-x-2">
              <input
                id="notification-enabled"
                type="checkbox"
                checked={settings.notificationEnabled}
                onChange={(e) => handleInputChange('notificationEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="notification-enabled" className="text-sm text-gray-700">
                扶養限度額接近時に通知する
              </label>
            </div>

            {settings.notificationEnabled && (
              <div>
                <label htmlFor="threshold-warning" className="block text-sm font-medium text-gray-700 mb-1">
                  警告の閾値（限度額の何%で通知するか）
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    id="threshold-warning"
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={settings.thresholdWarning}
                    onChange={(e) => handleInputChange('thresholdWarning', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {settings.thresholdWarning}%
                  </span>
                </div>
                {errors.thresholdWarning && (
                  <p className="text-red-600 text-sm mt-1">{errors.thresholdWarning}</p>
                )}
              </div>
            )}
          </div>

          {/* その他の設定 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">その他</h3>
            
            <div className="flex items-center space-x-2">
              <input
                id="auto-sync"
                type="checkbox"
                checked={settings.autoSync}
                onChange={(e) => handleInputChange('autoSync', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="auto-sync" className="text-sm text-gray-700">
                銀行口座と自動同期する
              </label>
            </div>

            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                言語
              </label>
              <select
                id="language"
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ja">日本語</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>デフォルトに戻す</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? '保存中...' : '保存'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}