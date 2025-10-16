-- Fix search_path for cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_oauth_states();

CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.oauth_state WHERE expires_at < now();
END;
$$;