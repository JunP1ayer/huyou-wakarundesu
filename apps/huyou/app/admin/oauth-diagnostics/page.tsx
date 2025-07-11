'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink, Copy, Check } from 'lucide-react'

interface ValidationResult {
  status: 'ready' | 'partial' | 'error'
  timestamp: string
  environment: {
    supabaseUrl: {
      configured: boolean
      valid: boolean
      value: string
    }
    supabaseKey: {
      configured: boolean
      valid: boolean
      length: number
    }
  }
  oauth: {
    googleProvider: {
      status: 'unknown' | 'enabled' | 'disabled' | 'error'
      error: string | null
      details: string | null
    }
  }
  connectivity: {
    supabaseConnection: boolean
    authEndpoint: boolean
  }
  recommendations: string[]
}

export default function OAuthDiagnosticsPage() {
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState('')

  const runValidation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/validate')
      const data = await response.json()
      setValidation(data)
    } catch (error) {
      console.error('Validation failed:', error)
      setValidation({
        status: 'error',
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: { configured: false, valid: false, value: 'エラー' },
          supabaseKey: { configured: false, valid: false, length: 0 }
        },
        oauth: {
          googleProvider: { status: 'error', error: 'API接続失敗', details: null }
        },
        connectivity: {
          supabaseConnection: false,
          authEndpoint: false
        },
        recommendations: ['診断APIへの接続に失敗しました']
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runValidation()
  }, [])

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  const getStatusIcon = (status: boolean | string) => {
    if (status === true || status === 'enabled' || status === 'ready') {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    } else if (status === 'partial' || status === 'unknown') {
      return <AlertCircle className="w-5 h-5 text-yellow-600" />
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getStatusColor = (status: boolean | string) => {
    if (status === true || status === 'enabled' || status === 'ready') {
      return 'text-green-700 bg-green-50 border-green-200'
    } else if (status === 'partial' || status === 'unknown') {
      return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    } else {
      return 'text-red-700 bg-red-50 border-red-200'
    }
  }

  const getOverallStatus = () => {
    if (!validation) return 'unknown'
    return validation.status
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OAuth 設定診断ツール
          </h1>
          <p className="text-gray-600">
            Google OAuth 認証の設定状況を詳細に診断します
          </p>
        </div>

        {/* Overall Status */}
        <div className={`mb-8 p-6 rounded-lg border ${getStatusColor(getOverallStatus())}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(getOverallStatus())}
              <div>
                <h2 className="text-lg font-semibold">
                  全体ステータス: {
                    getOverallStatus() === 'ready' ? '✅ 設定完了' :
                    getOverallStatus() === 'partial' ? '⚠️ 部分的設定' :
                    getOverallStatus() === 'error' ? '❌ 設定エラー' : '🔍 診断中'
                  }
                </h2>
                {validation && (
                  <p className="text-sm opacity-75">
                    最終診断: {new Date(validation.timestamp).toLocaleString('ja-JP')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={runValidation}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>再診断</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-gray-600">設定を診断しています...</p>
          </div>
        )}

        {/* Validation Results */}
        {validation && !isLoading && (
          <div className="space-y-6">
            {/* Environment Variables */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🔧 環境変数設定</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(validation.environment.supabaseUrl.valid)}
                    <div>
                      <p className="font-medium">NEXT_PUBLIC_SUPABASE_URL</p>
                      <p className="text-sm text-gray-600">{validation.environment.supabaseUrl.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      validation.environment.supabaseUrl.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {validation.environment.supabaseUrl.valid ? '有効' : '無効'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(validation.environment.supabaseKey.valid)}
                    <div>
                      <p className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
                      <p className="text-sm text-gray-600">長さ: {validation.environment.supabaseKey.length} 文字</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      validation.environment.supabaseKey.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {validation.environment.supabaseKey.valid ? 'JWT形式' : '無効形式'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Connectivity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🌐 接続テスト</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(validation.connectivity.supabaseConnection)}
                    <span className="font-medium">Supabase 接続</span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${
                    validation.connectivity.supabaseConnection ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {validation.connectivity.supabaseConnection ? '接続成功' : '接続失敗'}
                  </span>
                </div>
              </div>
            </div>

            {/* OAuth Configuration */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">🔐 OAuth 設定</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(validation.oauth.googleProvider.status === 'enabled')}
                      <span className="font-medium">Google OAuth Provider</span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      validation.oauth.googleProvider.status === 'enabled' 
                        ? 'bg-green-100 text-green-700' 
                        : validation.oauth.googleProvider.status === 'disabled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {validation.oauth.googleProvider.status === 'enabled' ? '有効' : 
                       validation.oauth.googleProvider.status === 'disabled' ? '無効' : '不明'}
                    </span>
                  </div>
                  
                  {validation.oauth.googleProvider.error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>エラー:</strong> {validation.oauth.googleProvider.error}
                    </div>
                  )}
                  
                  {validation.oauth.googleProvider.details && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      {validation.oauth.googleProvider.details}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {validation.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">💡 推奨事項</h3>
                <div className="space-y-3">
                  {validation.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-blue-800 text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">⚡ クイックアクション</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href="/login"
                  className="flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  <span>ログインページでテスト</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                
                <button
                  onClick={() => copyToClipboard(window.location.origin + '/auth/callback', 'callback')}
                  className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {copied === 'callback' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>コールバックURLをコピー</span>
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Google Cloud Console で設定すべきリダイレクトURI:</strong>
                </p>
                <div className="space-y-1 text-sm font-mono">
                  <div className="flex items-center justify-between">
                    <code className="text-gray-800">{window.location.origin}/auth/callback</code>
                    <button
                      onClick={() => copyToClipboard(window.location.origin + '/auth/callback', 'uri1')}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {copied === 'uri1' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-gray-800">https://[project-ref].supabase.co/auth/v1/callback</code>
                    <button
                      onClick={() => copyToClipboard('https://[project-ref].supabase.co/auth/v1/callback', 'uri2')}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {copied === 'uri2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentation Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">📚 設定ガイド</h3>
              <div className="space-y-2">
                <a
                  href="https://console.cloud.google.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Google Cloud Console</span>
                </a>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Supabase Dashboard</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}