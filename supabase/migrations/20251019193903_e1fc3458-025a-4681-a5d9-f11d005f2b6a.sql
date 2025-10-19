-- Enable RLS on all quarantine tables (audit tables should be admin-only)
DO $$
DECLARE t text;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public' AND tablename LIKE '%_quarantine'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    -- Only superadmin/service role can access quarantine tables for audit
    EXECUTE format('CREATE POLICY "Service role only" ON %I FOR ALL USING (false);', t);
  END LOOP;
END $$;