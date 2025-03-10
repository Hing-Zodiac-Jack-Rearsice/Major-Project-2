"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { signOut, useSession } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

interface AccountSwitcherProps {
  isCollapsed: boolean;
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
}

export function AccountSwitcher({ isCollapsed, accounts }: AccountSwitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<string>(accounts[0].email);
  const { data: session } = useSession();
  return (
    <Select defaultValue={selectedAccount} onValueChange={setSelectedAccount}>
      <SelectTrigger
        className={cn(
          "flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          isCollapsed &&
            "flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden"
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          <FcGoogle className="w-5 h-5" />
          <span className={cn("ml-2", isCollapsed && "hidden")}>{session?.user.name}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* {accounts.map((account) => (
          <SelectItem key={account.email} value={account.email}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {account.email}
            </div>
          </SelectItem>
        ))} */}
        <Button variant="ghost" className="w-full" onClick={() => signOut({ callbackUrl: "/" })}>
          Sign out
        </Button>
      </SelectContent>
    </Select>
  );
}
