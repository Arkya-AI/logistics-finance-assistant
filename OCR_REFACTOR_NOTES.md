# OCR Refactoring - Security Verification

## Changes Made

### ✅ Server-Side Only
- `supabase/functions/ocr-extract/index.ts`: Uses `GOOGLE_CLOUD_VISION_API_KEY` from Deno.env (server-side secret)
- `src/lib/gcv.ts`: Refactored to call edge function via `supabase.functions.invoke()` instead of direct API calls

### ✅ Client-Side Cleanup
- Removed all `import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY` references
- Removed direct Vision API calls from client code
- All OCR requests now proxy through the secure edge function

### ✅ Build-Time Security Check
- Added `securityCheckPlugin` to `vite.config.ts`
- Prevents builds if Vision API key is detected in client environment
- Logs confirmation when security check passes

## Architecture Flow

```
Client (src/lib/gcv.ts)
  ↓
  ocrWithGoogle(fileId)
  ↓
  supabase.functions.invoke("ocr-extract", { body: { fileId } })
  ↓
Server (supabase/functions/ocr-extract/index.ts)
  ↓
  - Authenticates user via JWT
  - Downloads file from storage
  - Calls Vision API with server-side key (Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY"))
  - Returns extracted text
```

## Security Guarantees

1. **No Key Exposure**: Vision API key never sent to client
2. **Authentication**: Edge function validates user JWT before processing
3. **RLS Protection**: File access checked via user_id in database queries
4. **Build Validation**: Vite plugin fails build if key detected in client bundle

## Usage

All existing code using `ocrWithGoogle(fileId)` continues to work identically, but now runs securely through the edge function.
