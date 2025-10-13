-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to exports
CREATE POLICY "Public read access to exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'exports');

-- Allow authenticated insert to exports
CREATE POLICY "Authenticated users can upload exports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exports' AND auth.role() = 'authenticated');

-- Allow service role full access to exports
CREATE POLICY "Service role full access to exports"
ON storage.objects FOR ALL
USING (bucket_id = 'exports' AND auth.role() = 'service_role');