import OpenAI from 'openai'

// Only check for API key at runtime, not build time
const getOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export const openai = process.env.NODE_ENV === 'production' || process.env.OPENAI_API_KEY 
  ? getOpenAIClient() 
  : null

export type FuyouClassificationResult = {
  category: '103万円扶養' | '106万円社保' | '130万円社保外' | '扶養外'
  limitIncome: number
  reason: string
}

export async function classifyFuyouWithAI(
  answers: {
    estIncome: number | null
    inParentIns: boolean | null
    weeklyHours: number | null
    month88k: boolean | null
  },
  isStudent: boolean
): Promise<FuyouClassificationResult> {
  // Ensure OpenAI client is available
  const client = openai || getOpenAIClient()
  
  const prompt = `
あなたは日本の税法と社会保険制度に詳しいアシスタントです。
以下の情報をもとに扶養区分を判定してください。

入力データ:
- 年収見込み: ${answers.estIncome}円
- 親の健康保険に加入: ${answers.inParentIns ? 'はい' : 'いいえ'}
- 週労働時間: ${answers.weeklyHours}時間
- 月8.8万円以上稼ぐ月があるか: ${answers.month88k ? 'はい' : 'いいえ'}
- 学生かどうか: ${isStudent ? 'はい' : 'いいえ'}

判定ルール:
1. 103万円扶養: 年収103万円以下で親の扶養に入る
2. 106万円社保: 年収106万円以上で社会保険に自分で加入
3. 130万円社保外: 年収130万円以上で社会保険扶養外
4. 扶養外: 年収が高く完全に独立

以下のJSON形式で回答してください:
{
  "category": "103万円扶養" | "106万円社保" | "130万円社保外" | "扶養外",
  "limitIncome": 上限額(円),
  "reason": "判定理由の簡潔な説明"
}
`

  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    response_format: { type: 'json_object' }
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const result = JSON.parse(content) as FuyouClassificationResult
    return result
  } catch {
    console.error('Failed to parse OpenAI response:', content)
    throw new Error('Invalid response format from OpenAI')
  }
}