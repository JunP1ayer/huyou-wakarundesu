'use client';

import React from 'react';
import { AlertTriangle, ExternalLink, FileText } from 'lucide-react';

interface LegalFooterProps {
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}

/**
 * Legal Footer Component
 * Displays important disclaimers about tax calculations and recommendations
 */
export default function LegalFooter({ variant = 'default', className = '' }: LegalFooterProps) {
  const baseClasses = "bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm";
  const fullClasses = `${baseClasses} ${className}`;

  if (variant === 'compact') {
    return (
      <div className={`${baseClasses} ${className} flex items-center gap-2 text-amber-800`}>
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span className="text-xs">
          <strong>重要:</strong> 最終判断は税務署にご確認ください
        </span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={fullClasses}>
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-900 mb-2">重要な免責事項</h4>
            <div className="space-y-3 text-amber-800">
              <p>
                <strong>🏛️ 最終判断は税務署にご確認ください</strong>
                <br />
                本アプリは一般的な税制情報に基づく参考計算を提供しますが、個別の税務判断については必ず管轄の税務署または税理士にご相談ください。
              </p>
              
              <p>
                <strong>📊 計算の正確性について</strong>
                <br />
                所得税・住民税・社会保険の計算は複雑で、個人の状況により異なります。本アプリの計算結果は目安であり、実際の税額と異なる場合があります。
              </p>
              
              <p>
                <strong>⚖️ 法的責任の制限</strong>
                <br />
                本アプリの使用により生じた損害について、開発者は一切の責任を負いません。正確な税務処理については、専門家にご相談ください。
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-amber-200 pt-3 mt-4">
          <div className="flex flex-col sm:flex-row gap-3 text-xs text-amber-700">
            <a 
              href="https://www.nta.go.jp/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-amber-900 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              国税庁ホームページ
            </a>
            <a 
              href="https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-amber-900 transition-colors"
            >
              <FileText className="w-3 h-3" />
              扶養控除について
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={fullClasses}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-amber-800">
          <p className="font-medium mb-1">
            ⚠️ 重要な注意事項
          </p>
          <p className="mb-2">
            <strong>最終判断は税務署にご確認ください。</strong>
            本アプリは一般的な税制に基づく参考計算を提供しますが、個別の状況については専門家にご相談ください。
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-amber-700">
            <a 
              href="https://www.nta.go.jp/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-amber-900 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              国税庁
            </a>
            <a 
              href="https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-amber-900 transition-colors"
            >
              <FileText className="w-3 h-3" />
              扶養控除詳細
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Convenience components for specific use cases
export const DashboardLegalFooter = () => (
  <LegalFooter variant="default" className="mt-6" />
);

export const OnboardingLegalFooter = () => (
  <LegalFooter variant="compact" className="mt-4" />
);

export const SettingsLegalFooter = () => (
  <LegalFooter variant="full" className="mt-6" />
);