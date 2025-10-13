import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskRunner } from "./TaskRunner";
import { DocViewer } from "./DocViewer";
import { ActionPane } from "./ActionPane";
import { Timeline } from "./Timeline";
import { Exceptions } from "./Exceptions";
import { Inbox } from "./Inbox";

export function WorkspaceTabs() {
  const [activeTab, setActiveTab] = useState("inbox");

  return (
    <div className="flex h-full flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="tasks">Task Runner</TabsTrigger>
            <TabsTrigger value="doc">Doc Viewer</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="inbox" className="h-full m-0">
            <Inbox />
          </TabsContent>
          <TabsContent value="tasks" className="h-full m-0">
            <TaskRunner onTabSwitch={setActiveTab} />
          </TabsContent>
          <TabsContent value="doc" className="h-full m-0">
            <DocViewer />
          </TabsContent>
          <TabsContent value="actions" className="h-full m-0">
            <ActionPane />
          </TabsContent>
          <TabsContent value="timeline" className="h-full m-0">
            <Timeline />
          </TabsContent>
          <TabsContent value="exceptions" className="h-full m-0">
            <Exceptions />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
