DROP POLICY ai_access_own ON public.ai_access_state;
REVOKE INSERT, UPDATE, DELETE ON public.ai_access_state FROM authenticated;
CREATE POLICY ai_access_read_own ON public.ai_access_state FOR SELECT TO authenticated USING (user_id = auth.uid());