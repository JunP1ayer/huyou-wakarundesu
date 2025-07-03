'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { LogIn, LogOut, User, Settings, Home } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { user, session, supabase } = useSupabase()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (!supabase) return
    
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Home className="w-6 h-6 text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">扶養わかるんです</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {session && user ? (
              // Authenticated user
              <>
                <Link 
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ダッシュボード
                </Link>
                
                <Link 
                  href="/settings"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Settings className="w-4 h-4 inline mr-1" />
                  設定
                </Link>

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4 inline mr-1" />
                  {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
                </button>
              </>
            ) : (
              // Not authenticated
              <>
                <Link 
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogIn className="w-4 h-4 inline mr-1" />
                  ログイン
                </Link>
                
                <Link 
                  href="/dashboard"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  デモを試す
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}