import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper: Generate cryptographically random string
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper: Base64 URL encode
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Helper: Generate PKCE challenge
async function generatePKCEChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(hash);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Only require JWT for initiate action (callback comes from Google redirect)
    let userId: string;
    
    if (action === "initiate") {
      // Get authorization header
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        console.error("No authorization header");
        return new Response(
          JSON.stringify({ error: "Unauthorized: No authorization header" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get authenticated user from JWT
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        authHeader.replace("Bearer ", "")
      );

      if (authError || !user) {
        console.error("Auth error:", authError);
        return new Response(
          JSON.stringify({ error: "Unauthorized: Invalid token" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = user.id;
      console.log(`Authenticated user: ${userId}, action: ${action}`);

    // === INITIATE FLOW ===
    if (action === "initiate") {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const redirectUri = Deno.env.get("OAUTH_REDIRECT_URL");

      if (!clientId || !redirectUri) {
        console.error("Missing OAuth credentials");
        return new Response(
          JSON.stringify({ error: "Server configuration error: Missing OAuth credentials" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Generate state and code_verifier
      const state = generateRandomString(32);
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generatePKCEChallenge(codeVerifier);

      // Store state with expiry (10 minutes)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      
      const { error: insertError } = await supabase
        .from("oauth_state")
        .insert({
          state,
          user_id: userId,
          code_verifier: codeVerifier,
          expires_at: expiresAt,
        });

      if (insertError) {
        console.error("Failed to store OAuth state:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to initiate OAuth flow" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Build Google OAuth URL
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", clientId);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      console.log("OAuth flow initiated for user:", userId);

      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    } // Close the if (action === "initiate") block
    
    // === CALLBACK FLOW ===
    if (action === "callback") {
      // Validate callback parameters with zod
      const qp = Object.fromEntries(url.searchParams);
      const callbackSchema = z.object({ 
        code: z.string().min(1),
        state: z.string().min(10) 
      });
      
      const { code, state } = callbackSchema.parse(qp);

      // Validate state and get code_verifier
      const { data: stateData, error: stateError } = await supabase
        .from("oauth_state")
        .select("*")
        .eq("state", state)
        .single();

      if (stateError || !stateData) {
        console.error("Invalid state:", stateError);
        return new Response(
          JSON.stringify({ error: "Invalid or expired state" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check expiry
      if (new Date(stateData.expires_at) < new Date()) {
        console.error("State expired");
        await supabase.from("oauth_state").delete().eq("state", state);
        return new Response(
          JSON.stringify({ error: "OAuth state expired" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const ownerId = stateData.user_id;
      const codeVerifier = stateData.code_verifier;

      // Delete state (one-time use)
      await supabase.from("oauth_state").delete().eq("state", state);

      // Exchange code for tokens
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      const redirectUri = Deno.env.get("OAUTH_REDIRECT_URL");

      if (!clientId || !clientSecret || !redirectUri) {
        console.error("Missing OAuth credentials for token exchange");
        return new Response(
          JSON.stringify({ error: "Server configuration error" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to exchange code for tokens" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const tokens = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokens;

      // Get user email
      const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userInfoResponse.ok) {
        console.error("Failed to get user info");
        return new Response(
          JSON.stringify({ error: "Failed to get user information" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const userInfo = await userInfoResponse.json();
      const email = userInfo.email;

      // Calculate token expiry
      const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

      // Upsert into gmail_config
      const { error: upsertError } = await supabase
        .from("gmail_config")
        .upsert({
          user_id: ownerId,
          email,
          access_token,
          refresh_token,
          token_expiry: tokenExpiry,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (upsertError) {
        console.error("Failed to store Gmail config:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to save Gmail configuration" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Fix #3: Gate sensitive logging (mask email, only in development)
      if (Deno.env.get("NODE_ENV") !== "production") {
        const maskedEmail = email.replace(/(.{2}).*(@.*)/, '$1***$2');
        console.log(`Gmail OAuth completed for user, email: ${maskedEmail}`);
      }

      return new Response(
        JSON.stringify({ success: true, email }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: "Invalid action parameter" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    // Handle zod validation errors
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
