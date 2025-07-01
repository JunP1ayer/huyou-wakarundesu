// Demo data for when environment variables are not configured
import { UserProfile, Transaction, UserStats } from './supabase'

// Demo user profile
export const demoProfile: UserProfile = {
  user_id: 'demo-user-001',
  is_student: false,
  support_type: 'full',
  insurance: 'employee',
  company_large: false,
  weekly_hours: 20,
  fuyou_line: 1030000,
  hourly_wage: 1200,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Demo transactions
export const demoTransactions: Transaction[] = [
  {
    id: 'demo-tx-001',
    user_id: 'demo-user-001',
    date: '2024-12-01',
    amount: 96000,
    description: '12月給料（デモデータ）',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-tx-002',
    user_id: 'demo-user-001',
    date: '2024-11-01',
    amount: 92000,
    description: '11月給料（デモデータ）',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-tx-003',
    user_id: 'demo-user-001',
    date: '2024-10-01',
    amount: 88000,
    description: '10月給料（デモデータ）',
    created_at: new Date().toISOString(),
  },
]

// Calculate demo stats
export function getDemoStats(): UserStats {
  const ytdIncome = demoTransactions.reduce((sum, tx) => sum + tx.amount, 0)
  const remaining = demoProfile.fuyou_line - ytdIncome
  const remainingHours = Math.floor(remaining / demoProfile.hourly_wage)
  
  return {
    user_id: 'demo-user-001',
    ytd_income: ytdIncome,
    remaining: remaining,
    remaining_hours: remainingHours,
    updated_at: new Date().toISOString(),
  }
}

// Demo mode storage (in-memory)
class DemoStorage {
  private profile: UserProfile = demoProfile
  private transactions: Transaction[] = [...demoTransactions]
  
  getProfile(): UserProfile {
    return this.profile
  }
  
  updateProfile(updates: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.profile, ...updates, updated_at: new Date().toISOString() }
    return this.profile
  }
  
  getTransactions(): Transaction[] {
    return this.transactions.sort((a, b) => b.date.localeCompare(a.date))
  }
  
  addTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    const newTransaction: Transaction = {
      ...transaction,
      id: `demo-tx-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    this.transactions.push(newTransaction)
    return newTransaction
  }
  
  deleteTransaction(id: string): boolean {
    const index = this.transactions.findIndex(tx => tx.id === id)
    if (index !== -1) {
      this.transactions.splice(index, 1)
      return true
    }
    return false
  }
  
  getStats(): UserStats {
    const ytdIncome = this.transactions.reduce((sum, tx) => sum + tx.amount, 0)
    const remaining = this.profile.fuyou_line - ytdIncome
    const remainingHours = Math.floor(remaining / this.profile.hourly_wage)
    
    return {
      user_id: this.profile.user_id,
      ytd_income: ytdIncome,
      remaining: remaining,
      remaining_hours: remainingHours,
      updated_at: new Date().toISOString(),
    }
  }
}

// Export singleton instance
export const demoStorage = new DemoStorage()