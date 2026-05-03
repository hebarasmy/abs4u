import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";
import { appTitle } from "@/lib/server-data";

import "./globals.css";

export const metadata: Metadata = {
  title: appTitle,
  description: "Local-first fitness planning, logging, and community app MVP.",
  appleWebApp: {
    capable: true,
    title: appTitle,
    statusBarStyle: "black-translucent",
  },
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  const theme = user?.ui_theme ?? "red";

  return (
    <html lang="en">
      <body data-theme={theme}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
