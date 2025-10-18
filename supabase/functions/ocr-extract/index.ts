import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request body
    const { fileId } = await req.json();
    if (!fileId) {
      return new Response(
        JSON.stringify({ error: "Missing fileId" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fix #3: Gate sensitive logging
    if (Deno.env.get("NODE_ENV") !== "production") {
      console.log(`[ocr-extract] Processing fileId: ${fileId}`);
    }

    // Get file metadata
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*")
      .eq("id", fileId)
      .eq("user_id", user.id)
      .single();

    if (fileError || !fileData) {
      console.error("File not found:", fileError);
      return new Response(
        JSON.stringify({ error: "File not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Download file blob from storage
    const { data: blobData, error: downloadError } = await supabase.storage
      .from("exports")
      .download(fileData.blob_ref);

    if (downloadError || !blobData) {
      console.error("Failed to download file:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download file" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (Deno.env.get("NODE_ENV") !== "production") {
      console.log(`[ocr-extract] Downloaded file, size: ${blobData.size} bytes`);
    }

    // Convert blob to base64
    const arrayBuffer = await blobData.arrayBuffer();
    const base64Image = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );

    // Get API key
    const apiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
    if (!apiKey) {
      console.error("Missing GOOGLE_CLOUD_VISION_API_KEY");
      return new Response(
        JSON.stringify({ error: "OCR service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Call Google Cloud Vision API
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const visionRequest = {
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: "DOCUMENT_TEXT_DETECTION",
              maxResults: 1,
            },
          ],
        },
      ],
    };

    if (Deno.env.get("NODE_ENV") !== "production") {
      console.log("[ocr-extract] Calling Google Vision API...");
    }
    const visionResponse = await fetch(visionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(visionRequest),
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error("Vision API error:", visionResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "OCR processing failed" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const visionData = await visionResponse.json();
    if (Deno.env.get("NODE_ENV") !== "production") {
      console.log("[ocr-extract] Vision API response received");
    }

    // Extract text
    const text =
      visionData.responses?.[0]?.fullTextAnnotation?.text || "";

    if (!text) {
      console.warn("[ocr-extract] No text detected in image");
    }

    if (Deno.env.get("NODE_ENV") !== "production") {
      console.log(`[ocr-extract] Extracted ${text.length} characters`);
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[ocr-extract] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
