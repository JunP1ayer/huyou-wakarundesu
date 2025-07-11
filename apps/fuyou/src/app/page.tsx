import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, TrendingUp, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            🎯 扶養わかるんです
          </h1>
          <p className="text-center text-gray-600 mt-2">
            MVP v0.1 - 3問で分かる、あなたの扶養区分
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ヒーロー セクション */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            たった3問で扶養区分を判定
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            学生の150万円枠、パートの106万・130万円壁をシンプルに判定。
            銀行連携で収入も自動追跡できます。
          </p>
          <Link href="/questions">
            <Button size="lg" className="text-lg px-8 py-3">
              診断をはじめる
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* 特徴セクション */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <FeatureCard
            icon={<Calculator className="w-8 h-8 text-blue-600" />}
            title="3問で簡単判定"
            description="年齢・労働時間・会社規模の3つの質問だけで正確に判定します"
          />
          <FeatureCard
            icon={<TrendingUp className="w-8 h-8 text-green-600" />}
            title="銀行連携で自動追跡"
            description="Moneytree LINK連携で今年の収入を自動集計。あといくら稼げるか一目瞭然"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-purple-600" />}
            title="正確な閾値判定"
            description="106万・130万・150万円の各種壁を法改正に対応した最新基準で判定"
          />
        </div>

        {/* 対象者セクション */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">こんな方におすすめ</CardTitle>
            <CardDescription>
              扶養控除や社会保険の適用について知りたい方
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-lg mb-2 text-blue-600">学生の方</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 19〜22歳の学生</li>
                  <li>• アルバイト収入の管理</li>
                  <li>• 150万円枠の活用</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2 text-green-600">パート・主婦の方</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• 配偶者控除を維持したい</li>
                  <li>• 社会保険加入を避けたい</li>
                  <li>• 106万・130万円壁の把握</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 注意書き */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 重要な注意事項</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• 住民税100万円非課税枠は表示のみ（MVP範囲外）</p>
              <p>• 雇用見込み2か月超要件は考慮されていません</p>
              <p>• 法改正により係数が変更される可能性があります</p>
              <p>• 最終的な判断は税理士等の専門家にご相談ください</p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* フッター */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        <p>© 2024 扶養わかるんです MVP v0.1</p>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="text-center">
      <CardContent className="p-6">
        <div className="flex justify-center mb-4">{icon}</div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}