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

    const { fileId, blobRef } = await req.json();
    const VISION_API_KEY = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");

    if (!VISION_API_KEY) {
      throw new Error("GOOGLE_CLOUD_VISION_API_KEY not configured");
    }

    console.log(`[ocr-extract] Processing file ${fileId}, blobRef: ${blobRef}`);

    // Fetch file from storage or use blobRef as base64 content
    // For now, mock response
    const mockText = `INVOICE
Invoice Number: INV-2025-001
Date: 2025-10-13
Vendor: ACME Corp
Total: $1,234.56`;

    console.log(`[ocr-extract] Extracted ${mockText.length} characters`);

    return new Response(
      JSON.stringify({ text: mockText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ocr-extract] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
