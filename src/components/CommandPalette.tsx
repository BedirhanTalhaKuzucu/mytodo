"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  FileText,
  Inbox,
  Plus,
  Search,
  Sun,
  X,
} from "lucide-react";
import type { NavView, Note, SpaceFilter, Task } from "@/types";
import { SpaceBadge } from "./SpaceBadge";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: Note[];
  onNavigate: (view: NavView) => void;
  onChangeSpace: (space: SpaceFilter) => void;
  onSelectTask: (id: string) => void;
  onSelectNote: (id: string) => void;
  onQuickCreateTask: (title: string) => void;
  onQuickCreateNote: (title: string) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  tasks,
  notes,
  onNavigate,
  onChangeSpace,
  onSelectTask,
  onSelectNote,
  onQuickCreateTask,
  onQuickCreateNote,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const matchedTasks = useMemo(() => {
    if (!q) return tasks.slice(0, 4);
    return tasks
      .filter((t) =>
        `${t.title} ${t.notes} ${t.tags.join(" ")}`.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [tasks, q]);

  const matchedNotes = useMemo(() => {
    if (!q) return notes.slice(0, 3);
    return notes
      .filter((n) =>
        `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [notes, q]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-stone-900/35 px-4 pt-16 sm:pt-24 backdrop-blur-[2px]">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Hızlı Komut Penceresi"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-2xl"
      >
        {/* Search Input */}
        <div className="flex items-center gap-2.5 border-b border-[#E7E5E4] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[#78716C]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Görev veya not ara, ya da yeni eklemek için yaz..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[#1C1917] placeholder:text-[#78716C]/70 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#78716C] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
          {/* Quick Create Actions when user types something */}
          {query.trim().length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                Hızlı Oluştur
              </p>
              <button
                type="button"
                onClick={() => {
                  onQuickCreateTask(query.trim());
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[#1C1917] hover:bg-indigo-50/70"
              >
                <Plus className="h-4 w-4 text-[#4F46E5]" />
                <span>
                  Yeni Görev:{" "}
                  <strong className="font-semibold">&ldquo;{query.trim()}&rdquo;</strong>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onQuickCreateNote(query.trim());
                  onClose();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-[#1C1917] hover:bg-emerald-50/70"
              >
                <Plus className="h-4 w-4 text-[#059669]" />
                <span>
                  Yeni Not:{" "}
                  <strong className="font-semibold">&ldquo;{query.trim()}&rdquo;</strong>
                </span>
              </button>
            </div>
          )}

          {/* Navigation Shortcuts */}
          {!q && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                Görünümler & Alanlar
              </p>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("today");
                    onClose();
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#1C1917] hover:bg-stone-100"
                >
                  <Sun className="h-4 w-4 text-[#D97706]" />
                  Bugün
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("inbox");
                    onClose();
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#1C1917] hover:bg-stone-100"
                >
                  <Inbox className="h-4 w-4 text-[#4F46E5]" />
                  Gelen Kutusu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("weekly");
                    onClose();
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#1C1917] hover:bg-stone-100"
                >
                  <CalendarDays className="h-4 w-4 text-[#4F46E5]" />
                  Haftalık Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("notes");
                    onClose();
                  }}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-[#1C1917] hover:bg-stone-100"
                >
                  <FileText className="h-4 w-4 text-[#059669]" />
                  Notlar
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-2 pt-1">
                {(
                  [
                    { value: "all", label: "Alan: Tümü" },
                    { value: "work", label: "Alan: İş" },
                    { value: "personal", label: "Alan: Özel" },
                  ] as { value: SpaceFilter; label: string }[]
                ).map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => {
                      onChangeSpace(s.value);
                      onClose();
                    }}
                    className="rounded-lg border border-[#E7E5E4] bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-medium text-[#78716C] hover:text-[#1C1917]"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {matchedTasks.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                Görevler
              </p>
              {matchedTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onSelectTask(t.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left hover:bg-stone-100"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <CheckSquare
                      className={`h-4 w-4 shrink-0 ${
                        t.status === "done"
                          ? "text-emerald-600"
                          : "text-[#78716C]"
                      }`}
                    />
                    <span
                      className={`truncate text-sm ${
                        t.status === "done"
                          ? "line-through text-[#78716C]"
                          : "text-[#1C1917]"
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <SpaceBadge space={t.space} size="xs" />
                </button>
              ))}
            </div>
          )}

          {/* Notes */}
          {matchedNotes.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                Notlar
              </p>
              {matchedNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelectNote(n.id);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left hover:bg-stone-100"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-[#059669]" />
                    <span className="truncate text-sm text-[#1C1917]">
                      {n.title}
                    </span>
                  </div>
                  <SpaceBadge space={n.space} size="xs" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
