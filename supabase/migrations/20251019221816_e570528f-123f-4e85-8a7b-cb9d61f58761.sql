-- Add foreign key constraints on user_id for all tenant tables
-- This is idempotent - will skip if FK already exists

DO $$
DECLARE
  t text;
  constraint_name text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'messages','files','extractions','invoices',
    'invoice_line_items','gmail_config','exports','user_roles'
  ]
  LOOP
    constraint_name := t || '_user_fk';
    -- If table exists and user_id column exists, try to add FK
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND column_name='user_id'
    ) THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;',
          t, constraint_name
        );
      EXCEPTION WHEN duplicate_object THEN
        -- FK already exists, ignore
      END;
    END IF;
  END LOOP;
END $$;