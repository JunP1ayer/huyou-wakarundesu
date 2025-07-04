import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import language files
import jaCommon from '@/locales/ja/common.json'
import enCommon from '@/locales/en/common.json'

const resources = {
  ja: {
    common: jaCommon,
  },
  en: {
    common: enCommon,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja', // Default to Japanese
    debug: process.env.NODE_ENV === 'development',
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Namespace and key separation
    ns: ['common'],
    defaultNS: 'common',
    keySeparator: '.',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Performance optimizations
    load: 'languageOnly', // Don't load region variants
    preload: ['ja', 'en'],
    
    // React options
    react: {
      useSuspense: false, // Avoid suspense for better performance
    },
  })

export default i18n