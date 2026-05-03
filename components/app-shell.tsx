import { ReactNode } from "react";

import { BottomNav } from "@/components/bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-28 pt-6 sm:px-6">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
