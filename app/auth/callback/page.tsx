'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { CheckCircle, XCircle, Loader } from 'lucide-react'

type AuthState = 'processing' | 'success' | 'error' | 'timeout'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { supabase } = useSupabase()
  const [authState, setAuthState] = useState<AuthState>('processing')
  const [message, setMessage] = useState('認証処理を開始しています...')

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleAuthCallback = async () => {
      if (!supabase) {
        setAuthState('error')
        setMessage('認証システムが利用できません。')
        setTimeout(() => router.replace('/login?error=no_supabase'), 3000)
        return
      }

      try {
        setMessage('認証情報を確認しています...')
        
        // URL パラメータから認証エラーをチェック
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (error) {
          console.error('🔴 OAuth Callback Error:', error, errorDescription)
          setAuthState('error')
          
          if (error === 'access_denied') {
            setMessage('Googleアクセスが拒否されました。')
          } else if (error === 'unauthorized_client') {
            setMessage('認証設定に問題があります。管理者にお問い合わせください。')
          } else {
            setMessage(`認証エラー: ${errorDescription || error}`)
          }
          
          setTimeout(() => router.replace('/login?error=oauth_denied'), 5000)
          return
        }

        setMessage('セッション情報を取得しています...')
        
        // セッション取得（最大3回リトライ）
        let session = null
        for (let i = 0; i < 3; i++) {
          const { data, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error(`🔴 Session fetch error (attempt ${i + 1}):`, sessionError)
            if (i === 2) throw sessionError
            await new Promise(resolve => setTimeout(resolve, 1000))
            continue
          }
          
          if (data.session) {
            session = data.session
            break
          }
          
          if (i < 2) {
            setMessage(`セッション確認中... (${i + 2}/3)`)
            await new Promise(resolve => setTimeout(resolve, 1500))
          }
        }

        if (session?.user) {
          console.log('✅ Authentication successful:', {
            email: session.user.email,
            provider: session.user.app_metadata?.provider,
            userId: session.user.id
          })
          
          setAuthState('success')
          setMessage(`${session.user.email} でログインしました！`)
          
          // ダッシュボードにリダイレクト
          setTimeout(() => router.replace('/dashboard'), 2000)
        } else {
          console.log('❌ No session found after callback attempts')
          setAuthState('error')
          setMessage('認証セッションが作成されませんでした。再度ログインしてください。')
          setTimeout(() => router.replace('/login?error=no_session'), 4000)
        }
      } catch (error) {
        console.error('🔴 Callback handling exception:', error)
        setAuthState('error')
        setMessage('認証処理でエラーが発生しました。')
        setTimeout(() => router.replace('/login?error=callback_failed'), 4000)
      }
    }

    // タイムアウト設定（30秒）
    timeoutId = setTimeout(() => {
      if (authState === 'processing') {
        setAuthState('timeout')
        setMessage('認証処理がタイムアウトしました。再度お試しください。')
        setTimeout(() => router.replace('/login?error=timeout'), 4000)
      }
    }, 30000)

    handleAuthCallback()

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [supabase, router, searchParams, authState])

  const getIcon = () => {
    switch (authState) {
      case 'processing':
        return <Loader className="animate-spin h-8 w-8 text-indigo-600" />
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />
      case 'error':
      case 'timeout':
        return <XCircle className="h-8 w-8 text-red-600" />
    }
  }

  const getBackgroundColor = () => {
    switch (authState) {
      case 'processing':
        return 'bg-gray-50'
      case 'success':
        return 'bg-green-50'
      case 'error':
      case 'timeout':
        return 'bg-red-50'
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${getBackgroundColor()}`}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-4">
          {getIcon()}
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {authState === 'processing' && '認証処理中...'}
          {authState === 'success' && 'ログイン成功！'}
          {authState === 'error' && '認証エラー'}
          {authState === 'timeout' && 'タイムアウト'}
        </h1>
        
        <p className="text-sm text-gray-600 mb-4">
          {message}
        </p>
        
        {authState === 'processing' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}
        
        {(authState === 'error' || authState === 'timeout') && (
          <button
            onClick={() => router.push('/login')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            ログインページに戻る
          </button>
        )}
        
        {authState === 'success' && (
          <p className="text-xs text-gray-500 mt-2">
            ダッシュボードに移動しています...
          </p>
        )}
      </div>
    </div>
  )
}