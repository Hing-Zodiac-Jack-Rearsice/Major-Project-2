"use client";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Crown, ChevronRight } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface PromptStatusProps {
  promptsRemaining: number;
  isSubscribed: boolean;
}

const statusVariants = cva(
  "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300 cursor-help",
  {
    variants: {
      variant: {
        free: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        premium:
          "bg-gradient-to-r from-amber-500 to-amber-300 text-black hover:shadow-md hover:from-amber-400 hover:to-amber-200",
      },
    },
    defaultVariants: {
      variant: "free",
    },
  }
);

export default function PromptStatus({ promptsRemaining, isSubscribed }: PromptStatusProps) {
  const maxPrompts = isSubscribed ? 45 : 15;
  const percentRemaining = Math.min(100, (promptsRemaining / maxPrompts) * 100);
  const { data: session } = useSession();
  // Determine color based on remaining prompts
  const getProgressColor = () => {
    if (percentRemaining > 60) return "bg-emerald-500";
    if (percentRemaining > 30) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className={cn(statusVariants({ variant: isSubscribed ? "premium" : "free" }))}>
          {isSubscribed ? (
            <>
              <Crown className="h-3.5 w-3.5" />
              <span>Premium</span>
              <span className="absolute -right-1 -top-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </span>
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" />
              <span>Free</span>
            </>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-0 overflow-hidden shadow-lg border-0 rounded-xl z-50">
        <div className="bg-gradient-to-br from-background to-background/80 backdrop-blur-sm">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-base flex items-center gap-1.5">
                {isSubscribed ? (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Premium Account
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 text-blue-500" />
                    Free Account
                  </>
                )}
              </h4>
              <Badge
                variant={isSubscribed ? "default" : "outline"}
                className={
                  isSubscribed ? "bg-amber-500/20 text-amber-600 hover:bg-amber-500/20" : ""
                }
              >
                {isSubscribed ? "Active" : "Limited"}
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Prompts Remaining</p>
                <p className="text-sm font-semibold">
                  {promptsRemaining} / {maxPrompts}
                </p>
              </div>
              <div className="h-2.5 w-full rounded-full bg-secondary/50 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                  style={{
                    width: `${percentRemaining}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {isSubscribed
                  ? "Resets at the end of each day"
                  : "Upgrade to Premium for more prompts"}
              </p>
            </div>
          </div>

          {!isSubscribed && (
            <div className="border-t bg-muted/30 p-3">
              <a
                href={`https://buy.stripe.com/test_dR63fxg1117ObbGcMM?prefilled_email=${session?.user?.email}`}
              >
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black"
                >
                  Upgrade to Premium
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
