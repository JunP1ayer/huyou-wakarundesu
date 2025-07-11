export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profile: {
        Row: {
          id: string
          user_id: string
          is_student: boolean | null
          annual_income: number | null
          is_over_20h: boolean | null
          fuyou_line: number | null
          profile_completed: boolean | null
          profile_completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          is_student?: boolean | null
          annual_income?: number | null
          is_over_20h?: boolean | null
          fuyou_line?: number | null
          profile_completed?: boolean | null
          profile_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          is_student?: boolean | null
          annual_income?: number | null
          is_over_20h?: boolean | null
          fuyou_line?: number | null
          profile_completed?: boolean | null
          profile_completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      income_entries: {
        Row: {
          id: string
          user_id: string
          amount: number
          date: string
          source: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          date: string
          source?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          date?: string
          source?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}