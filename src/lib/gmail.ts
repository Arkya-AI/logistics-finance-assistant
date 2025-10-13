// Gmail client utilities
import { supabase } from "@/integrations/supabase/client";

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  hasAttachments: boolean;
  attachments?: GmailAttachment[];
}

export interface GmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
}

export async function initiateGmailOAuth() {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase.functions.invoke("gmail-auth", {
    body: { action: "initiate", userId: user?.id },
  });

  if (error) throw error;
  return data;
}

export async function getGmailConfig() {
  const { data, error } = await supabase
    .from("gmail_config")
    .select("*")
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function scanGmailInvoices(sinceDays: number = 14) {
  const { data, error } = await supabase.functions.invoke("gmail-scan", {
    body: { sinceDays },
  });

  if (error) throw error;
  return data;
}
