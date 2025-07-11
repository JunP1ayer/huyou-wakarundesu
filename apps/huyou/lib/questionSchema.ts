export const questions = [
  { 
    id: 'estIncome', 
    text: '今年の見込みアルバイト収入はいくらくらい？', 
    type: 'number', 
    unit: '円' 
  },
  { 
    id: 'inParentIns', 
    text: '親の健康保険に入っていますか？', 
    type: 'boolean' 
  },
  { 
    id: 'isOver20hContract', 
    text: '週20時間以上の労働契約ですか？', 
    type: 'boolean' 
  },
  { 
    id: 'month88k', 
    text: '1か所の勤務先で月額8.8万円以上の見込み賃金がありますか？', 
    type: 'boolean' 
  },
] as const;

export type QuestionId = typeof questions[number]['id'];
export type QuestionType = typeof questions[number]['type'];

export type AnswerMap = Record<QuestionId, number | boolean | null>;

export interface FuyouClassificationResult {
  category: string;
  limit: number;
  description?: string;
}