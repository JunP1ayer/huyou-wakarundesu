'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuestionStore } from '@/store/questionStore';
import { formatResult, formatCurrency } from '@/lib/fuyouLogic';
import { MockBankApi } from '@/lib/bank/mockBankApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Banknote, ExternalLink, RefreshCw, TrendingUp } from 'lucide-react';
import type { FuyouJudgeParams, FuyouResultDisplay } from '@/types';

export default function ResultPage() {
  const router = useRouter();
  const { answers, bankToken, annualIncome, setBankConnection, setBankToken, setAnnualIncome } = useQuestionStore();
  const [result, setResult] = useState<FuyouResultDisplay | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  useEffect(() => {
    // 質問が完了していない場合は質問ページにリダイレクト
    if (answers.isStudent19to22 === undefined || 
        (!answers.isStudent19to22 && answers.weeklyHours20 === null)) {
      router.push('/questions');
      return;
    }

    // 扶養判定を実行
    const params: FuyouJudgeParams = {
      ...answers,
      annualIncome: annualIncome,
    };

    const judgmentResult = formatResult(params);
    setResult(judgmentResult);
  }, [answers, annualIncome, router]);

  const handleBankConnect = async () => {
    setIsConnecting(true);
    setBankConnection({ isLoading: true, error: null });

    try {
      // OAuth認証の開始
      const { state } = await MockBankApi.initiateOAuth();
      
      // 実際のアプリではここでOAuth画面にリダイレクト
      // モックでは直接コールバック処理を実行
      const { success, token } = await MockBankApi.handleCallback('mock_auth_code', state);
      
      if (success && token) {
        setBankToken(token);
        setBankConnection({ isConnected: true, isLoading: false });
        
        // 収入データを取得
        const incomeData = await MockBankApi.getCurrentYearIncome(token);
        if (incomeData.success && incomeData.data) {
          setAnnualIncome(incomeData.data.currentYearIncome);
        }
        
        setShowBankModal(false);
      } else {
        setBankConnection({ isLoading: false, error: '認証に失敗しました' });
      }
    } catch {
      setBankConnection({ isLoading: false, error: '接続エラーが発生しました' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncData = async () => {
    if (!bankToken) return;
    
    setIsConnecting(true);
    try {
      const syncedData = await MockBankApi.syncData(bankToken);
      if (syncedData.success && syncedData.data) {
        setAnnualIncome(syncedData.data.currentYearIncome);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!result) {
    return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
  }

  const badgeColor = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    red: 'bg-red-100 text-red-800 border-red-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
  }[result.badge.color];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            トップに戻る
          </Button>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            扶養区分の判定結果
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 判定結果カード */}
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Badge className={`text-lg px-4 py-2 ${badgeColor}`}>
                {result.badge.text}
              </Badge>
            </div>
            <CardTitle className="text-3xl">{result.message}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 収入情報 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">今年の累計収入</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(result.currentIncome)}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">あと稼げる金額</h3>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(result.remainingAmount)}
                </p>
              </div>
            </div>

            {/* 閾値情報 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">適用される閾値</h3>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(result.threshold)}
              </p>
            </div>

            {/* 銀行連携セクション */}
            <Card className="border-dashed">
              <CardContent className="p-6">
                {!bankToken ? (
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">📊 銀行連携で自動追跡</h3>
                    <p className="text-gray-600 mb-4">
                      Moneytree LINKと連携して収入を自動で追跡しましょう
                    </p>
                    <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Banknote className="w-4 h-4 mr-2" />
                          銀行連携をはじめる
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>銀行連携（Moneytree LINK）</DialogTitle>
                          <DialogDescription>
                            安全にあなたの収入データを取得します
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">🔒 セキュリティについて</h4>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• 読み取り専用のアクセス</li>
                              <li>• 銀行口座情報は取得しません</li>
                              <li>• いつでも連携を解除できます</li>
                            </ul>
                          </div>
                          <Button 
                            onClick={handleBankConnect} 
                            disabled={isConnecting}
                            className="w-full"
                          >
                            {isConnecting ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                接続中...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Moneytreeに接続
                              </>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="font-semibold mb-2 text-green-600">✅ 銀行連携済み</h3>
                    <p className="text-gray-600 mb-4">
                      収入データは自動で更新されます
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleSyncData}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TrendingUp className="w-4 h-4 mr-2" />
                      )}
                      データを更新
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* 法改正に関する注意書き */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-yellow-800 mb-2">📢 法改正情報</h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>• 2024年10月より社会保険の適用要件が変更される予定です</p>
              <p>• 扶養控除額の見直しが検討されています</p>
              <p>• 最新の情報は国税庁や厚生労働省のサイトでご確認ください</p>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.nta.go.jp/" target="_blank" rel="noopener noreferrer">
                  国税庁
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://www.mhlw.go.jp/" target="_blank" rel="noopener noreferrer">
                  厚生労働省
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}