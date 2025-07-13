'use client';

import React, { useEffect, useState } from 'react';
import { OnboardingAnswers } from '@/types/onboarding';
import { isIndependentMode, getCompletionMessage } from '@/lib/onboarding-navigation';
import { decideThreshold, formatYen, getThresholdDisplayName } from '@/lib/tax-walls';
import { CheckCircle, TrendingUp, Shield, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { OnboardingLegalFooter } from '@/components/legal/LegalFooter';

interface Props {
  answers: OnboardingAnswers;
}

export default function ScreenComplete({ answers }: Props) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);
  const independentMode = isIndependentMode(answers);
  const message = getCompletionMessage(answers);

  // Calculate user's threshold
  const thresholdResult = answers.dob ? decideThreshold({
    dob: answers.dob,
    student: answers.student || false,
    insurance_status: answers.insurance_status || 'parent',
    future_self_ins_date: answers.future_self_ins_date
  }) : null;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 設定完了！
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          {message}
        </p>
      </div>

      {/* User Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたの設定内容</h3>
        
        <div className="space-y-3 text-left">
          {answers.dob && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">
                年齢: {calculateAge(answers.dob)}歳
              </span>
            </div>
          )}
          
          {answers.student !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-lg">🎓</span>
              <span className="text-gray-700">
                {answers.student ? '学生' : '非学生'}
              </span>
            </div>
          )}
          
          {answers.insurance_status && (
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-gray-700">
                {answers.insurance_status === 'parent' ? '親の扶養' : '自分で社会保険加入'}
              </span>
            </div>
          )}
          
          {answers.other_income !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-lg">💰</span>
              <span className="text-gray-700">
                給与以外の収入: {answers.other_income ? 'あり' : 'なし'}
              </span>
            </div>
          )}
          
          {answers.multi_pay !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-lg">🏢</span>
              <span className="text-gray-700">
                複数勤務先: {answers.multi_pay ? 'あり' : 'なし'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Threshold Information */}
      {thresholdResult && !independentMode && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900">
              あなたの扶養控除限度額
            </h3>
          </div>
          
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700 mb-2">
              {formatYen(thresholdResult.currentWall)}
            </p>
            <p className="text-sm text-green-600">
              {getThresholdDisplayName(thresholdResult.currentWallType)}
            </p>
            
            {thresholdResult.currentWallType === 'incomeStudent' && (
              <p className="text-xs text-green-600 mt-2">
                ✨ 学生特定扶養控除が適用されます
              </p>
            )}
          </div>
        </div>
      )}

      {/* Independent Mode Notice */}
      {independentMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Independent Mode
          </h3>
          <p className="text-blue-700 text-sm">
            社会保険に加入されているため、扶養控除の管理は不要です。
            収入の記録と分析機能をご利用いただけます。
          </p>
        </div>
      )}

      {/* Next Steps */}
      <div className="space-y-4">
        <button
          onClick={handleGoToDashboard}
          className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          ダッシュボードを開く
        </button>
        
        <p className="text-sm text-gray-500">
          {countdown > 0 ? (
            <>自動的にダッシュボードに移動します ({countdown}秒)</>
          ) : (
            <>移動中...</>
          )}
        </p>
      </div>

      {/* Features Preview */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4">利用可能な機能</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span>📊</span>
            <span>リアルタイム収入追跡</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>💳</span>
            <span>銀行口座連携</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📱</span>
            <span>手動収入入力</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>🔔</span>
            <span>限度額アラート</span>
          </div>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <OnboardingLegalFooter />
    </div>
  );
}

function calculateAge(dob: Date): number {
  const today = new Date();
  const diff = today.getTime() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}