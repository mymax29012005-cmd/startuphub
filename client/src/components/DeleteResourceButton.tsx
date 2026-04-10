"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

export function DeleteResourceButton({
  apiUrl,
  onDeleted,
  className,
}: {
  apiUrl: string;
  onDeleted: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      className={className ?? "h-9 px-3 text-sm text-[rgba(255,120,120,0.95)] hover:text-white hover:bg-[rgba(255,80,80,0.15)] border border-[rgba(255,120,120,0.35)]"}
      disabled={loading}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(t("pages.deleteConfirm"))) return;
        setLoading(true);
        try {
          const r = await fetch(apiUrl, { method: "DELETE", credentials: "include" });
          if (r.ok) onDeleted();
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "…" : t("pages.delete")}
    </Button>
  );
}
