export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      player_modes: {
        Row: {
          correct_to_win: number
          created_at: string
          difficult_count: number
          easy_count: number
          enabled: boolean
          id: string
          moderate_count: number
          num_questions: number
          players: number
          reward_text: string
          sort_order: number
          time_limit_seconds: number
        }
        Insert: {
          correct_to_win?: number
          created_at?: string
          difficult_count?: number
          easy_count?: number
          enabled?: boolean
          id?: string
          moderate_count?: number
          num_questions?: number
          players: number
          reward_text?: string
          sort_order?: number
          time_limit_seconds?: number
        }
        Update: {
          correct_to_win?: number
          created_at?: string
          difficult_count?: number
          easy_count?: number
          enabled?: boolean
          id?: string
          moderate_count?: number
          num_questions?: number
          players?: number
          reward_text?: string
          sort_order?: number
          time_limit_seconds?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          active: boolean
          correct_answer: string
          created_at: string
          difficulty: string
          id: string
          option_a_en: string
          option_a_kn: string | null
          option_b_en: string
          option_b_kn: string | null
          option_c_en: string
          option_c_kn: string | null
          option_d_en: string
          option_d_kn: string | null
          question_code: string | null
          question_en: string
          question_kn: string | null
          subject: string | null
          topic: string | null
        }
        Insert: {
          active?: boolean
          correct_answer: string
          created_at?: string
          difficulty: string
          id?: string
          option_a_en: string
          option_a_kn?: string | null
          option_b_en: string
          option_b_kn?: string | null
          option_c_en: string
          option_c_kn?: string | null
          option_d_en: string
          option_d_kn?: string | null
          question_code?: string | null
          question_en: string
          question_kn?: string | null
          subject?: string | null
          topic?: string | null
        }
        Update: {
          active?: boolean
          correct_answer?: string
          created_at?: string
          difficulty?: string
          id?: string
          option_a_en?: string
          option_a_kn?: string | null
          option_b_en?: string
          option_b_kn?: string | null
          option_c_en?: string
          option_c_kn?: string | null
          option_d_en?: string
          option_d_kn?: string | null
          question_code?: string | null
          question_en?: string
          question_kn?: string | null
          subject?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      sample_config: {
        Row: {
          correct_to_win: number
          created_at: string
          enabled: boolean
          id: number
          intro_text_en: string
          intro_text_kn: string
          num_questions: number
          reward_text: string
          time_limit_seconds: number
          updated_at: string
        }
        Insert: {
          correct_to_win?: number
          created_at?: string
          enabled?: boolean
          id?: number
          intro_text_en?: string
          intro_text_kn?: string
          num_questions?: number
          reward_text?: string
          time_limit_seconds?: number
          updated_at?: string
        }
        Update: {
          correct_to_win?: number
          created_at?: string
          enabled?: boolean
          id?: number
          intro_text_en?: string
          intro_text_kn?: string
          num_questions?: number
          reward_text?: string
          time_limit_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      sample_questions: {
        Row: {
          active: boolean
          correct_answer: string
          created_at: string
          difficulty: string
          id: string
          option_a_en: string
          option_a_kn: string | null
          option_b_en: string
          option_b_kn: string | null
          option_c_en: string
          option_c_kn: string | null
          option_d_en: string
          option_d_kn: string | null
          question_code: string | null
          question_en: string
          question_kn: string | null
          sort_order: number
          subject: string | null
          topic: string | null
        }
        Insert: {
          active?: boolean
          correct_answer: string
          created_at?: string
          difficulty?: string
          id?: string
          option_a_en: string
          option_a_kn?: string | null
          option_b_en: string
          option_b_kn?: string | null
          option_c_en: string
          option_c_kn?: string | null
          option_d_en: string
          option_d_kn?: string | null
          question_code?: string | null
          question_en: string
          question_kn?: string | null
          sort_order?: number
          subject?: string | null
          topic?: string | null
        }
        Update: {
          active?: boolean
          correct_answer?: string
          created_at?: string
          difficulty?: string
          id?: string
          option_a_en?: string
          option_a_kn?: string | null
          option_b_en?: string
          option_b_kn?: string | null
          option_c_en?: string
          option_c_kn?: string | null
          option_d_en?: string
          option_d_kn?: string | null
          question_code?: string | null
          question_en?: string
          question_kn?: string | null
          sort_order?: number
          subject?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          business_name: string
          id: number
          item_name: string
          item_price: string
          owner_password_hash: string
          quiz_enabled: boolean
          retake_cooldown_minutes: number
          reward_text: string
        }
        Insert: {
          business_name?: string
          id?: number
          item_name?: string
          item_price?: string
          owner_password_hash?: string
          quiz_enabled?: boolean
          retake_cooldown_minutes?: number
          reward_text?: string
        }
        Update: {
          business_name?: string
          id?: number
          item_name?: string
          item_price?: string
          owner_password_hash?: string
          quiz_enabled?: boolean
          retake_cooldown_minutes?: number
          reward_text?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
