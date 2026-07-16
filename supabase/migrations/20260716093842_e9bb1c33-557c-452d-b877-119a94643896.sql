
-- Settings singleton
CREATE TABLE public.settings (
  id int PRIMARY KEY DEFAULT 1,
  business_name text NOT NULL DEFAULT 'EATABLE',
  item_name text NOT NULL DEFAULT 'Churumuri',
  item_price text NOT NULL DEFAULT '',
  reward_text text NOT NULL DEFAULT 'Free Item',
  quiz_enabled boolean NOT NULL DEFAULT true,
  owner_password_hash text NOT NULL DEFAULT '',
  CONSTRAINT settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.settings FOR SELECT USING (true);

-- Player modes (each mode has its own config)
CREATE TABLE public.player_modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  players int NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  num_questions int NOT NULL DEFAULT 4,
  easy_count int NOT NULL DEFAULT 0,
  moderate_count int NOT NULL DEFAULT 3,
  difficult_count int NOT NULL DEFAULT 1,
  time_limit_seconds int NOT NULL DEFAULT 60,
  correct_to_win int NOT NULL DEFAULT 3,
  reward_text text NOT NULL DEFAULT 'Free Churumuri',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_modes TO anon, authenticated;
GRANT ALL ON public.player_modes TO service_role;
ALTER TABLE public.player_modes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read player_modes" ON public.player_modes FOR SELECT USING (true);

-- Questions bank
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_code text,
  subject text,
  topic text,
  difficulty text NOT NULL,
  question_en text NOT NULL,
  question_kn text,
  option_a_en text NOT NULL, option_a_kn text,
  option_b_en text NOT NULL, option_b_kn text,
  option_c_en text NOT NULL, option_c_kn text,
  option_d_en text NOT NULL, option_d_kn text,
  correct_answer char(1) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX questions_difficulty_active_idx ON public.questions (difficulty, active);
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read questions" ON public.questions FOR SELECT USING (active = true);

-- Seed default settings row
INSERT INTO public.settings (id, business_name, item_name, reward_text, owner_password_hash)
VALUES (1, 'EATABLE', 'Churumuri', 'Free Churumuri',
  encode(digest('eatable2026','sha256'),'hex'))
ON CONFLICT (id) DO NOTHING;

-- Seed default player modes
INSERT INTO public.player_modes (players, num_questions, easy_count, moderate_count, difficult_count, time_limit_seconds, correct_to_win, reward_text, sort_order) VALUES
(1, 4, 0, 3, 1, 60, 3, 'Free Churumuri', 1),
(2, 6, 1, 3, 2, 90, 5, 'Free Large Churumuri', 2),
(3, 8, 2, 4, 2, 120, 6, 'Free Family Churumuri', 3),
(5, 10, 2, 5, 3, 150, 8, 'Free Party Pack', 4);

-- pgcrypto for digest()
CREATE EXTENSION IF NOT EXISTS pgcrypto;
