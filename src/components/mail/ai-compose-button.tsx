import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { generateEmail } from "./actions";
import { readStreamableValue } from "ai/rsc";
import { Bot } from "lucide-react";
import { turndown } from "./turndown";
import { useSession } from "next-auth/react";
type Props = {
  //   isComposing: boolean;
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
  // const [thread, setThread] = useState<any>([]);
  // useEffect(() => {
  //   setThread(props.thread);
  // }, []);
  // useEffect(() => {
  //   setThread(props.thread);
  // }, [thread]);
  const aiGenerate = async () => {
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
    // console.log(context);
    const { output } = await generateEmail(context, prompt);
    for await (const token of readStreamableValue(output)) {
      if (token) {
        // console.log(token);
        props.onGenerate(token);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={props.onClick} variant="default" className="rounded-full">
          <Bot className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {/* printing out the messages */}
        {/* <Button onClick={() => console.log(props.thread?.messages)}>Log thread</Button> */}
        <DialogHeader>
          <DialogTitle>AI Compose</DialogTitle>
          <DialogDescription>AI will help you compose your mails.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
        />
        <Button
          onClick={() => {
            aiGenerate();
            setOpen(false);
            setPrompt("");
          }}
        >
          Generate
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AIComposeButton;
