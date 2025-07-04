'use client'

import { useState, useCallback } from 'react'
import { FuyouClassificationResult } from '@/lib/questionSchema'

interface UseFuyouChatReturn {
  isOpen: boolean
  openChat: (isStudent: boolean) => Promise<FuyouClassificationResult | null>
  closeChat: () => void
  handleComplete: (result: FuyouClassificationResult) => void
}

export function useFuyouChat(): UseFuyouChatReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [resolve, setResolve] = useState<((result: FuyouClassificationResult | null) => void) | null>(null)

  const openChat = useCallback((): Promise<FuyouClassificationResult | null> => {
    return new Promise((resolveFn) => {
      setIsOpen(true)
      setResolve(() => resolveFn)
    })
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    if (resolve) {
      resolve(null) // User cancelled
      setResolve(null)
    }
  }, [resolve])

  const handleComplete = useCallback((result: FuyouClassificationResult) => {
    setIsOpen(false)
    if (resolve) {
      resolve(result)
      setResolve(null)
    }
  }, [resolve])

  return {
    isOpen,
    openChat,
    closeChat,
    handleComplete
  }
}