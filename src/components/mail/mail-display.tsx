import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
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
import { ScrollArea } from "../ui/scroll-area";
import { processAttachments } from "@/utils/processAttachments";

export function MailDisplay({ thread }: any) {
  const today = new Date();
  const [replyName, setReplyName] = useState("");
  // data for sending mail
  const [editorContent, setEditorContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  // Reset editor content and attachments when thread changes
  useEffect(() => {
    setEditorContent(""); // Reset the editor content
    setAttachments([]); // Clear attachments
    setReplyName(thread ? thread.messages[0].from : "");
  }, [thread]); // Trigger when the `thread` prop changes

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setAttachments((prev) => [...prev, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // const handleSend = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Handle sending the message with editorContent, attachments, to, cc, and subject
  //   console.log("To:", to);
  //   console.log("CC:", cc);
  //   console.log("Subject:", subject);
  //   console.log("Message:", editorContent);
  //   console.log("Attachments:", attachments);
  //   console.log("ThreadID:", thread.id);
  // };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Process attachments if any
      const processedAttachments =
        attachments.length > 0 ? await processAttachments(attachments) : undefined;

      // Prepare the message data
      const messageData = {
        threadId: thread.id,
        content: editorContent,
        attachments: processedAttachments,
      };

      // Send the request to our API endpoint
      const response = await fetch(`/api/mail/reply/${thread.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageData),
      });

      const result = await response.json();

      if (result.success) {
        // Clear the form
        setEditorContent("");
        setAttachments([]);
        // Maybe show a success notification
        console.log("Reply sent successfully:", result.messageId);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
      // Show error notification to user
    }
  };
  return (
    <div className="flex h-screen flex-col">
      {/* Header with actions */}
      {/* <Button onClick={() => console.log(thread.messages[thread.messages.length - 1].id)}>
        LOG last message id 1950e1dc9ca927e9
      </Button> */}

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
                  <Letter className="bg-white rounded-md text-black" html={message.text ?? ""} />
                </div>
              ))}
            </ScrollArea>

            {/* Fixed reply box at the bottom with improved styling */}
            <div className="border-t bg-white sticky bottom-0">
              <div className="border-t bg-white">
                <form onSubmit={handleSend} className="p-4">
                  <div className="h-fit space-y-4">
                    {/* To, CC, and Subject fields */}
                    {/* <div className="space-y-2">
                      <input
                        type="text"
                        placeholder={`To: ${thread.messages[0].replyTo}`}
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Cc"
                        value={cc}
                        onChange={(e) => setCc(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                      <input
                        type="text"
                        placeholder="Subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full p-2 border rounded-md"
                      />
                    </div> */}

                    {/* Editor container with fixed height */}
                    <div className="bg-white rounded-md">
                      <ReactQuill
                        theme="snow"
                        value={editorContent}
                        onChange={setEditorContent}
                        placeholder={`Reply to ${replyName}...`}
                        className="h-fit"
                      />
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

                      <Button type="submit" className="ml-auto">
                        Send
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
