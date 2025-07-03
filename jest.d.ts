// Jest カスタムマッチャーの型定義

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * 値が扶養限度額以内かどうかをテスト
       * @param limit 扶養限度額
       */
      toBeWithinFuyouLimit(limit: number): R

      /**
       * 値が正しい通貨フォーマットかどうかをテスト
       * 期待フォーマット: ¥1,000,000
       */
      toBeFormattedCurrency(): R

      /**
       * 値が正しい日本語日付フォーマットかどうかをテスト
       * 期待フォーマット: 2025/1/1 または 2025/01/01
       */
      toBeValidJapaneseDate(): R
    }
  }
}

// Next.js関連の型拡張
declare global {
  interface Window {
    __demo_mode?: boolean
  }
}

export {}