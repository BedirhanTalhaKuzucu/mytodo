"use client";

import React, { useState } from "react";
import { Briefcase, CalendarCheck, FileText, Heart, Inbox, Plus } from "lucide-react";
import type { Note, SpaceFilter, SpaceType, Task } from "@/types";
import { getTodayISO } from "@/lib/utils";
import { TaskRow } from "@/components/TaskRow";
import { SpaceBadge } from "@/components/SpaceBadge";

interface InboxViewProps {
  tasks: Task[];
  notes: Note[];
  spaceFilter: SpaceFilter;
  selectedId: string | null;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onSelectNote: (id: string) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onCreateInboxTask: (title: string) => void;
}

export function InboxView({
  tasks,
  notes,
  spaceFilter,
  selectedId,
  onToggleTask,
  onSelectTask,
  onSelectNote,
  onUpdateTask,
  onUpdateNote,
  onCreateInboxTask,
}: InboxViewProps) {
  const [quickTitle, setQuickTitle] = useState("");
  const todayISO = getTodayISO();

  // Inbox tasks: unassigned space OR unassigned dueDate (active todo)
  const inboxTasks = tasks.filter((t) => {
    if (t.status === "done") return false;
    const isUnassigned = t.space === null || t.dueDate === null;
    if (!isUnassigned) return false;
    if (spaceFilter === "all") return true;
    return t.space === spaceFilter || t.space === null;
  });

  // Inbox notes: unassigned space
  const inboxNotes = notes.filter((n) => n.space === null);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onCreateInboxTask(quickTitle);
    setQuickTitle("");
  };

  const moveTaskToSpace = (id: string, space: SpaceType) => {
    onUpdateTask(id, { space });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-[#4F46E5]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
            Gelen Kutusu
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#78716C]">
          Henüz alanı (İş/Özel) veya tarihi atanmamış hızlı kayıtlar. Tek tıkla organize et.
        </p>
      </div>

      {/* Quick Capture */}
      <form
        onSubmit={handleQuickAdd}
        className="flex items-center gap-2 rounded-xl border border-[#E7E5E4] bg-white p-2 shadow-2xs focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10"
      >
        <Plus className="ml-1.5 h-4 w-4 shrink-0 text-[#78716C]" />
        <input
          type="text"
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Aklına geleni hemen Gelen Kutusu'na yakala..."
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[#1C1917] placeholder:text-[#78716C]/70 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!quickTitle.trim()}
          className="rounded-lg bg-[#1C1917] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
        >
          Yakala
        </button>
      </form>

      {/* Inbox Tasks */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
          Düzenlenecek Görevler ({inboxTasks.length})
        </h2>

        {inboxTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E7E5E4] bg-white/60 py-10 text-center">
            <p className="text-sm font-medium text-[#1C1917]">
              Gelen Kutusu tertemiz!
            </p>
            <p className="mt-1 text-xs text-[#78716C]">
              Tarihsiz veya alansız görev kalmadı.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {inboxTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                isSelected={selectedId === task.id}
                onToggle={onToggleTask}
                onSelect={onSelectTask}
                extraActions={
                  <>
                    {task.space !== "work" && (
                      <button
                        type="button"
                        onClick={() => moveTaskToSpace(task.id, "work")}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        <Briefcase className="h-3 w-3" />
                        İş&apos;e Taşı
                      </button>
                    )}
                    {task.space !== "personal" && (
                      <button
                        type="button"
                        onClick={() => moveTaskToSpace(task.id, "personal")}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        <Heart className="h-3 w-3" />
                        Özel&apos;e Taşı
                      </button>
                    )}
                    {task.dueDate !== todayISO && (
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTask(task.id, { dueDate: todayISO })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                      >
                        <CalendarCheck className="h-3 w-3" />
                        Bugüne Al
                      </button>
                    )}
                  </>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Inbox Notes */}
      {inboxNotes.length > 0 && (
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
            Alansız Notlar ({inboxNotes.length})
          </h2>
          <div className="space-y-2.5">
            {inboxNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                  selectedId === note.id
                    ? "border-indigo-300 bg-white ring-2 ring-indigo-500/10 shadow-sm"
                    : "border-[#E7E5E4] bg-white hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-[#78716C]" />
                    <span className="truncate text-sm font-medium text-[#1C1917]">
                      {note.title}
                    </span>
                  </div>
                  <SpaceBadge space={note.space} size="xs" />
                </div>
                <div
                  className="mt-2.5 flex flex-wrap gap-1.5 border-t border-stone-100 pt-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => onUpdateNote(note.id, { space: "work" })}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                  >
                    <Briefcase className="h-3 w-3" />
                    İş&apos;e Taşı
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateNote(note.id, { space: "personal" })}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <Heart className="h-3 w-3" />
                    Özel&apos;e Taşı
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
