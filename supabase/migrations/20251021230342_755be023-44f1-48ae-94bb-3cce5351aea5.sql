-- Add minimal RLS policies for RBAC tables
-- This resolves the security finding: roles_no_policies

-- 1) roles: read-only for authenticated users
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='roles' AND policyname='roles_read_all') THEN
    DROP POLICY roles_read_all ON public.roles;
  END IF;
END $$;

CREATE POLICY roles_read_all
  ON public.roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Hardening: revoke direct public access
REVOKE ALL ON TABLE public.roles FROM PUBLIC;
GRANT SELECT ON TABLE public.roles TO authenticated;

-- 2) user_roles: owner-only read/write (separate policies for each operation)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='user_roles_owner_select') THEN
    DROP POLICY user_roles_owner_select ON public.user_roles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='user_roles_owner_insert') THEN
    DROP POLICY user_roles_owner_insert ON public.user_roles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='user_roles_owner_update') THEN
    DROP POLICY user_roles_owner_update ON public.user_roles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='user_roles_owner_delete') THEN
    DROP POLICY user_roles_owner_delete ON public.user_roles;
  END IF;
END $$;

CREATE POLICY user_roles_owner_select
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_roles_owner_insert
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_roles_owner_update
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_roles_owner_delete
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Hardening: revoke direct public access
REVOKE ALL ON TABLE public.user_roles FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;

-- Summary comment
COMMENT ON TABLE public.roles IS 'RLS enabled: authenticated users can read all role definitions';
COMMENT ON TABLE public.user_roles IS 'RLS enabled: users can only read/write their own role assignments';