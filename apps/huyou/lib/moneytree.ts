interface MoneytreeConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  baseUrl: string
}

interface MoneytreeAccount {
  id: string
  name: string
  type: string
  balance: number
  currency: string
}

interface MoneytreeTransaction {
  id: string
  account_id: string
  amount: number
  date: string
  description: string
  category: string[]
}

export class MoneytreeClient {
  private config: MoneytreeConfig

  constructor() {
    this.config = {
      clientId: process.env.MONEYTREE_CLIENT_ID!,
      clientSecret: process.env.MONEYTREE_CLIENT_SECRET!,
      redirectUri: process.env.MONEYTREE_REDIRECT_URI!,
      baseUrl: 'https://sandbox-api.moneytree.jp' // Sandbox URL
    }
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: 'accounts_read transactions_read',
      ...(state && { state })
    })

    return `${this.config.baseUrl}/oauth/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  async getAccessToken(code: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }> {
    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`)
    }

    return response.json()
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
  }> {
    const response = await fetch(`${this.config.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh access token: ${response.statusText}`)
    }

    return response.json()
  }

  // Get user accounts
  async getAccounts(accessToken: string): Promise<MoneytreeAccount[]> {
    const response = await fetch(`${this.config.baseUrl}/v1/accounts`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get accounts: ${response.statusText}`)
    }

    const data = await response.json()
    return data.accounts || []
  }

  // Get transactions for an account
  async getTransactions(accessToken: string, accountId: string, params?: {
    from?: string
    to?: string
    limit?: number
  }): Promise<MoneytreeTransaction[]> {
    const searchParams = new URLSearchParams()
    if (params?.from) searchParams.append('from', params.from)
    if (params?.to) searchParams.append('to', params.to)
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const url = `${this.config.baseUrl}/v1/accounts/${accountId}/transactions?${searchParams.toString()}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get transactions: ${response.statusText}`)
    }

    const data = await response.json()
    return data.transactions || []
  }

  // Get all income transactions (deposits) for the current year
  async getCurrentYearIncomeTransactions(accessToken: string): Promise<{
    accountId: string
    transactions: MoneytreeTransaction[]
  }[]> {
    const accounts = await this.getAccounts(accessToken)
    const currentYear = new Date().getFullYear()
    const yearStart = `${currentYear}-01-01`
    const yearEnd = `${currentYear}-12-31`

    const accountTransactions = await Promise.all(
      accounts.map(async (account) => {
        const transactions = await this.getTransactions(accessToken, account.id, {
          from: yearStart,
          to: yearEnd,
          limit: 1000
        })

        // Filter for income transactions (positive amounts/deposits)
        const incomeTransactions = transactions.filter(tx => 
          tx.amount > 0 && 
          (tx.category?.includes('income') || tx.category?.includes('salary') || tx.amount > 0)
        )

        return {
          accountId: account.id,
          transactions: incomeTransactions
        }
      })
    )

    return accountTransactions.filter(acc => acc.transactions.length > 0)
  }
}

export const moneytreeClient = new MoneytreeClient()