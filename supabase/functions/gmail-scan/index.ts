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

    console.log(`Scanning Gmail for invoices from last ${sinceDays} days (max ${MAX_MESSAGES} messages)...`);

    // Get Gmail config
    const { data: config, error: configError } = await supabase
      .from("gmail_config")
      .select("*")
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

    // Insert mock messages
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
        })), 
        { onConflict: "gmail_id" }
      )
      .select();

    if (msgError) throw msgError;

    // Mock attachment count (would come from actual Gmail API processing)
    attachmentsSaved = limitedMessages.filter(m => m.has_invoice).length;

    console.log(`Scan complete: ${messagesFetched} messages fetched, ${attachmentsSaved} attachments saved`);

    return new Response(
      JSON.stringify({
        success: true,
        sinceDays,
        messagesFetched,
        attachmentsSaved,
        message: `Scanned ${sinceDays} days. Mock data returned (real Gmail API integration pending).`,
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
