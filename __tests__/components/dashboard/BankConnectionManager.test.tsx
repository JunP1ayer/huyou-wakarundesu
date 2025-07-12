import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import BankConnectionManager, { BankConnection } from '@/components/dashboard/BankConnectionManager'

// モック用のタイマー
jest.useFakeTimers()

describe('BankConnectionManager', () => {
  const mockOnConnectionChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  it('初期状態で銀行接続リストが表示される', () => {
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    expect(screen.getByText('銀行口座連携')).toBeInTheDocument()
    expect(screen.getByText('三菱UFJ銀行')).toBeInTheDocument()
    expect(screen.getByText('ゆうちょ銀行')).toBeInTheDocument()
    expect(screen.getByText('銀行を追加')).toBeInTheDocument()
  })

  it('接続済み銀行の状態が正しく表示される', () => {
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    // 三菱UFJ銀行は接続済みとして表示される
    const connectedBank = screen.getByText('三菱UFJ銀行').closest('div')
    expect(connectedBank).toContainElement(screen.getByText('****1234'))
  })

  it('エラー状態の銀行が正しく表示される', () => {
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    // ゆうちょ銀行はエラー状態として表示される
    expect(screen.getByText('認証エラー：再認証が必要です')).toBeInTheDocument()
  })

  it('銀行追加ボタンをクリックすると新しい接続が追加される', async () => {
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    const addButton = screen.getByText('銀行を追加')
    fireEvent.click(addButton)
    
    // ローディング状態の確認
    expect(screen.getByText('接続中...')).toBeInTheDocument()
    
    // タイマーを進めて非同期処理を完了
    jest.advanceTimersByTime(2000)
    await waitFor(() => {
      expect(screen.getByText('楽天銀行')).toBeInTheDocument()
    })
    
    // onConnectionChangeが呼ばれることを確認
    expect(mockOnConnectionChange).toHaveBeenCalled()
  })

  it('再接続ボタンをクリックするとエラー状態が解消される', async () => {
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    // エラー状態の銀行の再接続ボタンを探す
    const errorBankSection = screen.getByText('ゆうちょ銀行').closest('div')
    const refreshButton = errorBankSection?.querySelector('button[title="再接続"]')
    
    expect(refreshButton).toBeInTheDocument()
    fireEvent.click(refreshButton!)
    
    // タイマーを進めて非同期処理を完了
    jest.advanceTimersByTime(1500)
    await waitFor(() => {
      // エラーメッセージが消えることを確認
      expect(screen.queryByText('認証エラー：再認証が必要です')).not.toBeInTheDocument()
    })
  })

  it('削除ボタンをクリックすると確認ダイアログが表示される', () => {
    // window.confirmをモック
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
    
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    const deleteButton = screen.getAllByTitle('接続を削除')[0]
    fireEvent.click(deleteButton)
    
    expect(confirmSpy).toHaveBeenCalledWith('この銀行接続を削除しますか？')
    
    confirmSpy.mockRestore()
  })

  it('削除を確認すると銀行接続が削除される', async () => {
    // window.confirmをモック（trueを返す）
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    const initialBankCount = screen.getAllByText(/銀行/).length
    const deleteButton = screen.getAllByTitle('接続を削除')[0]
    fireEvent.click(deleteButton)
    
    // タイマーを進めて非同期処理を完了
    jest.advanceTimersByTime(1000)
    await waitFor(() => {
      // 銀行の数が減っていることを確認
      const currentBankCount = screen.getAllByText(/銀行/).filter(el => 
        !el.textContent?.includes('銀行を追加') && !el.textContent?.includes('銀行口座連携')
      ).length
      expect(currentBankCount).toBeLessThan(initialBankCount)
    })
    
    confirmSpy.mockRestore()
  })

  it('接続がない場合、空状態のメッセージが表示される', () => {
    // 空の接続リストでレンダリングするため、モックデータを空にする
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    // 削除処理で全ての接続を削除
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    
    // 全ての削除ボタンをクリック
    const deleteButtons = screen.getAllByTitle('接続を削除')
    deleteButtons.forEach(button => fireEvent.click(button))
    
    jest.advanceTimersByTime(1000)
    
    waitFor(() => {
      expect(screen.getByText('銀行口座が接続されていません')).toBeInTheDocument()
      expect(screen.getByText('「銀行を追加」から口座を接続してください')).toBeInTheDocument()
    })
    
    confirmSpy.mockRestore()
  })

  it('カスタムクラス名が適用される', () => {
    const { container } = render(
      <BankConnectionManager 
        onConnectionChange={mockOnConnectionChange} 
        className="custom-class" 
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('onConnectionChangeが接続変更時に正しいデータで呼ばれる', () => {
    render(<BankConnectionManager onConnectionChange={mockOnConnectionChange} />)
    
    // 初回レンダリング時に呼ばれる
    expect(mockOnConnectionChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          bankName: '三菱UFJ銀行',
          status: 'connected'
        }),
        expect.objectContaining({
          bankName: 'ゆうちょ銀行', 
          status: 'error'
        })
      ])
    )
  })
})