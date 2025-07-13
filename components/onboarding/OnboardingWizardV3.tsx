'use client';

import React, { useState, useEffect } from 'react';
import { OnboardingAnswers, OnboardingStep } from '@/types/onboarding';
import { 
  getNextStep, 
  getPreviousStep, 
  calculateProgress, 
  validateStepAnswers,
  isIndependentMode,
  getCompletionMessage
} from '@/lib/onboarding-navigation';

// Step components
import ScreenDOB from './steps/ScreenDOB';
import ScreenStudent from './steps/ScreenStudent';
import ScreenInsurance from './steps/ScreenInsurance';
import ScreenOtherInc from './steps/ScreenOtherInc';
import ScreenMultiPay from './steps/ScreenMultiPay';
import ScreenFutureIns from './steps/ScreenFutureIns';
import ScreenJobs from './steps/ScreenJobs';
import ScreenBankLink from './steps/ScreenBankLink';
import ScreenComplete from './steps/ScreenComplete';

export default function OnboardingWizardV3() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('ScreenDOB');
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [isLoading, setIsLoading] = useState(false);

  const progress = calculateProgress(currentStep, answers);
  const canGoNext = validateStepAnswers(currentStep, answers);
  const canGoBack = getPreviousStep(currentStep, answers) !== null;

  const handleNext = async () => {
    if (!canGoNext) return;

    setIsLoading(true);
    
    const nextStep = getNextStep(currentStep, answers);
    
    if (nextStep === 'Complete') {
      // Save to database
      try {
        await saveOnboardingData(answers);
        setCurrentStep(nextStep);
      } catch (error) {
        console.error('Error saving onboarding data:', error);
        // Handle error - show toast, etc.
      }
    } else {
      setCurrentStep(nextStep);
    }
    
    setIsLoading(false);
  };

  const handleBack = () => {
    const prevStep = getPreviousStep(currentStep, answers);
    if (prevStep) {
      setCurrentStep(prevStep);
    }
  };

  const updateAnswers = (newAnswers: Partial<OnboardingAnswers>) => {
    setAnswers(prev => ({ ...prev, ...newAnswers }));
  };

  const renderCurrentStep = () => {
    const stepProps = {
      answers,
      updateAnswers,
      onNext: handleNext,
      onBack: handleBack,
      canGoNext,
      canGoBack,
      isLoading
    };

    switch (currentStep) {
      case 'ScreenDOB':
        return <ScreenDOB {...stepProps} />;
      case 'ScreenStudent':
        return <ScreenStudent {...stepProps} />;
      case 'ScreenInsurance':
        return <ScreenInsurance {...stepProps} />;
      case 'ScreenOtherInc':
        return <ScreenOtherInc {...stepProps} />;
      case 'ScreenMultiPay':
        return <ScreenMultiPay {...stepProps} />;
      case 'ScreenFutureIns':
        return <ScreenFutureIns {...stepProps} />;
      case 'ScreenJobs':
        return <ScreenJobs {...stepProps} />;
      case 'ScreenBankLink':
        return <ScreenBankLink {...stepProps} />;
      case 'Complete':
        return <ScreenComplete answers={answers} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              オンボーディング進行状況 (2025年税制対応)
            </span>
            <span className="text-sm font-medium text-gray-700">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            {renderCurrentStep()}
          </div>
        </div>

        {/* Debug Info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2">Debug Info (V3):</h3>
            <p>Current Step: {currentStep}</p>
            <p>Progress: {progress}%</p>
            <p>Can Go Next: {canGoNext ? 'Yes' : 'No'}</p>
            <p>Independent Mode: {isIndependentMode(answers) ? 'Yes' : 'No'}</p>
            <pre className="mt-2 text-xs">{JSON.stringify(answers, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

async function saveOnboardingData(answers: OnboardingAnswers) {
  const response = await fetch('/api/onboarding/save-v3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(answers),
  });

  if (!response.ok) {
    throw new Error('Failed to save onboarding data');
  }

  return response.json();
}