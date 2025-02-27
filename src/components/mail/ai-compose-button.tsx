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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { generateEmail } from "./actions";
import { readStreamableValue } from "ai/rsc";
import { Bot } from "lucide-react";
type Props = {
  //   isComposing: boolean;
  onGenerate: (token: string) => void;
  onClick: () => void;
};

const AIComposeButton = (props: Props) => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const aiGenerate = async () => {
    const { output } = await generateEmail("", prompt);
    for await (const token of readStreamableValue(output)) {
      if (token) {
        console.log(token);
        props.onGenerate(token);
      }
    }
  };
  // const aiGenerate = async () => {
  //   const { output } = await generateEmail("", prompt);

  //   // Define a delay function
  //   const delay = (ms: any) => new Promise((resolve) => setTimeout(resolve, ms));

  //   for await (const token of readStreamableValue(output)) {
  //     if (token) {
  //       console.log(token);
  //       // Add delay before calling onGenerate
  //       await delay(200); // Adjust milliseconds as needed
  //       props.onGenerate(token);
  //     }
  //   }
  // };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={props.onClick}>
          <Bot className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
