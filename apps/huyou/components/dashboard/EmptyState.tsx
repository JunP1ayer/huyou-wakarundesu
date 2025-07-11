'use client'

import { Settings, ArrowRight } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="h-8 w-8 text-indigo-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            初期設定を完了してください
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            扶養控除の管理を開始するには、まず設定画面であなたの情報を登録してください。
          </p>
          
          <div className="space-y-4">
            <button 
              onClick={() => window.location.href = '/settings'}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              設定を開始する
              <ArrowRight className="h-4 w-4" />
            </button>
            
            <div className="text-xs text-gray-500">
              <p>設定に必要な情報：</p>
              <ul className="mt-1 space-y-1">
                <li>• 時給または月給</li>
                <li>• 週の労働時間</li>
                <li>• 学生区分</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}