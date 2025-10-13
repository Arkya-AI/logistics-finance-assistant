import { supabase } from "@/integrations/supabase/client";

const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

interface InvoiceHeader {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  vendorName: string;
  billTo: string | null;
  poNumber: string | null;
  currency: string;
  subtotal: number | null;
  tax: number | null;
  total: number;
}

interface InvoiceLineItem {
  description: string;
  quantity: number | null;
  unitPrice: number | null;
  amount: number;
}

interface StructuredInvoice {
  header: InvoiceHeader;
  lineItems: InvoiceLineItem[];
}

const INVOICE_SCHEMA = {
  type: "object",
  properties: {
    header: {
      type: "object",
      properties: {
        invoiceNumber: { type: "string" },
        invoiceDate: { type: "string", format: "date" },
        dueDate: { type: ["string", "null"], format: "date" },
        vendorName: { type: "string" },
        billTo: { type: ["string", "null"] },
        poNumber: { type: ["string", "null"] },
        currency: { type: "string", enum: ["USD", "AED", "INR", "SGD"] },
        subtotal: { type: ["number", "null"] },
        tax: { type: ["number", "null"] },
        total: { type: "number" },
      },
      required: ["invoiceNumber", "invoiceDate", "vendorName", "currency", "total"],
      additionalProperties: false,
    },
    lineItems: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          quantity: { type: ["number", "null"] },
          unitPrice: { type: ["number", "null"] },
          amount: { type: "number" },
        },
        required: ["description", "amount"],
        additionalProperties: false,
      },
    },
  },
  required: ["header", "lineItems"],
  additionalProperties: false,
};

export async function structureInvoiceWithGPT(
  extractionId: string,
  rawText: string
): Promise<StructuredInvoice> {
  const LOVABLE_API_KEY = import.meta.env.VITE_LOVABLE_API_KEY;

  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const systemPrompt = `You are an expert invoice data extractor. Extract structured invoice data from OCR text.
Return ONLY valid JSON matching the schema. Use null for missing optional fields.
Ensure all numbers are parsed correctly. Currency must be one of: USD, AED, INR, SGD.
Line items must be an array with at least one item.`;

  const userPrompt = `Extract invoice data from this OCR text:\n\n${rawText}`;

  const response = await fetch(LOVABLE_AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_schema", json_schema: { name: "invoice", schema: INVOICE_SCHEMA, strict: true } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI structuring failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in AI response");
  }

  const structured: StructuredInvoice = JSON.parse(content);

  // Save to extraction record
  await supabase
    .from("extractions")
    .update({
      gpt_json_ref: JSON.stringify(structured),
      status: "success",
    })
    .eq("id", extractionId);

  return structured;
}
