'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react'

// 銀行接続の状態を表す型
export type BankConnectionStatus = 'connected' | 'error' | 'loading' | 'disconnected'

// 銀行接続情報の型
export interface BankConnection {
  id: string
  bankName: string
  accountNumber: string
  status: BankConnectionStatus
  lastSync?: Date
  error?: string
}

interface BankConnectionManagerProps {
  onConnectionChange?: (connections: BankConnection[]) => void
  className?: string
}

// モック用の銀行接続データ
const mockConnections: BankConnection[] = [
  {
    id: '1',
    bankName: '三菱UFJ銀行',
    accountNumber: '****1234',
    status: 'connected',
    lastSync: new Date(Date.now() - 1000 * 60 * 30), // 30分前
  },
  {
    id: '2', 
    bankName: 'ゆうちょ銀行',
    accountNumber: '****5678',
    status: 'error',
    error: '認証エラー：再認証が必要です',
  },
]

export default function BankConnectionManager({ 
  onConnectionChange, 
  className = '' 
}: BankConnectionManagerProps) {
  const [connections, setConnections] = useState<BankConnection[]>(mockConnections)
  const [isAdding, setIsAdding] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    onConnectionChange?.(connections)
  }, [connections, onConnectionChange])

  const handleAddConnection = async () => {
    setIsAdding(true)
    try {
      // 実際の実装ではMoneytree APIを呼び出し
      // 今回はモックで新しい接続を追加
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newConnection: BankConnection = {
        id: String(Date.now()),
        bankName: '楽天銀行',
        accountNumber: '****9999',
        status: 'connected',
        lastSync: new Date(),
      }
      
      setConnections(prev => [...prev, newConnection])
    } catch (error) {
      console.error('銀行接続の追加に失敗:', error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleRefreshConnection = async (connectionId: string) => {
    setIsRefreshing(true)
    try {
      // Moneytree APIで接続を更新
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'connected' as const, lastSync: new Date(), error: undefined }
          : conn
      ))
    } catch (error) {
      console.error('接続の更新に失敗:', error)
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'error' as const, error: '更新に失敗しました' }
          : conn
      ))
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleRemoveConnection = async (connectionId: string) => {
    if (!confirm('この銀行接続を削除しますか？')) return
    
    try {
      // Moneytree APIで接続を削除
      await new Promise(resolve => setTimeout(resolve, 1000))
      setConnections(prev => prev.filter(conn => conn.id !== connectionId))
    } catch (error) {
      console.error('接続の削除に失敗:', error)
    }
  }

  const getStatusIcon = (status: BankConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusText = (connection: BankConnection) => {
    switch (connection.status) {
      case 'connected':
        return connection.lastSync 
          ? `最終同期: ${connection.lastSync.toLocaleString('ja-JP', { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}`
          : '接続済み'
      case 'error':
        return connection.error || 'エラーが発生しています'
      case 'loading':
        return '同期中...'
      default:
        return '未接続'
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">銀行口座連携</h3>
        <button
          onClick={handleAddConnection}
          disabled={isAdding}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{isAdding ? '接続中...' : '銀行を追加'}</span>
        </button>
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="mb-2">銀行口座が接続されていません</div>
          <div className="text-sm">「銀行を追加」から口座を接続してください</div>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(connection.status)}
                <div>
                  <div className="font-medium text-gray-900">
                    {connection.bankName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {connection.accountNumber}
                  </div>
                  <div className="text-xs text-gray-400">
                    {getStatusText(connection)}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {connection.status === 'error' && (
                  <button
                    onClick={() => handleRefreshConnection(connection.id)}
                    disabled={isRefreshing}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="再接続"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => handleRemoveConnection(connection.id)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title="接続を削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <div>💡 銀行口座を接続すると、収入の自動取得が可能になります</div>
        <div>🔒 接続情報は暗号化されて安全に保存されます</div>
      </div>
    </div>
  )
}