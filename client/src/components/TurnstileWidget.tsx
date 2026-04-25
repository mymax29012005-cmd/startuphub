"use client";

import React, { useEffect, useRef } from "react";

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
  const containerIdRef = useRef<string | null>(null);
  if (!containerIdRef.current) {
    // stable id across rerenders; avoid widget remount "blinking"
    containerIdRef.current = `ts-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
  }
  const id = containerIdRef.current;
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

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
          if (typeof token === "string" && token.length > 5) onTokenRef.current(token);
        },
        "expired-callback": () => onTokenRef.current(""),
        "error-callback": () => onTokenRef.current(""),
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
  }, [id, siteKey]);

  return <div id={id} className={className} />;
}

