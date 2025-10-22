import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { WorkspaceTabs } from "./WorkspaceTabs";

interface WorkspaceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceDrawer({ open, onOpenChange }: WorkspaceDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] lg:w-[700px] flex flex-col rounded-none">
        <DrawerHeader className="border-b">
          <DrawerTitle>Task Monitor</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-hidden">
          <WorkspaceTabs />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
