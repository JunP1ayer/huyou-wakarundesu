'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAuthenticatedSupabaseClient } from '@/lib/supabase'
import { useFuyouChat } from '@/hooks/useFuyouChat'
import UnknownFuyouChat from '@/components/chat/UnknownFuyouChat'
import { FuyouClassificationResult } from '@/lib/questionSchema'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface OnboardingData {
  is_student: boolean | null  // Q1: 学生かどうか
  under_103_last_year: boolean | null  // Q2: 昨年収入103万円以下か
  using_family_insurance: boolean | null  // Q3: 家族の健康保険使用か
  weekly_hours: number | null  // Q4: 週労働時間
  // Legacy fields for compatibility  
  birth_year?: number | null
  student_type?: string | null
  support_type?: string | null
  insurance?: string | null
  monthly_income_target?: number | null
  fuyou_category?: string | null
  fuyou_limit?: number | null
}

interface QuestionConfig {
  id: keyof OnboardingData
  step: number
  title: string
  question: string
  description: string
  type: 'boolean' | 'number'
  options?: Array<{ value: boolean; label: string }>
  placeholder?: string
  suffix?: string
  min?: number
  max?: number
}

const questions: QuestionConfig[] = [
  {
    id: 'is_student',
    step: 1,
    title: 'Step 1/4 学生確認',
    question: 'あなたは現在学生ですか？',
    description: '※適切な扶養判定のため、学生状況をお聞かせください',
    type: 'boolean' as const,
    options: [
      { value: true, label: 'はい、学生です' },
      { value: false, label: 'いいえ、学生ではありません' }
    ]
  },
  {
    id: 'under_103_last_year',
    step: 2,
    title: 'Step 2/4 収入の確認',
    question: '昨年のアルバイト収入は 103 万円以下でしたか？',
    description: '※扶養控除の判定に必要な情報です',
    type: 'boolean' as const,
    options: [
      { value: true, label: 'はい、103万円以下でした' },
      { value: false, label: 'いいえ、103万円を超えていました' }
    ]
  },
  {
    id: 'using_family_insurance',
    step: 3,
    title: 'Step 3/4 健康保険の確認',
    question: '親やご家族の健康保険証を使っていますか？',
    description: '※社会保険の扶養判定に必要な情報です',
    type: 'boolean' as const,
    options: [
      { value: true, label: 'はい、家族の保険証を使っています' },
      { value: false, label: 'いいえ、自分で加入しています' }
    ]
  },
  {
    id: 'weekly_hours',
    step: 4,
    title: 'Step 4/4 労働時間の入力',
    question: '1週間に平均どれくらい働いていますか？',
    description: '※社会保険加入要件の判定に使用します',
    type: 'number' as const,
    placeholder: '例: 20',
    suffix: '時間',
    min: 0,
    max: 40
  }
]

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    is_student: null,
    under_103_last_year: null,
    using_family_insurance: null,
    weekly_hours: null,
    fuyou_category: null,
    fuyou_limit: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const router = useRouter()
  const { isOpen, openChat, closeChat } = useFuyouChat()

  const currentQuestion = questions[currentStep]
  const totalSteps = questions.length

  const validateNumberInput = (value: string, question: QuestionConfig): string | null => {
    if (!value.trim()) {
      return '数字を入力してください'
    }
    
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      return '有効な数字を入力してください'
    }
    
    if (question.min !== undefined && numValue < question.min) {
      return `${question.min}以上の値を入力してください`
    }
    
    if (question.max !== undefined && numValue > question.max) {
      return `${question.max}以下の値を入力してください`
    }
    
    return null
  }

  const handleAnswer = (value: boolean | string | number) => {
    setValidationError(null)
    
    // Number input validation
    if (currentQuestion.type === 'number' && typeof value === 'string') {
      const error = validateNumberInput(value, currentQuestion)
      if (error) {
        setValidationError(error)
        return
      }
      value = parseFloat(value)
    }

    const newData = { ...data, [currentQuestion.id]: value }
    setData(newData)

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
      setInputValue('')
    } else {
      handleOnboardingComplete(newData)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setValidationError(null)
      // Restore previous value for number inputs
      if (questions[currentStep - 1].type === 'number') {
        const prevValue = data[questions[currentStep - 1].id]
        setInputValue(prevValue ? String(prevValue) : '')
      }
    }
  }

  const handleOnboardingComplete = async (finalData: OnboardingData) => {
    setIsLoading(true)
    setError(null)

    try {
      const authClient = await getAuthenticatedSupabaseClient()
      if (!authClient) {
        setError('認証が必要です。ログインしてください。')
        return
      }

      const { supabase, user } = authClient

      // Convert simplified onboarding data to complete profile format required by isProfileComplete()
      const currentYear = new Date().getFullYear()
      const profileData = {
        user_id: user.id,
        // Required fields for isProfileComplete()
        birth_year: currentYear - 20, // Assume typical student age
        student_type: finalData.is_student ? 'university' : 'other',
        support_type: finalData.using_family_insurance ? 'full' : 'none',
        insurance: finalData.using_family_insurance ? 'none' : 'national', // 'none' means family insurance
        monthly_income_target: 85000, // Default income target
        // Legacy fields
        is_student: finalData.is_student === true,
        weekly_hours: finalData.weekly_hours ?? 20,
        fuyou_line: calculateFuyouLine(finalData),
        hourly_wage: 1200, // Default hourly wage
        profile_completed: true, // Mark as completed
        profile_completed_at: new Date().toISOString(),
        onboarding_step: 4, // Mark as fully completed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('user_profile')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) throw profileError

      // Create initial stats
      const statsData = {
        user_id: user.id,
        ytd_income: 0, // Income will be fetched from bank API
        remaining: profileData.fuyou_line,
        remaining_hours: finalData.weekly_hours && profileData.hourly_wage
          ? Math.max(0, profileData.fuyou_line / profileData.hourly_wage)
          : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: statsError } = await supabase
        .from('user_stats')
        .upsert(statsData, { onConflict: 'user_id' })

      if (statsError) throw statsError

      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      setError('設定の保存に失敗しました。もう一度お試しください。')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateFuyouLine = (data: OnboardingData): number => {
    // Simple logic: if student and using family insurance, use 130万 line
    if (data.is_student && data.using_family_insurance) {
      return 1300000 // 130万円
    }
    return 1030000 // 103万円 (default)
  }

  const handleChatComplete = (result: FuyouClassificationResult) => {
    setData(prev => ({
      ...prev,
      fuyou_category: result.category,
      fuyou_limit: result.limit
    }))
    closeChat()
    
    // Skip to final step after chat completion
    if (result.limit) {
      const finalData = {
        ...data,
        fuyou_category: result.category,
        fuyou_limit: result.limit
      }
      handleOnboardingComplete(finalData)
    }
  }

  if (isOpen) {
    return (
      <UnknownFuyouChat 
        isOpen={isOpen}
        isStudent={data.is_student === true}
        onClose={closeChat}
        onComplete={handleChatComplete}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{currentQuestion.title}</span>
            <span>{currentStep + 1}/{totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {currentQuestion.question}
            </h2>
            <p className="text-sm text-gray-600">
              {currentQuestion.description}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Boolean Questions */}
          {currentQuestion.type === 'boolean' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <button
                  key={String(option.value)}
                  onClick={() => handleAnswer(option.value)}
                  className="w-full min-h-[44px] p-4 text-left bg-gray-50 hover:bg-indigo-50 hover:border-indigo-300 border border-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {/* Number Input Questions */}
          {currentQuestion.type === 'number' && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={currentQuestion.placeholder}
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {currentQuestion.suffix && (
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {currentQuestion.suffix}
                  </span>
                )}
              </div>
              
              {validationError && (
                <p className="text-sm text-red-600">{validationError}</p>
              )}
              
              <button
                onClick={() => handleAnswer(inputValue)}
                disabled={!inputValue.trim()}
                className="w-full min-h-[44px] bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {currentStep === totalSteps - 1 ? '設定完了' : '次へ'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" />
            戻る
          </button>

          <button
            onClick={() => openChat(data.is_student === true)}
            className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium min-h-[44px]"
          >
            わからない？
          </button>
        </div>

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              <span>設定を保存中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}