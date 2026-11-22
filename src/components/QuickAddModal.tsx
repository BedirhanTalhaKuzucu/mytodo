"use client";

import React, { useState } from "react";
import { CheckSquare, FileText, X } from "lucide-react";
import type { SpaceType, TaskPriority } from "@/types";
import { getTodayISO, getTomorrowISO } from "@/lib/utils";

interface QuickAddModalProps {
  isOpen: boolean;
  initialMode?: "task" | "note";
  initialTitle?: string;
  initialBody?: string;
  defaultSpace: SpaceType | null;
  onClose: () => void;
  onCreateTask: (data: {
    title: string;
    notes?: string;
    space: SpaceType | null;
    dueDate: string | null;
    priority: TaskPriority;
  }) => void;
  onCreateNote: (data: {
    title: string;
    content: string;
    space: SpaceType | null;
  }) => void;
}

export function QuickAddModal({
  isOpen,
  initialMode = "task",
  initialTitle = "",
  initialBody = "",
  defaultSpace,
  onClose,
  onCreateTask,
  onCreateNote,
}: QuickAddModalProps) {
  const [mode, setMode] = useState<"task" | "note">(initialMode);
  const [title, setTitle] = useState(initialTitle);
  const [noteContent, setNoteContent] = useState(initialBody);
  const [space, setSpace] = useState<SpaceType | null>(defaultSpace);
  const [dueDate, setDueDate] = useState<string | null>(getTodayISO());
  const [priority, setPriority] = useState<TaskPriority>("medium");

  if (!isOpen) return null;

  const todayISO = getTodayISO();
  const tomorrowISO = getTomorrowISO();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (mode === "task") {
      onCreateTask({
        title: title.trim(),
        notes: noteContent.trim() || undefined,
        space,
        dueDate,
        priority,
      });
    } else {
      onCreateNote({
        title: title.trim(),
        content: noteContent,
        space,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/35 sm:px-4 backdrop-blur-[2px]">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-2xl space-y-4 pb-safe"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center rounded-xl bg-stone-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("task")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                mode === "task"
                  ? "bg-white text-[#1C1917] shadow-2xs"
                  : "text-[#78716C]"
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5 text-[#4F46E5]" />
              Görev
            </button>
            <button
              type="button"
              onClick={() => setMode("note")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                mode === "note"
                  ? "bg-white text-[#1C1917] shadow-2xs"
                  : "text-[#78716C]"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-[#059669]" />
              Not
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          type="text"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            mode === "task" ? "Ne yapılması gerekiyor?" : "Not başlığı..."
          }
          className="w-full text-base font-semibold text-[#1C1917] placeholder:text-[#78716C]/70 focus:outline-none"
        />

        <textarea
          rows={mode === "note" ? 4 : 2}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder={
            mode === "note"
              ? "Not içeriğini yaz (Markdown destekli)..."
              : "Açıklama veya paylaşılan detay (isteğe bağlı)..."
          }
          className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3 text-sm text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
        />

        {/* Space Selector */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[#78716C] mr-1">Alan:</span>
          {(
            [
              { value: null, label: "Gelen Kutusu" },
              { value: "work", label: "İş" },
              { value: "personal", label: "Özel" },
            ] as { value: SpaceType | null; label: string }[]
          ).map((s) => (
            <button
              key={String(s.value)}
              type="button"
              onClick={() => setSpace(s.value)}
              className={`rounded-lg border px-2.5 py-1 font-medium transition-colors ${
                space === s.value
                  ? s.value === "work"
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                    : s.value === "personal"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-stone-400 bg-stone-100 text-[#1C1917]"
                  : "border-[#E7E5E4] bg-white text-[#78716C]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Date & Priority for Task */}
        {mode === "task" && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDueDate(todayISO)}
                className={`rounded-lg border px-2.5 py-1 ${
                  dueDate === todayISO
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-[#E7E5E4] text-[#78716C]"
                }`}
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => setDueDate(tomorrowISO)}
                className={`rounded-lg border px-2.5 py-1 ${
                  dueDate === tomorrowISO
                    ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-[#E7E5E4] text-[#78716C]"
                }`}
              >
                Yarın
              </button>
              <button
                type="button"
                onClick={() => setDueDate(null)}
                className={`rounded-lg border px-2.5 py-1 ${
                  dueDate === null
                    ? "border-stone-400 bg-stone-100 text-[#1C1917] font-medium"
                    : "border-[#E7E5E4] text-[#78716C]"
                }`}
              >
                Tarihsiz
              </button>
            </div>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="rounded-lg border border-[#E7E5E4] bg-white px-2 py-1 text-xs text-[#1C1917]"
            >
              <option value="high">Yüksek Öncelik</option>
              <option value="medium">Orta Öncelik</option>
              <option value="low">Düşük Öncelik</option>
            </select>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full sm:w-auto rounded-xl bg-[#1C1917] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
          >
            {mode === "task" ? "Görevi Kaydet" : "Notu Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
