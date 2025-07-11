// 扶養判定結果の型
export type FuyouResult = '扶養内' | '106万壁' | '130万壁' | '学生150万枠';

// 質問回答の型
export interface QuestionAnswers {
  isStudent19to22: boolean;
  weeklyHours20: boolean | null; // null = 不要
  company51Plus: boolean | null; // null = 不要
}

// 扶養判定パラメータの型
export interface FuyouJudgeParams extends QuestionAnswers {
  annualIncome: number; // 銀行APIで取得した年収
}

// 銀行API レスポンスの型
export interface BankApiResponse {
  success: boolean;
  data?: {
    currentYearIncome: number; // 今年の累計収入
    monthlyIncomes: Array<{
      month: number;
      amount: number;
      date: string;
    }>;
  };
  error?: string;
}

// 銀行連携状態の型
export interface BankConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

// 判定結果表示用の型
export interface FuyouResultDisplay {
  result: FuyouResult;
  currentIncome: number;
  remainingAmount: number;
  threshold: number;
  message: string;
  badge: {
    text: string;
    color: 'green' | 'yellow' | 'red' | 'blue';
  };
}