import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { WorkspaceDrawer } from "@/components/Workspace/WorkspaceDrawer";
import { DevPanel } from "@/components/DevPanel";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2 } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { runState, taskEvents } = useChatStore();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  // Auto-open drawer when jobs are running
  useEffect(() => {
    if (runState === 'running' || runState === 'planning') {
      setDrawerOpen(true);
    }
  }, [runState]);

  // Auto-close on completion
  useEffect(() => {
    if (runState === 'done') {
      const timer = setTimeout(() => setDrawerOpen(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [runState]);

  const isJobRunning = runState === 'running' || runState === 'planning';

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen w-full relative">
      <DevPanel />
      
      {/* Top Bar with Jobs Button */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="gap-2 shadow-md"
        >
          {isJobRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ClipboardList className="h-4 w-4" />
          )}
          Jobs
          {taskEvents.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {taskEvents.length}
            </Badge>
          )}
        </Button>
      </div>
      
      {/* Chat Panel - Full Width */}
      <div className="w-full">
        <ChatPanel />
      </div>

      {/* Collapsible Workspace Drawer */}
      <WorkspaceDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
};

export default Index;
