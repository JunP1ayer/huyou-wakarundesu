module.exports = {
  extends: [
    'next/core-web-vitals'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error',
    'react-hooks/exhaustive-deps': 'error'
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'dist/',
    '*.config.js',
    '*.config.ts'
  ]
}