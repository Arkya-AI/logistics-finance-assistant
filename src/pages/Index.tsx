import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChatPanel } from "@/components/Chat/ChatPanel";
import { WorkspaceTabs } from "@/components/Workspace/WorkspaceTabs";
import { DevPanel } from "@/components/DevPanel";
import { useAuth } from "@/contexts/AuthProvider";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate("/auth");
    }
  }, [session, navigate]);

  if (!session) {
    return null;
  }

  return (
    <div className="flex h-screen w-full relative">
      <DevPanel />
      
      {/* Left: Chat Panel */}
      <div className="w-full md:w-[400px] lg:w-[450px] flex-shrink-0">
        <ChatPanel />
      </div>

      {/* Right: Workspace Tabs */}
      <div className="flex-1">
        <WorkspaceTabs />
      </div>
    </div>
  );
};

export default Index;
