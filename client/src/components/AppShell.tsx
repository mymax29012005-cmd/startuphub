"use client";

import { usePathname } from "next/navigation";
import type React from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideHeader =
    pathname === "/register" ||
    pathname === "/login" ||
    pathname === "/profile" ||
    pathname === "/chats" ||
    pathname.startsWith("/chat/");
  const hideFooter = pathname === "/chats" || pathname.startsWith("/chat/");

  return (
    <div className="min-h-screen flex flex-col">
      {hideHeader ? null : <Header />}
      <main className="flex-1">{children}</main>
      {hideFooter ? null : <Footer />}
    </div>
  );
}

