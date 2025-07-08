'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFuyouChat } from '@/hooks/useFuyouChat'
import UnknownFuyouChat from '@/components/chat/UnknownFuyouChat'
import { FuyouClassificationResult } from '@/lib/questionSchema'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useToastFallback } from '@/components/notifications/Toast'
import { debugLog } from '@/lib/debug'
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary'

interface OnboardingData {
  is_student: boolean | null  // Q1: 学生かどうか
  using_family_insurance: boolean | null  // Q2: 家族の健康保険使用か
  is_over_20h_contract: boolean | null  // Q3: 週20時間以上の契約か
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
    title: 'Step 1/3 学生確認',
    question: 'あなたは現在学生ですか？',
    description: '※適切な扶養判定のため、学生状況をお聞かせください',
    type: 'boolean' as const,
    options: [
      { value: true, label: 'はい、学生です' },
      { value: false, label: 'いいえ、学生ではありません' }
    ]
  },
  {
    id: 'using_family_insurance',
    step: 2,
    title: 'Step 2/3 健康保険の確認',
    question: '親やご家族の健康保険証を使っていますか？',
    description: '※社会保険の扶養判定に必要な情報です',
    type: 'boolean' as const,
    options: [
      { value: true, label: 'はい、家族の保険証を使っています' },
      { value: false, label: 'いいえ、自分で加入しています' }
    ]
  },
  {
    id: 'is_over_20h_contract',
    step: 3,
    title: 'Step 3/3 労働契約の確認',
    question: 'あなたの "契約上の" 週あたり労働時間は 20 時間以上ですか？',
    description: '※繁忙期だけ超える場合は「いいえ」で OK。継続的に超えるなら「はい」を選択してください。',
    type: 'boolean' as const,
    options: [
      { value: true, label: 'はい、20時間以上です' },
      { value: false, label: 'いいえ、20時間未満です' }
    ]
  }
]

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<OnboardingData>({
    is_student: null,
    using_family_insurance: null,
    is_over_20h_contract: null,
    fuyou_category: null,
    fuyou_limit: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const router = useRouter()
  const { isOpen, openChat, closeChat } = useFuyouChat()
  const { showToast, ToastContainer } = useToastFallback()

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
    debugLog('[DEBUG] handleAnswer 呼ばれた', { value, currentStep, totalSteps, isLoading })
    
    if (isLoading) {
      debugLog('[DEBUG] 既に処理中のため無視')
      return
    }
    
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
      debugLog('[DEBUG] 次のステップへ移動', currentStep + 1)
      setCurrentStep(currentStep + 1)
      setInputValue('')
    } else {
      debugLog('[DEBUG] 最終ステップ完了 - handleOnboardingComplete呼び出し')
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

  const handleOnboardingComplete = async (finalData: OnboardingData, retryCount = 0) => {
    debugLog('[DEBUG] handleOnboardingComplete 呼ばれた', { finalData, retryCount })
    setIsLoading(true)
    setError(null)

    try {
      const payload = {
        isStudent: finalData.is_student === true,
        annualIncome: 1000000, // Default 100万円見込み (Moneytree API で取得後に置き換え予定)
        isDependent: finalData.using_family_insurance === true,
        isOver20hContract: finalData.is_over_20h_contract === true
      }

      console.log('[DEBUG] Sending request with payload:', payload)
      console.log('[DEBUG] Request headers will include credentials')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const res = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': `onboarding-${Date.now()}-${retryCount}`
        },
        body: JSON.stringify(payload),
        credentials: 'include', // 重要: クッキー（セッション）を含めてリクエスト
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('[DEBUG] Response received:', { status: res.status, ok: res.ok })
      
      const responseData = await res.json()
      console.log('[DEBUG] Response data:', responseData)
      
      if (!res.ok) {
        // Handle specific error cases
        if (responseData.code === 'UNAUTHORIZED' || responseData.code === 'SESSION_EXPIRED') {
          console.log('🔄 認証エラー - ログインページへリダイレクト')
          if (responseData.redirectTo) {
            router.replace(responseData.redirectTo)
            return
          } else {
            router.replace('/login')
            return
          }
        }
        
        // Handle network/temporary errors with retry logic
        if (res.status >= 500 && retryCount < 2) {
          console.log(`🔄 Server error (${res.status}) - retrying in 2 seconds (attempt ${retryCount + 1}/3)`)
          showToast(`サーバーエラーが発生しました。再試行中... (${retryCount + 1}/3)`, 'error')
          
          setTimeout(() => {
            handleOnboardingComplete(finalData, retryCount + 1)
          }, 2000)
          return
        }
        
        throw responseData
      }

      // Success response validation
      if (responseData.success && typeof responseData.allowance === 'number') {
        console.log('✅ allowance', responseData.allowance)
        console.log('✅ 全保存処理完了 - 結果ページへ移動中')
        
        // Add slight delay for better UX
        setTimeout(() => {
          router.replace(`/result?allowance=${responseData.allowance}`)
        }, 500)
      } else {
        console.error('❌ Invalid response format:', responseData)
        throw { 
          error: 'Invalid response format', 
          code: 'INTERNAL_ERROR',
          details: 'Response missing required fields'
        }
      }
    } catch (e: unknown) {
      console.error('❌ 保存処理でエラー発生', e)
      
      // Handle different error types
      if (e instanceof TypeError && e.message.includes('fetch')) {
        // Network error
        if (retryCount < 2) {
          console.log(`🔄 Network error - retrying in 3 seconds (attempt ${retryCount + 1}/3)`)
          showToast(`ネットワークエラーが発生しました。再試行中... (${retryCount + 1}/3)`, 'error')
          
          setTimeout(() => {
            handleOnboardingComplete(finalData, retryCount + 1)
          }, 3000)
          return
        } else {
          setError('ネットワーク接続に問題があります。インターネット接続を確認してください。')
          showToast('ネットワーク接続に問題があります', 'error')
          setIsLoading(false)
          return
        }
      }
      
      if (e.name === 'AbortError') {
        setError('リクエストがタイムアウトしました。再試行してください。')
        showToast('リクエストがタイムアウトしました', 'error')
        setIsLoading(false)
        return
      }
      
      // API error responses
      const errorData = e as { error?: string; code?: string; details?: string }
      let errorMessage = errorData.error ?? '設定の保存に失敗しました。もう一度お試しください。'
      
      // Enhanced error messages
      switch (errorData.code) {
        case 'VALIDATION_ERROR':
          errorMessage = '入力データに問題があります。確認してください。'
          break
        case 'SESSION_EXPIRED':
          errorMessage = 'セッションが期限切れです。再度ログインしてください。'
          // Auto-redirect to login after showing message
          setTimeout(() => router.replace('/login'), 3000)
          break
        case 'DATABASE_ERROR':
          errorMessage = 'データの保存に失敗しました。しばらく待ってから再試行してください。'
          break
        case 'INTERNAL_ERROR':
          errorMessage = 'システムエラーが発生しました。サポートにお問い合わせください。'
          break
        default:
          if (retryCount < 1) {
            console.log(`🔄 Unknown error - retrying once more`)
            showToast('エラーが発生しました。再試行中...', 'error')
            
            setTimeout(() => {
              handleOnboardingComplete(finalData, retryCount + 1)
            }, 2000)
            return
          }
      }
      
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      console.log('✅ setIsLoading(false) - スピナー閉じる')
      setIsLoading(false)
    }
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
    <AuthErrorBoundary>
      <ToastContainer />
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
                disabled={!inputValue.trim() || isLoading}
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
    </AuthErrorBoundary>
  )
}