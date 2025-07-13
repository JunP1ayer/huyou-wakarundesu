'use client';

import React, { useState } from 'react';
import { OnboardingAnswers } from '@/types/onboarding';
import { STEP_CONFIGS } from '@/types/onboarding';
import { Calendar, ArrowLeft, Clock } from 'lucide-react';

interface Props {
  answers: OnboardingAnswers;
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLoading: boolean;
}

export default function ScreenFutureIns({ answers, updateAnswers, onNext, onBack, canGoBack, isLoading }: Props) {
  const config = STEP_CONFIGS.ScreenFutureIns;
  const [selectedDate, setSelectedDate] = useState<string>(
    answers.future_self_ins_date ? answers.future_self_ins_date.toISOString().split('T')[0] : ''
  );

  const handleNoChange = () => {
    updateAnswers({ future_self_ins_date: null });
    onNext();
  };

  const handleDateSubmit = () => {
    if (selectedDate) {
      updateAnswers({ future_self_ins_date: new Date(selectedDate) });
    } else {
      updateAnswers({ future_self_ins_date: null });
    }
    onNext();
  };

  // Get minimum date (today) and maximum date (end of current year)
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const maxDate = `${currentYear}-12-31`;

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600">
          {config.description}
        </p>
      </div>

      <div className="space-y-6">
        <button
          onClick={handleNoChange}
          disabled={isLoading}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-colors disabled:opacity-50 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">🚫</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">今年は変更予定なし</p>
              <p className="text-sm text-gray-600">
                引き続き親の扶養に入り続ける予定
              </p>
            </div>
          </div>
        </button>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <p className="font-medium text-gray-900">変更予定日を指定</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                自分で社会保険に加入する予定日
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                max={maxDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {selectedDate && (
              <div className="bg-white rounded-md p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  📅 {new Date(selectedDate).toLocaleDateString('ja-JP')}から社会保険加入予定
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  この日以降は130万円の壁が適用されます
                </p>
              </div>
            )}
            
            <button
              onClick={handleDateSubmit}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              この日付で設定
            </button>
          </div>
        </div>
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
          💡 社会保険加入予定日を設定すると、その日から自動的に130万円の壁に切り替わります
        </p>
      </div>
    </div>
  );
}