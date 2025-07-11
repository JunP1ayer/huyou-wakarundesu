import { QuestionFlow } from '@/components/QuestionFlow';

export default function QuestionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-center text-gray-900">
            扶養区分の判定
          </h1>
          <p className="text-center text-gray-600 mt-2">
            以下の質問にお答えください
          </p>
        </div>
      </header>

      <main className="py-8">
        <QuestionFlow />
      </main>
    </div>
  );
}