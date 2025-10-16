// Data Access Layer for database operations
import { supabase } from "@/integrations/supabase/client";
import type { Message, File, Invoice, InvoiceLineItem, Extraction, Export } from "@/types/database";

// Messages DAL
export const messagesDAL = {
  async create(data: Omit<Message, "id" | "created_at" | "user_id">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: result, error } = await supabase
      .from("messages")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return result as Message;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("received_at", { ascending: false });
    if (error) throw error;
    return data as Message[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Message;
  },
};

// Files DAL
export const filesDAL = {
  async create(data: Omit<File, "id" | "created_at" | "user_id">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: result, error } = await supabase
      .from("files")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return result as File;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as File[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as File;
  },

  async getByMessageId(messageId: string) {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("message_id", messageId);
    if (error) throw error;
    return data as File[];
  },
};

// Invoices DAL
export const invoicesDAL = {
  async create(data: Omit<Invoice, "id" | "created_at" | "user_id">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: result, error } = await supabase
      .from("invoices")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return result as Invoice;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Invoice[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Invoice;
  },
};

// Invoice Line Items DAL
export const lineItemsDAL = {
  async create(data: Omit<InvoiceLineItem, "id" | "created_at" | "user_id">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: result, error } = await supabase
      .from("invoice_line_items")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return result as InvoiceLineItem;
  },

  async getByInvoiceId(invoiceId: string) {
    const { data, error } = await supabase
      .from("invoice_line_items")
      .select("*")
      .eq("invoice_id", invoiceId);
    if (error) throw error;
    return data as InvoiceLineItem[];
  },
};

// Extractions DAL
export const extractionsDAL = {
  async create(data: Omit<Extraction, "id" | "created_at" | "user_id">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: result, error } = await supabase
      .from("extractions")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return result as Extraction;
  },

  async getAll() {
    const { data, error } = await supabase
      .from("extractions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Extraction[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("extractions")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Extraction;
  },

  async getByFileId(fileId: string) {
    const { data, error } = await supabase
      .from("extractions")
      .select("*")
      .eq("file_id", fileId);
    if (error) throw error;
    return data as Extraction[];
  },
};

// Exports DAL
export const exportsDAL = {
  async getByInvoiceId(invoiceId: string) {
    const { data, error } = await supabase
      .from("exports")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Export[];
  },

  async regenerateSignedUrl(exportId: string) {
    // Get the export record
    const { data: exportRecord, error: fetchError } = await supabase
      .from("exports")
      .select("*")
      .eq("id", exportId)
      .single();
    if (fetchError) throw fetchError;

    const exp = exportRecord as Export;
    
    // Generate new signed URL valid for 24 hours
    const expiresIn = 24 * 60 * 60;
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from("exports")
      .createSignedUrl(exp.file_path, expiresIn);
    if (urlError) throw urlError;

    // Update the export record
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const { data, error: updateError } = await supabase
      .from("exports")
      .update({
        signed_url: signedUrl?.signedUrl,
        expires_at: expiresAt.toISOString(),
      })
      .eq("id", exportId)
      .select()
      .single();
    if (updateError) throw updateError;

    return data as Export;
  },
};
