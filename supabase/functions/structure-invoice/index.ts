import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate request body with zod
    const bodySchema = z.object({ 
      fileId: z.string().uuid(),
      text: z.string().min(1).max(200_000) 
    });
    const { fileId, text } = bodySchema.parse(await req.json());
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Fix #3: Gate sensitive logging
    if (Deno.env.get("NODE_ENV") !== "production") {
      console.log(`[structure-invoice] Processing ${text.length} characters`);
    }

    const systemPrompt = `You are an invoice data extraction assistant. Extract structured data from OCR text and return it as JSON matching this schema:
{
  "doctype": "Invoice" | "Credit Note" | "Debit Note",
  "invoiceNumber": string,
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "vendorName": string,
  "billTo": string,
  "poNumber": string,
  "currency": "USD" | "AED" | "INR" | "SGD",
  "subtotal": number,
  "tax": number,
  "total": number,
  "lineItems": [
    {
      "description": string,
      "quantity": number,
      "unitPrice": number,
      "amount": number
    }
  ]
}

Return ONLY the JSON object, no extra text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice",
              description: "Extract structured invoice data",
              parameters: {
                type: "object",
                properties: {
                  doctype: { type: "string", enum: ["Invoice", "Credit Note", "Debit Note"] },
                  invoiceNumber: { type: "string" },
                  invoiceDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                  dueDate: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                  vendorName: { type: "string" },
                  billTo: { type: "string" },
                  poNumber: { type: "string" },
                  currency: { type: "string", enum: ["USD", "AED", "INR", "SGD"] },
                  subtotal: { type: "number" },
                  tax: { type: "number" },
                  total: { type: "number" },
                  lineItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quantity: { type: "number" },
                        unitPrice: { type: "number" },
                        amount: { type: "number" },
                      },
                      required: ["description", "amount"],
                    },
                  },
                },
                required: ["invoiceNumber", "total"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[structure-invoice] AI error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const invoice = JSON.parse(toolCall.function.arguments);
    // Fix #3: Don't log sensitive invoice numbers in production
    if (Deno.env.get("NODE_ENV") !== "production") {
      console.log("[structure-invoice] Extracted invoice:", invoice.invoiceNumber);
    }

    return new Response(
      JSON.stringify({ invoice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.error("[structure-invoice] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
