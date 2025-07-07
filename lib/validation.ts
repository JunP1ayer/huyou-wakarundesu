/**
 * 入力検証システム - Zod スキーマバリデーション
 * 型安全でセキュアな入力検証とサニタイゼーション
 */

import { z } from 'zod'
import { NextRequest } from 'next/server'

/**
 * 基本的なバリデーションルール
 */
const ValidationRules = {
  // 日本の金額形式（円）
  currencyJPY: z.number()
    .int('金額は整数である必要があります')
    .min(0, '金額は0以上である必要があります')
    .max(50_000_000, '金額は5000万円以下である必要があります'),

  // 時給（円）
  hourlyWage: z.number()
    .int('時給は整数である必要があります')
    .min(500, '時給は500円以上である必要があります')
    .max(10_000, '時給は10000円以下である必要があります'),

  // 労働時間
  workingHours: z.number()
    .min(0, '労働時間は0以上である必要があります')
    .max(168, '労働時間は週168時間以下である必要があります'),

  // ユーザーID（UUID v4）
  userId: z.string()
    .uuid('有効なユーザーIDである必要があります'),

  // メールアドレス
  email: z.string()
    .email('有効なメールアドレスである必要があります')
    .max(254, 'メールアドレスは254文字以下である必要があります'),

  // パスワード（強度チェック）
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字、小文字、数字を含む必要があります'),

  // 日本語文字列（一般的なテキスト）
  japaneseText: z.string()
    .min(1, 'テキストは空にできません')
    .max(1000, 'テキストは1000文字以下である必要があります')
    .regex(/^[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\u3400-\u4DBF\s\w\d\p{P}]*$/u, '不正な文字が含まれています'),

  // URL
  url: z.string()
    .url('有効なURLである必要があります')
    .max(2048, 'URLは2048文字以下である必要があります'),

  // 日付文字列（ISO 8601）
  isoDate: z.string()
    .datetime('有効な日時形式である必要があります'),

  // IPアドレス
  ipAddress: z.string()
    .ip('有効なIPアドレスである必要があります'),

  // ファイルサイズ（バイト）
  fileSize: z.number()
    .int('ファイルサイズは整数である必要があります')
    .min(0, 'ファイルサイズは0以上である必要があります')
    .max(10 * 1024 * 1024, 'ファイルサイズは10MB以下である必要があります'), // 10MB
} as const

/**
 * 扶養計算用のスキーマ
 */
export const FuyouValidationSchemas = {
  // オンボーディング質問の回答（新4問形式）
  onboardingAnswers: z.object({
    under_103_last_year: z.boolean({
      errorMap: () => ({ message: '質問1: 昨年の収入について選択してください' })
    }),
    using_family_insurance: z.boolean({
      errorMap: () => ({ message: '質問2: 健康保険について選択してください' })
    }),
    weekly_hours: z.number()
      .min(0, '労働時間は0時間以上である必要があります')
      .max(40, '労働時間は40時間以下である必要があります')
      .refine((val) => val >= 0, { message: '労働時間を正しく入力してください' })
  }),

  // ユーザープロフィール（新形式対応）
  userProfile: z.object({
    user_id: ValidationRules.userId,
    is_student: z.boolean().optional(),
    weekly_hours: z.number()
      .min(0, '労働時間は0時間以上である必要があります')
      .max(40, '労働時間は40時間以下である必要があります')
      .optional(),
    fuyou_line: ValidationRules.currencyJPY,
    hourly_wage: ValidationRules.hourlyWage,
    created_at: ValidationRules.isoDate.optional(),
    updated_at: ValidationRules.isoDate.optional()
  }),

  // ユーザー統計情報（新形式対応）
  userStats: z.object({
    user_id: ValidationRules.userId,
    ytd_income: ValidationRules.currencyJPY,
    remaining: ValidationRules.currencyJPY.optional(),
    remaining_hours: z.number().min(0).optional(),
    transaction_count: z.number()
      .int('取引件数は整数である必要があります')
      .min(0, '取引件数は0以上である必要があります')
      .max(10000, '取引件数は10000件以下である必要があります')
      .optional(),
    last_calculated: ValidationRules.isoDate.optional(),
    created_at: ValidationRules.isoDate.optional(),
    updated_at: ValidationRules.isoDate.optional()
  }),

  // 取引データ
  transaction: z.object({
    id: z.string().uuid().optional(),
    user_id: ValidationRules.userId,
    amount: ValidationRules.currencyJPY,
    date: ValidationRules.isoDate,
    description: ValidationRules.japaneseText,
    category: z.enum(['給与', 'アルバイト', 'その他'], {
      errorMap: () => ({ message: '有効な取引カテゴリを選んでください' })
    }),
    source: z.enum(['manual', 'moneytree', 'csv_import'], {
      errorMap: () => ({ message: '有効な取引ソースを選んでください' })
    }),
    created_at: ValidationRules.isoDate.optional()
  }),

  // プロフィール更新（新形式対応）
  profileUpdate: z.object({
    fuyou_line: ValidationRules.currencyJPY.optional(),
    hourly_wage: ValidationRules.hourlyWage.optional(),
    is_student: z.boolean().optional(),
    weekly_hours: z.number()
      .min(0, '労働時間は0時間以上である必要があります')
      .max(40, '労働時間は40時間以下である必要があります')
      .optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: '少なくとも1つのフィールドを更新する必要があります'
  })
} as const

/**
 * API用の共通スキーマ
 */
export const APIValidationSchemas = {
  // リクエストメタデータ
  requestMetadata: z.object({
    timestamp: ValidationRules.isoDate.optional(),
    user_agent: z.string().max(500, 'User-Agentは500文字以下である必要があります').optional(),
    ip_address: ValidationRules.ipAddress.optional(),
    request_id: z.string().uuid().optional()
  }),

  // ページネーション
  pagination: z.object({
    page: z.number().int().min(1, 'ページ番号は1以上である必要があります').default(1),
    limit: z.number().int().min(1).max(100, '1ページあたりの件数は100件以下である必要があります').default(20),
    sort: z.enum(['date', 'amount', 'created_at']).default('date'),
    order: z.enum(['asc', 'desc']).default('desc')
  }),

  // ファイルアップロード
  fileUpload: z.object({
    filename: z.string()
      .min(1, 'ファイル名は空にできません')
      .max(255, 'ファイル名は255文字以下である必要があります')
      .regex(/^[^<>:"/\\|?*]+$/, 'ファイル名に無効な文字が含まれています'),
    mimetype: z.enum([
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ], {
      errorMap: () => ({ message: 'CSV、Excel形式のファイルのみサポートしています' })
    }),
    size: ValidationRules.fileSize
  }),

  // CSVインポート
  csvImport: z.object({
    transactions: z.array(FuyouValidationSchemas.transaction).max(1000, 'CSVファイルは1000件以下である必要があります')
  })
} as const

/**
 * 入力サニタイゼーション関数
 */
export const sanitize = {
  /**
   * HTMLエスケープ
   */
  html: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  },

  /**
   * SQLインジェクション対策（基本的なエスケープ）
   */
  sql: (input: string): string => {
    return input.replace(/'/g, "''").replace(/"/g, '""')
  },

  /**
   * 日本語テキストの正規化
   */
  japaneseText: (input: string): string => {
    return input
      .normalize('NFKC') // Unicode正規化
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // ゼロ幅文字を削除
      .trim()
  },

  /**
   * 数値の正規化
   */
  number: (input: string | number): number => {
    if (typeof input === 'number') return input
    
    // 全角数字を半角に変換
    const normalized = input
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[,，]/g, '') // カンマを削除
      .trim()
    
    const parsed = parseFloat(normalized)
    if (isNaN(parsed)) throw new Error('有効な数値ではありません')
    
    return parsed
  }
}

/**
 * バリデーションヘルパー関数
 */
export const validate = {
  /**
   * リクエストボディのバリデーション
   */
  async requestBody<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
  ): Promise<{ success: true; data: T } | { success: false; errors: string[] }> {
    try {
      const body = await request.json()
      const result = schema.safeParse(body)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        const errors = result.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        )
        return { success: false, errors }
      }
    } catch {
      return { 
        success: false, 
        errors: ['リクエストボディの解析に失敗しました'] 
      }
    }
  },

  /**
   * URLパラメータのバリデーション
   */
  urlParams<T>(
    params: Record<string, string | string[]>,
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(params)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
  },

  /**
   * 条件付きバリデーション
   */
  conditional<T>(
    data: T,
    condition: boolean,
    schema: z.ZodSchema<T>
  ): { success: true; data: T } | { success: false; errors: string[] } {
    if (!condition) {
      return { success: true, data }
    }
    
    const result = schema.safeParse(data)
    
    if (result.success) {
      return { success: true, data: result.data }
    } else {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
  }
}

/**
 * カスタムバリデーター
 */
export const customValidators = {
  /**
   * 扶養限度額の妥当性チェック
   */
  fuyouLimit: z.number().refine(
    (value) => [1030000, 1060000, 1300000, 1500000].includes(value),
    { message: '有効な扶養限度額ではありません（103万円、106万円、130万円、150万円のいずれか）' }
  ),

  /**
   * 未来の日付チェック
   */
  notFutureDate: z.string().datetime().refine(
    (dateString) => new Date(dateString) <= new Date(),
    { message: '未来の日付は設定できません' }
  ),

  /**
   * 営業日チェック（土日祝日を除く）
   */
  businessDay: z.string().datetime().refine(
    (dateString) => {
      const date = new Date(dateString)
      const dayOfWeek = date.getDay()
      return dayOfWeek !== 0 && dayOfWeek !== 6 // 日曜日(0)と土曜日(6)を除く
    },
    { message: '営業日（平日）である必要があります' }
  ),

  /**
   * 重複チェック用のユニーク制約
   */
  createUniqueValidator: <T>(
    checkFunction: (value: T) => Promise<boolean>,
    message: string = 'この値は既に使用されています'
  ) => {
    return z.any().refine(checkFunction, { message })
  }
}

/**
 * バリデーションエラーレスポンス生成
 */
export function createValidationErrorResponse(errors: string[]) {
  return {
    error: 'Validation Error',
    message: '入力データが無効です',
    details: errors,
    code: 'VALIDATION_FAILED'
  }
}

/**
 * 型安全なAPI応答スキーマ
 */
export const ResponseSchemas = {
  success: <T>(dataSchema: z.ZodSchema<T>) => z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: ValidationRules.isoDate
  }),

  error: z.object({
    success: z.literal(false),
    error: z.string(),
    message: z.string(),
    details: z.array(z.string()).optional(),
    code: z.string().optional(),
    timestamp: ValidationRules.isoDate
  })
}