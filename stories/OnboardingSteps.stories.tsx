import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import ScreenDOB from '../components/onboarding/steps/ScreenDOB';
import ScreenStudent from '../components/onboarding/steps/ScreenStudent';
import ScreenInsurance from '../components/onboarding/steps/ScreenInsurance';
import ScreenOtherInc from '../components/onboarding/steps/ScreenOtherInc';
import ScreenMultiPay from '../components/onboarding/steps/ScreenMultiPay';
import ScreenFutureIns from '../components/onboarding/steps/ScreenFutureIns';
import ScreenJobs from '../components/onboarding/steps/ScreenJobs';
import ScreenBankLink from '../components/onboarding/steps/ScreenBankLink';
import ScreenComplete from '../components/onboarding/steps/ScreenComplete';
import { OnboardingAnswers } from '../types/onboarding';

// Common props for all steps
const commonProps = {
  onNext: action('onNext'),
  onBack: action('onBack'),
  canGoBack: true,
  isLoading: false,
  updateAnswers: action('updateAnswers')
};

// Sample answers for Complete screen
const sampleAnswers: OnboardingAnswers = {
  dob: new Date('2003-03-15'),
  student: true,
  insurance_status: 'parent',
  other_income: false,
  multi_pay: true,
  future_self_ins_date: null,
  jobs: [
    {
      id: '1',
      employer_name: 'セブンイレブン渋谷店',
      job_type: 'part_time',
      hourly_rate: 1200,
      expected_monthly_hours: 80
    }
  ],
  bank_connections: [
    {
      id: '1',
      bank_name: 'ゆうちょ銀行',
      account_type: 'checking',
      account_nickname: 'メイン口座'
    }
  ]
};

// DOB Screen Stories
const DOBMeta: Meta<typeof ScreenDOB> = {
  title: 'Onboarding/ScreenDOB',
  component: ScreenDOB,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Date of birth input screen for onboarding flow.'
      }
    }
  }
};

export default DOBMeta;

export const DOBDefault: StoryObj<typeof ScreenDOB> = {
  args: {
    answers: {},
    ...commonProps
  }
};

export const DOBWithExisting: StoryObj<typeof ScreenDOB> = {
  args: {
    answers: { dob: new Date('2003-03-15') },
    ...commonProps
  }
};

// Student Screen Stories  
const StudentMeta: Meta<typeof ScreenStudent> = {
  title: 'Onboarding/ScreenStudent',
  component: ScreenStudent
};

export const StudentDefault: StoryObj<typeof ScreenStudent> = {
  args: {
    answers: { dob: new Date('2003-03-15') },
    ...commonProps
  }
};

export const StudentSelected: StoryObj<typeof ScreenStudent> = {
  args: {
    answers: { dob: new Date('2003-03-15'), student: true },
    ...commonProps
  }
};

// Insurance Screen Stories
const InsuranceMeta: Meta<typeof ScreenInsurance> = {
  title: 'Onboarding/ScreenInsurance',
  component: ScreenInsurance
};

export const InsuranceDefault: StoryObj<typeof ScreenInsurance> = {
  args: {
    answers: { dob: new Date('2003-03-15'), student: true },
    ...commonProps
  }
};

// Other Income Screen Stories
const OtherIncMeta: Meta<typeof ScreenOtherInc> = {
  title: 'Onboarding/ScreenOtherInc',
  component: ScreenOtherInc
};

export const OtherIncDefault: StoryObj<typeof ScreenOtherInc> = {
  args: {
    answers: { 
      dob: new Date('2003-03-15'), 
      student: true, 
      insurance_status: 'parent' 
    },
    ...commonProps
  }
};

// Multi Pay Screen Stories
const MultiPayMeta: Meta<typeof ScreenMultiPay> = {
  title: 'Onboarding/ScreenMultiPay',
  component: ScreenMultiPay
};

export const MultiPayDefault: StoryObj<typeof ScreenMultiPay> = {
  args: {
    answers: { 
      dob: new Date('2003-03-15'), 
      student: true, 
      insurance_status: 'parent',
      other_income: false
    },
    ...commonProps
  }
};

// Future Insurance Screen Stories
const FutureInsMeta: Meta<typeof ScreenFutureIns> = {
  title: 'Onboarding/ScreenFutureIns',
  component: ScreenFutureIns
};

export const FutureInsDefault: StoryObj<typeof ScreenFutureIns> = {
  args: {
    answers: { 
      dob: new Date('2003-03-15'), 
      student: true, 
      insurance_status: 'parent',
      other_income: false,
      multi_pay: true
    },
    ...commonProps
  }
};

export const FutureInsWithDate: StoryObj<typeof ScreenFutureIns> = {
  args: {
    answers: { 
      dob: new Date('2003-03-15'), 
      student: true, 
      insurance_status: 'parent',
      other_income: false,
      multi_pay: true,
      future_self_ins_date: new Date('2025-04-01')
    },
    ...commonProps
  }
};

// Jobs Screen Stories
const JobsMeta: Meta<typeof ScreenJobs> = {
  title: 'Onboarding/ScreenJobs',
  component: ScreenJobs
};

export const JobsEmpty: StoryObj<typeof ScreenJobs> = {
  args: {
    answers: { 
      dob: new Date('2003-03-15'), 
      student: true, 
      insurance_status: 'parent',
      other_income: false,
      multi_pay: true,
      future_self_ins_date: null
    },
    ...commonProps
  }
};

export const JobsWithData: StoryObj<typeof ScreenJobs> = {
  args: {
    answers: { 
      dob: new Date('2003-03-15'), 
      student: true, 
      insurance_status: 'parent',
      other_income: false,
      multi_pay: true,
      future_self_ins_date: null,
      jobs: [
        {
          id: '1',
          employer_name: 'セブンイレブン渋谷店',
          job_type: 'part_time',
          hourly_rate: 1200,
          expected_monthly_hours: 80
        },
        {
          id: '2',
          employer_name: 'スターバックス新宿店',
          job_type: 'part_time',
          hourly_rate: 1100,
          expected_monthly_hours: 60
        }
      ]
    },
    ...commonProps
  }
};

// Bank Link Screen Stories
const BankLinkMeta: Meta<typeof ScreenBankLink> = {
  title: 'Onboarding/ScreenBankLink',
  component: ScreenBankLink
};

export const BankLinkEmpty: StoryObj<typeof ScreenBankLink> = {
  args: {
    answers: { 
      ...sampleAnswers,
      bank_connections: []
    },
    ...commonProps
  }
};

export const BankLinkWithData: StoryObj<typeof ScreenBankLink> = {
  args: {
    answers: sampleAnswers,
    ...commonProps
  }
};

// Complete Screen Stories
const CompleteMeta: Meta<typeof ScreenComplete> = {
  title: 'Onboarding/ScreenComplete',
  component: ScreenComplete
};

export const CompleteStudent: StoryObj<typeof ScreenComplete> = {
  args: {
    answers: sampleAnswers
  }
};

export const CompleteNonStudent: StoryObj<typeof ScreenComplete> = {
  args: {
    answers: {
      ...sampleAnswers,
      student: false,
      dob: new Date('1998-01-01') // 26 years old
    }
  }
};

export const CompleteIndependent: StoryObj<typeof ScreenComplete> = {
  args: {
    answers: {
      ...sampleAnswers,
      insurance_status: 'self',
      student: false,
      dob: new Date('2000-01-01') // 24 years old
    }
  }
};