"use client";

import { usePathname } from "next/navigation";
import type React from "react";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { EmailVerifyBanner } from "./EmailVerifyBanner";

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
      {hideHeader ? null : <EmailVerifyBanner />}
      <main className={hideHeader ? "flex-1" : "flex-1 pt-[var(--site-header-height)]"}>{children}</main>
      {hideFooter ? null : <Footer />}
    </div>
  );
}

