'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { useFuyouChat } from '@/hooks/useFuyouChat'
import UnknownFuyouChat from '@/components/chat/UnknownFuyouChat'

interface OnboardingData {
  is_student: boolean | null
  support_type: 'full' | 'partial' | 'none' | null
  insurance: 'national' | 'employee' | 'none' | null
  company_large: boolean | null
  weekly_hours: number | null
  fuyou_category?: string | null
  fuyou_limit?: number | null
}

const questions = [
  {
    id: 'is_student',
    title: '学生ですか？',
    description: '現在、大学・専門学校などに在学中ですか？',
    options: [
      { value: true, label: 'はい、学生です' },
      { value: false, label: 'いいえ、学生ではありません' }
    ]
  },
  {
    id: 'support_type',
    title: '扶養の種類は？',
    description: '現在の扶養状況を教えてください',
    options: [
      { value: 'full', label: '完全扶養（年間収入ゼロ〜数万円）' },
      { value: 'partial', label: '103万円以内（アルバイト収入あり）' },
      { value: 'none', label: '扶養に入っていない' }
    ]
  },
  {
    id: 'insurance',
    title: '保険の種類は？',
    description: '加入している健康保険を教えてください',
    options: [
      { value: 'national', label: '国民健康保険（自分で加入）' },
      { value: 'employee', label: '親の健康保険（扶養として加入）' },
      { value: 'none', label: 'よくわからない' }
    ]
  },
  {
    id: 'company_large',
    title: '勤務先の規模は？',
    description: '働いている会社の従業員数はどれくらいですか？',
    options: [
      { value: true, label: '大企業（従業員501人以上）' },
      { value: false, label: '中小企業（従業員500人以下）' }
    ]
  },
  {
    id: 'weekly_hours',
    title: '週の労働時間は？',
    description: '1週間に何時間くらい働いていますか？',
    options: [
      { value: 10, label: '10時間未満' },
      { value: 15, label: '10-15時間' },
      { value: 20, label: '15-20時間' },
      { value: 25, label: '20-25時間' },
      { value: 30, label: '25時間以上' }
    ]
  }
]

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    is_student: null,
    support_type: null,
    insurance: null,
    company_large: null,
    weekly_hours: null,
    fuyou_category: null,
    fuyou_limit: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isOpen, openChat, closeChat, handleComplete } = useFuyouChat()

  const currentQuestion = questions[currentStep]
  const totalSteps = questions.length

  const handleAnswer = (value: boolean | string | number) => {
    const newData = { ...data, [currentQuestion.id]: value }
    setData(newData)

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleOnboardingComplete(newData)
    }
  }

  const handleOnboardingComplete = async (finalData: OnboardingData) => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Calculate fuyou_line based on answers or chat result
      let fuyou_line = finalData.fuyou_limit || 1030000 // Use chat result or default
      if (!finalData.fuyou_limit && finalData.is_student) {
        fuyou_line = 1300000 // Student limit is higher if no chat result
      }

      const profileData = {
        user_id: user.id,
        is_student: finalData.is_student || false,
        support_type: finalData.support_type || 'none',
        insurance: finalData.insurance || 'none',
        company_large: finalData.company_large || false,
        weekly_hours: finalData.weekly_hours || 0,
        fuyou_line,
        hourly_wage: 1200 // Default hourly wage
      }

      const { error } = await supabase
        .from('user_profile')
        .upsert(profileData)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error saving profile:', error)
      setError('プロフィールの保存中にエラーが発生しました。再度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleUnknown = async () => {
    const isStudent = data.is_student ?? true // Default to student if not set
    const result = await openChat(isStudent)
    
    if (result) {
      // Update data with classification result
      const newData = { 
        ...data, 
        fuyou_category: result.category,
        fuyou_limit: result.limit
      }
      setData(newData)
      
      // Auto-complete the onboarding with smart defaults based on classification
      const finalData: OnboardingData = {
        ...newData,
        support_type: result.category === '扶養外' ? 'none' as const : 'partial' as const,
        insurance: 'employee' as const, // Most common case
        company_large: false,  // Conservative estimate
        weekly_hours: data.weekly_hours || 15 // Default moderate hours
      }
      
      handleOnboardingComplete(finalData)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">プロフィールを保存中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header with progress */}
      <div className="bg-white shadow-sm px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full ${
                    index <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 font-medium">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
            >
              ← 戻る
            </button>
          )}
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {currentQuestion.title}
              </h1>
              <p className="text-gray-600 leading-relaxed">
                {currentQuestion.description}
              </p>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 border-2 border-transparent rounded-xl transition-all duration-200 font-medium text-gray-800 hover:text-indigo-900"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                onClick={handleUnknown}
                className="w-full p-3 text-center text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                わからない？
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <UnknownFuyouChat
        isOpen={isOpen}
        isStudent={data.is_student ?? true}
        onClose={closeChat}
        onComplete={handleComplete}
      />
    </div>
  )
}