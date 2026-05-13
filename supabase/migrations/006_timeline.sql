-- Migration 006: Timeline preferences
-- Weekly summaries are computed at runtime — no DB table needed.

CREATE TABLE IF NOT EXISTS public.timeline_preferences (
  user_id     uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  show_correlations   boolean NOT NULL DEFAULT true,
  show_weekly_summary boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.timeline_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own timeline_preferences"
  ON public.timeline_preferences
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
