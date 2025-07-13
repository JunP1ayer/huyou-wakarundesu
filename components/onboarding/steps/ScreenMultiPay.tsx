'use client';

import React from 'react';
import { OnboardingAnswers } from '@/types/onboarding';
import { STEP_CONFIGS } from '@/types/onboarding';
import { Building2, ArrowLeft } from 'lucide-react';

interface Props {
  answers: OnboardingAnswers;
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLoading: boolean;
}

export default function ScreenMultiPay({ answers, updateAnswers, onNext, onBack, canGoBack, isLoading }: Props) {
  const config = STEP_CONFIGS.ScreenMultiPay;

  const handleAnswer = (multi_pay: boolean) => {
    updateAnswers({ multi_pay });
    onNext();
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-orange-600" />
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
          onClick={() => handleAnswer(true)}
          disabled={isLoading}
          className="w-full p-4 bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 hover:border-orange-300 rounded-lg transition-colors disabled:opacity-50 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🏢</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">はい、複数あります</p>
              <p className="text-sm text-gray-600">
                掛け持ちバイト・ダブルワーク・複数社給与など
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleAnswer(false)}
          disabled={isLoading}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-colors disabled:opacity-50 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🏬</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">いいえ、1つだけです</p>
              <p className="text-sm text-gray-600">
                単一の勤務先からの給与のみ
              </p>
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
          ⚠️ 複数勤務先がある場合、各勤務先の給与を個別に追跡できます
        </p>
      </div>
    </div>
  );
}