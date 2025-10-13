import { supabase } from "@/integrations/supabase/client";
import { renderPdfPageToBase64, isPdfMime } from "./pdf";

const VISION_API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;

interface VisionApiResponse {
  responses: Array<{
    fullTextAnnotation?: {
      text: string;
    };
    error?: {
      message: string;
    };
  }>;
}

export async function ocrWithGoogle(fileId: string): Promise<string> {
  // Fetch file metadata
  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("*")
    .eq("id", fileId)
    .single();

  if (fileError || !file) {
    throw new Error(`File not found: ${fileId}`);
  }

  // Download file from storage
  const { data: blobData, error: downloadError } = await supabase.storage
    .from("uploads")
    .download(file.blob_ref);

  if (downloadError || !blobData) {
    throw new Error(`Failed to download file: ${downloadError?.message}`);
  }

  let base64Content: string;

  // Check if PDF, render first page to image
  if (isPdfMime(file.mime)) {
    const base64Image = await renderPdfPageToBase64(blobData, 1);
    // Remove data:image/png;base64, prefix
    base64Content = base64Image.split(",")[1];
  } else {
    // For images, convert directly to base64
    const arrayBuffer = await blobData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Content = btoa(binary);
  }

  // Call Google Cloud Vision API
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Content,
            },
            features: [
              {
                type: "DOCUMENT_TEXT_DETECTION",
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Vision API error: ${response.status} - ${errorText}`);
  }

  const data: VisionApiResponse = await response.json();

  if (data.responses[0]?.error) {
    throw new Error(`Vision API error: ${data.responses[0].error.message}`);
  }

  const extractedText = data.responses[0]?.fullTextAnnotation?.text || "";

  if (!extractedText) {
    throw new Error("No text extracted from image");
  }

  return extractedText;
}
