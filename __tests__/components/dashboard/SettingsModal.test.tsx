import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SettingsModal, { UserPreferences } from '@/components/dashboard/SettingsModal'

describe('SettingsModal', () => {
  const mockSettings: UserPreferences = {
    fuyouLine: 1030000,
    isStudent: false,
    workSchedule: 'partTime',
    notificationEnabled: true,
    thresholdWarning: 80,
    autoSync: true,
    currency: 'JPY',
    language: 'ja',
  }

  const mockOnClose = jest.fn()
  const mockOnSave = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // documentのoverflowスタイルをリセット
    document.body.style.overflow = 'unset'
  })

  afterEach(() => {
    // テスト後のクリーンアップ
    document.body.style.overflow = 'unset'
  })

  it('モーダルが開いている時に正しく表示される', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('設定')).toBeInTheDocument()
    expect(screen.getByText('扶養管理に関する設定を変更できます')).toBeInTheDocument()
  })

  it('モーダルが閉じている時は表示されない', () => {
    render(
      <SettingsModal
        isOpen={false}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('現在の設定値が正しく表示される', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    // 扶養限度額の選択
    const fuyouLineSelect = screen.getByLabelText('扶養限度額')
    expect(fuyouLineSelect).toHaveValue('1030000')

    // 通知有効化チェックボックス
    const notificationCheckbox = screen.getByLabelText('扶養限度額接近時に通知する')
    expect(notificationCheckbox).toBeChecked()

    // 警告閾値スライダー
    const thresholdSlider = screen.getByLabelText('警告の閾値（限度額の何%で通知するか）')
    expect(thresholdSlider).toHaveValue('80')
  })

  it('設定を変更すると保存ボタンが有効になる', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    const saveButton = screen.getByText('保存')
    expect(saveButton).toBeDisabled()

    // 設定を変更
    const fuyouLineSelect = screen.getByLabelText('扶養限度額')
    fireEvent.change(fuyouLineSelect, { target: { value: '1300000' } })

    expect(saveButton).not.toBeDisabled()
  })

  it('学生チェックボックスを切り替えできる', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    const studentCheckbox = screen.getByLabelText('学生です（勤労学生控除の適用対象）')
    expect(studentCheckbox).not.toBeChecked()

    fireEvent.click(studentCheckbox)
    expect(studentCheckbox).toBeChecked()
  })

  it('通知設定を無効にすると警告閾値が非表示になる', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    // 初期状態では警告閾値が表示されている
    expect(screen.getByLabelText('警告の閾値（限度額の何%で通知するか）')).toBeInTheDocument()

    // 通知を無効化
    const notificationCheckbox = screen.getByLabelText('扶養限度額接近時に通知する')
    fireEvent.click(notificationCheckbox)

    // 警告閾値が非表示になる
    expect(screen.queryByLabelText('警告の閾値（限度額の何%で通知するか）')).not.toBeInTheDocument()
  })

  it('保存ボタンをクリックするとonSaveが呼ばれる', async () => {
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    // 設定を変更して保存ボタンを有効化
    const fuyouLineSelect = screen.getByLabelText('扶養限度額')
    fireEvent.change(fuyouLineSelect, { target: { value: '1300000' } })

    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        ...mockSettings,
        fuyouLine: 1300000,
      })
    })
  })

  it('Escapeキーを押すとモーダルが閉じる', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('閉じるボタンをクリックするとモーダルが閉じる', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    const closeButton = screen.getByLabelText('設定を閉じる')
    fireEvent.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('変更がある状態で閉じようとすると確認ダイアログが表示される', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    // 設定を変更
    const fuyouLineSelect = screen.getByLabelText('扶養限度額')
    fireEvent.change(fuyouLineSelect, { target: { value: '1300000' } })

    // 閉じようとする
    const closeButton = screen.getByLabelText('設定を閉じる')
    fireEvent.click(closeButton)

    expect(confirmSpy).toHaveBeenCalledWith('変更が保存されていません。閉じてもよろしいですか？')
    expect(mockOnClose).not.toHaveBeenCalled() // confirmでfalseを返したので閉じない

    confirmSpy.mockRestore()
  })

  it('デフォルトに戻すボタンが機能する', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    const resetButton = screen.getByText('デフォルトに戻す')
    fireEvent.click(resetButton)

    expect(confirmSpy).toHaveBeenCalledWith('すべての設定をデフォルトに戻しますか？')

    confirmSpy.mockRestore()
  })

  it('バリデーションエラーが正しく表示される', async () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    // 警告閾値を無効な値に設定（150%）
    const thresholdSlider = screen.getByLabelText('警告の閾値（限度額の何%で通知するか）')
    fireEvent.change(thresholdSlider, { target: { value: '150' } })

    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('警告閾値は50%〜100%の範囲で設定してください')).toBeInTheDocument()
    })

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('保存時にエラーが発生した場合エラーメッセージが表示される', async () => {
    mockOnSave.mockRejectedValueOnce(new Error('保存エラー'))

    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    // 設定を変更
    const fuyouLineSelect = screen.getByLabelText('扶養限度額')
    fireEvent.change(fuyouLineSelect, { target: { value: '1300000' } })

    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('設定の保存に失敗しました。もう一度お試しください。')).toBeInTheDocument()
    })
  })

  it('モーダル開時にbodyのスクロールが無効化される', () => {
    render(
      <SettingsModal
        isOpen={true}
        onClose={mockOnClose}
        currentSettings={mockSettings}
        onSave={mockOnSave}
      />
    )

    expect(document.body.style.overflow).toBe('hidden')
  })
})