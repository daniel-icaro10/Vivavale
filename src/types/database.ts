/**
 * Tipos do schema Supabase — VivaLeve.
 * Sincronizado com migrations 001 + 002 + 003 + 004.
 * Substituir pelo output de `npx supabase gen types typescript` após configurar o projeto.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          age: number | null;
          diagnosis: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          age?: number | null;
          diagnosis?: string | null;
          timezone?: string;
        };
        Update: {
          name?: string;
          age?: number | null;
          diagnosis?: string | null;
          timezone?: string;
        };
        Relationships: [];
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          pain_level: number;
          fatigue_level: number;
          sleep_quality: number;
          mood_level: number;
          anxiety_level: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          pain_level: number;
          fatigue_level: number;
          sleep_quality: number;
          mood_level: number;
          anxiety_level: number;
          notes?: string | null;
        };
        Update: {
          pain_level?: number;
          fatigue_level?: number;
          sleep_quality?: number;
          mood_level?: number;
          anxiety_level?: number;
          notes?: string | null;
        };
        Relationships: [];
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string | null;
          frequency: string | null;
          start_date: string | null;
          active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dosage?: string | null;
          frequency?: string | null;
          start_date?: string | null;
          active?: boolean;
          notes?: string | null;
        };
        Update: {
          name?: string;
          dosage?: string | null;
          frequency?: string | null;
          start_date?: string | null;
          active?: boolean;
          notes?: string | null;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          medication_id: string;
          // PostgreSQL time type: retornado como "HH:MM:SS" pelo Supabase client.
          // Normalizar para "HH:MM" antes de usar no frontend.
          time_local: string;
          timezone: string;
          recurrence: "daily" | "weekdays" | "custom_future";
          active: boolean;
          last_sent_at: string | null;
          next_trigger_at: string | null;
          last_error: string | null;
          error_count: number;
          last_attempt_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          medication_id: string;
          time_local: string;
          timezone: string;
          recurrence?: "daily" | "weekdays" | "custom_future";
          active?: boolean;
          last_sent_at?: string | null;
          next_trigger_at?: string | null;
          last_error?: string | null;
          error_count?: number;
          last_attempt_at?: string | null;
        };
        Update: {
          medication_id?: string;
          time_local?: string;
          timezone?: string;
          recurrence?: "daily" | "weekdays" | "custom_future";
          active?: boolean;
          last_sent_at?: string | null;
          next_trigger_at?: string | null;
          last_error?: string | null;
          error_count?: number;
          last_attempt_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_medication_id_fkey";
            columns: ["medication_id"];
            referencedRelation: "medications";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent?: string | null;
          active?: boolean;
        };
        Update: {
          p256dh_key?: string;
          auth_key?: string;
          user_agent?: string | null;
          active?: boolean;
        };
        Relationships: [];
      };
      public_symptom_sessions: {
        Row: {
          id: string;
          session_token: string;
          answers: Record<string, unknown>;
          computed_scores: Record<string, unknown>;
          computed_insights: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_token?: string;
          answers: Record<string, unknown>;
          computed_scores: Record<string, unknown>;
          computed_insights: Record<string, unknown>;
        };
        Update: never;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          reminders_enabled: boolean;
          // PostgreSQL time type: "HH:MM:SS" ou null.
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          reminders_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string;
        };
        Update: {
          reminders_enabled?: boolean;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          timezone?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_public_session_insights: {
        Args: { p_token: string };
        Returns: Record<string, unknown> | null;
      };
      check_rate_limit: {
        Args: { p_key: string; p_max_requests: number; p_window_seconds: number };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
