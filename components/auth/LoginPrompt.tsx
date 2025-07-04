'use client'

import { LogIn, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LoginPromptProps {
  message?: string
  onLogin?: () => void
}

export default function LoginPrompt({ 
  message = 'この機能を利用するにはログインが必要です',
  onLogin 
}: LoginPromptProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = () => {
    setIsLoading(true)
    if (onLogin) {
      onLogin()
    } else {
      router.push('/login')
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
            onClick={handleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isLoading ? 'ログインページへ移動中...' : 'ログインページへ'}
          </button>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              ログインすることで、扶養控除の計算と収入管理機能をご利用いただけます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}