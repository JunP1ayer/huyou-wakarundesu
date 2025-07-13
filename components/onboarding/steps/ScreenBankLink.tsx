'use client';

import React, { useState } from 'react';
import { OnboardingAnswers } from '@/types/onboarding';
import { STEP_CONFIGS } from '@/types/onboarding';
import { CreditCard, ArrowLeft, Plus, Shield, AlertCircle } from 'lucide-react';

interface BankConnection {
  id?: string;
  bank_name: string;
  account_type: 'checking' | 'savings' | 'other';
  account_nickname?: string;
}

interface Props {
  answers: OnboardingAnswers;
  updateAnswers: (answers: Partial<OnboardingAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
  canGoBack: boolean;
  isLoading: boolean;
}

export default function ScreenBankLink({ answers, updateAnswers, onNext, onBack, canGoBack, isLoading }: Props) {
  const config = STEP_CONFIGS.ScreenBankLink;
  const [bankConnections, setBankConnections] = useState<BankConnection[]>(answers.bank_connections || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnection, setNewConnection] = useState<BankConnection>({
    bank_name: '',
    account_type: 'checking',
    account_nickname: ''
  });

  const popularBanks = [
    'ゆうちょ銀行', '三菱UFJ銀行', '三井住友銀行', 'みずほ銀行',
    'りそな銀行', '楽天銀行', '住信SBIネット銀行', 'PayPay銀行',
    'イオン銀行', 'セブン銀行'
  ];

  const addConnection = () => {
    if (newConnection.bank_name.trim()) {
      const updatedConnections = [...bankConnections, { 
        ...newConnection, 
        id: Date.now().toString(),
        account_nickname: newConnection.account_nickname || `${newConnection.bank_name}口座`
      }];
      setBankConnections(updatedConnections);
      setNewConnection({
        bank_name: '',
        account_type: 'checking',
        account_nickname: ''
      });
      setShowAddForm(false);
    }
  };

  const removeConnection = (index: number) => {
    const updatedConnections = bankConnections.filter((_, i) => i !== index);
    setBankConnections(updatedConnections);
  };

  const handleNext = () => {
    updateAnswers({ bank_connections: bankConnections });
    onNext();
  };

  const getAccountTypeLabel = (type: string) => {
    const labels = {
      checking: '普通預金',
      savings: '定期預金',
      other: 'その他'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600">
          {config.description}
        </p>
      </div>

      <div className="space-y-6 text-left">
        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">セキュリティについて</h4>
              <p className="text-sm text-blue-800">
                このデモでは実際の銀行連携は行いません。口座情報の登録のみ行い、
                後ほどWebhookシミュレーターで入金データをテストできます。
              </p>
            </div>
          </div>
        </div>

        {/* Existing Connections */}
        {bankConnections.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">連携予定の口座</h3>
            {bankConnections.map((connection, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{connection.account_nickname}</p>
                  <p className="text-sm text-gray-600">
                    {connection.bank_name} • {getAccountTypeLabel(connection.account_type)}
                  </p>
                </div>
                <button
                  onClick={() => removeConnection(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Connection Form */}
        {showAddForm ? (
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">銀行口座を追加</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  銀行名
                </label>
                <select
                  value={newConnection.bank_name}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, bank_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">銀行を選択してください</option>
                  {popularBanks.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                  <option value="other">その他</option>
                </select>
              </div>

              {newConnection.bank_name === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    銀行名を入力
                  </label>
                  <input
                    type="text"
                    value={newConnection.account_nickname}
                    onChange={(e) => setNewConnection(prev => ({ ...prev, bank_name: e.target.value, account_nickname: e.target.value }))}
                    placeholder="銀行名を入力"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  口座種別
                </label>
                <select
                  value={newConnection.account_type}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, account_type: e.target.value as BankConnection['account_type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="checking">普通預金</option>
                  <option value="savings">定期預金</option>
                  <option value="other">その他</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ニックネーム（任意）
                </label>
                <input
                  type="text"
                  value={newConnection.account_nickname}
                  onChange={(e) => setNewConnection(prev => ({ ...prev, account_nickname: e.target.value }))}
                  placeholder={`例: ${newConnection.bank_name}メイン口座`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={addConnection}
                  disabled={!newConnection.bank_name}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  追加
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Plus className="w-5 h-5" />
              <span>銀行口座を追加</span>
            </div>
          </button>
        )}

        {/* Demo Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">デモ環境について</h4>
              <p className="text-sm text-yellow-800">
                実際の銀行API連携の代わりに、Webhookシミュレーターで入金データをテストできます。
                ダッシュボードで「入金シミュレート」ボタンから模擬データを送信可能です。
              </p>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleNext}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {bankConnections.length > 0 ? '設定完了' : 'スキップ（後で設定）'}
          </button>
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
    </div>
  );
}