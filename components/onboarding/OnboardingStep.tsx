'use client'

import { useTranslation } from 'react-i18next'
import '@/lib/i18n'

interface OnboardingData {
  birth_year?: number
  student_type?: string
  support_type?: string
  insurance?: string
  monthly_income_target?: number
  is_student?: boolean
}

interface OnboardingStepProps {
  step: number
  formData: OnboardingData
  onUpdateData: (field: keyof OnboardingData, value: any) => void
  experimentId?: string
}

export default function OnboardingStep({ step, formData, onUpdateData, experimentId }: OnboardingStepProps) {
  const { t } = useTranslation('common')

  const handleRadioChange = (field: keyof OnboardingData, value: string) => {
    onUpdateData(field, value)
  }

  const handleNumberChange = (field: keyof OnboardingData, value: string) => {
    const numValue = parseInt(value)
    onUpdateData(field, isNaN(numValue) ? undefined : numValue)
  }

  switch (step) {
    case 1:
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t('onboarding.step1.title')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('onboarding.step1.subtitle')}
            </p>
          </div>

          <div className="space-y-6">
            {/* Birth Year */}
            <div>
              <label htmlFor="birth-year" className="block text-sm font-medium text-gray-900 mb-3">
                {t('onboarding.step1.birthYear')}
              </label>
              <select
                id="birth-year"
                value={formData.birth_year || ''}
                onChange={(e) => handleNumberChange('birth_year', e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                required
                aria-describedby="birth-year-help"
                data-experiment-id={experimentId}
              >
                <option value="">{t('onboarding.step1.selectPlaceholder')}</option>
                {Array.from({ length: 30 }, (_, i) => 2010 - i).map(year => (
                  <option key={year} value={year}>{year}年</option>
                ))}
              </select>
              <p id="birth-year-help" className="mt-2 text-xs text-gray-500">
                {t('onboarding.step1.birthYearHelp')}
              </p>
            </div>

            {/* Student Type */}
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-gray-900 mb-3">
                  {t('onboarding.step1.studentType')}
                </legend>
                <div className="space-y-3">
                  {[
                    { value: 'university', label: t('onboarding.step1.university') },
                    { value: 'vocational', label: t('onboarding.step1.vocational') },
                    { value: 'high_school', label: t('onboarding.step1.highSchool') },
                    { value: 'graduate', label: t('onboarding.step1.graduate') },
                    { value: 'other', label: t('onboarding.step1.other') }
                  ].map(option => (
                    <label key={option.value} className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="student_type"
                        value={option.value}
                        checked={formData.student_type === option.value}
                        onChange={(e) => handleRadioChange('student_type', e.target.value)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                        data-experiment-id={experimentId}
                      />
                      <span className="ml-3 text-sm text-gray-900 group-hover:text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      )

    case 2:
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t('onboarding.step2.title')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('onboarding.step2.subtitle')}
            </p>
          </div>

          <div>
            <fieldset>
              <legend className="sr-only">{t('onboarding.step2.legend')}</legend>
              <div className="space-y-3">
                {[
                  { 
                    value: 'full', 
                    label: t('onboarding.step2.full'),
                    description: t('onboarding.step2.fullDesc')
                  },
                  { 
                    value: 'none', 
                    label: t('onboarding.step2.none'),
                    description: t('onboarding.step2.noneDesc')
                  },
                  { 
                    value: 'partial', 
                    label: t('onboarding.step2.partial'),
                    description: t('onboarding.step2.partialDesc')
                  }
                ].map(option => (
                  <label 
                    key={option.value} 
                    className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <input
                      type="radio"
                      name="support_type"
                      value={option.value}
                      checked={formData.support_type === option.value}
                      onChange={(e) => handleRadioChange('support_type', e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 mt-0.5"
                      data-experiment-id={experimentId}
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      )

    case 3:
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t('onboarding.step3.title')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('onboarding.step3.subtitle')}
            </p>
          </div>

          <div>
            <fieldset>
              <legend className="sr-only">{t('onboarding.step3.legend')}</legend>
              <div className="space-y-3">
                {[
                  { 
                    value: 'none', 
                    label: t('onboarding.step3.none'),
                    description: t('onboarding.step3.noneDesc')
                  },
                  { 
                    value: 'employee', 
                    label: t('onboarding.step3.employee'),
                    description: t('onboarding.step3.employeeDesc')
                  },
                  { 
                    value: 'national', 
                    label: t('onboarding.step3.national'),
                    description: t('onboarding.step3.nationalDesc')
                  }
                ].map(option => (
                  <label 
                    key={option.value} 
                    className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <input
                      type="radio"
                      name="insurance"
                      value={option.value}
                      checked={formData.insurance === option.value}
                      onChange={(e) => handleRadioChange('insurance', e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500 mt-0.5"
                      data-experiment-id={experimentId}
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      )

    case 4:
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              {t('onboarding.step4.title')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('onboarding.step4.subtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="income-target" className="block text-sm font-medium text-gray-900 mb-3">
                {t('onboarding.step4.label')}
              </label>
              <input
                id="income-target"
                type="number"
                value={formData.monthly_income_target || ''}
                onChange={(e) => handleNumberChange('monthly_income_target', e.target.value)}
                placeholder={t('onboarding.step4.placeholder')}
                min="0"
                max="1000000"
                step="1000"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                aria-describedby="income-help"
                data-experiment-id={experimentId}
              />
              <p id="income-help" className="mt-2 text-xs text-gray-500">
                {t('onboarding.step4.help')}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">{t('onboarding.step4.reference')}</span>
                    {t('onboarding.step4.referenceText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    default:
      return <div>{t('common.invalidStep')}</div>
  }
}