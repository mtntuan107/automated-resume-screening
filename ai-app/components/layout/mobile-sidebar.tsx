// components/layout/mobile-sidebar.tsx
"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { sidebarNavItems } from "@/config/menu";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function MobileSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent hover:text-foreground md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetTitle className="mb-4 px-2">Menu Mobile</SheetTitle>
        <div className="flex flex-col space-y-3">
          {sidebarNavItems.map((item) => {
              const isActive = pathname === item.href;
              return(
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)} // Đóng menu khi click
              className={cn(
                "flex items-center rounded-md px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                 isActive ? "bg-accent" : "transparent"
              )}
            >
              {item.title}
            </Link>
          )})}
        </div>
      </SheetContent>
    </Sheet>
  );
}