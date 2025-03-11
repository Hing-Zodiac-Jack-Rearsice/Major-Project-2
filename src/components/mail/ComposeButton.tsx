import * as React from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Paperclip, Pen, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { processAttachments } from "@/utils/processAttachments";
import AIComposeButton from "./ai-compose-button";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

interface ComposeButtonProps {
  isCollapsed?: boolean;
}

export function ComposeButton({ isCollapsed = false }: ComposeButtonProps) {
  const [to, setTo] = React.useState("");
  const [cc, setCc] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [aiContent, setAiContent] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [composeAttachments, setComposeAttachments] = React.useState<File[]>([]);
  const [isSending, setIsSending] = React.useState(false);
  const { toast } = useToast();

  const handleComposeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setComposeAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeComposeAttachment = (index: number) => {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const onGen = (token: string) => {
    setAiContent((prev) => prev + token);
  };

  const resetForm = () => {
    setTo("");
    setCc("");
    setSubject("");
    setBody("");
    setAiContent("");
    setComposeAttachments([]);
  };

  React.useEffect(() => {
    setBody(
      aiContent
        .split("\n") // Split by new lines
        .map((line) => `<p>${line.trim()}</p>`) // Wrap each line in <p>
        .join("")
    ); // Join without extra spaces
  }, [aiContent]);

  const handleSend = async () => {
    try {
      setIsSending(true);

      // Process attachments
      const processedAttachments = await Promise.all(
        composeAttachments.map(async (file) => {
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]); // Get base64 data
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });

          return {
            filename: file.name,
            mimeType: file.type,
            data: base64Data, // Base64 encoded data
            size: file.size,
          };
        })
      );

      // Create the payload
      const payload = {
        to,
        cc,
        subject,
        body,
        attachments: processedAttachments,
      };

      // Send the email
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      const data = await response.json();
      if (data.success) {
        resetForm();
        setIsOpen(false);
      } else {
        throw new Error(data.error || "Failed to send email");
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      // You could add a toast notification here
    } finally {
      setIsSending(false);
      toast({
        title: "Success",
        description: "Mail has been sent successfully.",
        duration: 5000,
      });
    }
  };

  // Reset form when dialog is closed
  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  return (
    <div className="relative mt-auto h-20 flex items-center justify-center">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl bg-gradient-to-r text-white rounded-full focus-visible:ring-0",
              isCollapsed ? "w-10 h-10 p-0" : "w-[90%] px-6 py-6"
            )}
          >
            <Pen className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span className="font-semibold">Compose</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <DialogTitle className="text-xl font-semibold">New Message</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="to" className="min-w-[60px]">
                  To:
                </Label>
                <Input
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1"
                  placeholder="recipient@example.com"
                  disabled={isSending}
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="cc" className="min-w-[60px]">
                  Cc:
                </Label>
                <Input
                  id="cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="flex-1"
                  placeholder="cc@example.com"
                  disabled={isSending}
                />
              </div>
              <div className="flex items-center gap-4">
                <Label htmlFor="subject" className="min-w-[60px]">
                  Subject:
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1"
                  placeholder="Enter subject"
                  disabled={isSending}
                />
              </div>
              <div className="min-h-[300px]">
                <ReactQuill
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  className="h-[250px]"
                  placeholder="Write your message here..."
                  readOnly={isSending}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ["bold", "italic", "underline", "strike", "blockquote"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
            </div>
            {/* Attachments section */}
            {composeAttachments.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                <ul className="space-y-2">
                  {composeAttachments.map((file, index) => (
                    <li key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{file.name}</span>
                        <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeComposeAttachment(index)}
                        className="text-red-600 h-6"
                        disabled={isSending}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between border-t pt-4">
            {/* File input handler */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="compose-file-upload"
                className={cn(
                  "flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer",
                  isSending && "opacity-50 pointer-events-none"
                )}
              >
                <Paperclip className="h-4 w-4" />
                <span className="text-sm">Attach</span>
              </label>
              <input
                id="compose-file-upload"
                type="file"
                multiple
                onChange={handleComposeFileChange}
                className="hidden"
                disabled={isSending}
              />
            </div>

            <div className="flex gap-2">
              <AIComposeButton onGenerate={onGen} onClick={() => setAiContent("")} />
              <Button onClick={handleSend} className="gap-2 rounded-full" disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send message
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
