"use client";

import React, { createContext, useContext } from "react";

import { useSessionAndUnread } from "@/hooks/useSessionAndUnread";

type SessionValue = ReturnType<typeof useSessionAndUnread>;

const SessionCtx = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionAndUnread();
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSiteSession(): SessionValue {
  const v = useContext(SessionCtx);
  if (!v) {
    throw new Error("useSiteSession must be used within SessionProvider");
  }
  return v;
}
