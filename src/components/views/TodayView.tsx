"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Pin,
  Plus,
} from "lucide-react";
import type { Note, SpaceFilter, SpaceType, Task } from "@/types";
import {
  formatTurkishDateLong,
  getGreeting,
  getTodayISO,
  isOverdue,
  isToday,
} from "@/lib/utils";
import { TaskRow } from "@/components/TaskRow";
import { SpaceBadge } from "@/components/SpaceBadge";

interface TodayViewProps {
  tasks: Task[];
  notes: Note[];
  spaceFilter: SpaceFilter;
  selectedId: string | null;
  pomodoroTaskId: string | null;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onSelectNote: (id: string) => void;
  onFocusPomodoro: (id: string) => void;
  onCreateQuickTask: (title: string, space: SpaceType | null, dueDate: string) => void;
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export function TodayView({
  tasks,
  notes,
  spaceFilter,
  selectedId,
  pomodoroTaskId,
  onToggleTask,
  onSelectTask,
  onSelectNote,
  onFocusPomodoro,
  onCreateQuickTask,
}: TodayViewProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const [quickSpace, setQuickSpace] = useState<SpaceType>(
    spaceFilter === "personal" ? "personal" : "work"
  );
  const [showCompleted, setShowCompleted] = useState(false);

  const todayISO = getTodayISO();

  const matchesSpace = (space: SpaceType | null) =>
    spaceFilter === "all" || space === spaceFilter;

  const relevantTasks = tasks.filter((t) => matchesSpace(t.space));

  const overdueTasks = relevantTasks
    .filter((t) => t.status === "todo" && isOverdue(t.dueDate))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const todayTasks = relevantTasks
    .filter((t) => t.status === "todo" && isToday(t.dueDate))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const completedToday = relevantTasks.filter(
    (t) =>
      t.status === "done" &&
      (isToday(t.dueDate) || isOverdue(t.dueDate) || t.updatedAt.startsWith(todayISO))
  );

  const pinnedNotes = notes.filter(
    (n) => n.isPinned && matchesSpace(n.space)
  );

  const totalPending = overdueTasks.length + todayTasks.length;

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const targetSpace =
      spaceFilter === "all" ? quickSpace : spaceFilter;
    onCreateQuickTask(quickTitle, targetSpace, todayISO);
    setQuickTitle("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header & Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#78716C]">
            {formatTurkishDateLong()}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1C1917]">
            {getGreeting()}!{" "}
            <span className="font-normal text-[#78716C] text-lg sm:text-xl">
              {totalPending === 0
                ? "Bugün için tüm görevler tamamlandı."
                : `Bugün ${totalPending} görev seni bekliyor.`}
            </span>
          </h1>
        </div>
      </div>

      {/* Quick Inline Add for Today */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 rounded-xl border border-[#E7E5E4] bg-white p-2 shadow-2xs focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10"
      >
        <Plus className="ml-1.5 h-4 w-4 shrink-0 text-[#78716C]" />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Bugüne hızlı görev ekle..."
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[#1C1917] placeholder:text-[#78716C]/70 focus:outline-none"
        />
        {spaceFilter === "all" && (
          <div className="flex items-center rounded-lg bg-stone-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setQuickSpace("work")}
              className={`rounded-md px-2 py-1 font-medium transition-colors ${
                quickSpace === "work"
                  ? "bg-white text-[#4F46E5] shadow-2xs"
                  : "text-[#78716C]"
              }`}
            >
              İş
            </button>
            <button
              type="button"
              onClick={() => setQuickSpace("personal")}
              className={`rounded-md px-2 py-1 font-medium transition-colors ${
                quickSpace === "personal"
                  ? "bg-white text-[#059669] shadow-2xs"
                  : "text-[#78716C]"
              }`}
            >
              Özel
            </button>
          </div>
        )}
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="rounded-lg bg-[#1C1917] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
        >
          Ekle
        </button>
      </form>

      {/* Pinned Notes Strip */}
      {pinnedNotes.length > 0 && (
        <section aria-label="Sabitlenmiş Notlar" className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
            <Pin className="h-3.5 w-3.5 text-[#D97706]" />
            Sabitlenmiş Notlar
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {pinnedNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border p-3.5 text-left transition-all ${
                  selectedId === note.id
                    ? "border-indigo-300 bg-white ring-2 ring-indigo-500/10 shadow-sm"
                    : "border-[#E7E5E4] bg-white hover:border-stone-300 hover:shadow-xs"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[#1C1917]">
                    {note.title}
                  </span>
                  <SpaceBadge space={note.space} size="xs" />
                </div>
                <p className="line-clamp-2 text-xs text-[#78716C] leading-relaxed">
                  {note.content.replace(/[#*_`>-]/g, "").trim() ||
                    "İçerik yok..."}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Gecikmiş ({overdueTasks.length})
          </div>
          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isSelected={selectedId === task.id}
                isFocusedInPomodoro={pomodoroTaskId === task.id}
                onToggle={onToggleTask}
                onSelect={onSelectTask}
                onFocusPomodoro={onFocusPomodoro}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's Tasks */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
            Bugünün Odakları ({todayTasks.length})
          </h2>
        </div>

        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E7E5E4] bg-white/60 py-10 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500/80" />
            <p className="mt-2 text-sm font-medium text-[#1C1917]">
              Bugün için bekleyen görev yok
            </p>
            <p className="mt-0.5 text-xs text-[#78716C]">
              Yukarıdan yeni bir görev ekleyebilir veya Haftalık Plan&apos;dan görev çekebilirsin.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isSelected={selectedId === task.id}
                isFocusedInPomodoro={pomodoroTaskId === task.id}
                onToggle={onToggleTask}
                onSelect={onSelectTask}
                onFocusPomodoro={onFocusPomodoro}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed Today */}
      {completedToday.length > 0 && (
        <section className="pt-2">
          <button
            type="button"
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78716C] hover:text-[#1C1917]"
          >
            {showCompleted ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            Tamamlananlar ({completedToday.length})
          </button>
          {showCompleted && (
            <div className="mt-2.5 space-y-2">
              {completedToday.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedId === task.id}
                  onToggle={onToggleTask}
                  onSelect={onSelectTask}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
