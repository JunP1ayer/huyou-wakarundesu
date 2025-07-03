/**
 * ダッシュボードチャートコンポーネントのテスト
 * 進捗表示とステータス判定のUIテスト
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import DashboardChart from '@/components/dashboard/DashboardChart'
import { UserProfile, UserStats } from '@/lib/supabase'

// テスト用データ
const mockProfile: UserProfile = {
  user_id: 'test-user-id',
  fuyou_line: 1030000,
  hourly_wage: 1000,
  is_student: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z'
}

const mockStats: UserStats = {
  user_id: 'test-user-id',
  ytd_income: 500000,
  transaction_count: 25,
  last_calculated: '2025-07-01T12:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-07-01T12:00:00Z'
}

// threshold utilsのモック
jest.mock('@/utils/threshold', () => ({
  getThresholdStatus: jest.fn((income, limit) => {
    const percentage = (income / limit) * 100
    if (percentage < 80) {
      return { status: 'safe', label: '安全', message: '扶養範囲内です' }
    } else if (percentage < 95) {
      return { status: 'warning', label: '注意', message: '限度額に近づいています' }
    } else if (percentage < 100) {
      return { status: 'danger', label: '危険', message: '限度額まで僅かです' }
    } else {
      return { status: 'exceeded', label: '超過', message: '限度額を超過しています' }
    }
  })
}))

describe('DashboardChart コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('基本表示', () => {
    test('チャートが正常にレンダリングされる', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      expect(screen.getByText('扶養範囲ステータス')).toBeInTheDocument()
      expect(screen.getByText('今年の収入進捗')).toBeInTheDocument()
      expect(screen.getByText('残り可能収入')).toBeInTheDocument()
      expect(screen.getByText('取引件数')).toBeInTheDocument()
    })

    test('収入金額が正しくフォーマットされて表示される', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      // 現在の収入
      expect(screen.getByText('¥500,000')).toBeInTheDocument()
      // 限度額
      expect(screen.getByText('¥1,030,000')).toBeInTheDocument()
      // 残り可能収入
      expect(screen.getByText('¥530,000')).toBeInTheDocument()
    })

    test('取引件数が正しく表示される', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      expect(screen.getByText('25件')).toBeInTheDocument()
    })

    test('進捗率が正しく計算される', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      // 500,000 / 1,030,000 = 48.5%
      expect(screen.getByText('48.5%')).toBeInTheDocument()
    })
  })

  describe('ステータス表示テスト', () => {
    test('安全な収入レベル（50万円）でのステータス表示', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      expect(screen.getByText('安全')).toBeInTheDocument()
      expect(screen.getByText('扶養範囲内です')).toBeInTheDocument()
    })

    test('警告レベル（85万円）でのステータス表示', () => {
      const warningStats = { ...mockStats, ytd_income: 850000 }
      render(<DashboardChart stats={warningStats} profile={mockProfile} />)
      
      expect(screen.getByText('注意')).toBeInTheDocument()
      expect(screen.getByText('限度額に近づいています')).toBeInTheDocument()
    })

    test('危険レベル（98万円）でのステータス表示', () => {
      const dangerStats = { ...mockStats, ytd_income: 980000 }
      render(<DashboardChart stats={dangerStats} profile={mockProfile} />)
      
      expect(screen.getByText('危険')).toBeInTheDocument()
      expect(screen.getByText('限度額まで僅かです')).toBeInTheDocument()
    })

    test('超過レベル（110万円）でのステータス表示', () => {
      const exceededStats = { ...mockStats, ytd_income: 1100000 }
      render(<DashboardChart stats={exceededStats} profile={mockProfile} />)
      
      expect(screen.getByText('超過')).toBeInTheDocument()
      expect(screen.getByText('限度額を超過しています')).toBeInTheDocument()
    })
  })

  describe('進捗バーのスタイルテスト', () => {
    test('安全レベルでは緑色の進捗バー', () => {
      const { container } = render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      const progressBar = container.querySelector('.bg-green-500')
      expect(progressBar).toBeInTheDocument()
    })

    test('警告レベルでは黄色の進捗バー', () => {
      const warningStats = { ...mockStats, ytd_income: 850000 }
      const { container } = render(<DashboardChart stats={warningStats} profile={mockProfile} />)
      
      const progressBar = container.querySelector('.bg-yellow-500')
      expect(progressBar).toBeInTheDocument()
    })

    test('危険レベルでは赤色の進捗バー', () => {
      const dangerStats = { ...mockStats, ytd_income: 980000 }
      const { container } = render(<DashboardChart stats={dangerStats} profile={mockProfile} />)
      
      const progressBar = container.querySelector('.bg-red-500')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('境界値テスト', () => {
    test('収入が0円の場合', () => {
      const zeroStats = { ...mockStats, ytd_income: 0 }
      render(<DashboardChart stats={zeroStats} profile={mockProfile} />)
      
      expect(screen.getByText('¥0')).toBeInTheDocument()
      expect(screen.getByText('0.0%')).toBeInTheDocument()
      expect(screen.getByText('¥1,030,000')).toBeInTheDocument() // 残り金額は限度額と同じ
    })

    test('限度額ちょうどの場合', () => {
      const exactStats = { ...mockStats, ytd_income: 1030000 }
      render(<DashboardChart stats={exactStats} profile={mockProfile} />)
      
      expect(screen.getByText('100.0%')).toBeInTheDocument()
      expect(screen.getByText('¥0')).toBeInTheDocument() // 残り可能収入は0
    })

    test('限度額を大幅に超過した場合', () => {
      const exceededStats = { ...mockStats, ytd_income: 2000000 }
      render(<DashboardChart stats={exceededStats} profile={mockProfile} />)
      
      expect(screen.getByText('100.0%')).toBeInTheDocument() // 100%以上は100%に制限
      expect(screen.getByText('¥0')).toBeInTheDocument() // 残り可能収入は0
    })
  })

  describe('詳細情報表示', () => {
    test('最終計算日時が正しく表示される', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      // 日本語ロケールでの日時表示をテスト
      expect(screen.getByText(/最終計算:/)).toBeInTheDocument()
      expect(screen.getByText(/2025/)).toBeInTheDocument()
    })

    test('データ更新日時が正しく表示される', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      expect(screen.getByText(/データ更新:/)).toBeInTheDocument()
      expect(screen.getByText(/2025/)).toBeInTheDocument()
    })
  })

  describe('プロップスバリデーション', () => {
    test('profile.fuyou_line が0以下の場合のエラーハンドリング', () => {
      const invalidProfile = { ...mockProfile, fuyou_line: 0 }
      
      render(<DashboardChart stats={mockStats} profile={invalidProfile} />)
      
      // 進捗率は0%になるはず
      expect(screen.getByText('0.0%')).toBeInTheDocument()
    })

    test('stats.ytd_income が負の値の場合', () => {
      const invalidStats = { ...mockStats, ytd_income: -100000 }
      
      render(<DashboardChart stats={invalidStats} profile={mockProfile} />)
      
      // 負の値も正しく表示されることを確認
      expect(screen.getByText('¥-100,000')).toBeInTheDocument()
    })
  })

  describe('アクセシビリティテスト', () => {
    test('適切なセマンティックHTMLが使用されている', () => {
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      // ヘッダーがh3要素で構造化されている
      expect(screen.getByRole('heading', { level: 3, name: '扶養範囲ステータス' })).toBeInTheDocument()
    })

    test('進捗バーにaria-labelが設定されている', () => {
      const { container } = render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      // 進捗バー要素の確認（実装に応じて調整が必要）
      const progressBars = container.querySelectorAll('[role="progressbar"]')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  describe('レスポンシブデザインテスト', () => {
    test('モバイル表示での要素配置', () => {
      // ビューポートサイズをモバイルに設定
      global.innerWidth = 375
      global.innerHeight = 667
      
      render(<DashboardChart stats={mockStats} profile={mockProfile} />)
      
      // グリッドレイアウトが正しく適用されている
      const gridContainer = screen.getByText('残り可能収入').closest('.grid')
      expect(gridContainer).toHaveClass('grid-cols-2')
    })
  })
})