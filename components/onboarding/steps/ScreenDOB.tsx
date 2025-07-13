'use client';

import React, { useState } from 'react';
import { OnboardingAnswers } from '@/types/onboarding';
import { STEP_CONFIGS } from '@/types/onboarding';
import { ArrowRight, Calendar } from 'lucide-react';

interface Props {
  answers: OnboardingAnswers;
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void;
  onNext: () => void;
  canGoNext: boolean;
  isLoading: boolean;
}

export default function ScreenDOB({ answers, updateAnswers, onNext, canGoNext, isLoading }: Props) {
  const config = STEP_CONFIGS.ScreenDOB;
  const [dateInput, setDateInput] = useState(
    answers.dob ? answers.dob.toISOString().split('T')[0] : ''
  );

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDateInput(value);
    
    if (value) {
      const date = new Date(value);
      updateAnswers({ dob: date });
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onNext();
    }
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600">
          {config.description}
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
            生年月日
          </label>
          <input
            id="dob"
            type="date"
            value={dateInput}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]} // Today or earlier
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
          />
        </div>

        {answers.dob && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              年齢: {calculateAge(answers.dob)}歳
            </p>
            {calculateAge(answers.dob) >= 19 && calculateAge(answers.dob) <= 22 && (
              <p className="text-sm text-blue-600 mt-1">
                ※ 特定扶養控除（150万円）の対象年齢です
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!canGoNext || isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              処理中...
            </>
          ) : (
            <>
              次へ
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function calculateAge(dob: Date): number {
  const today = new Date();
  const diff = today.getTime() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}