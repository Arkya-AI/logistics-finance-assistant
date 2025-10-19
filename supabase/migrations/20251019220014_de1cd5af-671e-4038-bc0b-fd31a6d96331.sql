-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id text PRIMARY KEY,
  description text
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id text REFERENCES public.roles(id),
  PRIMARY KEY(user_id, role_id)
);

-- Insert default roles
INSERT INTO public.roles (id, description) VALUES
  ('admin', 'Full access'),
  ('member', 'Standard')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on both tables (no policies yet, just scaffolding)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;