'use client'

import { useState, useEffect } from 'react'
import { questions, AnswerMap } from '@/lib/questionSchema'
import { classifyFuyou } from '@/lib/fuyouClassifier'
import { FuyouClassificationResult } from '@/lib/questionSchema'
import { trackEvent } from '@/lib/gtag'
import * as Sentry from '@sentry/nextjs'

interface UnknownFuyouChatProps {
  isOpen: boolean
  isStudent: boolean
  onClose: () => void
  onComplete: (result: FuyouClassificationResult) => void
}

export default function UnknownFuyouChat({ 
  isOpen, 
  isStudent, 
  onClose, 
  onComplete 
}: UnknownFuyouChatProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({
    estIncome: null,
    inParentIns: null,
    weeklyHours: null,
    month88k: null
  })
  const [inputValue, setInputValue] = useState('')

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  useEffect(() => {
    if (isOpen) {
      // Reset state when opening
      setCurrentQuestionIndex(0)
      setAnswers({
        estIncome: null,
        inParentIns: null,
        weeklyHours: null,
        month88k: null
      })
      setInputValue('')
      
      // Track chat start
      trackEvent.chatUnknownStart()
      Sentry.addBreadcrumb({
        message: 'Unknown fuyou chat started',
        level: 'info',
        data: { isStudent }
      })
    }
  }, [isOpen, isStudent])

  if (!isOpen) return null

  const handleAnswer = (value: number | boolean) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (isLastQuestion) {
      // Calculate classification and complete
      const result = classifyFuyou(newAnswers, isStudent)
      
      // Track completion
      trackEvent.chatUnknownComplete(result.category, result.limit)
      Sentry.addBreadcrumb({
        message: 'Unknown fuyou chat completed',
        level: 'info',
        data: { 
          category: result.category, 
          limit: result.limit,
          // Mask sensitive data
          maskedAnswers: {
            hasIncome: newAnswers.estIncome !== null,
            hasInsurance: newAnswers.inParentIns !== null,
            hasHours: newAnswers.weeklyHours !== null,
            hasMonthlyLimit: newAnswers.month88k !== null
          }
        }
      })
      
      onComplete(result)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setInputValue('')
    }
  }

  const handleNumberSubmit = () => {
    const numValue = parseInt(inputValue.replace(/[^0-9]/g, ''))
    if (!isNaN(numValue) && numValue >= 0) {
      handleAnswer(numValue)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setInputValue('')
    }
  }

  const renderQuestionInput = () => {
    if (currentQuestion.type === 'boolean') {
      return (
        <div className="space-y-3">
          <button
            onClick={() => handleAnswer(true)}
            className="w-full p-4 text-left bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 rounded-xl transition-all duration-200 font-medium text-green-900"
          >
            はい
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="w-full p-4 text-left bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 rounded-xl transition-all duration-200 font-medium text-red-900"
          >
            いいえ
          </button>
        </div>
      )
    }

    if (currentQuestion.type === 'number') {
      return (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`例: 800000`}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-lg text-center"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleNumberSubmit()
                }
              }}
            />
            {currentQuestion.unit && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                {currentQuestion.unit}
              </span>
            )}
          </div>
          <button
            onClick={handleNumberSubmit}
            disabled={!inputValue.trim()}
            className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-all duration-200"
          >
            回答する
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              扶養区分を確認します
            </h2>
            <button
              onClick={() => {
                trackEvent.chatUnknownCancel(currentQuestionIndex)
                Sentry.addBreadcrumb({
                  message: 'Unknown fuyou chat cancelled',
                  level: 'info',
                  data: { questionIndex: currentQuestionIndex }
                })
                onClose()
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress */}
          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full ${
                  index <= currentQuestionIndex ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="text-right mt-2">
            <span className="text-sm text-gray-500 font-medium">
              {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentQuestion.text}
            </h3>
            {currentQuestion.type === 'number' && (
              <p className="text-sm text-gray-500">
                数字のみを入力してください
              </p>
            )}
          </div>

          {renderQuestionInput()}

          {/* Back button */}
          {currentQuestionIndex > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleBack}
                className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
              >
                ← 前の質問に戻る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}