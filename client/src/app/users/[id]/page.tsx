"use client";

import React, { use as useReact, useEffect, useState } from "react";

import { PublicUserProfile } from "@/components/profile/PublicUserProfile";

type Me = { id: string };

export default function PublicProfileUsersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = useReact(params);
  const [viewerId, setViewerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const r = await fetch("/api/v1/auth/me", { credentials: "include" });
        if (!r.ok) return;
        const data = (await r.json()) as Me;
        if (!cancelled) setViewerId(data.id);
      } catch {
        // ignore
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return <PublicUserProfile userId={id} viewerId={viewerId} />;
}
