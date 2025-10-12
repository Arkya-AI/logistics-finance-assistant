import { ChatPanel } from "@/components/Chat/ChatPanel";
import { WorkspaceTabs } from "@/components/Workspace/WorkspaceTabs";
import { DevPanel } from "@/components/DevPanel";

const Index = () => {
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
