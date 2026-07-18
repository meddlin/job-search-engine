"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  TableProperties,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/kanban",
    label: "Jobs",
    icon: BriefcaseBusiness,
  },
  {
    href: "/people",
    label: "People",
    icon: Users,
  },
  {
    href: "/data",
    label: "Data",
    icon: TableProperties,
  },
];

export default function TopNavigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 text-foreground backdrop-blur">
      <div className="mx-auto flex w-[90%] flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="size-4" aria-hidden="true" />
          </span>
          Job Search
        </Link>

        <nav aria-label="Primary navigation" className="min-w-0">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Button
                  key={item.href}
                  asChild
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "justify-start",
                    !isActive && "text-muted-foreground",
                  )}
                >
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon data-icon="inline-start" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
