import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "../ui/textarea";
import { generateEmail } from "./actions";
import { readStreamableValue } from "ai/rsc";
import { Bot, X } from "lucide-react";
import { turndown } from "./turndown";
import { useSession } from "next-auth/react";
import { usePromptStore } from "@/state/promptStore";

type Props = {
  onGenerate: (token: string) => void;
  onClick: () => void;
  thread?: {
    messages: any[];
  };
};

const AIComposeButton = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { data: session } = useSession();
  const { decrementPromptCount, promptsRemaining, isSubscribed } = usePromptStore();

  const aiGenerate = async () => {
    try {
      let context = "";
      if (props.thread) {
        for (const messages of props.thread.messages) {
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

      const { output } = await generateEmail(context, prompt, isSubscribed as boolean);
      for await (const token of readStreamableValue(output)) {
        if (token) {
          props.onGenerate(token);
        }
      }
    } catch (error) {
      console.error("Error generating email:", error);
    } finally {
      await decrementPromptCount();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={props.onClick}
          variant="default"
          className="size-10 rounded-full focus-visible:ring-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          disabled={!promptsRemaining || promptsRemaining <= 0}
        >
          <Bot className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>AI Compose</DialogTitle>
            {/* <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose> */}
          </div>
          <DialogDescription>AI will help you compose your mails.</DialogDescription>
        </DialogHeader>
        <Textarea
          className="focus-visible:ring-0"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
        />
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              onClick={() => {
                aiGenerate();
                setPrompt("");
              }}
            >
              Generate
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIComposeButton;
