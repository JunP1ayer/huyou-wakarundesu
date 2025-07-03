import { NextRequest, NextResponse } from 'next/server'
import { type FuyouClassificationResult } from '@/lib/openaiClient'
import { trackEvent } from '@/lib/gtag'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers, isStudent } = body

    // Validate input
    if (!answers || typeof isStudent !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid input: answers and isStudent are required' },
        { status: 400 }
      )
    }

    // Add breadcrumb for tracking
    Sentry.addBreadcrumb({
      message: 'OpenAI classification request started',
      level: 'info',
      data: {
        isStudent,
        // Mask sensitive data
        hasEstIncome: answers.estIncome !== null,
        hasInsuranceInfo: answers.inParentIns !== null,
        hasHoursInfo: answers.weeklyHours !== null,
        hasMonthlyInfo: answers.month88k !== null
      }
    })

    // Check for demo mode
    if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !process.env.OPENAI_API_KEY) {
      console.log('🟡 ClassifyFuyou API - Demo mode: Returning mock classification result')
      
      // Mock classification result based on input
      const mockResult: FuyouClassificationResult = {
        category: isStudent ? '130万円社保外' : '103万円扶養',
        limitIncome: isStudent ? 1300000 : 1030000,
        reason: isStudent 
          ? 'デモモード: 学生の場合、年収130万円以内であれば扶養控除の対象となります。'
          : 'デモモード: 一般的には年収103万円以内であれば所得税の扶養控除対象となります。'
      }

      // Track demo mode usage
      trackEvent.openaiClassifySuccess(mockResult.category, mockResult.limitIncome)

      Sentry.addBreadcrumb({
        message: 'Mock classification completed (demo mode)',
        level: 'info',
        data: {
          category: mockResult.category,
          limitIncome: mockResult.limitIncome,
          demo_mode: true
        }
      })

      return NextResponse.json(mockResult)
    }

    // Dynamically import OpenAI function to avoid build-time initialization
    const { classifyFuyouWithAI } = await import('@/lib/openaiClient')
    
    // Call OpenAI API
    const result: FuyouClassificationResult = await classifyFuyouWithAI(answers, isStudent)

    // Track success event
    trackEvent.openaiClassifySuccess(result.category, result.limitIncome)

    Sentry.addBreadcrumb({
      message: 'OpenAI classification completed successfully',
      level: 'info',
      data: {
        category: result.category,
        limitIncome: result.limitIncome
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in classifyFuyou API:', error)

    // Track error event
    trackEvent.openaiClassifyError(error instanceof Error ? error.message : 'Unknown error')

    Sentry.captureException(error, {
      tags: {
        section: 'openai_classification'
      },
      extra: {
        endpoint: '/api/classifyFuyou'
      }
    })

    return NextResponse.json(
      { error: 'Classification failed. Please try again.' },
      { status: 500 }
    )
  }
}