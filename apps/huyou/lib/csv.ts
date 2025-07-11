import { parse as json2csv } from 'json2csv'
import { Transaction } from './supabase'

export interface IncomeExportData {
  date: string
  amount: number
  description?: string
}

export function transactionsToCsv(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return 'date,amount,description\n'
  }

  const csvData = transactions.map(transaction => ({
    date: transaction.date,
    amount: transaction.amount,
    description: transaction.description || ''
  }))

  const opts = { 
    fields: ['date', 'amount', 'description'],
    header: true 
  }

  return json2csv(csvData, opts)
}

export function generateCsvFilename(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `income-${today}.csv`
}