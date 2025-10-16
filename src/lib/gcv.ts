import { supabase } from "@/integrations/supabase/client";

/**
 * OCR extraction using Google Cloud Vision API (server-side)
 * Calls the ocr-extract edge function to process files securely
 */
export async function ocrWithGoogle(fileId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ocr-extract", {
    body: { fileId },
  });

  if (error) {
    throw new Error(`OCR extraction failed: ${error.message}`);
  }

  if (!data || !data.text) {
    throw new Error("No text extracted from document");
  }

  return data.text;
}
