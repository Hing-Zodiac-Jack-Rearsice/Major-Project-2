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
      <div className="container flex h-16 items-center">
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <MobileNav setIsOpen={setIsOpen} />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex w-full justify-center">
          <nav className="hidden md:flex md:gap-10">
            <Link href="/" className="flex items-center text-lg font-medium">
              Home
            </Link>

            {/* Logo in the center */}
            <Link href="/" className="flex items-center space-x-2">
              {/* <span className="inline-block font-bold text-xl">LOGO</span> */}
              <img src="/LOGO.png" alt="PHNER Logo" className="w-8 h-8 mr-2" />
            </Link>

            <Link href="/pricing" className="flex items-center text-lg font-medium">
              Pricing
            </Link>
          </nav>

          {/* Mobile logo (centered) */}
          <div className="flex md:hidden w-full justify-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/LOGO.png" alt="PHNER Logo" className="w-8 h-8 mr-2" />

              {/* <span className="inline-block font-bold text-xl">LOGO</span> */}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileNav({ setIsOpen }: { setIsOpen: (open: boolean) => void }) {
  return (
    <div className="flex flex-col gap-4 px-4 pt-8">
      <Link
        href="/"
        className="flex items-center text-lg font-medium"
        onClick={() => setIsOpen(false)}
      >
        Home
      </Link>

      <Link
        href="/pricing"
        className="flex items-center text-lg font-medium"
        onClick={() => setIsOpen(false)}
      >
        Pricing
      </Link>
    </div>
  );
}
