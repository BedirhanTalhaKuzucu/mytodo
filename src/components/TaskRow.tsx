"use client";

import React from "react";
import {
  Calendar,
  Check,
  CheckSquare,
  FileText,
  Play,
  Repeat,
} from "lucide-react";
import type { Task } from "@/types";
import { formatTurkishDateShort, isOverdue } from "@/lib/utils";
import { PriorityBadge, SpaceBadge } from "./SpaceBadge";

interface TaskRowProps {
  task: Task;
  isSelected?: boolean;
  isFocusedInPomodoro?: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onFocusPomodoro?: (id: string) => void;
  showSpace?: boolean;
  extraActions?: React.ReactNode;
}

export function TaskRow({
  task,
  isSelected = false,
  isFocusedInPomodoro = false,
  onToggle,
  onSelect,
  onFocusPomodoro,
  showSpace = true,
  extraActions,
}: TaskRowProps) {
  const isDone = task.status === "done";
  const completedSubtasks = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const overdue = !isDone && isOverdue(task.dueDate);

  return (
    <div
      onClick={() => onSelect(task.id)}
      className={`group flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer ${
        isSelected
          ? "bg-white border-indigo-300 ring-2 ring-indigo-500/10 shadow-sm"
          : "bg-white border-[#E7E5E4] hover:border-stone-300 hover:shadow-xs"
      } ${isDone ? "opacity-65" : ""}`}
    >
      <button
        type="button"
        aria-label={isDone ? "Görevi tamamlanmadı yap" : "Görevi tamamla"}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          isDone
            ? task.space === "personal"
              ? "bg-[#059669] border-[#059669] text-white"
              : "bg-[#4F46E5] border-[#4F46E5] text-white"
            : "border-stone-300 bg-white hover:border-stone-400"
        }`}
      >
        {isDone && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium leading-snug ${
              isDone ? "line-through text-[#78716C]" : "text-[#1C1917]"
            }`}
          >
            {task.title}
          </p>

          {onFocusPomodoro && !isDone && (
            <button
              type="button"
              title="Bu göreve odaklan (Pomodoro)"
              onClick={(e) => {
                e.stopPropagation();
                onFocusPomodoro(task.id);
              }}
              className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                isFocusedInPomodoro
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : "opacity-0 group-hover:opacity-100 focus:opacity-100 bg-stone-100 hover:bg-amber-50 hover:text-amber-700 text-stone-600"
              }`}
            >
              <Play className="h-3 w-3 fill-current" />
              <span className="hidden sm:inline">
                {isFocusedInPomodoro ? "Odakta" : "Odaklan"}
              </span>
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {showSpace && <SpaceBadge space={task.space} size="xs" />}
          <PriorityBadge priority={task.priority} />

          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                overdue
                  ? "bg-rose-50 text-rose-700 border border-rose-200/70"
                  : "bg-stone-100 text-[#78716C]"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {formatTurkishDateShort(task.dueDate)}
            </span>
          )}

          {task.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-[#78716C]">
              <Repeat className="h-3 w-3" />
              {task.recurrence === "daily"
                ? "Günlük"
                : task.recurrence === "weekly"
                ? "Haftalık"
                : "Aylık"}
            </span>
          )}

          {totalSubtasks > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] font-medium text-[#78716C]">
              <CheckSquare className="h-3 w-3" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {task.linkedNoteIds.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/70 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">
              <FileText className="h-3 w-3" />
              {task.linkedNoteIds.length} not
            </span>
          )}

          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-stone-100/80 px-1.5 py-0.5 text-[11px] text-[#78716C]"
            >
              #{tag}
            </span>
          ))}
        </div>

        {extraActions && (
          <div
            className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-stone-100 pt-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {extraActions}
          </div>
        )}
      </div>
    </div>
  );
}
