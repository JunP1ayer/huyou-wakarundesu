'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'

export default function Callback() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  useEffect(() => {
    (async () => {
      const { error } = await supabase.auth.getSession()
      if (error) {
        console.error('callback getSession error', error)
        router.replace(`/login?error=${encodeURIComponent(error.message)}`)
      } else {
        router.replace('/dashboard')
      }
    })()
  }, [router, supabase])

  return <p>認証処理中…</p>
}