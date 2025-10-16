-- Create oauth_state table for PKCE flow
CREATE TABLE IF NOT EXISTS public.oauth_state (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_verifier text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oauth_state ENABLE ROW LEVEL SECURITY;

-- Policy: users can only manage their own OAuth states
CREATE POLICY "Users manage own oauth state"
  ON public.oauth_state
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for cleanup of expired states
CREATE INDEX idx_oauth_state_expires ON public.oauth_state(expires_at);

-- Function to cleanup expired states (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.oauth_state WHERE expires_at < now();
END;
$$;