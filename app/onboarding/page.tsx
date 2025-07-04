'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { getNextOnboardingStep } from '@/lib/profile-validation'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import dynamic from 'next/dynamic'

// Lazy load step components for performance
const OnboardingStep = dynamic(() => import('@/components/onboarding/OnboardingStep'), {
  loading: () => <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />
})

interface OnboardingData {
  birth_year?: number
  student_type?: string
  support_type?: string
  insurance?: string
  monthly_income_target?: number
  is_student?: boolean
}


function OnboardingContent() {
  const { user, profile, refreshProfile, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation('common')
  const experimentId = 'default' // Default experiment ID
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

  // GA4 tracking for onboarding steps
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_step_view', {
        step_number: currentStep,
        step_name: getStepName(currentStep),
        experiment_id: experimentId || 'default'
      })
    }
  }, [currentStep, experimentId])

  const getStepName = (step: number): string => {
    const stepNames = ['basic_info', 'support_status', 'insurance', 'income_target']
    return stepNames[step - 1] || 'unknown'
  }

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

      if (error) throw error

      await refreshProfile()
      
      // GA4 tracking for successful step completion
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_step_complete', {
          step_number: currentStep,
          step_name: getStepName(currentStep),
          experiment_id: experimentId || 'default'
        })
      }
      
      return true
    } catch (err) {
      console.error('Profile save error:', err)
      setError(t('onboarding.validation.saveFailed'))
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    let stepData: Partial<OnboardingData> = {}

    // Validate current step
    switch (currentStep) {
      case 1:
        if (!formData.birth_year || !formData.student_type) {
          setError(t('onboarding.validation.allFieldsRequired'))
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
          setError(t('onboarding.validation.pleaseSelect'))
          return
        }
        stepData = { support_type: formData.support_type }
        break
      case 3:
        if (!formData.insurance) {
          setError(t('onboarding.validation.pleaseSelect'))
          return
        }
        stepData = { insurance: formData.insurance }
        break
      case 4:
        if (!formData.monthly_income_target || formData.monthly_income_target <= 0) {
          setError(t('onboarding.validation.amountRequired'))
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
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'signup_complete', {
            method: 'onboarding',
            experiment_id: experimentId || 'default'
          })
        }
        router.push('/dashboard')
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const updateFormData = (field: keyof OnboardingData, value: number | string | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null) // Clear error when user makes changes
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t('aria.loading')}>
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-white" role="main">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Progress indicator - Minimal Google style */}
        <div className="mb-8" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {t('onboarding.step')} {currentStep} / 4
            </div>
            <div className="text-sm text-gray-500">
              {t('onboarding.remaining', { count: 4 - currentStep })}
            </div>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content - Lazy loaded */}
        <div className="bg-white">
          <Suspense fallback={<div className="h-64 bg-gray-50 rounded-lg animate-pulse" />}>
            <OnboardingStep
              step={currentStep}
              formData={formData}
              onUpdateData={updateFormData}
              experimentId={experimentId}
            />
          </Suspense>

          {/* Error message */}
          {error && (
            <div 
              className="mt-6 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* Navigation - Google style minimal */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('aria.backToStep')}
            >
              {currentStep > 1 ? t('onboarding.back') : ''}
            </button>
            
            <button
              onClick={handleNext}
              disabled={saving}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              aria-label={currentStep === 4 ? t('aria.completeSetup') : t('aria.nextStep')}
              data-experiment-id={experimentId}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                  {t('onboarding.saving')}
                </>
              ) : (
                currentStep === 4 ? t('onboarding.complete') : t('onboarding.next')
              )}
            </button>
          </div>

          {/* Skip option - Minimal for non-essential steps */}
          {currentStep > 2 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm text-gray-500 hover:text-gray-700 focus:outline-none focus:underline"
                aria-label={t('aria.skipToDashboard')}
              >
                {t('onboarding.skipSetup')}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

