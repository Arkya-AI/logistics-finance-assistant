import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clearPersistedState } from "@/lib/persist";
import { useChatStore } from "@/store/chatStore";
import { toast } from "sonner";

export const DevPanel = () => {
  const { devErrorsEnabled, toggleDevErrors } = useChatStore();

  const handleResetState = () => {
    clearPersistedState();
    toast.success("State cleared. Refresh to reset.");
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="p-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dev-errors" className="text-sm">
                Simulate Errors (10%)
              </Label>
              <Switch
                id="dev-errors"
                checked={devErrorsEnabled}
                onCheckedChange={toggleDevErrors}
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleResetState} className="text-destructive">
            Reset State
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
