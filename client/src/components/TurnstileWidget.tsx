"use client";

import React, { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptPromise: Promise<void> | null = null;
function ensureScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") return resolve();
    const existing = document.querySelector('script[data-turnstile="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script")));
      if ((window as any).turnstile) resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function TurnstileWidget({
  siteKey,
  onToken,
  className,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  className?: string;
}) {
  const id = useId();
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      await ensureScript();
      if (cancelled) return;
      if (!window.turnstile) return;

      const el = document.getElementById(id);
      if (!el) return;

      widgetIdRef.current = window.turnstile.render(el, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token: unknown) => {
          if (typeof token === "string" && token.length > 5) onToken(token);
        },
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    }

    void mount();
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
      }
    };
  }, [id, onToken, siteKey]);

  return <div id={id} className={className} />;
}

