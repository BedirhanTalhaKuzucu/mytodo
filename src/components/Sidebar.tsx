"use client";

import React from "react";
import {
  CalendarDays,
  FileText,
  Inbox,
  Plus,
  Sun,
  Timer,
  Wallet,
} from "lucide-react";
import type { NavView, PomodoroState } from "@/types";
import { formatSeconds } from "@/lib/utils";

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  counts: {
    today: number;
    inbox: number;
    weekly: number;
    notes: number;
  };
  onQuickAddTask: () => void;
  onQuickAddNote: () => void;
  pomodoro: PomodoroState;
  onOpenPomodoroModal: () => void;
  onOpenBudgetApp: () => void;
}

const NAV_ITEMS: {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "today", label: "Bugün", icon: Sun },
  { id: "inbox", label: "Gelen Kutusu", icon: Inbox },
  { id: "weekly", label: "Haftalık Plan", icon: CalendarDays },
  { id: "notes", label: "Notlar", icon: FileText },
];

export function Sidebar({
  activeView,
  onSelectView,
  counts,
  onQuickAddTask,
  onQuickAddNote,
  pomodoro,
  onOpenPomodoroModal,
  onOpenBudgetApp,
}: SidebarProps) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-[#E7E5E4] bg-[#FAF9F6] p-3.5">
      <div className="space-y-5">
        {/* Quick Create Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onQuickAddTask}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1C1917] px-3 py-2 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Görev
          </button>
          <button
            type="button"
            onClick={onQuickAddNote}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917] hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Not
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1" aria-label="Ana Menü">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            const count = counts[item.id] ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-[#1C1917] shadow-xs border border-[#E7E5E4]"
                    : "text-[#78716C] hover:bg-stone-200/50 hover:text-[#1C1917] border border-transparent"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      active ? "text-[#4F46E5]" : "text-[#78716C]"
                    }`}
                  />
                  {item.label}
                </span>
                {count > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      active
                        ? "bg-stone-100 text-[#1C1917]"
                        : "bg-stone-200/70 text-[#78716C]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pomodoro + Budget App Switcher */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onOpenPomodoroModal}
          className="flex w-full items-center justify-between rounded-xl border border-[#E7E5E4] bg-white p-3 text-left hover:border-stone-300 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                pomodoro.isRunning
                  ? "bg-amber-100 text-amber-700"
                  : "bg-stone-100 text-[#78716C]"
              }`}
            >
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#1C1917]">
                {pomodoro.mode === "focus" ? "Odaklanma" : "Mola"}
              </p>
              <p className="text-[11px] text-[#78716C]">
                {pomodoro.isRunning ? "Çalışıyor" : "Hazır"}
              </p>
            </div>
          </div>
          <span className="font-mono text-sm font-semibold text-[#1C1917] tabular-nums">
            {formatSeconds(pomodoro.secondsLeft)}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBudgetApp}
          className="flex w-full items-center justify-between rounded-xl border border-indigo-200/80 bg-indigo-50/60 px-3 py-2.5 text-left hover:bg-indigo-100/70 transition-colors"
        >
          <span className="flex items-center gap-2.5 text-xs font-semibold text-indigo-900">
            <Wallet className="h-4 w-4 text-[#4F46E5]" />
            Bütçe Uygulaması
          </span>
          <span className="text-[11px] font-medium text-[#4F46E5]">Aç →</span>
        </button>
      </div>
    </aside>
  );
}
