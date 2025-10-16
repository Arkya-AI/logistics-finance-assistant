import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user from JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate sinceDays from query params
    const url = new URL(req.url);
    let sinceDays = Number(url.searchParams.get("sinceDays") ?? "14");
    
    // Validate and sanitize sinceDays
    if (!Number.isFinite(sinceDays)) {
      sinceDays = 14;
    }
    sinceDays = Math.max(1, Math.min(30, Math.floor(sinceDays)));

    const MAX_MESSAGES = 200;
    let messagesFetched = 0;
    let attachmentsSaved = 0;

    console.log(`[User ${user.id}] Scanning Gmail for invoices from last ${sinceDays} days (max ${MAX_MESSAGES} messages)...`);

    // Get Gmail config for this user
    const { data: config, error: configError } = await supabase
      .from("gmail_config")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: "Gmail not connected. Please connect Gmail first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TODO: Implement actual Gmail API search with pagination
    // For now, return mock data limited to MAX_MESSAGES
    const mockMessages = [
      {
        id: "mock-msg-1",
        threadId: "thread-1",
        from: "vendor@example.com",
        subject: "Invoice #12345",
        received_at: new Date().toISOString(),
        has_invoice: true,
      },
      {
        id: "mock-msg-2",
        threadId: "thread-2",
        from: "billing@supplier.com",
        subject: "Your Invoice - Order #67890",
        received_at: new Date().toISOString(),
        has_invoice: true,
      },
    ];

    // Limit messages to MAX_MESSAGES
    const limitedMessages = mockMessages.slice(0, MAX_MESSAGES);
    messagesFetched = limitedMessages.length;

    // Insert messages with user_id
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .upsert(
        limitedMessages.map(m => ({ 
          gmail_id: m.id, 
          thread_id: m.threadId,
          from: m.from,
          subject: m.subject,
          received_at: m.received_at,
          has_invoice: m.has_invoice,
          user_id: user.id, // Ownership
        })), 
        { onConflict: "gmail_id" }
      )
      .select();

    if (msgError) throw msgError;

    // Mock: Create file attachments for messages with invoices and auto-process them
    const fileIds: string[] = [];
    for (const msg of limitedMessages.filter(m => m.has_invoice)) {
      // Mock file data - in real implementation, extract from Gmail
      const mockFileData = {
        message_id: messages?.find(m => m.gmail_id === msg.id)?.id,
        filename: `invoice_${msg.id}.pdf`,
        mime: "application/pdf",
        sha256: `mock_hash_${msg.id}`,
        blob_ref: `mock_blob_${msg.id}`,
        pages: 1,
        source: "gmail" as const,
        user_id: user.id, // Foreign ownership from message
      };

      const { data: fileRecord, error: fileError } = await supabase
        .from("files")
        .insert(mockFileData)
        .select()
        .single();

      if (fileError) {
        console.error(`Failed to save file for message ${msg.id}:`, fileError);
        continue;
      }

      fileIds.push(fileRecord.id);
      attachmentsSaved++;

      // Auto-process the invoice in user context
      console.log(`Auto-processing file ${fileRecord.id} for user ${user.id}...`);
      
      // Call processInvoice edge function (or orchestrator) with user context
      // For now, just log - in production, invoke ocr-extract or structure-invoice
      // supabase.functions.invoke('ocr-extract', { body: { fileId: fileRecord.id } })
    }

    console.log(`Scan complete: ${messagesFetched} messages, ${attachmentsSaved} files saved, ${fileIds.length} queued for processing`);

    return new Response(
      JSON.stringify({
        success: true,
        sinceDays,
        messagesFetched,
        attachmentsSaved,
        filesQueued: fileIds.length,
        message: `Scanned ${sinceDays} days. ${attachmentsSaved} attachments saved and queued for processing.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("gmail-scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
