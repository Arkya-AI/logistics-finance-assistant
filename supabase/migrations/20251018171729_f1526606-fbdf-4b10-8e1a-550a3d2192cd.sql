-- ============================================
-- Integrity Indexes & OAuth TTL Cleanup
-- ============================================

-- 1. Per-user file dedupe by sha256 (prevents duplicate files per user)
CREATE UNIQUE INDEX IF NOT EXISTS files_user_sha256_uniq
  ON files(user_id, sha256);

-- 2. One gmail_config row per user
CREATE UNIQUE INDEX IF NOT EXISTS gmail_config_user_uniq
  ON gmail_config(user_id);

-- 3. Add 'kind' column to exports for better tracking
ALTER TABLE exports 
  ADD COLUMN IF NOT EXISTS kind text 
  CHECK (kind IN ('csv', 'json'));

-- Update existing exports to set kind based on file_path
UPDATE exports 
SET kind = CASE 
  WHEN file_path LIKE '%.csv' THEN 'csv'
  WHEN file_path LIKE '%.json' THEN 'json'
  ELSE 'csv'
END
WHERE kind IS NULL;

-- Make kind NOT NULL after backfilling
ALTER TABLE exports 
  ALTER COLUMN kind SET NOT NULL;

-- Create unique index: one active CSV/JSON per invoice per user
CREATE UNIQUE INDEX IF NOT EXISTS exports_user_invoice_kind_uniq
  ON exports(user_id, invoice_id, kind);

-- 4. OAuth state TTL cleanup function (can be called manually or via external scheduler)
CREATE OR REPLACE FUNCTION public.purge_oauth_state()
RETURNS void 
LANGUAGE sql 
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM oauth_state WHERE expires_at < now();
$$;