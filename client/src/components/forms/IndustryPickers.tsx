"use client";

import React from "react";

import { addListingFieldClass } from "@/components/forms/addListingFormShell";
import { INDUSTRY_CATEGORIES_BY_SECTOR, INDUSTRY_SECTORS, type SectorId, isSectorId } from "@/lib/industryHierarchy";

type Props = {
  sector: string;
  subcategoryId: string;
  onChange: (next: { sector: SectorId; subcategoryId: string }) => void;
  className?: string;
};

export function IndustryPickers({ sector, subcategoryId, onChange, className }: Props) {
  const fieldClass = addListingFieldClass;
  const sec: SectorId = isSectorId(sector) ? sector : INDUSTRY_SECTORS[0]!.id;
  const cats = INDUSTRY_CATEGORIES_BY_SECTOR[sec];
  const safeSub = cats.some((c) => c.id === subcategoryId) ? subcategoryId : cats[0]!.id;

  return (
    <div className={className ?? "grid gap-8 md:grid-cols-2"}>
      <label>
        <div className="mb-2 block text-sm text-gray-400">
          Отрасль <span className="text-red-500">*</span>
        </div>
        <select
          className={fieldClass}
          value={sec}
          onChange={(e) => {
            const nextS = e.target.value as SectorId;
            const first = INDUSTRY_CATEGORIES_BY_SECTOR[nextS][0]?.id ?? "other_it";
            onChange({ sector: nextS, subcategoryId: first });
          }}
        >
          {INDUSTRY_SECTORS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <div className="mb-2 block text-sm text-gray-400">
          Категория отрасли <span className="text-red-500">*</span>
        </div>
        <select
          className={fieldClass}
          value={safeSub}
          onChange={(e) => onChange({ sector: sec, subcategoryId: e.target.value })}
        >
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
