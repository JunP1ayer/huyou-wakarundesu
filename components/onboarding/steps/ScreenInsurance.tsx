'use client';

import React from 'react';
import { OnboardingAnswers } from '@/types/onboarding';
import { STEP_CONFIGS } from '@/types/onboarding';
import { Shield, ArrowLeft } from 'lucide-react';

interface Props {
  answers: OnboardingAnswers;
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLoading: boolean;
}

export default function ScreenInsurance({ answers, updateAnswers, onNext, onBack, canGoBack, isLoading }: Props) {
  const config = STEP_CONFIGS.ScreenInsurance;

  const handleAnswer = (insurance_status: 'parent' | 'self') => {
    updateAnswers({ insurance_status });
    onNext();
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600">
          {config.description}
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleAnswer('parent')}
          disabled={isLoading}
          className="w-full p-4 bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-lg transition-colors disabled:opacity-50 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">👨‍👩‍👧‍👦</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">親の扶養に入っています</p>
              <p className="text-sm text-gray-600">家族の健康保険を使用中（扶養控除対象）</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleAnswer('self')}
          disabled={isLoading}
          className="w-full p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-lg transition-colors disabled:opacity-50 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">自分で社会保険に加入しています</p>
              <p className="text-sm text-gray-600">会社の社保または国民健康保険</p>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </button>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⚠️ 社会保険加入の場合は130万円の壁（社会保険扶養限度額）が適用されます
        </p>
      </div>
    </div>
  );
}