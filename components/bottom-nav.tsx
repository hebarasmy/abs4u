"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarRange, Home, PlusCircle, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/upload/exercise", label: "Record", icon: PlusCircle, center: true },
  { href: "/plan", label: "Routines", icon: CalendarRange },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-3xl px-4 pb-4">
      <nav className="mx-auto grid max-w-xl grid-cols-5 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05)),rgba(24,25,30,0.82)] p-2 shadow-card backdrop-blur-xl">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[20px] px-2 py-3 text-[11px] font-medium transition",
                item.center && "-mt-6 accent-border accent-gradient-vertical border text-white shadow-glow",
                active && !item.center ? "accent-gradient" : "text-white/54 hover:bg-white/6 hover:text-white/84",
                active && item.center && "ring-2 ring-white/35",
              )}
            >
              <Icon className={cn("h-4 w-4", item.center && "h-5 w-5")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
