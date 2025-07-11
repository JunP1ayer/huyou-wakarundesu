import { create } from 'zustand';
import type { QuestionAnswers, BankConnectionState } from '@/types';

interface QuestionStore {
  // 質問の回答状態
  answers: QuestionAnswers;
  currentStep: number;
  totalSteps: number;
  
  // 銀行連携状態
  bankConnection: BankConnectionState;
  bankToken: string | null;
  annualIncome: number;
  
  // アクション
  updateAnswer: (key: keyof QuestionAnswers, value: boolean | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetQuestions: () => void;
  
  // 銀行連携アクション
  setBankConnection: (state: Partial<BankConnectionState>) => void;
  setBankToken: (token: string | null) => void;
  setAnnualIncome: (income: number) => void;
  
  // ユーティリティ
  isStepCompleted: (step: number) => boolean;
  canProceedToNext: () => boolean;
  getNextStepNumber: () => number | null;
}

const initialAnswers: QuestionAnswers = {
  isStudent19to22: false,
  weeklyHours20: null,
  company51Plus: null,
};

const initialBankConnection: BankConnectionState = {
  isConnected: false,
  isLoading: false,
  error: null,
};

export const useQuestionStore = create<QuestionStore>((set, get) => ({
  // 初期状態
  answers: initialAnswers,
  currentStep: 1,
  totalSteps: 3,
  bankConnection: initialBankConnection,
  bankToken: null,
  annualIncome: 0,

  // 質問回答の更新
  updateAnswer: (key, value) =>
    set((state) => ({
      answers: { ...state.answers, [key]: value },
    })),

  // ステップ移動
  nextStep: () =>
    set((state) => {
      const nextStep = get().getNextStepNumber();
      return nextStep ? { currentStep: nextStep } : state;
    }),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(1, state.currentStep - 1),
    })),

  goToStep: (step) =>
    set(() => ({
      currentStep: Math.max(1, Math.min(3, step)),
    })),

  resetQuestions: () =>
    set(() => ({
      answers: initialAnswers,
      currentStep: 1,
      bankConnection: initialBankConnection,
      bankToken: null,
      annualIncome: 0,
    })),

  // 銀行連携
  setBankConnection: (connectionState) =>
    set((state) => ({
      bankConnection: { ...state.bankConnection, ...connectionState },
    })),

  setBankToken: (token) =>
    set(() => ({ bankToken: token })),

  setAnnualIncome: (income) =>
    set(() => ({ annualIncome: income })),

  // ユーティリティ関数
  isStepCompleted: (step) => {
    const { answers } = get();
    
    switch (step) {
      case 1:
        return typeof answers.isStudent19to22 === 'boolean';
      case 2:
        return answers.isStudent19to22 || answers.weeklyHours20 !== null;
      case 3:
        return answers.isStudent19to22 || 
               answers.weeklyHours20 === false || 
               answers.company51Plus !== null;
      default:
        return false;
    }
  },

  canProceedToNext: () => {
    const { currentStep } = get();
    return get().isStepCompleted(currentStep);
  },

  getNextStepNumber: () => {
    const { currentStep, answers, totalSteps } = get();
    
    if (currentStep >= totalSteps) return null;
    
    // ステップ1完了後の分岐
    if (currentStep === 1 && answers.isStudent19to22) {
      // 学生の場合は質問終了
      return null;
    }
    
    // ステップ2完了後の分岐
    if (currentStep === 2 && answers.weeklyHours20 === false) {
      // 週20時間未満の場合は質問終了
      return null;
    }
    
    return currentStep + 1;
  },
}));