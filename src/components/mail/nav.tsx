import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import React from "react";

interface NavProps {
  isCollapsed: boolean;
  sendSelected: (text: string) => void;
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    variant: "default" | "ghost";
  }[];
}

export function Nav({
  links,
  isCollapsed,
  sendSelected,
  selectedItem,
}: NavProps & { selectedItem: string }) {
  // Change the initial state from "inbox" to "All"
  const [selected, setSelected] = React.useState("All");

  // Call sendSelected with "All" when component mounts
  React.useEffect(() => {
    sendSelected(selected);
  }, []);

  const handleClick = (text: string) => {
    setSelected(text);
    // send selected text back to the parent
    sendSelected(text);
    // console.log("child: " + text);
  };

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) => {
          const itemKey = `${link.title}-${index}`;
          // Determine variant based on selected state
          const variant = selectedItem === link.title ? "default" : "ghost";

          return isCollapsed ? (
            <Tooltip key={itemKey} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href="#"
                  onClick={() => {
                    handleClick(link.title);
                  }}
                  className={cn(
                    buttonVariants({ variant, size: "icon" }),
                    "h-9 w-9",
                    variant === "default" &&
                      "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && <span className="ml-auto text-muted-foreground">{link.label}</span>}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={itemKey}
              href="#"
              onClick={() => {
                handleClick(link.title);
              }}
              className={cn(
                buttonVariants({ variant, size: "sm" }),
                variant === "default" &&
                  "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white",
                "justify-start"
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.title}
              {link.label && (
                <span
                  className={cn(
                    "ml-auto",
                    variant === "default" && "text-background dark:text-white"
                  )}
                >
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Nav;
