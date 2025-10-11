// Documents table schema - stores OCR extraction results

export type DocumentStatus = "pending" | "processing" | "complete" | "error";

export interface Document {
  id: string; // UUID
  messageId: string; // Foreign key to Messages table
  attachmentUrl: string; // Storage path from Messages.attachment_refs
  filename: string;
  mimeType: string;
  fileSize: number;
  
  // Azure Document Intelligence metadata
  azureOperationId?: string; // Operation ID from Azure for polling
  azureModelId?: string; // prebuilt-invoice, prebuilt-receipt, etc.
  
  // OCR results
  rawOcrJson?: any; // Full Azure response JSON
  extractedText?: string; // Plain text extraction
  pageCount?: number;
  confidence?: number; // Overall confidence score 0-1
  
  // Processing status
  status: DocumentStatus;
  errorMessage?: string;
  
  // Timestamps
  createdAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  
  // Multi-tenant isolation
  tenantId: string;
}

// Azure Document Intelligence API response types (simplified)
export interface AzureDocumentField {
  type: string;
  valueString?: string;
  valueNumber?: number;
  valueDate?: string;
  content?: string;
  boundingRegions?: Array<{
    pageNumber: number;
    polygon: number[];
  }>;
  confidence: number;
}

export interface AzureDocumentPage {
  pageNumber: number;
  width: number;
  height: number;
  unit: string;
  words: Array<{
    content: string;
    polygon: number[];
    confidence: number;
  }>;
  lines?: Array<{
    content: string;
    polygon: number[];
  }>;
}

export interface AzureOcrResponse {
  status: "notStarted" | "running" | "succeeded" | "failed";
  createdDateTime: string;
  lastUpdatedDateTime: string;
  analyzeResult?: {
    apiVersion: string;
    modelId: string;
    content: string; // Full extracted text
    pages: AzureDocumentPage[];
    documents?: Array<{
      docType: string;
      fields: Record<string, AzureDocumentField>;
      boundingRegions: Array<{
        pageNumber: number;
        polygon: number[];
      }>;
      confidence: number;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface OcrProcessingResult {
  documentId: string;
  success: boolean;
  status: DocumentStatus;
  extractedText?: string;
  pageCount?: number;
  confidence?: number;
  errorMessage?: string;
}
