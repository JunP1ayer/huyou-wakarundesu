'use client'

import { LogIn, User } from 'lucide-react'

interface LoginPromptProps {
  message?: string
  onLogin?: () => void
}

export default function LoginPrompt({ 
  message = 'この機能を利用するにはログインが必要です',
  onLogin 
}: LoginPromptProps) {
  const handleGoogleLogin = async () => {
    try {
      // Google OAuth のリダイレクト処理をここに実装
      // 現在はSupabase OAuth 設定待ち
      if (onLogin) {
        onLogin()
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            ログインが必要です
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Googleでログイン
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              ログインすることで、扶養控除の計算とMoneytree連携による自動収入管理をご利用いただけます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}