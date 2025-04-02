"use client";
import type React from "react";
import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Send, Loader2, SparklesIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { Button } from "../ui/button";
import { turndown } from "./turndown";
import { useSession } from "next-auth/react";
import { Input } from "../ui/input";
import { usePromptStore } from "@/state/promptStore";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";

const AskAI = ({ isCollapsed, thread }: { isCollapsed: boolean; thread: any }) => {
  const { toast } = useToast();
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { decrementPromptCount, promptsRemaining, isSubscribed } = usePromptStore();

  // Get thread context
  const getThreadContext = () => {
    if (!thread) return "";

    let context = "";
    for (const message of thread.messages) {
      const content = ` 
Subject: ${message.subject}
From: ${message.email}
Sent: ${new Date(message.date).toLocaleString()}
Body: ${turndown.turndown(message.text) || ""}
`;
      context += content;
    }
    context += `\nMy name is ${session?.user.name} and my email is ${session?.user.email}`;
    return context;
  };

  // Chat hook configuration
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    id: thread?.id || "default",
    api: "/api/chat",
    body: {
      mailContext: getThreadContext(),
      threadId: thread?.id || "",
      isSubscribed,
    },
    onFinish: async () => {
      await decrementPromptCount();
    },
  });

  // Fetch existing messages when thread changes
  useEffect(() => {
    const fetchMessages = async (threadId: string) => {
      try {
        const response = await fetch(`/api/chat/messages?threadId=${threadId}`);
        if (!response.ok) throw new Error("Failed to fetch messages");
        const data = await response.json();
        setMessages(data || []);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setMessages([]);
      }
    };

    if (thread?.id) {
      fetchMessages(thread.id);
    } else {
      setMessages([]);
    }
  }, [thread?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!promptsRemaining || promptsRemaining <= 0) {
      toast({
        title: "You have reached your prompt limit.",
        description: "Please try again tomorrow.",
        duration: 3000,
      });
      return;
    }
    handleSubmit(e);
  };

  if (isCollapsed) {
    return (
      <div className="flex justify-center p-2 border-t">
        <Button
          className="rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md h-10 w-10"
          aria-label="Ask AI about this thread"
        >
          <SparklesIcon className="size-4 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="border-t">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 p-3 border-b border-blue-100 dark:border-blue-900/30">
        <div className="flex items-center gap-2 px-1">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-full">
            <SparklesIcon className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
            Ask about anything related to this thread
          </p>
        </div>
      </div>

      <ScrollArea className={`flex-1 px-2 ${messages.length > 0 ? "h-[100px]" : "h-0"} mb-2`}>
        <AnimatePresence mode="wait">
          {messages.length === 0 && isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("mt-2 w-fit max-w-[85%] break-words rounded-2xl px-3 py-2", {
                  "ml-auto bg-blue-500 text-white": message.role === "user",
                  "mr-auto bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100":
                    message.role === "assistant",
                })}
              >
                <div className="text-sm">{message.content}</div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </ScrollArea>

      <div className="px-2 dark:border-gray-800">
        <form onSubmit={handleFormSubmit} className="flex gap-1">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask a question..."
            className="rounded-2xl focus-visible:ring-0"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md size-10"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AskAI;
