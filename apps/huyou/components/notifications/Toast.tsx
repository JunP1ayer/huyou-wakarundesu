'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'warning' | 'error' | 'info' | 'success'
  duration?: number
  onClose?: () => void
}

export default function Toast({ 
  message, 
  type = 'warning', 
  duration = 5000, 
  onClose 
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
      case 'error':
        return <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      case 'success':
        return <CheckCircle className="h-5 w-5 flex-shrink-0" />
      case 'info':
        return <Info className="h-5 w-5 flex-shrink-0" />
      default:
        return <AlertTriangle className="h-5 w-5 flex-shrink-0" />
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm animate-in slide-in-from-top-2">
      <div className={`border rounded-lg p-4 shadow-lg ${getTypeStyles()}`}>
        <div className="flex items-start">
          {getIcon()}
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              onClose?.()
            }}
            className="ml-4 flex-shrink-0 opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast manager for fallback notifications
export function useToastFallback() {
  const [toasts, setToasts] = useState<Array<{
    id: string
    message: string
    type: 'warning' | 'error' | 'info' | 'success'
  }>>([])

  const showToast = (message: string, type: 'warning' | 'error' | 'info' | 'success' = 'warning') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )

  return { showToast, ToastContainer }
}