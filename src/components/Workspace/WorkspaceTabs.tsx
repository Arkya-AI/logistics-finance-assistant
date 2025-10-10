import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskRunner } from "./TaskRunner";
import { DocViewer } from "./DocViewer";
import { ActionPane } from "./ActionPane";
import { Timeline } from "./Timeline";
import { Exceptions } from "./Exceptions";

export function WorkspaceTabs() {
  return (
    <div className="flex h-full flex-col">
      <Tabs defaultValue="tasks" className="flex h-full flex-col">
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="tasks">Task Runner</TabsTrigger>
            <TabsTrigger value="doc">Doc Viewer</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="tasks" className="h-full m-0">
            <TaskRunner />
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
