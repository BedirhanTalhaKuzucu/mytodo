"use client";

import React from "react";
import { Pause, Play, Search, Timer } from "lucide-react";
import type { PomodoroState, SpaceFilter } from "@/types";
import { formatSeconds } from "@/lib/utils";

interface TopBarProps {
  spaceFilter: SpaceFilter;
  hideSpaceFilter?: boolean;
  onChangeSpace: (space: SpaceFilter) => void;
  onOpenCommandPalette: () => void;
  pomodoro: PomodoroState;
  isPomodoroActive: boolean;
  onTogglePomodoroRunning: () => void;
  onOpenPomodoroModal: () => void;
}

const SPACE_OPTIONS: { value: SpaceFilter; label: string; dotColor?: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "work", label: "İş", dotColor: "bg-[#4F46E5]" },
  { value: "personal", label: "Özel", dotColor: "bg-[#059669]" },
];

export function TopBar({
  spaceFilter,
  hideSpaceFilter = false,
  onChangeSpace,
  onOpenCommandPalette,
  pomodoro,
  isPomodoroActive,
  onTogglePomodoroRunning,
  onOpenPomodoroModal,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-[#E7E5E4] bg-[#FAF9F6]/90 px-3 sm:px-5 backdrop-blur-md">
      {/* Left: Brand (visible on mobile, subtle on desktop) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white border border-[#E7E5E4] shadow-2xs">
          <div className="flex items-center gap-0.5">
            <span className="h-3.5 w-1.5 rounded-full bg-[#4F46E5]" />
            <span className="h-3.5 w-1.5 rounded-full bg-[#059669]" />
          </div>
        </div>
        <span className="hidden sm:inline font-semibold tracking-tight text-[#1C1917]">
          {hideSpaceFilter ? "Denge Bütçe" : "Denge"}
        </span>
      </div>

      {/* Center: Segmented Space Control */}
      {!hideSpaceFilter ? (
        <div
          role="tablist"
          aria-label="Alan Filtresi"
          className="flex items-center rounded-xl border border-[#E7E5E4] bg-stone-100/80 p-1"
        >
          {SPACE_OPTIONS.map((opt) => {
            const active = spaceFilter === opt.value;
            return (
              <button
                key={opt.value}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onChangeSpace(opt.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs sm:text-sm font-medium transition-all ${
                  active
                    ? "bg-white text-[#1C1917] shadow-xs"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                {opt.dotColor && (
                  <span className={`h-2 w-2 rounded-full ${opt.dotColor}`} />
                )}
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div />
      )}

      {/* Right: Mini Pomodoro + Ctrl+K Trigger */}
      <div className="flex items-center gap-2">
        {isPomodoroActive ? (
          <div className="flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50/90 px-2 py-1 text-xs font-medium text-amber-900 shadow-2xs">
            <button
              type="button"
              onClick={onOpenPomodoroModal}
              className="flex items-center gap-1.5 hover:opacity-80"
              title="Pomodoro Detayları"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  pomodoro.isRunning
                    ? "bg-amber-500 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span className="font-mono tabular-nums">
                {formatSeconds(pomodoro.secondsLeft)}
              </span>
            </button>
            <button
              type="button"
              onClick={onTogglePomodoroRunning}
              aria-label={pomodoro.isRunning ? "Duraklat" : "Başlat"}
              className="ml-0.5 rounded-md p-0.5 hover:bg-amber-200/60"
            >
              {pomodoro.isRunning ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenPomodoroModal}
            title="Pomodoro Zamanlayıcı"
            className="flex h-8 w-8 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-xl border border-[#E7E5E4] bg-white text-xs font-medium text-[#78716C] hover:text-[#1C1917] hover:border-stone-300 transition-colors"
          >
            <Timer className="h-4 w-4" />
            <span className="hidden lg:inline">Odak</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex h-8 items-center gap-2 rounded-xl border border-[#E7E5E4] bg-white px-2.5 text-xs text-[#78716C] hover:border-stone-300 hover:text-[#1C1917] transition-colors shadow-2xs"
          title="Hızlı Komut & Arama (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Ara veya ekle...</span>
          <kbd className="hidden md:inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-stone-500 border border-stone-200">
            Ctrl K
          </kbd>
        </button>
      </div>
    </header>
  );
}
