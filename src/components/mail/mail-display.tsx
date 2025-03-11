"use client";
import React, { useState, useEffect, useRef } from "react";
import { debounce } from "lodash";
import "react-quill/dist/quill.snow.css";
import { Letter } from "react-letter";
import { addDays } from "date-fns/addDays";
import { addHours } from "date-fns/addHours";
import { format } from "date-fns/format";
import { nextSaturday } from "date-fns/nextSaturday";
import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Scroll,
  Trash2,
  User,
  Paperclip,
  Download,
  Loader2,
} from "lucide-react";

import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type ReactQuillType from "react-quill"; // Import the type

import { ScrollArea } from "../ui/scroll-area";
import { processAttachments } from "@/utils/processAttachments";
import dynamic from "next/dynamic";
import AIComposeButton from "./ai-compose-button";
import { Delta } from "quill";
import { generate, generateEmail } from "./actions";
import { useToast } from "@/hooks/use-toast";
// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
}) as typeof ReactQuillType;
export function MailDisplay({ thread }: any) {
  const quillRef = useRef<ReactQuillType>(null);
  const { toast } = useToast();
  const today = new Date();
  const [replyName, setReplyName] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setEditorLoaded(true);
    setEditorContent("");
    setAttachments([]);
    setReplyName(thread ? thread.messages[0].from : "");
  }, [thread]);

  const onGenerate = (token: string) => {
    // setEditorContent("");
    setContent((prev) => prev + token);
  };

  useEffect(() => {
    setEditorContent(
      content
        .split("\n") // Split by new lines
        .map((line) => `<p>${line.trim()}</p>`) // Wrap each line in <p>
        .join("")
    ); // Join without extra spaces
  }, [content]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const processedAttachments =
        attachments.length > 0 ? await processAttachments(attachments) : undefined;

      const messageData = {
        threadId: thread.id,
        content: editorContent,
        attachments: processedAttachments,
        participants:
          thread.messages[0].replyTo?.length > 0 ? thread.messages[0].replyTo : thread.participants,
      };

      const response = await fetch(`/api/mail/reply/${thread.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();

      if (result.success) {
        setEditorContent("");
        setAttachments([]);
        setContent("");
        toast({
          title: "Success",
          description: "Your reply has been sent successfully.",
          duration: 5000,
        });
        console.log("Reply sent successfully:", result.messageId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      toast({
        title: "Error",
        description: "Failed to send your reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadAttachment = async (messageId: string, attachment: any) => {
    try {
      const response = await fetch(
        `/api/mail/attachment?messageId=${messageId}&attachmentId=${attachment.id}`
      );

      if (!response.ok) throw new Error("Failed to fetch attachment");

      const data = await response.json();

      // Convert base64 to blob
      const binaryData = atob(data.data.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: attachment.mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading attachment:", error);
      toast({
        title: "Error",
        description: "Failed to download attachment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header with actions */}
      <div className="flex items-center">
        <div className="flex items-center p-2">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!thread}>
                  <Archive className="h-4 w-4" />
                  <span className="sr-only">Archive</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Archive</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!thread}>
                  <ArchiveX className="h-4 w-4" />
                  <span className="sr-only">Move to junk</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move to junk</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!thread}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Move to trash</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move to trash</TooltipContent>
            </Tooltip>
            <Separator orientation="vertical" className="mx-1 h-6" />
            <Tooltip>
              <Popover>
                <PopoverTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={!thread}>
                      <Clock className="h-4 w-4" />
                      <span className="sr-only">Snooze</span>
                    </Button>
                  </TooltipTrigger>
                </PopoverTrigger>
                <PopoverContent className="flex w-[535px] p-0">
                  <div className="flex flex-col gap-2 border-r px-2 py-4">
                    <div className="px-4 text-sm font-medium">Snooze until</div>
                    <div className="grid min-w-[250px] gap-1">
                      <Button variant="ghost" className="justify-start font-normal">
                        Later today
                        <span className="ml-auto text-muted-foreground">
                          {format(addHours(today, 4), "E, h:m b")}
                        </span>
                      </Button>
                      <Button variant="ghost" className="justify-start font-normal">
                        Tomorrow
                        <span className="ml-auto text-muted-foreground">
                          {format(addDays(today, 1), "E, h:m b")}
                        </span>
                      </Button>
                      <Button variant="ghost" className="justify-start font-normal">
                        This weekend
                        <span className="ml-auto text-muted-foreground">
                          {format(nextSaturday(today), "E, h:m b")}
                        </span>
                      </Button>
                      <Button variant="ghost" className="justify-start font-normal">
                        Next week
                        <span className="ml-auto text-muted-foreground">
                          {format(addDays(today, 7), "E, h:m b")}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <div className="p-2">
                    <Calendar />
                  </div>
                </PopoverContent>
              </Popover>
              <TooltipContent>Snooze</TooltipContent>
            </Tooltip>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!thread}>
                  <Reply className="h-4 w-4" />
                  <span className="sr-only">Reply</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!thread}>
                  <ReplyAll className="h-4 w-4" />
                  <span className="sr-only">Reply all</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reply all</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" disabled={!thread}>
                  <Forward className="h-4 w-4" />
                  <span className="sr-only">Forward</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Forward</TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="mx-2 h-6" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!thread}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mark as unread</DropdownMenuItem>
              <DropdownMenuItem>Star thread</DropdownMenuItem>
              <DropdownMenuItem>Add label</DropdownMenuItem>
              <DropdownMenuItem>Mute thread</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {thread ? (
          <>
            {/* Enhanced Thread header */}
            <div className="bg-gray-50 p-6">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {thread.messages[0].subject}
              </h1>
              {thread.messages.length > 1 && (
                <div className="mt-1 text-sm text-gray-500">
                  {thread.messages.length} messages in this conversation
                </div>
              )}
            </div>
            <Separator />

            {/* Scrollable thread body */}
            <ScrollArea className="flex-1">
              {thread.messages.map((message: any) => (
                <div key={message.id} className="p-4 border-b">
                  <div className="flex gap-4 mb-4 items-center">
                    <Avatar>
                      <AvatarImage alt={message.name} />
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{message.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(message.date), "PPpp")}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Add attachments display */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                      <div className="space-y-2">
                        {message.attachments.map((attachment: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white p-2 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700">{attachment.filename}</span>
                              <span className="text-xs text-gray-500">
                                ({Math.round(attachment.size / 1024)} KB)
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAttachment(message.id, attachment)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Letter className="bg-white rounded-md text-black" html={message.text ?? ""} />
                </div>
              ))}
            </ScrollArea>

            {/* Fixed reply box at the bottom with improved styling */}
            <div className="border-t bg-white sticky bottom-0">
              <div className="border-t bg-white">
                <form onSubmit={handleSend} className="p-4">
                  <div className="h-fit space-y-4">
                    {/* Editor container with fixed height */}
                    <div className="bg-white rounded-md">
                      {editorLoaded && (
                        <>
                          <ReactQuill
                            theme="snow"
                            value={editorContent}
                            onChange={setEditorContent}
                            placeholder={`Write a reply...`}
                            className="h-fit"
                            modules={{
                              toolbar: [
                                [{ header: [1, 2, false] }],
                                ["bold", "italic", "underline", "strike", "blockquote"],
                                [{ list: "ordered" }, { list: "bullet" }],
                                ["link"],
                                ["clean"],
                              ],
                            }}
                            ref={quillRef} // Moved to the end of the props list
                          />
                          <style jsx global>{`
                            .ql-editor {
                              min-height: 100px;
                            }
                          `}</style>
                        </>
                      )}
                    </div>
                    {/* Attachments section */}
                    {attachments.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-2">Attachments:</h4>
                        <ul className="space-y-2">
                          {attachments.map((file, index) => (
                            <li key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700">{file.name}</span>
                                <span className="text-gray-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAttachment(index)}
                                className="text-red-600 h-6"
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions footer */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="file-upload"
                          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
                        >
                          <Paperclip className="h-4 w-4" />
                          <span className="text-sm">Attach</span>
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      <Label htmlFor="mute" className="flex items-center gap-2 text-sm">
                        <Switch id="mute" aria-label="Mute thread" />
                        Mute thread
                      </Label>
                      {/* AI COMPOSE BUTTON */}

                      <AIComposeButton
                        onGenerate={onGenerate}
                        onClick={() => setContent("")}
                        thread={thread}
                      />

                      <Button type="submit" className="ml-auto rounded-full" disabled={isSending}>
                        {isSending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-muted-foreground">No thread selected</div>
        )}
      </div>
    </div>
  );
}
