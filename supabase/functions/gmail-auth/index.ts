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
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const OAUTH_REDIRECT_URL = Deno.env.get("OAUTH_REDIRECT_URL") || 
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/gmail-auth`;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Gmail OAuth not configured. Missing credentials." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const url = new URL(req.url);
    let action: string | undefined;
    let code: string | null = null;
    let userId: string | undefined;

    if (req.method === "GET") {
      // Handle Google OAuth redirect (GET /gmail-auth?code=...&state=...)
      code = url.searchParams.get("code");
      userId = url.searchParams.get("state") || undefined;
      if (code) action = "callback";
    } else {
      // Handle JSON body from client-initiated actions
      const body = await req.json().catch(() => ({} as any));
      action = body.action;
      code = body.code ?? null;
      userId = body.userId;
    }

    if (action === "initiate") {
      const scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/userinfo.email"
      ].join(" ");

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", OAUTH_REDIRECT_URL);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", scopes);
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      if (userId) {
        authUrl.searchParams.set("state", userId);
      }

      console.log("[gmail-auth] Generated OAuth URL");
      return new Response(
        JSON.stringify({ authUrl: authUrl.toString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "callback" && code) {
      console.log("[gmail-auth] Processing OAuth callback");

      // Exchange code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: OAUTH_REDIRECT_URL,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[gmail-auth] Token exchange failed:", errorText);
        return new Response(
          JSON.stringify({ error: "Failed to exchange authorization code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokens = await tokenResponse.json();
      const { access_token, refresh_token, expires_in } = tokens;

      // Fetch user profile email
      const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!profileResponse.ok) {
        console.error("[gmail-auth] Failed to fetch user profile");
        return new Response(
          JSON.stringify({ error: "Failed to fetch user profile" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const profile = await profileResponse.json();
      const email = profile.email;

      console.log(`[gmail-auth] OAuth successful for email: ${email}`);

      // Calculate token expiry
      const tokenExpiry = new Date(Date.now() + expires_in * 1000).toISOString();

      // Upsert into gmail_config
      const { error: upsertError } = await supabase
        .from("gmail_config")
        .upsert({
          user_id: userId,
          email,
          access_token,
          refresh_token,
          token_expiry: tokenExpiry,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (upsertError) {
        console.error("[gmail-auth] Database upsert failed:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to save configuration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, email }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action or missing parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[gmail-auth] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
