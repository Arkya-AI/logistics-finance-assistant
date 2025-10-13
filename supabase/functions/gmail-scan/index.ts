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

    const { sinceDays = 14 } = await req.json();

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

    // TODO: Implement actual Gmail API search
    // For now, return mock data
    console.log(`Scanning Gmail for invoices from last ${sinceDays} days...`);
    
    const mockMessages = [
      {
        id: "mock-msg-1",
        threadId: "thread-1",
        from: "vendor@example.com",
        subject: "Invoice #12345",
        received_at: new Date().toISOString(),
        has_invoice: true,
      },
    ];

    // Insert mock messages
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .upsert(mockMessages.map(m => ({ gmail_id: m.id, ...m })), { onConflict: "gmail_id" })
      .select();

    if (msgError) throw msgError;

    return new Response(
      JSON.stringify({
        success: true,
        messagesFound: messages?.length || 0,
        message: "Mock scan completed. Real Gmail API integration pending.",
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
