import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/store/chatStore";
import { Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function Settings() {
  const { autoProcess, toggleAutoProcess } = useChatStore();
  const defaultRedirectUrl = `https://fsnjwooppfqmiszxfidn.supabase.co/functions/v1/gmail-auth`;

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Gmail OAuth Configuration</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use this redirect URL in your Google Cloud Console OAuth configuration
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirect-url">OAuth Redirect URL</Label>
            <Input
              id="redirect-url"
              value={defaultRedirectUrl}
              readOnly
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Add this URL to "Authorized redirect URIs" in your Google OAuth Client settings
            </p>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Processing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure how invoices are processed
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-process">Auto-Process Invoices</Label>
              <p className="text-sm text-muted-foreground">
                Automatically process files when uploaded or received via Gmail
              </p>
            </div>
            <Switch
              id="auto-process"
              checked={autoProcess}
              onCheckedChange={toggleAutoProcess}
            />
          </div>
        </div>

        <div className="rounded-lg border p-4 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            {autoProcess
              ? "✓ Files will be automatically processed through OCR, structuring, and validation"
              : "⚠️ Files will require manual processing via the 'Process' button"}
          </p>
        </div>
      </div>
    </div>
  );
}
