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
import { Paperclip, Pen, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { processAttachments } from "@/utils/processAttachments";

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
  const [isOpen, setIsOpen] = React.useState(false);
  const [composeAttachments, setComposeAttachments] = React.useState<File[]>([]);

  const handleComposeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setComposeAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeComposeAttachment = (index: number) => {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    try {
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

      // Log the payload being sent
      const payload = {
        to,
        cc,
        subject,
        body,
        attachments: processedAttachments,
      };
      console.log("Full payload being sent:", payload);

      // Send the email
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Log the response
      console.log("Response status:", response.status);
      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      if (data.success) {
        setIsOpen(false);
        setTo("");
        setCc("");
        setSubject("");
        setBody("");
        setComposeAttachments([]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to send email:", error);
      // Handle error (show error message to user)
    }
  };
  // const handleSend = () => {
  //   console.log("Sending email:", { to, cc, subject, body });
  //   setIsOpen(false);
  //   setTo("");
  //   setCc("");
  //   setSubject("");
  //   setBody("");
  // };

  return (
    <div className="relative mt-auto h-20 flex items-center justify-center">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            className={cn(
              "shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full",
              isCollapsed ? "w-10 h-10 p-0" : "w-[85%] px-6 py-6"
            )}
          >
            <Pen className={cn("h-5 w-5", !isCollapsed && "mr-2")} />
            {!isCollapsed && <span className="font-semibold">Compose</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
            <DialogTitle className="text-xl font-semibold">New Message</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            ></Button>
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
                />
              </div>
              <div className="min-h-[300px]">
                <ReactQuill
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  className="h-[250px]"
                  placeholder="Write your message here..."
                />
              </div>
            </div>
            {/* Updated attachments section */}
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
            {/* Updated file input handler */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="compose-file-upload"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
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
              />
            </div>

            <Button
              onClick={handleSend}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Send className="h-4 w-4" />
              Send message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
