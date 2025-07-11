'use client';

import { useQuestionStore } from '@/store/questionStore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export function QuestionFlow() {
  const {
    answers,
    currentStep,
    totalSteps,
    updateAnswer,
    nextStep,
    prevStep,
    canProceedToNext,
    getNextStepNumber,
    isStepCompleted,
  } = useQuestionStore();
  
  const router = useRouter();

  const handleNext = () => {
    const nextStepNumber = getNextStepNumber();
    if (nextStepNumber) {
      nextStep();
    } else {
      // 質問完了 → 結果ページへ
      router.push('/result');
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      prevStep();
    } else {
      router.push('/');
    }
  };

  const renderQuestion = () => {
    switch (currentStep) {
      case 1:
        return (
          <QuestionCard
            title="Q1. あなたの年齢について"
            description="扶養控除の判定に必要な情報です"
            question="あなたは19〜22歳の学生ですか？"
            value={answers.isStudent19to22}
            onAnswer={(value) => updateAnswer('isStudent19to22', value)}
          />
        );

      case 2:
        return (
          <QuestionCard
            title="Q2. 労働時間について"
            description="社会保険の適用判定に必要です"
            question="週20時間以上働いていますか？"
            value={answers.weeklyHours20}
            onAnswer={(value) => updateAnswer('weeklyHours20', value)}
          />
        );

      case 3:
        return (
          <QuestionCard
            title="Q3. 勤務先について"
            description="106万円壁の適用判定に必要です"
            question="勤務先の従業員数は概ね51人以上ですか？"
            value={answers.company51Plus}
            onAnswer={(value) => updateAnswer('company51Plus', value)}
          />
        );

      default:
        return null;
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;
  const nextStepExists = getNextStepNumber() !== null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* プログレスバー */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>質問 {currentStep} / {totalSteps}</span>
          <span>{Math.round(progressPercentage)}% 完了</span>
        </div>
        <Progress value={progressPercentage} className="w-full" />
      </div>

      {/* 質問カード */}
      {renderQuestion()}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          戻る
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceedToNext()}
          className="flex items-center gap-2"
        >
          {nextStepExists ? '次へ' : '結果を見る'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* ステップインジケーター */}
      <div className="flex justify-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`w-3 h-3 rounded-full ${
              step === currentStep
                ? 'bg-primary'
                : isStepCompleted(step)
                ? 'bg-primary/60'
                : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

interface QuestionCardProps {
  title: string;
  description: string;
  question: string;
  value: boolean | null;
  onAnswer: (value: boolean) => void;
}

function QuestionCard({ title, description, question, value, onAnswer }: QuestionCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-base font-medium">{question}</p>
        
        <div className="flex gap-4">
          <Button
            variant={value === true ? 'default' : 'outline'}
            size="lg"
            onClick={() => onAnswer(true)}
            className="flex-1"
          >
            はい
          </Button>
          <Button
            variant={value === false ? 'default' : 'outline'}
            size="lg"
            onClick={() => onAnswer(false)}
            className="flex-1"
          >
            いいえ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}