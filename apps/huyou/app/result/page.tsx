'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function Result() {
  const searchParams = useSearchParams()
  const allowance = searchParams.get('allowance') ?? '---'

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center gap-6 p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">あなたの扶養限度額</h1>
        <p className="text-6xl font-extrabold text-indigo-600 mb-4">{allowance}</p>
        <p className="text-xl text-gray-700 mb-2">万円</p>
        <p className="text-sm text-gray-500 mb-6">※ 実際の税制は条件により異なる場合があります</p>
        
        <div className="space-y-3">
          <Link 
            href="/dashboard"
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors block"
          >
            ダッシュボードへ
          </Link>
          <Link 
            href="/settings"
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors block"
          >
            設定を変更
          </Link>
        </div>
      </div>
    </main>
  )
}