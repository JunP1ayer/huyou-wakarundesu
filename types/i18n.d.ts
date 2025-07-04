// TypeScript declarations for i18n
declare module '*.json' {
  const content: Record<string, any>
  export default content
}

// Extend i18next types for better TypeScript support
import 'react-i18next'
import type common from '@/locales/ja/common.json'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
    }
  }
}