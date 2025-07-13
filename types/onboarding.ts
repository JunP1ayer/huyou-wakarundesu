/**
 * Onboarding types and interfaces
 */

export interface OnboardingAnswers {
  // Step 0
  dob?: Date;
  
  // Step 1 (conditional: age 19-22)
  student?: boolean;
  
  // Step 2
  insurance_status?: 'parent' | 'self';
  
  // Step 3 (conditional: insurance_status = "parent")
  other_income?: boolean;
  
  // Step 4 (conditional: insurance_status = "parent")
  multi_pay?: boolean;
  
  // Step 5 (conditional: insurance_status = "parent")
  future_self_ins_date?: Date | null;
  
  // Step 6 (conditional: insurance_status = "parent")
  jobs?: Job[];
  
  // Step 7 (conditional: insurance_status = "parent")
  bank_connections?: BankConnection[];
}

export interface Job {
  id?: string;
  company_name: string;
  hourly_wage?: number;
  monthly_salary?: number;
  is_primary: boolean;
}

export interface BankConnection {
  id?: string;
  bank_name: string;
  account_id: string;
  connection_status: 'pending' | 'active' | 'failed';
}

export type OnboardingStep = 
  | 'ScreenDOB'
  | 'ScreenStudent'
  | 'ScreenInsurance'
  | 'ScreenOtherInc'
  | 'ScreenMultiPay'
  | 'ScreenFutureIns'
  | 'ScreenJobs'
  | 'ScreenBankLink'
  | 'Complete';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'ScreenDOB',
  'ScreenStudent',
  'ScreenInsurance',
  'ScreenOtherInc',
  'ScreenMultiPay',
  'ScreenFutureIns',
  'ScreenJobs',
  'ScreenBankLink',
  'Complete'
];

export interface OnboardingStepConfig {
  id: OnboardingStep;
  title: string;
  description: string;
  fields: string[];
}

export const STEP_CONFIGS: Record<OnboardingStep, OnboardingStepConfig> = {
  ScreenDOB: {
    id: 'ScreenDOB',
    title: '生年月日を教えてください',
    description: '扶養控除の適用条件を確認するため、生年月日が必要です',
    fields: ['dob']
  },
  ScreenStudent: {
    id: 'ScreenStudent',
    title: '現在学生ですか？',
    description: '19〜22歳の学生は特定扶養控除（150万円）が適用されます',
    fields: ['student']
  },
  ScreenInsurance: {
    id: 'ScreenInsurance',
    title: '健康保険の加入状況',
    description: '親の扶養に入っているか、自分で社会保険に加入しているか教えてください',
    fields: ['insurance_status']
  },
  ScreenOtherInc: {
    id: 'ScreenOtherInc',
    title: '給与以外の収入はありますか？',
    description: '手渡し給与、フリーランス収入、投資収益などがある場合は「はい」を選択',
    fields: ['other_income']
  },
  ScreenMultiPay: {
    id: 'ScreenMultiPay',
    title: '複数の勤務先がありますか？',
    description: '掛け持ちバイトや複数の収入源がある場合は「はい」を選択',
    fields: ['multi_pay']
  },
  ScreenFutureIns: {
    id: 'ScreenFutureIns',
    title: '社会保険加入予定はありますか？',
    description: '今後、自分で社会保険に加入する予定がある場合は日付を選択',
    fields: ['future_self_ins_date']
  },
  ScreenJobs: {
    id: 'ScreenJobs',
    title: '勤務先情報を登録',
    description: '給与振込を自動判別するため、勤務先情報を入力してください',
    fields: ['jobs']
  },
  ScreenBankLink: {
    id: 'ScreenBankLink',
    title: '銀行口座を連携',
    description: '給与振込を自動で追跡するため、口座を連携してください',
    fields: ['bank_connections']
  },
  Complete: {
    id: 'Complete',
    title: '設定完了！',
    description: 'オンボーディングが完了しました',
    fields: []
  }
};