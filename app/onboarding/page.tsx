'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { getNextOnboardingStep } from '@/lib/profile-validation'

interface OnboardingData {
  birth_year?: number
  student_type?: string
  support_type?: string
  insurance?: string
  monthly_income_target?: number
  is_student?: boolean
}

export default function OnboardingPage() {
  const { user, profile, refreshProfile, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<OnboardingData>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  // Initialize step based on profile data
  useEffect(() => {
    if (profile) {
      const nextStep = getNextOnboardingStep(profile)
      setCurrentStep(nextStep > 4 ? 4 : nextStep)
      
      // Pre-fill form with existing data
      setFormData({
        birth_year: profile.birth_year || undefined,
        student_type: profile.student_type || undefined,
        support_type: profile.support_type !== 'unknown' ? profile.support_type : undefined,
        insurance: profile.insurance !== 'unknown' ? profile.insurance : undefined,
        monthly_income_target: profile.monthly_income_target || undefined,
      })
    }
  }, [profile])

  const saveStep = async (stepData: Partial<OnboardingData>) => {
    if (!user) return false

    setSaving(true)
    setError(null)

    try {
      const updateData = {
        ...stepData,
        onboarding_step: currentStep,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('user_profile')
        .update(updateData)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      await refreshProfile()
      return true
    } catch (err) {
      console.error('プロフィール保存エラー:', err)
      setError('保存中にエラーが発生しました。もう一度お試しください。')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    let stepData: Partial<OnboardingData> = {}

    switch (currentStep) {
      case 1:
        if (!formData.birth_year || !formData.student_type) {
          setError('すべての項目を入力してください')
          return
        }
        stepData = {
          birth_year: formData.birth_year,
          student_type: formData.student_type,
          is_student: true
        }
        break

      case 2:
        if (!formData.support_type) {
          setError('扶養状況を選択してください')
          return
        }
        stepData = { support_type: formData.support_type }
        break

      case 3:
        if (!formData.insurance) {
          setError('健康保険の状況を選択してください')
          return
        }
        stepData = { insurance: formData.insurance }
        break

      case 4:
        if (!formData.monthly_income_target || formData.monthly_income_target <= 0) {
          setError('月収目標を入力してください')
          return
        }
        stepData = { monthly_income_target: formData.monthly_income_target }
        break
    }

    const success = await saveStep(stepData)
    if (success) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1)
      } else {
        // Complete onboarding
        router.push('/dashboard')
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>初期設定</span>
            <span>{currentStep}/4</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Step Content */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                基本情報を教えてください
              </h2>
              <p className="text-gray-600 mb-6">
                あなたに合った扶養判定を行うために必要な情報です
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    生まれた年
                  </label>
                  <select
                    value={formData.birth_year || ''}
                    onChange={(e) => setFormData({...formData, birth_year: parseInt(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    {Array.from({ length: 30 }, (_, i) => 2010 - i).map(year => (
                      <option key={year} value={year}>{year}年</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    あなたの学生区分
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'university', label: '大学生・短大生' },
                      { value: 'vocational', label: '専門学生' },
                      { value: 'high_school', label: '高校生' },
                      { value: 'graduate', label: '大学院生' },
                      { value: 'other', label: 'その他' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="student_type"
                          value={option.value}
                          checked={formData.student_type === option.value}
                          onChange={(e) => setFormData({...formData, student_type: e.target.value})}
                          className="mr-2 text-blue-600"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                親の扶養に入っていますか？
              </h2>
              <p className="text-gray-600 mb-6">
                年末調整や確定申告で親があなたを「扶養家族」として申告しているかどうかです
              </p>

              <div className="space-y-3">
                {[
                  { 
                    value: 'full', 
                    label: 'はい、親の扶養に入っています',
                    description: '親が年末調整であなたを扶養家族として申告している'
                  },
                  { 
                    value: 'none', 
                    label: 'いいえ、扶養には入っていません',
                    description: '自分で税金を払っている、または親の扶養に入っていない'
                  },
                  { 
                    value: 'partial', 
                    label: 'よくわからない',
                    description: '確認してから後で設定することもできます'
                  }
                ].map(option => (
                  <div key={option.value} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="support_type"
                        value={option.value}
                        checked={formData.support_type === option.value}
                        onChange={(e) => setFormData({...formData, support_type: e.target.value})}
                        className="mr-3 mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                健康保険はどこに入っていますか？
              </h2>
              <p className="text-gray-600 mb-6">
                病院に行く時に使う保険証の種類を教えてください
              </p>

              <div className="space-y-3">
                {[
                  { 
                    value: 'none', 
                    label: '親の健康保険（扶養として加入）',
                    description: '親の会社の健康保険に家族として入っている'
                  },
                  { 
                    value: 'employee', 
                    label: '自分の勤務先の健康保険',
                    description: 'アルバイト先の社会保険に自分で加入している'
                  },
                  { 
                    value: 'national', 
                    label: '国民健康保険',
                    description: '自分で国民健康保険に加入している'
                  }
                ].map(option => (
                  <div key={option.value} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="insurance"
                        value={option.value}
                        checked={formData.insurance === option.value}
                        onChange={(e) => setFormData({...formData, insurance: e.target.value})}
                        className="mr-3 mt-1 text-blue-600"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                毎月どれくらい稼ぎたいですか？
              </h2>
              <p className="text-gray-600 mb-6">
                月収目標を設定すると、扶養を外れそうになった時にお知らせします
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    月収目標（円）
                  </label>
                  <input
                    type="number"
                    value={formData.monthly_income_target || ''}
                    onChange={(e) => setFormData({...formData, monthly_income_target: parseInt(e.target.value)})}
                    placeholder="例：80000"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">💡 参考情報</p>
                    <p>扶養内で働く場合、年収103万円以下（月平均約8.6万円）が目安です。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              戻る
            </button>
            
            <button
              onClick={handleNext}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : currentStep === 4 ? '完了' : '次へ'}
            </button>
          </div>
        </div>

        {/* Skip Option (only for non-essential steps) */}
        {currentStep > 2 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              後で設定する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}