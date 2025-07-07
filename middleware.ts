import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // ── debug: Edge Runtime で env が入っているか確認（ログは Vercel dashboard → Functions）
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30))
  console.log('SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)

  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // セッション取得（エラーも catch してログへ）
  const { error } = await supabase.auth.getSession()
  if (error) console.error('middleware getSession error:', error)
  return res
}

// _next/static, _next/image, favicon, manifest などは除外して 401 を防ぐ
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt).*)',
  ],
}