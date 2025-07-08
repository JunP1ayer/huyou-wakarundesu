/**
 * 包括的 API テスト: /api/profile/complete
 * セキュリティ、エッジケース、型安全性を検証
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/profile/complete/route'
import type { ProfileCompleteApiResponse, ApiErrorResponse, ProfileCompleteResponse } from '@/types/api'

// Supabase モック
const mockSupabaseAuth = {
  getSession: jest.fn()
}

const mockSupabaseFrom = {
  upsert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn()
}

const mockSupabase = {
  auth: mockSupabaseAuth,
  from: jest.fn(() => mockSupabaseFrom)
}

// calcAllowance モック
jest.mock('@/lib/calcAllowance', () => ({
  calcAllowance: jest.fn(() => 103)
}))

// Supabase クライアントモック
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => mockSupabase)
}))

// cookies モック
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

describe('/api/profile/complete - 包括的テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // デフォルトの成功レスポンス
    mockSupabaseAuth.getSession.mockResolvedValue({
      data: { 
        session: { 
          user: { id: 'test-user-123' } 
        } 
      },
      error: null
    })
    mockSupabaseFrom.single.mockResolvedValue({
      data: {
        user_id: 'test-user-123',
        is_student: true,
        annual_income: 1000000,
        is_over_20h: false,
        fuyou_line: 1030000,
        profile_completed: true,
        profile_completed_at: '2025-01-01T00:00:00.000Z',
        updated_at: '2025-01-01T00:00:00.000Z'
      },
      error: null
    })
  })

  describe('✅ 正常系テスト', () => {
    test('有効なリクエストで成功レスポンスを返す', async () => {
      const validPayload = {
        isStudent: true,
        annualIncome: 1000000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ProfileCompleteResponse

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.allowance).toBe(103)
      expect(data.profile).toBeDefined()
      expect(data.profile.user_id).toBe('test-user-123')
    })

    test('レスポンスヘッダが適切に設定される', async () => {
      const validPayload = {
        isStudent: true,
        annualIncome: 1000000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)

      expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate')
      expect(response.headers.get('X-Response-Time')).toMatch(/\\d+ms/)
    })
  })

  describe('🔒 認証・セッションテスト', () => {
    test('セッションエラー時は401を返す', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session invalid' }
      })

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify({ isStudent: true, annualIncome: 1000000, isDependent: true, isOver20hContract: false }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(401)
      expect(data.code).toBe('UNAUTHORIZED')
      expect(data.redirectTo).toBe('/login')
    })

    test('セッション期限切れ時は適切なエラーコードを返す', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      })

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify({ isStudent: true, annualIncome: 1000000, isDependent: true, isOver20hContract: false }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(401)
      expect(data.code).toBe('SESSION_EXPIRED')
      expect(data.error).toBe('Session expired')
    })

    test('ユーザーIDなしセッション時は401を返す', async () => {
      mockSupabaseAuth.getSession.mockResolvedValue({
        data: { session: { user: null } },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify({ isStudent: true, annualIncome: 1000000, isDependent: true, isOver20hContract: false }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(401)
      expect(data.code).toBe('UNAUTHORIZED')
    })
  })

  describe('🛡️ 入力値検証テスト', () => {
    test('不正なJSONは400エラーを返す', async () => {
      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.error).toBe('Invalid JSON in request body')
    })

    test('必須フィールド不足時は400エラーを返す', async () => {
      const incompletePayload = {
        isStudent: true,
        // annualIncome missing
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(incompletePayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.error).toContain('Missing required field: annualIncome')
    })

    test('年収範囲外（負数）は400エラーを返す', async () => {
      const invalidPayload = {
        isStudent: true,
        annualIncome: -1000000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.error).toContain('Annual income must be between 0 and 50,000,000 yen')
    })

    test('年収範囲外（上限超過）は400エラーを返す', async () => {
      const invalidPayload = {
        isStudent: true,
        annualIncome: 100_000_000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
      expect(data.error).toContain('Annual income must be between 0 and 50,000,000 yen')
    })

    test('非数値年収は400エラーを返す', async () => {
      const invalidPayload = {
        isStudent: true,
        annualIncome: 'not-a-number',
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(invalidPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('💾 データベースエラーテスト', () => {
    test('データベース保存エラー時は500を返す', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'PGRST116' }
      })

      const validPayload = {
        isStudent: true,
        annualIncome: 1000000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(500)
      expect(data.code).toBe('DATABASE_ERROR')
      expect(data.error).toBe('Failed to save profile')
    })

    test('権限エラー時は403を返す', async () => {
      mockSupabaseFrom.single.mockResolvedValue({
        data: null,
        error: { message: 'permission denied', code: 'PGRST301' }
      })

      const validPayload = {
        isStudent: true,
        annualIncome: 1000000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(403)
      expect(data.code).toBe('UNAUTHORIZED')
    })
  })

  describe('🧮 計算ロジックテスト', () => {
    test('calcAllowanceエラー時は500を返す', async () => {
      const { calcAllowance } = require('@/lib/calcAllowance')
      calcAllowance.mockImplementation(() => {
        throw new Error('Calculation failed')
      })

      const validPayload = {
        isStudent: true,
        annualIncome: 1000000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(500)
      expect(data.code).toBe('INTERNAL_ERROR')
      expect(data.error).toBe('Failed to calculate allowance')
    })
  })

  describe('⚡ エッジケース・パフォーマンステスト', () => {
    test('境界値年収（0円）で正常処理', async () => {
      const boundaryPayload = {
        isStudent: true,
        annualIncome: 0,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(boundaryPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ProfileCompleteResponse

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.profile.annual_income).toBe(0)
    })

    test('境界値年収（上限）で正常処理', async () => {
      const boundaryPayload = {
        isStudent: true,
        annualIncome: 50_000_000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(boundaryPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ProfileCompleteResponse

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.profile.annual_income).toBe(50_000_000)
    })

    test('型変換テスト（文字列boolean）', async () => {
      const typeConversionPayload = {
        isStudent: 'true',
        annualIncome: '1000000',
        isDependent: 'false',
        isOver20hContract: 'true'
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(typeConversionPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ProfileCompleteResponse

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.profile.is_student).toBe(true)
      expect(data.profile.annual_income).toBe(1000000)
      expect(data.profile.is_over_20h).toBe(true)
    })

    test('レスポンス時間が記録される', async () => {
      const validPayload = {
        isStudent: true,
        annualIncome: 1000000,
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(validPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const start = Date.now()
      const response = await POST(request)
      const end = Date.now()

      const responseTime = response.headers.get('X-Response-Time')
      expect(responseTime).toMatch(/\\d+ms/)
      
      const duration = parseInt(responseTime?.replace('ms', '') || '0')
      expect(duration).toBeGreaterThanOrEqual(0)
      expect(duration).toBeLessThanOrEqual(end - start + 100) // 100ms buffer
    })
  })

  describe('🔐 セキュリティテスト', () => {
    test('大容量ペイロードの処理', async () => {
      const largePayload = {
        isStudent: true,
        annualIncome: 1000000,
        isDependent: true,
        isOver20hContract: false,
        // 大量の追加データ
        extraData: 'x'.repeat(1000000) // 1MB
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(largePayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      
      // 大容量でも正常処理されることを確認
      expect(response.status).toBe(200)
    })

    test('SQLインジェクション対策（文字列年収）', async () => {
      const sqlInjectionPayload = {
        isStudent: true,
        annualIncome: "1000000; DROP TABLE users; --",
        isDependent: true,
        isOver20hContract: false
      }

      const request = new NextRequest('http://localhost:3000/api/profile/complete', {
        method: 'POST',
        body: JSON.stringify(sqlInjectionPayload),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json() as ApiErrorResponse

      expect(response.status).toBe(400)
      expect(data.code).toBe('VALIDATION_ERROR')
    })
  })
})