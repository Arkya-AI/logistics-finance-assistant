-- Harden storage RLS for 'exports' bucket and remove legacy public policy

-- 1) Ensure bucket is private (if not already)
UPDATE storage.buckets SET public = false WHERE id = 'exports';

-- 2) Drop legacy public policy if it exists
DROP POLICY IF EXISTS "Public read access to exports" ON storage.objects;

-- 3) Path convention: store all objects under '<user_id>/...' to enable per-user policies.
--    (Orchestrator/export code already writes with user_id prefix; if not, adjust it.)
--    Example key: `${user_id}/${file_id}/invoice.csv`

-- 4) Owner-only SELECT on storage.objects
DROP POLICY IF EXISTS exports_owner_select ON storage.objects;
CREATE POLICY exports_owner_select
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'exports'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- 5) Owner-only INSERT (defense in depth)
DROP POLICY IF EXISTS exports_owner_insert ON storage.objects;
CREATE POLICY exports_owner_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exports'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- 6) Owner-only UPDATE (optional, for rotation)
DROP POLICY IF EXISTS exports_owner_update ON storage.objects;
CREATE POLICY exports_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'exports'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

-- 7) Owner-only DELETE (optional, for rotation)
DROP POLICY IF EXISTS exports_owner_delete ON storage.objects;
CREATE POLICY exports_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'exports'
    AND split_part(name, '/', 1) = auth.uid()::text
  );