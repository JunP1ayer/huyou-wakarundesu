/**
 * Admin Thresholds Management Page
 * Allows administrators to manage dynamic fuyou thresholds for different years
 * Supports 2025 tax reform and future changes
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import ThresholdManager from '@/components/admin/ThresholdManager'

export const metadata: Metadata = {
  title: '扶養閾値管理 | 扶養わかるんです',
  description: '動的扶養閾値の管理画面。年度別の税制改正に対応。',
  robots: 'noindex, nofollow' // Admin pages should not be indexed
}

// Loading fallback component
function ThresholdManagerSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status Card Skeleton */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
            </div>
          </div>
          
          {/* Year Selection Skeleton */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Thresholds Table Skeleton */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminThresholdsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            扶養閾値管理
          </h1>
          <p className="text-gray-600">
            年度別の扶養限度額を管理します。2025年税制改正などの変更に対応できます。
          </p>
        </div>
        
        <Suspense fallback={<ThresholdManagerSkeleton />}>
          <ThresholdManager />
        </Suspense>
      </div>
    </div>
  )
}