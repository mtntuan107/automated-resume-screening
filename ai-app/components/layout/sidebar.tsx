"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { sidebarNavItems } from "@/config/menu";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen border-r pt-16 md:block w-72 bg-background sticky top-0 overflow-y-auto overflow-x-hidden scrollbar-hide">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <nav className="grid items-start gap-2">
              {sidebarNavItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={index}
                    href={item.href}
                  >
                    <span
                      className={cn(
                        buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                        "justify-start w-full truncate",
                        isActive ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline",
                      )}
                    >
                      {item.title}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}