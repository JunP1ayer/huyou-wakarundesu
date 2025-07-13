'use client';

import React, { useState } from 'react';
import { Play, Zap, TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
  userId: string;
}

interface SimulationResult {
  success: boolean;
  deposit_id?: string;
  classification?: {
    is_income: boolean;
    job_id?: string;
    confidence: number;
    matched_keywords?: string[];
  };
  message?: string;
  error?: string;
}

export default function WebhookSimulator({ userId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState('salary');

  const scenarios = [
    {
      id: 'salary',
      name: '給与入金',
      description: 'セブンイレブン',
      amount: 85000,
      bank: 'ゆうちょ銀行'
    },
    {
      id: 'other_job',
      name: '副業給与',
      description: 'スターバックス',
      amount: 45000,
      bank: '三菱UFJ銀行'
    },
    {
      id: 'cash_job',
      name: '現金バイト',
      description: 'イベントスタッフ給与',
      amount: 12000,
      bank: '楽天銀行'
    },
    {
      id: 'non_income',
      name: '非給与入金',
      description: '家族からの送金',
      amount: 30000,
      bank: 'みずほ銀行'
    },
    {
      id: 'freelance',
      name: 'フリーランス',
      description: 'Webデザイン報酬',
      amount: 150000,
      bank: '住信SBIネット銀行'
    }
  ];

  const simulateDeposit = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const scenario = scenarios.find(s => s.id === selectedScenario);
      if (!scenario) throw new Error('Invalid scenario');

      const payload = {
        user_id: userId,
        amount: scenario.amount,
        description: scenario.description,
        transaction_date: new Date().toISOString().split('T')[0],
        bank_name: scenario.bank,
        account_id: `demo_account_${Date.now()}`
      };

      const response = await fetch('/api/webhook/bank-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        setLastResult({
          success: true,
          ...result
        });
      } else {
        setLastResult({
          success: false,
          error: result.error || 'Simulation failed'
        });
      }
    } catch (error) {
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Zap className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">入金シミュレーター</h3>
          <p className="text-sm text-gray-600">
            銀行Webhook機能をテストできます
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Scenario Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            シミュレーションシナリオ
          </label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {scenarios.map(scenario => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name} - {scenario.description} ({scenario.amount.toLocaleString()}円)
              </option>
            ))}
          </select>
        </div>

        {/* Selected Scenario Details */}
        {selectedScenario && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">シミュレーション内容</h4>
            {(() => {
              const scenario = scenarios.find(s => s.id === selectedScenario);
              return scenario ? (
                <div className="space-y-1 text-sm text-purple-800">
                  <p><strong>取引内容:</strong> {scenario.description}</p>
                  <p><strong>金額:</strong> {scenario.amount.toLocaleString()}円</p>
                  <p><strong>銀行:</strong> {scenario.bank}</p>
                  <p><strong>取引日:</strong> {new Date().toLocaleDateString('ja-JP')}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Simulate Button */}
        <button
          onClick={simulateDeposit}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {isLoading ? '処理中...' : '入金をシミュレート'}
        </button>

        {/* Result Display */}
        {lastResult && (
          <div className={`rounded-lg p-4 ${
            lastResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {lastResult.success ? (
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium mb-2 ${
                  lastResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {lastResult.success ? '✅ シミュレーション成功' : '❌ シミュレーション失敗'}
                </h4>

                {lastResult.success && lastResult.classification && (
                  <div className={`space-y-2 text-sm ${
                    lastResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    <p><strong>分類結果:</strong> {lastResult.classification.is_income ? '収入として認識' : '非収入として認識'}</p>
                    <p><strong>信頼度:</strong> {Math.round(lastResult.classification.confidence * 100)}%</p>
                    {lastResult.classification.job_id && (
                      <p><strong>勤務先:</strong> マッチした勤務先あり</p>
                    )}
                    {lastResult.classification.matched_keywords && lastResult.classification.matched_keywords.length > 0 && (
                      <p><strong>マッチキーワード:</strong> {lastResult.classification.matched_keywords.join(', ')}</p>
                    )}
                    {lastResult.message && (
                      <p><strong>メッセージ:</strong> {lastResult.message}</p>
                    )}
                  </div>
                )}

                {!lastResult.success && lastResult.error && (
                  <p className="text-sm text-red-800">
                    <strong>エラー:</strong> {lastResult.error}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">使い方</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• シナリオを選択して「入金をシミュレート」をクリック</li>
                <li>• 自動的に分類エンジンが動作し、収入かどうかを判定</li>
                <li>• 収入として認識された場合、リアルタイムで限度額が更新</li>
                <li>• ダッシュボードで結果を確認できます</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}