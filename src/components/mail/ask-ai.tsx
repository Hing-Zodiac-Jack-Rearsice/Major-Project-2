"use client";
import type React from "react";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Send, Loader2, SparkleIcon, SparklesIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { Button } from "../ui/button";
import { turndown } from "./turndown";
import { useSession } from "next-auth/react";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { Input } from "../ui/input";
import { threadId } from "worker_threads";

const AskAI = ({ isCollapsed, thread }: { isCollapsed: boolean; thread: any }) => {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  // Add a key to force the useChat hook to reset
  const [chatKey, setChatKey] = useState(thread?.id || "default");
  // Fetch existing messages when thread changes
  useEffect(() => {
    if (thread?.id) {
      fetchMessages();
      setChatKey(thread.id);
    }
  }, [thread?.id]);

  // Function to fetch existing messages
  const fetchMessages = async () => {
    if (!thread?.id) return;

    setIsInitialLoading(true);
    try {
      const response = await fetch(`/api/chat/messages?threadId=${thread.id}`);
      const data = await response.json();
      setInitialMessages(data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Get thread context
  const getThreadContext = () => {
    let context = "";
    if (thread) {
      for (const messages of thread.messages) {
        const content = ` 
Subject: ${messages.subject}
From: ${messages.email}
Sent: ${new Date(messages.date).toLocaleString()}
Body: ${turndown.turndown(messages.text) || ""}
`;
        context += content;
      }
    }
    context += `My name is ${session?.user.name} and my email is ${session?.user.email}`;
    return context;
  };
  // Only initialize useChat when thread is available
  const threadAvailable = Boolean(thread && thread.id);
  // Use the useChat hook from AI SDK
  // Use the useChat hook from AI SDK with the key prop to force reset
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    id: chatKey, // Add this line to force reset on thread change
    initialMessages: initialMessages,
    api: "/api/chat",
    body: {
      mailContext: getThreadContext(),
      threadId: threadAvailable ? thread.id : "",
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  // If collapsed, just show the sparkles icon button
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

  // Full component when not collapsed
  return (
    <div className="border-t">
      {/* <Button onClick={() => console.log(thread.id)}>log threadid</Button> */}
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
      <ScrollArea
        className={`flex-1 px-2 ${
          messages.length > 0 ? "h-[100px]" : "h-0"
        } scroll-smooth overflow-y-auto mb-2`}
      >
        <AnimatePresence mode="wait">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              layout="position"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("z-10 mt-2 w-fit max-w-[85%] break-words rounded-2xl px-3 py-2", {
                "ml-auto bg-blue-500 text-white": message.role === "user",
                "mr-auto bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100":
                  message.role === "assistant",
              })}
              layoutId={`container-[${messages.length - 1}]`}
            >
              <div className="text-sm">{message.content}</div>
            </motion.div>
          ))}
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
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-full bg-blue-600 hover:bg-blue-700 transition-colors shadow-md"
            aria-label="Send message"
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
