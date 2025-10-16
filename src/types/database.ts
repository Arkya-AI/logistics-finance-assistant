// Database types for server-side tables

export interface Message {
  id: string;
  gmail_id: string;
  thread_id?: string;
  from: string;
  subject: string;
  received_at: string;
  has_invoice: boolean;
  created_at: string;
}

export interface File {
  id: string;
  message_id?: string;
  filename: string;
  mime: string;
  sha256: string;
  blob_ref: string;
  pages: number;
  source: "gmail" | "upload";
  created_at: string;
}

export interface Invoice {
  id: string;
  file_id: string;
  doctype?: string;
  invoice_number?: string;
  po_number?: string;
  vendor_name?: string;
  bill_to?: string;
  invoice_date?: string;
  due_date?: string;
  currency: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  confidence?: number;
  created_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  amount?: number;
  created_at: string;
}

export interface Extraction {
  id: string;
  file_id: string;
  raw_text_ref?: string;
  ocr_json_ref?: string;
  gpt_json_ref?: string;
  method?: string;
  duration_ms?: number;
  status: "pending" | "success" | "error";
  error_message?: string;
  created_at: string;
}

export interface GmailConfig {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token?: string;
  token_expiry?: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Export {
  id: string;
  user_id: string;
  invoice_id?: string;
  file_path: string;
  signed_url?: string;
  expires_at?: string;
  created_at: string;
}
