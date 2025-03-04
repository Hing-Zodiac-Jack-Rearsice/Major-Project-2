"use client";
import * as React from "react";
import {
  AlertCircle,
  Archive,
  ArchiveX,
  File,
  Inbox,
  MessagesSquare,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  Users2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccountSwitcher } from "@/components/mail/account-switcher";
import { MailDisplay } from "@/components/mail/mail-display";
import { MailList } from "@/components/mail/mail-list";
import { Nav } from "@/components/mail/nav";
import { type Mail } from "@/components/mail/data";
import { Button } from "../ui/button";
import { useSession } from "next-auth/react";
import { ComposeButton } from "./ComposeButton";
import AskAI from "./ask-ai";
import { ScrollArea } from "../ui/scroll-area";
import { usePromptStore } from "@/state/promptStore";
import PromptStatus from "./promptStatus";

export function Mail({
  accounts,
  threads,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: any) {
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [selectedThread, setSelectedThread] = React.useState<{
    id: string;
    messages: Mail[];
    unreadCount: number;
    lastMessage: Mail;
  } | null>(null);
  const [selected, setSelected] = React.useState("all");
  const { promptsRemaining, fetchPromptCount, decrementPromptCount, isSubscribed } =
    usePromptStore();
  // Fetch prompt count when component mounts
  React.useEffect(() => {
    fetchPromptCount();
  }, []);
  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={(sizes: number[]) => {
          document.cookie = `react-resizable-panels:layout:mail=${JSON.stringify(sizes)}`;
        }}
        className="items-stretch max-h-screen"
      >
        {/* left panel */}
        {/* <Button onClick={() => console.log(session)}>log user</Button> */}
        <ResizablePanel
          defaultSize={0}
          collapsedSize={navCollapsedSize}
          collapsible={true}
          minSize={15}
          maxSize={20}
          onCollapse={() => {
            setIsCollapsed(true);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
          }}
          onResize={() => {
            setIsCollapsed(false);
            document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
          }}
          className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
        >
          <div className="flex flex-col h-full">
            <div
              className={cn(
                "flex h-[52px] items-center justify-center",
                isCollapsed ? "h-[52px]" : "px-2"
              )}
            >
              <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
            </div>
            <Separator />
            <ScrollArea className="overflow-y-auto scroll-smooth">
              <Nav
                selectedItem={selected}
                sendSelected={(data) => setSelected(data)}
                isCollapsed={isCollapsed}
                links={[
                  {
                    title: "All",
                    label: "",
                    icon: Inbox,
                    variant: "default",
                  },
                  {
                    title: "Drafts",
                    label: "",
                    icon: File,
                    variant: "ghost",
                  },
                  {
                    title: "Sent",
                    label: "",
                    icon: Send,
                    variant: "ghost",
                  },
                  {
                    title: "Junk",
                    label: "",
                    icon: ArchiveX,
                    variant: "ghost",
                  },
                  {
                    title: "Trash",
                    label: "",
                    icon: Trash2,
                    variant: "ghost",
                  },
                  {
                    title: "Archive",
                    label: "",
                    icon: Archive,
                    variant: "ghost",
                  },
                ]}
              />
            </ScrollArea>
            <Separator />
            <ScrollArea className="overflow-y-auto scroll-smooth">
              <Nav
                selectedItem={selected} // Pass the same shared selected state
                sendSelected={(data) => setSelected(data)}
                isCollapsed={isCollapsed}
                links={[
                  {
                    title: "Social",
                    label: "",
                    icon: Users2,
                    variant: "ghost",
                  },
                  {
                    title: "Updates",
                    label: "",
                    icon: AlertCircle,
                    variant: "ghost",
                  },
                  {
                    title: "Forums",
                    label: "",
                    icon: MessagesSquare,
                    variant: "ghost",
                  },
                  {
                    title: "Shopping",
                    label: "",
                    icon: ShoppingCart,
                    variant: "ghost",
                  },
                  {
                    title: "Promotions",
                    label: "",
                    icon: Archive,
                    variant: "ghost",
                  },
                ]}
              />
            </ScrollArea>
            <AskAI isCollapsed={isCollapsed} thread={selectedThread} />
            <ComposeButton isCollapsed={isCollapsed} />
          </div>
        </ResizablePanel>
        {/* middle panel */}
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={40} minSize={30} className="overflow-y-auto">
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between px-4 py-2">
              <h1 className="text-xl font-bold">Inbox</h1>
              <PromptStatus
                promptsRemaining={promptsRemaining as number}
                isSubscribed={isSubscribed as boolean}
              />

              {/* <TabsList className="ml-auto">
                <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                  All mail
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-zinc-600 dark:text-zinc-200">
                  Unread
                </TabsTrigger>
              </TabsList> */}
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList onThreadSelect={setSelectedThread} selected={selected} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList onThreadSelect={setSelectedThread} selected={selected} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={defaultLayout[2]} minSize={30}>
          <MailDisplay thread={selectedThread} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
