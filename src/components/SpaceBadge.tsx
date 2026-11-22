import React from "react";
import type { SpaceType, TaskPriority } from "@/types";

export function SpaceBadge({
  space,
  size = "sm",
}: {
  space: SpaceType | null;
  size?: "xs" | "sm";
}) {
  const padding = size === "xs" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs";

  if (space === "work") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/70 ${padding}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#4F46E5]" />
        İş
      </span>
    );
  }

  if (space === "personal") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 ${padding}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
        Özel
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium bg-stone-100 text-stone-600 border border-stone-200 ${padding}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
      Gelen
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  if (priority === "high") {
    return (
      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
        Yüksek
      </span>
    );
  }
  if (priority === "medium") {
    return (
      <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80">
        Orta
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
      Düşük
    </span>
  );
}
