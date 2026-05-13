/**
 * Tipos gerados do schema Supabase.
 * Substituir pelo output do `npx supabase gen types typescript` após configurar o projeto Supabase.
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          age?: number | null;
          diagnosis?: string | null;
        };
        Update: {
          name?: string;
          age?: number | null;
          diagnosis?: string | null;
        };
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
      };
      medications: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          dosage: string | null;
          schedule: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          dosage?: string | null;
          schedule?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          dosage?: string | null;
          schedule?: string | null;
          notes?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
