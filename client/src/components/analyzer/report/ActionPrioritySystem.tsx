"use client";

import React from "react";
import type { ActionPriorityItem } from "@/lib/analyzer/types";
import { reportCopy } from "@/lib/analyzer/reportCopy";

function upliftHint(title: string, priority: ActionPriorityItem["priority"]) {
  const base = priority === "high" ? [8, 12] : priority === "medium" ? [4, 7] : [2, 4];
  const t = title.toLowerCase();
  if (t.includes("retention") || t.includes("удерж")) return [Math.max(6, base[0]), Math.max(9, base[1])];
  if (t.includes("runway") || t.includes("запас") || t.includes("продлить")) return [Math.max(5, base[0] - 1), Math.max(8, base[1] - 1)];
  if (t.includes("cac") || t.includes("payback")) return [base[0], base[1]];
  return base;
}

function priorityChip(p: ActionPriorityItem["priority"]) {
  if (p === "high") return "ВЫСОКИЙ";
  if (p === "medium") return "СРЕДНИЙ";
  return "НИЗКИЙ";
}

export function ActionPrioritySystem({ actions }: { actions?: ActionPriorityItem[] }) {
  const list = (actions ?? []).slice(0, 3);
  if (!list.length) return null;

  return (
    <div className="ii-panel ii-panel-action">
      <div className="ii-panelTitle">{reportCopy.actions.title}</div>
      <div className="ii-panelSubtitle">{reportCopy.actions.subtitle}</div>

      <div className="ii-actionList">
        {list.map((a, idx) => {
          const up = upliftHint(a.title, a.priority);
          return (
            <div key={idx} className="ii-actionCard">
              <div className="ii-actionLeft">
                <div className="ii-actionRank">#{idx + 1}</div>
                <div className="ii-actionMeta">
                  <div className="ii-actionTitle">{a.title}</div>
                  <div className="ii-actionReason">{a.reason}</div>
                  <div className="ii-actionChips">
                    <span className={`ii-chip ii-chip-${a.priority}`}>{priorityChip(a.priority)}</span>
                    {a.improves.slice(0, 3).map((x) => (
                      <span key={x} className="ii-chip ii-chip-ghost">
                        {x}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ii-actionRight">
                <div className="ii-actionImpact">+{up[0]}–{up[1]}%</div>
                <div className="ii-actionImpactHint">к вероятности успеха и силе вердикта</div>
                <div className="ii-actionExpected">{a.expectedImpact}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

