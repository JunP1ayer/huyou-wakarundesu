import type { BankApiResponse } from '@/types';

/**
 * Moneytree LINK モックAPI
 * 今年4〜7月に月8万円の給与振込みデータを返す
 */
export class MockBankApi {
  private static readonly MONTHLY_SALARY = 80_000; // 8万円/月
  private static readonly START_MONTH = 4; // 4月から
  private static readonly CURRENT_MONTH = 7; // 7月まで

  /**
   * OAuth認証の開始
   */
  static async initiateOAuth(): Promise<{ authUrl: string; state: string }> {
    // 実際のMoneytreeの場合はOAuth URLを生成
    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = `/api/auth/moneytree/callback?code=mock_auth_code&state=${state}`;
    
    return {
      authUrl,
      state,
    };
  }

  /**
   * 認証コールバック処理
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static async handleCallback(code: string, _state: string): Promise<{ success: boolean; token?: string }> {
    // モック実装では常に成功
    await this.delay(1000); // API呼び出しのシミュレーション
    
    if (code === 'mock_auth_code') {
      return {
        success: true,
        token: 'mock_access_token_' + Date.now(),
      };
    }
    
    return { success: false };
  }

  /**
   * 今年の収入データを取得
   */
  static async getCurrentYearIncome(token?: string): Promise<BankApiResponse> {
    await this.delay(1500); // API呼び出しのシミュレーション

    if (!token) {
      return {
        success: false,
        error: '認証が必要です',
      };
    }

    try {
      const monthlyIncomes = this.generateMonthlyIncomes();
      const currentYearIncome = monthlyIncomes.reduce((total, income) => total + income.amount, 0);

      return {
        success: true,
        data: {
          currentYearIncome,
          monthlyIncomes,
        },
      };
    } catch {
      return {
        success: false,
        error: 'データの取得に失敗しました',
      };
    }
  }

  /**
   * 月別収入データを生成（4月〜7月、月8万円）
   */
  private static generateMonthlyIncomes() {
    const currentYear = new Date().getFullYear();
    const incomes = [];

    for (let month = this.START_MONTH; month <= this.CURRENT_MONTH; month++) {
      // 各月の給料日（15日と仮定）
      const payDay = new Date(currentYear, month - 1, 15);
      
      incomes.push({
        month,
        amount: this.MONTHLY_SALARY,
        date: payDay.toISOString().split('T')[0], // YYYY-MM-DD形式
      });
    }

    return incomes;
  }

  /**
   * 指定した時間だけ待機（APIコールのシミュレーション）
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 接続状況を確認
   */
  static async checkConnection(token?: string): Promise<{ isConnected: boolean; error?: string }> {
    await this.delay(500);

    if (!token || !token.startsWith('mock_access_token')) {
      return {
        isConnected: false,
        error: '認証情報が無効です',
      };
    }

    return { isConnected: true };
  }

  /**
   * データの再同期
   */
  static async syncData(token: string): Promise<BankApiResponse> {
    await this.delay(2000); // 同期処理のシミュレーション
    
    // 新しいデータがある場合のシミュレーション（ランダムで追加収入）
    const hasNewData = Math.random() > 0.7;
    
    if (hasNewData) {
      const baseResponse = await this.getCurrentYearIncome(token);
      if (baseResponse.success && baseResponse.data) {
        // 臨時収入をシミュレーション
        const bonusIncome = {
          month: 7,
          amount: 30_000, // 3万円のボーナス
          date: new Date().toISOString().split('T')[0],
        };
        
        baseResponse.data.monthlyIncomes.push(bonusIncome);
        baseResponse.data.currentYearIncome += bonusIncome.amount;
      }
      return baseResponse;
    }
    
    return this.getCurrentYearIncome(token);
  }
}