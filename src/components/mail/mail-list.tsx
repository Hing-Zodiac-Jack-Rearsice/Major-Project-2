"use client";
import { ComponentProps, useEffect, useState, useRef } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Mail } from "./data";
import { Button } from "../ui/button";

interface MailListProps {
  onMailSelect: (mail: Mail) => void;
  selected: string;
}

export function MailList({ onMailSelect, selected }: MailListProps) {
  const [mails, setMails] = useState<Mail[]>([]);
  const [lastToken, setLastToken] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const observerTarget = useRef(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchMail = async () => {
    try {
      setLoading(true);
      setInitialLoading(true);
      setMails([]); // Clear existing mails while loading new category
      const res = await fetch(`/api/mail?category=${category}`);
      const data = await res.json();
      setMails(data.messages);
      setLastToken(data.nextPageToken);
      // Select the first mail automatically if there are any messages
      if (data.messages && data.messages.length > 0) {
        onMailSelect(data.messages[0]);
      }
    } catch (error) {
      console.error("Error fetching initial emails:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const fetchMore = async () => {
    if (!lastToken || loading) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/mail?category=${category}&pageToken=${lastToken}`);
      const data = await res.json();
      setMails((previousMail) => [...previousMail, ...data.messages]);
      setLastToken(data.nextPageToken);
    } catch (error) {
      console.error("Error fetching more emails:", error);
    } finally {
      setLoading(false);
    }
  };

  // Update category when selected prop changes
  useEffect(() => {
    setCategory(selected.toLowerCase());
  }, [selected]);

  // Fetch emails and reset scroll when category changes
  useEffect(() => {
    fetchMail();
    // Reset scroll position
    if (scrollAreaRef.current) {
      const scrollableNode = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollableNode) {
        scrollableNode.scrollTop = 0;
      }
    }
  }, [category]);

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

  // Show loading spinner during initial load or category change
  if (initialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-8.5rem)]">
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="flex flex-col gap-2 p-4 pt-0">
          {mails.map((mail) => (
            <button
              key={mail.id}
              onClick={() => onMailSelect(mail)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent"
              )}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{mail.name}</div>
                    {!mail.read && <span className="flex h-2 w-2 rounded-full bg-blue-600" />}
                  </div>
                  <div className="ml-auto text-xs">
                    {formatDistanceToNow(new Date(mail.date), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-xs font-medium">{mail.subject}</div>
              </div>
              {mail.labels?.length ? (
                <div className="flex items-center gap-2">
                  {mail.labels.map((label) => (
                    <Badge key={label} variant={getBadgeVariantFromLabel(label)}>
                      {/* to remove the first word from the label EX: CATEGORY_UPDATES => updates */}
                      {label.split("_")[label.split("_").length - 1]}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
          <div ref={observerTarget} className="flex justify-center py-4">
            {loading && <Loader2 className="animate-spin" />}
          </div>
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
