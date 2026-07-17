DROP POLICY IF EXISTS "public read settings" ON public.settings;
DROP POLICY IF EXISTS "public read questions" ON public.questions;
REVOKE SELECT ON public.settings FROM anon, authenticated;
REVOKE SELECT ON public.questions FROM anon, authenticated;