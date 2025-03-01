"use client";
import React, { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { Button } from "../ui/button";
import { turndown } from "./turndown";
import { useSession } from "next-auth/react";
import { Textarea } from "../ui/textarea";

const AskAI = ({ isCollapsed, thread }: { isCollapsed: boolean; thread: any }) => {
  const { data: session } = useSession();
  const [userQuestion, setUserQuestion] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Use the useChat hook from AI SDK
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      mailContext: getThreadContext(),
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

  return (
    <>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === "user" ? "User: " : "AI: "}
          {message.content}
        </div>
      ))}

      <form onSubmit={handleFormSubmit}>
        <input name="prompt" value={input} onChange={handleInputChange} />
        <button type="submit">Submit</button>
      </form>
    </>
  );
};

export default AskAI;
