-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_id TEXT UNIQUE NOT NULL,
  thread_id TEXT,
  "from" TEXT NOT NULL,
  subject TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  has_invoice BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  blob_ref TEXT NOT NULL,
  pages INTEGER DEFAULT 1,
  source TEXT NOT NULL CHECK (source IN ('gmail', 'upload')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  doctype TEXT,
  invoice_number TEXT,
  po_number TEXT,
  vendor_name TEXT,
  bill_to TEXT,
  invoice_date DATE,
  due_date DATE,
  currency TEXT DEFAULT 'USD',
  subtotal DECIMAL(12,2),
  tax DECIMAL(12,2),
  total DECIMAL(12,2),
  confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice_line_items table
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2),
  unit_price DECIMAL(12,2),
  amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create extractions table
CREATE TABLE public.extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE NOT NULL,
  raw_text_ref TEXT,
  ocr_json_ref TEXT,
  gpt_json_ref TEXT,
  method TEXT,
  duration_ms INTEGER,
  status TEXT CHECK (status IN ('pending', 'success', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create gmail_config table for OAuth tokens
CREATE TABLE public.gmail_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now - single tenant demo)
CREATE POLICY "Allow all on messages" ON public.messages FOR ALL USING (true);
CREATE POLICY "Allow all on files" ON public.files FOR ALL USING (true);
CREATE POLICY "Allow all on invoices" ON public.invoices FOR ALL USING (true);
CREATE POLICY "Allow all on invoice_line_items" ON public.invoice_line_items FOR ALL USING (true);
CREATE POLICY "Allow all on extractions" ON public.extractions FOR ALL USING (true);
CREATE POLICY "Allow users to manage own gmail config" ON public.gmail_config FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_messages_gmail_id ON public.messages(gmail_id);
CREATE INDEX idx_files_message_id ON public.files(message_id);
CREATE INDEX idx_files_sha256 ON public.files(sha256);
CREATE INDEX idx_invoices_file_id ON public.invoices(file_id);
CREATE INDEX idx_line_items_invoice_id ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_extractions_file_id ON public.extractions(file_id);