-- ============================================================
-- VivaLeve — Schema inicial
-- Idempotente: pode ser executado mais de uma vez com segurança
-- ============================================================

-- ============================================================
-- TABELAS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  age        integer     CHECK (age > 0 AND age < 120),
  diagnosis  text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           date        NOT NULL DEFAULT CURRENT_DATE,
  pain_level     smallint    NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
  fatigue_level  smallint    NOT NULL CHECK (fatigue_level BETWEEN 0 AND 10),
  sleep_quality  smallint    NOT NULL CHECK (sleep_quality BETWEEN 0 AND 10),
  mood_level     smallint    NOT NULL CHECK (mood_level BETWEEN 0 AND 10),
  anxiety_level  smallint    NOT NULL CHECK (anxiety_level BETWEEN 0 AND 10),
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS public.medications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  dosage     text,
  schedule   text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS daily_logs_user_date_idx
  ON public.daily_logs (user_id, date DESC);

CREATE INDEX IF NOT EXISTS medications_user_idx
  ON public.medications (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES — profiles
-- profiles: INSERT é feito exclusivamente pelo trigger (SECURITY DEFINER)
-- ============================================================

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- POLICIES — daily_logs
-- ============================================================

DROP POLICY IF EXISTS "daily_logs_select_own" ON public.daily_logs;
CREATE POLICY "daily_logs_select_own"
  ON public.daily_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_logs_insert_own" ON public.daily_logs;
CREATE POLICY "daily_logs_insert_own"
  ON public.daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_logs_update_own" ON public.daily_logs;
CREATE POLICY "daily_logs_update_own"
  ON public.daily_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "daily_logs_delete_own" ON public.daily_logs;
CREATE POLICY "daily_logs_delete_own"
  ON public.daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- POLICIES — medications
-- ============================================================

DROP POLICY IF EXISTS "medications_select_own" ON public.medications;
CREATE POLICY "medications_select_own"
  ON public.medications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "medications_insert_own" ON public.medications;
CREATE POLICY "medications_insert_own"
  ON public.medications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "medications_update_own" ON public.medications;
CREATE POLICY "medications_update_own"
  ON public.medications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "medications_delete_own" ON public.medications;
CREATE POLICY "medications_delete_own"
  ON public.medications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Atualiza updated_at automaticamente em profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Cria profile automaticamente quando um usuário se cadastra.
-- SECURITY DEFINER: executa como owner da função, bypass do RLS para INSERT.
-- SET search_path = public: protege contra search path injection.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
