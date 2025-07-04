'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 Global Error Boundary caught an error:', error, errorInfo)
    
    // Log to external service if needed
    this.logErrorToService(error, errorInfo)
    
    this.setState({ error, errorInfo })
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, you would send this to your error tracking service
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😵</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                申し訳ございません
              </h1>
              <p className="text-gray-600 mb-6">
                予期しないエラーが発生しました。ページを再読み込みするか、しばらく時間をおいてから再度お試しください。
              </p>

              <div className="space-y-3">
                <button
                  onClick={this.handleReload}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  ページを再読み込み
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                >
                  ホームページに戻る
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    開発者向け詳細情報
                  </summary>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <div className="font-mono text-red-800">
                      <div className="font-bold">Error:</div>
                      <div className="mb-2">{this.state.error.message}</div>
                      <div className="font-bold">Stack:</div>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Specific error components for common scenarios
export function AuthError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-4xl mb-4">🔐</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">認証エラー</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              再試行
            </button>
          )}
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    </div>
  )
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
      <div className="flex items-start">
        <div className="text-yellow-600 mr-3">⚠️</div>
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800">ネットワークエラー</h3>
          <p className="text-sm text-yellow-700 mt-1">
            インターネット接続を確認して、もう一度お試しください。
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
            >
              再試行
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ValidationError({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex items-start">
        <div className="text-red-600 mr-3">❌</div>
        <div className="flex-1">
          <h3 className="font-medium text-red-800">入力エラー</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
      </div>
    </div>
  )
}

export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-md p-4">
      <div className="flex items-start">
        <div className="text-green-600 mr-3">✅</div>
        <div className="flex-1">
          <p className="text-sm text-green-700">{message}</p>
        </div>
      </div>
    </div>
  )
}

// Hook for handling async errors
export function useErrorHandler() {
  const handleError = (error: unknown, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error)
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Failed to fetch')) {
        return 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      }
      
      if (error.message.includes('Unauthorized') || error.message.includes('403')) {
        return 'この操作を行う権限がありません。ログインし直してください。'
      }
      
      if (error.message.includes('Not found') || error.message.includes('404')) {
        return 'お探しのページまたはデータが見つかりません。'
      }
      
      return `エラーが発生しました: ${error.message}`
    }
    
    return '予期しないエラーが発生しました。'
  }

  return { handleError }
}