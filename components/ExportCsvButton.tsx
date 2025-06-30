'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { saveAs } from 'file-saver'
import { createSupabaseClient } from '@/lib/supabase'
import { transactionsToCsv, generateCsvFilename } from '@/lib/csv'

export default function ExportCsvButton() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        alert('ログインが必要です')
        return
      }

      // Fetch all transactions for the user
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching transactions:', error)
        alert('データの取得中にエラーが発生しました')
        return
      }

      if (!transactions || transactions.length === 0) {
        alert('エクスポートするデータがありません')
        return
      }

      // Convert to CSV and download
      const csvContent = transactionsToCsv(transactions)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const filename = generateCsvFilename()
      
      saveAs(blob, filename)
      
      // Show success message
      alert(`${transactions.length}件のデータをCSVファイル「${filename}」としてダウンロードしました`)
      
    } catch (error) {
      console.error('Error during CSV export:', error)
      alert('CSVエクスポート中にエラーが発生しました')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="h-4 w-4" />
      <span>{isExporting ? 'エクスポート中...' : 'CSV ダウンロード'}</span>
    </button>
  )
}