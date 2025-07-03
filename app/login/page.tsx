'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { LogIn, Mail, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const { supabase, session, loading } = useSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Check for error parameters from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error) {
      switch (error) {
        case 'auth_failed':
          setMessage('認証に失敗しました。再度お試しください。')
          break
        case 'no_session':
          setMessage('セッションが作成されませんでした。再度ログインしてください。')
          break
        case 'callback_failed':
          setMessage('認証処理でエラーが発生しました。')
          break
        case 'no_supabase':
          setMessage('認証システムが利用できません。')
          break
        default:
          setMessage('エラーが発生しました。')
      }
      // Clear the error from URL
      router.replace('/login', undefined)
    }
  }, [])

  // Already logged in? Redirect to dashboard
  useEffect(() => {
    if (!loading && session) {
      router.replace('/dashboard')
    }
  }, [session, loading, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !email) return

    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        setMessage(`エラー: ${error.message}`)
      } else {
        setMessage('マジックリンクを送信しました！メールボックスを確認してください。')
      }
    } catch (error) {
      console.error('Login error:', error)
      setMessage('ログインに失敗しました。再試行してください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setMessage('デモモードです。認証が設定されていません。')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('Google login error:', error)
        if (error.message.includes('provider is not enabled')) {
          setMessage('Google認証が設定されていません。管理者にお問い合わせください。')
        } else if (error.message.includes('redirect_uri_mismatch')) {
          setMessage('リダイレクトURIの設定に問題があります。管理者にお問い合わせください。')
        } else {
          setMessage(`Google ログインエラー: ${error.message}`)
        }
        setIsLoading(false)
      }
      // 成功時はリダイレクトされるのでloadingはfalseにしない
    } catch (error) {
      console.error('Google login error:', error)
      setMessage('Google ログインに失敗しました。再試行してください。')
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">扶養わかるんです</h1>
          <h2 className="mt-6 text-2xl font-extrabold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            扶養控除の計算とMoneytree連携による自動収入管理
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-8 space-y-6">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {isLoading ? 'ログイン中...' : 'Googleでログイン'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">または</span>
            </div>
          </div>

          {/* Email Login */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="メールアドレス"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !email}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mail className="w-5 h-5 mr-2" />
              {isLoading ? '送信中...' : 'マジックリンクを送信'}
            </button>
          </form>

          {/* Message */}
          {message && (
            <div className={`text-sm text-center p-3 rounded-md ${
              message.includes('エラー') || message.includes('失敗') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          {/* Back to Home */}
          <div className="text-center">
            <Link 
              href="/"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              ホームに戻る
            </Link>
          </div>

          {/* Demo Mode Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              デモモードでは認証なしでお試しいただけます。<br />
              本格利用にはログインが必要です。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}