"use client";

import React, { useState } from "react";
import { Pause, Play, RotateCcw, Settings2, Timer, X } from "lucide-react";
import type { PomodoroMode, PomodoroState, Task } from "@/types";
import { formatSeconds } from "@/lib/utils";

interface PomodoroModalProps {
  isOpen: boolean;
  onClose: () => void;
  pomodoro: PomodoroState;
  tasks: Task[];
  onToggleRunning: () => void;
  onReset: () => void;
  onSwitchMode: (mode: PomodoroMode) => void;
  onSetDurations: (focus: number, brk: number) => void;
  onStartTask: (taskId: string) => void;
  onClearTask: () => void;
}

export function PomodoroModal({
  isOpen,
  onClose,
  pomodoro,
  tasks,
  onToggleRunning,
  onReset,
  onSwitchMode,
  onSetDurations,
  onStartTask,
  onClearTask,
}: PomodoroModalProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [focusInput, setFocusInput] = useState(pomodoro.focusMinutes);
  const [breakInput, setBreakInput] = useState(pomodoro.breakMinutes);

  if (!isOpen) return null;

  const activeTask = pomodoro.activeTaskId
    ? tasks.find((t) => t.id === pomodoro.activeTaskId)
    : null;
  const todoTasks = tasks.filter((t) => t.status === "todo");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/35 px-4 backdrop-blur-[2px]">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Pomodoro Odaklanma Zamanlayıcısı"
        className="relative z-10 w-full max-w-sm rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-[#D97706]" />
            <h2 className="text-sm font-semibold text-[#1C1917]">
              Odaklanma Zamanlayıcısı
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setFocusInput(pomodoro.focusMinutes);
                setBreakInput(pomodoro.breakMinutes);
                setShowSettings((v) => !v);
              }}
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100"
              title="Süre Ayarları"
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => onSwitchMode("focus")}
            className={`rounded-lg py-1.5 transition-colors ${
              pomodoro.mode === "focus"
                ? "bg-white text-[#1C1917] shadow-2xs"
                : "text-[#78716C]"
            }`}
          >
            Odak ({pomodoro.focusMinutes} dk)
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode("break")}
            className={`rounded-lg py-1.5 transition-colors ${
              pomodoro.mode === "break"
                ? "bg-white text-[#059669] shadow-2xs"
                : "text-[#78716C]"
            }`}
          >
            Mola ({pomodoro.breakMinutes} dk)
          </button>
        </div>

        {/* Big Clock */}
        <div className="flex flex-col items-center py-2">
          <span className="font-mono text-5xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {formatSeconds(pomodoro.secondsLeft)}
          </span>
          {activeTask && (
            <div className="mt-3 flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs text-amber-900 max-w-full">
              <span className="truncate font-medium">{activeTask.title}</span>
              <button
                type="button"
                onClick={onClearTask}
                className="shrink-0 text-amber-700 hover:text-amber-950"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onToggleRunning}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1C1917] px-6 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            {pomodoro.isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Duraklat
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Başlat
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-[#E7E5E4] bg-white p-2.5 text-[#78716C] hover:bg-stone-50 hover:text-[#1C1917]"
            title="Sıfırla"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Task Association */}
        <div className="border-t border-[#E7E5E4] pt-3">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1.5">
            Göreve Bağla
          </label>
          <select
            value={pomodoro.activeTaskId ?? ""}
            onChange={(e) => {
              if (e.target.value) {
                onStartTask(e.target.value);
              } else {
                onClearTask();
              }
            }}
            className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1917] focus:outline-none"
          >
            <option value="">Görev seçilmedi (serbest odak)</option>
            {todoTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Duration Settings */}
        {showSettings && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSetDurations(focusInput, breakInput);
              setShowSettings(false);
            }}
            className="rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3 space-y-2.5 text-xs"
          >
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#78716C] mb-1">Odak (dk)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={focusInput}
                  onChange={(e) => setFocusInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-[#1C1917]"
                />
              </div>
              <div>
                <label className="block text-[#78716C] mb-1">Mola (dk)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={breakInput}
                  onChange={(e) => setBreakInput(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-[#1C1917]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#1C1917] py-1.5 font-medium text-white hover:bg-stone-800"
            >
              Uygula
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
