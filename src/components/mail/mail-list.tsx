"use client";
import { ComponentProps, useEffect, useState, useRef, useCallback } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { Mail } from "./data";
import { Input } from "../ui/input";

interface Thread {
  id: string;
  messages: Mail[];
  unreadCount: number;
  lastMessage: Mail;
}

interface MailListProps {
  onThreadSelect: (thread: Thread) => void;
  selected: string;
  searchQuery?: string;
}

export function MailList({ onThreadSelect, selected }: MailListProps) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [lastToken, setLastToken] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const observerTarget = useRef(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [query, setQuery] = useState("");
  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      setThreads([]); // Clear existing threads while loading new category
      const res = await fetch(`/api/mail?category=${category}&search=${searchQuery}`);
      const data = await res.json();

      // Process threads to include unread count and last message
      const processedThreads = data.threads.map((thread: Thread) => ({
        ...thread,
        unreadCount: thread.messages.filter((msg) => !msg.read).length,
        lastMessage: thread.messages[thread.messages.length - 1],
      }));

      setThreads(processedThreads);
      setLastToken(data.nextPageToken);

      // Select the first thread automatically if there are any threads
      if (processedThreads.length > 0) {
        onThreadSelect(processedThreads[0]);
      }
    } catch (error) {
      console.error("Error fetching initial threads:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [category, searchQuery, onThreadSelect]);

  const fetchMore = async () => {
    if (!lastToken || loading) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/mail?category=${category}&pageToken=${lastToken}&search=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();

      // Process new threads
      const processedThreads = data.threads.map((thread: Thread) => ({
        ...thread,
        unreadCount: thread.messages.filter((msg) => !msg.read).length,
        lastMessage: thread.messages[thread.messages.length - 1],
      }));

      setThreads((prev) => [...prev, ...processedThreads]);
      setLastToken(data.nextPageToken);
    } catch (error) {
      console.error("Error fetching more threads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update category when selected prop changes
  useEffect(() => {
    setCategory(selected.toLowerCase());
  }, [selected]);

  // Fetch threads and reset scroll when category or search query changes
  useEffect(() => {
    fetchThreads();
    // Reset scroll position
    if (scrollAreaRef.current) {
      const scrollableNode = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollableNode) {
        scrollableNode.scrollTop = 0;
      }
    }
  }, [category, searchQuery, fetchThreads]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && lastToken) {
          fetchMore();
        }
      },
      {
        threshold: 0.1,
        root: null,
        rootMargin: "100px",
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [lastToken, loading]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(query);
    }, 700);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div className="relative flex flex-col h-screen">
      <div className="relative px-4 my-4">
        <Input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {initialLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => onThreadSelect(thread)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
                  )}
                >
                  <div className="flex w-full flex-col gap-1">
                    <div className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{thread.lastMessage.name}</div>
                      </div>
                      <div className="ml-auto text-xs">
                        {formatDistanceToNow(new Date(thread.lastMessage.date), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                    <div className="text-xs font-medium">{thread.lastMessage.subject}</div>
                    {thread.messages.length > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {thread.messages.length} messages
                      </div>
                    )}
                  </div>
                  {thread.lastMessage.labels?.length ? (
                    <div className="flex items-center gap-2">
                      {thread.lastMessage.labels
                        .filter((label) => label !== "UNREAD") // Exclude "unread"
                        .map((label) => (
                          <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                            {label.split("_").pop()} {/* Get last part after "_" */}
                          </Badge>
                        ))}
                    </div>
                  ) : null}
                </button>
              ))}
              <div ref={observerTarget} className="flex justify-center py-10">
                {loading && <Loader2 className="animate-spin" />}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function getBadgeVariantFromLabel(label: string): ComponentProps<typeof Badge>["variant"] {
  if (["work"].includes(label.toLowerCase())) {
    return "default";
  }

  if (["personal"].includes(label.toLowerCase())) {
    return "outline";
  }

  return "secondary";
}
