-- ============================================
-- Enforce NOT NULL + FK(user_id) on all tenant tables
-- Quarantine NULL rows for audit before deletion
-- ============================================

-- Step 1: Quarantine and delete any rows with NULL user_id
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages','files','extractions','invoices','invoice_line_items','gmail_config','exports','oauth_state']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='user_id') THEN
      EXECUTE format('CREATE TABLE IF NOT EXISTS %I_quarantine AS TABLE %I WITH NO DATA;', t||'', t);
      EXECUTE format('INSERT INTO %I_quarantine SELECT * FROM %I WHERE user_id IS NULL;', t, t);
      EXECUTE format('DELETE FROM %I WHERE user_id IS NULL;', t);
    END IF;
  END LOOP;
END $$;

-- Step 2: Enforce NOT NULL and add FK to auth.users (ignore if exists)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema='public' AND column_name='user_id'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN user_id SET NOT NULL;', r.table_name);
    BEGIN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;', r.table_name, r.table_name);
    EXCEPTION WHEN duplicate_object THEN
      -- FK already exists, skip
    END;
  END LOOP;
END $$;

-- Step 3: Integrity indexes (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS files_user_sha256_uniq ON files(user_id, sha256);
CREATE UNIQUE INDEX IF NOT EXISTS gmail_config_user_uniq ON gmail_config(user_id);

-- Step 4: Defense-in-depth ownership guard trigger
CREATE OR REPLACE FUNCTION enforce_row_ownership()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NULL THEN 
    RAISE EXCEPTION 'Authentication required for % operation on %', TG_OP, TG_TABLE_NAME; 
  END IF;
  
  IF TG_OP='INSERT' THEN
    -- Auto-set user_id if null, but reject if it doesn't match auth user
    IF NEW.user_id IS NULL THEN 
      NEW.user_id := auth.uid(); 
    END IF;
    IF NEW.user_id <> auth.uid() THEN 
      RAISE EXCEPTION 'Cannot insert row for different user (tried %, auth is %)', NEW.user_id, auth.uid(); 
    END IF;
  ELSIF TG_OP='UPDATE' THEN
    -- Prevent changing user_id
    IF NEW.user_id IS NULL OR NEW.user_id <> OLD.user_id THEN 
      RAISE EXCEPTION 'Cannot change user_id on existing row'; 
    END IF;
    IF NEW.user_id <> auth.uid() THEN 
      RAISE EXCEPTION 'Cannot update row owned by different user'; 
    END IF;
  END IF;
  
  RETURN NEW;
END $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Apply trigger to all tenant tables
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages','files','extractions','invoices','invoice_line_items','gmail_config','exports']
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_row_ownership ON %I;', t);
      EXECUTE format('CREATE TRIGGER trg_enforce_row_ownership BEFORE INSERT OR UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION enforce_row_ownership();', t);
    END IF;
  END LOOP;
END $$;