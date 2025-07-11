'use client'

import React, { Component, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AuthErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface AuthErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AUTH-ERROR-BOUNDARY] Authentication error caught:', error, errorInfo)
    
    // Log to external service if needed
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
    }
    
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <AuthErrorFallback 
          error={this.state.error} 
          errorInfo={this.state.errorInfo}
          onRetry={() => this.setState({ hasError: false, error: null, errorInfo: null })}
        />
      )
    }

    return this.props.children
  }
}

interface AuthErrorFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  onRetry: () => void
}

function AuthErrorFallback({ error, onRetry }: AuthErrorFallbackProps) {
  const router = useRouter()

  const handleRetry = () => {
    onRetry()
    // Optionally refresh the page or redirect
    window.location.reload()
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  const isAuthError = error?.message?.toLowerCase().includes('auth') ||
                     error?.message?.toLowerCase().includes('session') ||
                     error?.message?.toLowerCase().includes('unauthorized')

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isAuthError ? '認証エラーが発生しました' : 'エラーが発生しました'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {isAuthError 
            ? 'セッションに問題が発生しました。再度ログインが必要です。'
            : 'アプリケーションエラーが発生しました。再試行してください。'
          }
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left bg-gray-50 p-4 rounded-lg mb-6">
            <summary className="cursor-pointer font-medium">エラー詳細 (開発者向け)</summary>
            <div className="mt-2 text-sm">
              <p><strong>Error:</strong> {error.message}</p>
              <p><strong>Stack:</strong></p>
              <pre className="text-xs overflow-auto">{error.stack}</pre>
            </div>
          </details>
        )}

        <div className="space-y-3">
          {isAuthError ? (
            <>
              <button
                onClick={handleGoToLogin}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                ログインページへ
              </button>
              <button
                onClick={handleRetry}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                再試行
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleRetry}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                再試行
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                ホームに戻る
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthErrorBoundary