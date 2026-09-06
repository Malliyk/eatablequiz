CREATE TABLE public.sample_config (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  num_questions integer NOT NULL DEFAULT 3,
  time_limit_seconds integer NOT NULL DEFAULT 60,
  correct_to_win integer NOT NULL DEFAULT 2,
  reward_text text NOT NULL DEFAULT 'Practice round - no reward',
  intro_text_en text NOT NULL DEFAULT 'This is a practice round so you can see how the real quiz works. No reward is given.',
  intro_text_kn text NOT NULL DEFAULT 'ಇದು ಅಭ್ಯಾಸ ಸುತ್ತು. ನಿಜವಾದ ಕ್ವಿಜ್ ಹೇಗೆ ನಡೆಯುತ್ತದೆ ಎಂದು ತಿಳಿಯಲು ಇದನ್ನು ಆಡಿ. ಇದಕ್ಕೆ ಬಹುಮಾನ ಇರುವುದಿಲ್ಲ.',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sample_config_singleton CHECK (id = 1)
);
GRANT ALL ON public.sample_config TO service_role;
ALTER TABLE public.sample_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sample_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_code text,
  subject text,
  topic text,
  difficulty text NOT NULL DEFAULT 'Easy',
  question_en text NOT NULL,
  question_kn text,
  option_a_en text NOT NULL,
  option_a_kn text,
  option_b_en text NOT NULL,
  option_b_kn text,
  option_c_en text NOT NULL,
  option_c_kn text,
  option_d_en text NOT NULL,
  option_d_kn text,
  correct_answer character(1) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT ALL ON public.sample_questions TO service_role;
ALTER TABLE public.sample_questions ENABLE ROW LEVEL SECURITY;

INSERT INTO public.sample_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sample_config_updated_at
BEFORE UPDATE ON public.sample_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();