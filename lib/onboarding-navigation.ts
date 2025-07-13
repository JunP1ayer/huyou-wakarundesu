/**
 * Onboarding navigation logic with adaptive branching
 */

import { OnboardingAnswers, OnboardingStep } from '../types/onboarding';

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: Date): number {
  const today = new Date();
  const diff = today.getTime() - dob.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Determine the next step based on current answers
 * Implements adaptive branching logic per requirements
 */
export function getNextStep(
  currentStep: OnboardingStep,
  answers: OnboardingAnswers
): OnboardingStep {
  switch (currentStep) {
    case 'ScreenDOB':
      // After DOB, check if user is 19-22 for student question
      if (answers.dob) {
        const age = calculateAge(answers.dob);
        if (age >= 19 && age <= 22) {
          return 'ScreenStudent';
        }
      }
      return 'ScreenInsurance';

    case 'ScreenStudent':
      return 'ScreenInsurance';

    case 'ScreenInsurance':
      // If user selects "self" insurance, skip to Independent Mode
      if (answers.insurance_status === 'self') {
        return 'Complete'; // Independent Mode
      }
      return 'ScreenOtherInc';

    case 'ScreenOtherInc':
      return 'ScreenMultiPay';

    case 'ScreenMultiPay':
      return 'ScreenFutureIns';

    case 'ScreenFutureIns':
      // If future_self_ins_date is in the past, skip to Independent Mode
      if (answers.future_self_ins_date && answers.future_self_ins_date <= new Date()) {
        return 'Complete'; // Independent Mode
      }
      return 'ScreenJobs';

    case 'ScreenJobs':
      return 'ScreenBankLink';

    case 'ScreenBankLink':
      return 'Complete';

    default:
      return 'Complete';
  }
}

/**
 * Get the previous step (for back navigation)
 */
export function getPreviousStep(
  currentStep: OnboardingStep,
  answers: OnboardingAnswers
): OnboardingStep | null {
  switch (currentStep) {
    case 'ScreenDOB':
      return null; // First step

    case 'ScreenStudent':
      return 'ScreenDOB';

    case 'ScreenInsurance':
      if (answers.dob) {
        const age = calculateAge(answers.dob);
        if (age >= 19 && age <= 22) {
          return 'ScreenStudent';
        }
      }
      return 'ScreenDOB';

    case 'ScreenOtherInc':
      return 'ScreenInsurance';

    case 'ScreenMultiPay':
      return 'ScreenOtherInc';

    case 'ScreenFutureIns':
      return 'ScreenMultiPay';

    case 'ScreenJobs':
      return 'ScreenFutureIns';

    case 'ScreenBankLink':
      return 'ScreenJobs';

    default:
      return null;
  }
}

/**
 * Check if a step should be shown based on current answers
 */
export function shouldShowStep(step: OnboardingStep, answers: OnboardingAnswers): boolean {
  switch (step) {
    case 'ScreenDOB':
      return true; // Always show

    case 'ScreenStudent':
      if (answers.dob) {
        const age = calculateAge(answers.dob);
        return age >= 19 && age <= 22;
      }
      return false;

    case 'ScreenInsurance':
      return true; // Always show

    case 'ScreenOtherInc':
    case 'ScreenMultiPay':
    case 'ScreenFutureIns':
    case 'ScreenJobs':
    case 'ScreenBankLink':
      // Only show if insurance_status is "parent"
      return answers.insurance_status === 'parent';

    case 'Complete':
      return true;

    default:
      return false;
  }
}

/**
 * Get all steps that should be shown for the current user
 */
export function getAvailableSteps(answers: OnboardingAnswers): OnboardingStep[] {
  const allSteps: OnboardingStep[] = [
    'ScreenDOB',
    'ScreenStudent',
    'ScreenInsurance',
    'ScreenOtherInc',
    'ScreenMultiPay',
    'ScreenFutureIns',
    'ScreenJobs',
    'ScreenBankLink',
    'Complete'
  ];

  return allSteps.filter(step => shouldShowStep(step, answers));
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(currentStep: OnboardingStep, answers: OnboardingAnswers): number {
  const availableSteps = getAvailableSteps(answers);
  const currentIndex = availableSteps.indexOf(currentStep);
  
  if (currentIndex === -1) return 0;
  
  return Math.round((currentIndex / (availableSteps.length - 1)) * 100);
}

/**
 * Validate answers for a specific step
 */
export function validateStepAnswers(step: OnboardingStep, answers: OnboardingAnswers): boolean {
  switch (step) {
    case 'ScreenDOB':
      return !!answers.dob;

    case 'ScreenStudent':
      return answers.student !== undefined;

    case 'ScreenInsurance':
      return !!answers.insurance_status;

    case 'ScreenOtherInc':
      return answers.other_income !== undefined;

    case 'ScreenMultiPay':
      return answers.multi_pay !== undefined;

    case 'ScreenFutureIns':
      return true; // Optional field

    case 'ScreenJobs':
      return !answers.jobs || answers.jobs.length > 0;

    case 'ScreenBankLink':
      return !answers.bank_connections || answers.bank_connections.length > 0;

    default:
      return true;
  }
}

/**
 * Determine if user will be in Independent Mode
 */
export function isIndependentMode(answers: OnboardingAnswers): boolean {
  return (
    answers.insurance_status === 'self' ||
    (answers.future_self_ins_date !== null && 
     answers.future_self_ins_date !== undefined && 
     answers.future_self_ins_date <= new Date())
  );
}

/**
 * Get completion status message
 */
export function getCompletionMessage(answers: OnboardingAnswers): string {
  if (isIndependentMode(answers)) {
    return '社会保険加入中のため、Independent Modeでご利用いただけます。';
  }
  
  return 'オンボーディングが完了しました！扶養控除の管理を開始します。';
}