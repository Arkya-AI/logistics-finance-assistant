-- Make exports bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'exports';

-- Create exports tracking table
CREATE TABLE public.exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_id UUID,
  file_path TEXT NOT NULL,
  signed_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "exports_owner" 
ON public.exports 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);