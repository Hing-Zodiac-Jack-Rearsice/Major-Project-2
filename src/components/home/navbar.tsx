"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathName = usePathname();
  if (pathName == "/mail") {
    return null;
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full h-16 items-center justify-center">
        <Link href="/mail">Mail</Link>
        <Link href="/">
          <img src="/logo.png" className="w-8 h-8 mx-10" />
        </Link>
        <Link href="/pricing">Pricing</Link>
      </div>
    </header>
  );
}
