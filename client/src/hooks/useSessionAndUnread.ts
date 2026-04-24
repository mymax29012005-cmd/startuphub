"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  role: "user" | "admin";
  accountType: "founder" | "investor" | "partner" | "buyer";
  name: string;
  email?: string | null;
  emailVerifiedAt?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export function useSessionAndUnread() {
  const pathname = usePathname() ?? "";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      if (!cancelled) setLoading(true);
      try {
        const r = await fetch("/api/v1/auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
        if (!r.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = (await r.json()) as AuthUser;
        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    async function loadUnread() {
      try {
        const r = await fetch("/api/v1/chats/unread-count", {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-store" },
        });
        if (!r.ok) {
          if (!cancelled) setUnreadChats(0);
          return;
        }
        const data = (await r.json()) as { total: number };
        if (!cancelled) setUnreadChats(Number(data.total) || 0);
      } catch {
        if (!cancelled) setUnreadChats(0);
      }
    }

    if (!user) {
      setUnreadChats(0);
      return;
    }

    void loadUnread();
    const tmr = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      void loadUnread();
    }, 60000);
    return () => {
      cancelled = true;
      window.clearInterval(tmr);
    };
  }, [user?.id, pathname]);

  return { user, loading, unreadChats };
}
