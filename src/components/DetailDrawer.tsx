"use client";

import React, { useState } from "react";
import {
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Link2,
  Maximize2,
  Minimize2,
  Pencil,
  Pin,
  Play,
  Plus,
  Repeat,
  Tag,
  Timer,
  Trash2,
  Unlink,
  X,
} from "lucide-react";
import type {
  Note,
  PomodoroState,
  SelectedItem,
  SpaceType,
  Task,
  TaskPriority,
  TaskRecurrence,
} from "@/types";
import {
  formatSeconds,
  formatTurkishDateShort,
  generateId,
  getTodayISO,
  getTomorrowISO,
} from "@/lib/utils";
import { DatePicker } from "./DatePicker";
import { PriorityBadge, SpaceBadge } from "./SpaceBadge";

interface DetailDrawerProps {
  selected: SelectedItem;
  tasks: Task[];
  notes: Note[];
  pomodoro?: PomodoroState;
  onClose: () => void;
  onSelect: (item: SelectedItem) => void;
  onUpdateTask: (id: string, patch: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateNote: (id: string, patch: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onLinkTaskNote: (taskId: string, noteId: string) => void;
  onUnlinkTaskNote: (taskId: string, noteId: string) => void;
  onCreateTaskFromNote: (note: Note, title: string) => void;
  onFocusPomodoro: (taskId: string) => void;
}

function SimpleMarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <p className="text-sm italic text-[#78716C]">Henüz içerik yok...</p>
    );
  }

  const lines = content.split("\n");
  return (
    <div className="space-y-2 text-sm text-[#1C1917] leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="text-lg font-bold text-[#1C1917] pt-1">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-base font-semibold text-[#1C1917] pt-1">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#78716C]" />
              <span>{renderInlineFormatting(line.slice(2))}</span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+\.)\s(.*)$/);
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span className="font-semibold text-[#78716C]">{match?.[1]}</span>
              <span>{renderInlineFormatting(match?.[2] ?? "")}</span>
            </div>
          );
        }
        if (!line.trim()) {
          return <div key={i} className="h-2" />;
        }
        return <p key={i}>{renderInlineFormatting(line)}</p>;
      })}
    </div>
  );
}

function renderInlineFormatting(text: string): React.ReactNode {
  // Bold (**text**) and inline code (`code`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="rounded bg-stone-100 px-1 py-0.5 font-mono text-xs text-indigo-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function DetailDrawer({
  selected,
  tasks,
  notes,
  pomodoro,
  onClose,
  onSelect,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onUpdateNote,
  onDeleteNote,
  onLinkTaskNote,
  onUnlinkTaskNote,
  onCreateTaskFromNote,
  onFocusPomodoro,
}: DetailDrawerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newTag, setNewTag] = useState("");
  const [notePreviewMode, setNotePreviewMode] = useState(false);
  const [newLinkedTaskTitle, setNewLinkedTaskTitle] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMetaExpanded, setIsMetaExpanded] = useState(false);

  if (!selected) return null;

  const task =
    selected.type === "task"
      ? tasks.find((t) => t.id === selected.id) ?? null
      : null;
  const note =
    selected.type === "note"
      ? notes.find((n) => n.id === selected.id) ?? null
      : null;

  if (!task && !note) return null;

  const todayISO = getTodayISO();
  const tomorrowISO = getTomorrowISO();

  const renderSpaceButtons = (
    currentSpace: SpaceType | null,
    onChange: (s: SpaceType | null) => void
  ) => (
    <div className="flex items-center gap-1.5">
      {(
        [
          { value: null, label: "Gelen" },
          { value: "work", label: "İş" },
          { value: "personal", label: "Özel" },
        ] as { value: SpaceType | null; label: string }[]
      ).map((opt) => {
        const active = currentSpace === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
              active
                ? opt.value === "work"
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : opt.value === "personal"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-stone-400 bg-stone-100 text-[#1C1917]"
                : "border-[#E7E5E4] bg-white text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Backdrop (Mobile always, Desktop when expanded) */}
      <div
        onClick={() => {
          if (isExpanded) setIsExpanded(false);
          else onClose();
        }}
        className={`fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-[1px] ${
          isExpanded ? "block" : "md:hidden"
        }`}
      />

      {/* Drawer / Bottom-Sheet / Expanded Modal Container */}
      <aside
        aria-label="Detay Paneli"
        className={
          isExpanded
            ? "fixed inset-3 md:inset-8 lg:inset-y-8 lg:inset-x-24 z-50 flex flex-col rounded-2xl border border-[#E7E5E4] bg-white shadow-2xl"
            : "fixed inset-x-0 bottom-0 top-12 z-50 flex flex-col rounded-t-2xl border-t border-[#E7E5E4] bg-white shadow-2xl md:static md:inset-auto md:z-auto md:w-[420px] lg:w-[460px] md:shrink-0 md:rounded-none md:border-t-0 md:border-l md:shadow-none"
        }
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E7E5E4] px-4 py-3">
          <div className="flex items-center gap-2">
            {task ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                <CheckSquare className="h-3.5 w-3.5 text-[#4F46E5]" />
                Görev Detayı
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                <FileText className="h-3.5 w-3.5 text-[#059669]" />
                Not Düzenleyici
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {task && task.status === "todo" && (
              <button
                type="button"
                onClick={() => onFocusPomodoro(task.id)}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                title="Bu görevle Pomodoro başlat"
              >
                <Play className="h-3 w-3 fill-current" />
                Odaklan
              </button>
            )}
            {note && (
              <button
                type="button"
                onClick={() =>
                  onUpdateNote(note.id, { isPinned: !note.isPinned })
                }
                className={`rounded-lg p-1.5 transition-colors ${
                  note.isPinned
                    ? "bg-amber-50 text-[#D97706]"
                    : "text-[#78716C] hover:bg-stone-100"
                }`}
                title={note.isPinned ? "Sabitlemeyi kaldır" : "Sabitle"}
              >
                <Pin className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              className="hidden md:inline-flex rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917] transition-colors"
              title={isExpanded ? "Normal Boyuta Küçült" : "Geniş Görünüm"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                if (task) {
                  onDeleteTask(task.id);
                } else if (note) {
                  onDeleteNote(note.id);
                }
                onClose();
              }}
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Sil"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917] transition-colors"
              title="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {task && (
            <>
              {/* Title & Status */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    task.status === "done"
                      ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                      : "border-stone-300 bg-white hover:border-stone-400"
                  }`}
                >
                  {task.status === "done" && (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  )}
                </button>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) =>
                    onUpdateTask(task.id, { title: e.target.value })
                  }
                  className={`w-full bg-transparent text-lg font-semibold focus:outline-none ${
                    task.status === "done"
                      ? "line-through text-[#78716C]"
                      : "text-[#1C1917]"
                  }`}
                  placeholder="Görev başlığı..."
                />
              </div>

              {/* Pomodoro Stats Banner (if active or has completed sessions) */}
              {(pomodoro?.activeTaskId === task.id ||
                (task.pomodoroSessions ?? 0) > 0) && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-amber-700" />
                    <span className="font-medium">
                      {(task.pomodoroSessions ?? 0) > 0
                        ? `${task.pomodoroSessions} Pomodoro oturumu (${task.pomodoroMinutes ?? 0} dk)`
                        : "Pomodoro aktif"}
                    </span>
                  </div>
                  {pomodoro?.activeTaskId === task.id && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 border border-amber-200">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          pomodoro.isRunning
                            ? "bg-amber-500 animate-pulse"
                            : "bg-amber-400"
                        }`}
                      />
                      {formatSeconds(pomodoro.secondsLeft)}
                    </span>
                  )}
                </div>
              )}

              {/* Collapsible Metadata Grid */}
              <div className="rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] text-xs">
                <button
                  type="button"
                  onClick={() => setIsMetaExpanded((v) => !v)}
                  className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left"
                >
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className="flex items-center gap-1 font-medium text-[#78716C]">
                      {isMetaExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      Özellikler
                    </span>
                    {!isMetaExpanded && (
                      <>
                        <SpaceBadge space={task.space} size="xs" />
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && (
                          <span className="rounded-md bg-white border border-[#E7E5E4] px-1.5 py-0.5 text-[11px] text-[#78716C]">
                            {formatTurkishDateShort(task.dueDate)}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-[#78716C] shrink-0">
                    {isMetaExpanded ? "Daralt" : "Düzenle"}
                  </span>
                </button>

                {isMetaExpanded && (
                  <div className="space-y-3 border-t border-[#E7E5E4] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#78716C]">Alan</span>
                      {renderSpaceButtons(task.space, (space) =>
                        onUpdateTask(task.id, { space })
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-[#78716C]">Öncelik</span>
                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            { value: "high", label: "Yüksek" },
                            { value: "medium", label: "Orta" },
                            { value: "low", label: "Düşük" },
                          ] as { value: TaskPriority; label: string }[]
                        ).map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() =>
                              onUpdateTask(task.id, { priority: p.value })
                            }
                            className={`rounded-lg px-2.5 py-1 font-medium border transition-colors ${
                              task.priority === p.value
                                ? p.value === "high"
                                  ? "border-rose-300 bg-rose-50 text-rose-700"
                                  : p.value === "medium"
                                  ? "border-amber-300 bg-amber-50 text-amber-800"
                                  : "border-stone-300 bg-stone-200/70 text-[#1C1917]"
                                : "border-[#E7E5E4] bg-white text-[#78716C]"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-medium text-[#78716C]">
                        <Calendar className="h-3.5 w-3.5" />
                        Tarih
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTask(task.id, { dueDate: todayISO })
                          }
                          className={`rounded-lg px-2 py-1 border ${
                            task.dueDate === todayISO
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
                              : "border-[#E7E5E4] bg-white text-[#78716C]"
                          }`}
                        >
                          Bugün
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateTask(task.id, { dueDate: tomorrowISO })
                          }
                          className={`rounded-lg px-2 py-1 border ${
                            task.dueDate === tomorrowISO
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
                              : "border-[#E7E5E4] bg-white text-[#78716C]"
                          }`}
                        >
                          Yarın
                        </button>
                        <DatePicker
                          value={task.dueDate ?? ""}
                          onChange={(v) =>
                            onUpdateTask(task.id, {
                              dueDate: v || null,
                            })
                          }
                          placeholder="Tarih"
                          className="!rounded-lg !px-2 !py-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 font-medium text-[#78716C]">
                        <Repeat className="h-3.5 w-3.5" />
                        Tekrar
                      </span>
                      <select
                        value={task.recurrence}
                        onChange={(e) =>
                          onUpdateTask(task.id, {
                            recurrence: e.target.value as TaskRecurrence,
                          })
                        }
                        className="rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1 text-xs text-[#1C1917] focus:outline-none"
                      >
                        <option value="none">Tekrarsız</option>
                        <option value="daily">Günlük</option>
                        <option value="weekly">Haftalık</option>
                        <option value="monthly">Aylık</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Subtasks */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                  Alt Görevler ({task.subtasks.filter((s) => s.done).length}/
                  {task.subtasks.length})
                </h3>

                <div className="space-y-1.5">
                  {task.subtasks.map((sub) => (
                    <div
                      key={sub.id}
                      className="group flex items-center gap-2 rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-2"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = task.subtasks.map((s) =>
                            s.id === sub.id ? { ...s, done: !s.done } : s
                          );
                          onUpdateTask(task.id, { subtasks: updated });
                        }}
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          sub.done
                            ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                            : "border-stone-300"
                        }`}
                      >
                        {sub.done && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          sub.done
                            ? "line-through text-[#78716C]"
                            : "text-[#1C1917]"
                        }`}
                      >
                        {sub.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateTask(task.id, {
                            subtasks: task.subtasks.filter(
                              (s) => s.id !== sub.id
                            ),
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-[#78716C] hover:text-rose-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newSubtaskTitle.trim()) return;
                    onUpdateTask(task.id, {
                      subtasks: [
                        ...task.subtasks,
                        {
                          id: generateId(),
                          title: newSubtaskTitle.trim(),
                          done: false,
                        },
                      ],
                    });
                    setNewSubtaskTitle("");
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Alt görev ekle..."
                    className="flex-1 rounded-lg border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-1.5 text-xs text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim()}
                    className="rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1C1917] disabled:opacity-40 hover:bg-stone-50"
                  >
                    Ekle
                  </button>
                </form>
              </div>

              {/* Task Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                  Açıklama / Notlar
                </label>
                <textarea
                  rows={4}
                  value={task.notes}
                  onChange={(e) =>
                    onUpdateTask(task.id, { notes: e.target.value })
                  }
                  placeholder="Görevle ilgili detaylar, linkler veya notlar..."
                  className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3 text-sm text-[#1C1917] placeholder:text-[#78716C]/70 focus:border-indigo-300 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                  <Tag className="h-3.5 w-3.5" />
                  Etiketler
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 text-xs text-[#1C1917]"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateTask(task.id, {
                            tags: task.tags.filter((t) => t !== tag),
                          })
                        }
                        className="text-[#78716C] hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const clean = newTag.trim().replace(/^#/, "");
                      if (!clean || task.tags.includes(clean)) {
                        setNewTag("");
                        return;
                      }
                      onUpdateTask(task.id, { tags: [...task.tags, clean] });
                      setNewTag("");
                    }}
                  >
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="+ etiket"
                      className="w-24 rounded-lg border border-dashed border-stone-300 bg-transparent px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none"
                    />
                  </form>
                </div>
              </div>

              {/* Linked Notes */}
              <div className="space-y-2.5 border-t border-[#E7E5E4] pt-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                    <Link2 className="h-3.5 w-3.5 text-[#4F46E5]" />
                    Bağlı Notlar ({task.linkedNoteIds.length})
                  </span>
                </div>

                {task.linkedNoteIds.length > 0 && (
                  <div className="space-y-1.5">
                    {task.linkedNoteIds.map((nid) => {
                      const linkedNote = notes.find((n) => n.id === nid);
                      if (!linkedNote) return null;
                      return (
                        <div
                          key={nid}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onSelect({ type: "note", id: linkedNote.id })
                            }
                            className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-[#4F46E5]"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0 text-[#78716C]" />
                            <span className="truncate text-xs font-medium">
                              {linkedNote.title}
                            </span>
                            <SpaceBadge space={linkedNote.space} size="xs" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onUnlinkTaskNote(task.id, linkedNote.id)
                            }
                            title="Bağlantıyı kaldır"
                            className="rounded p-1 text-[#78716C] hover:text-rose-600"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Link existing note */}
                {notes.filter((n) => !task.linkedNoteIds.includes(n.id))
                  .length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onLinkTaskNote(task.id, e.target.value);
                      }
                    }}
                    className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs text-[#78716C] focus:outline-none"
                  >
                    <option value="">+ Mevcut bir notu bağla...</option>
                    {notes
                      .filter((n) => !task.linkedNoteIds.includes(n.id))
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </>
          )}

          {note && (
            <>
              {/* Note Title */}
              <input
                type="text"
                value={note.title}
                onChange={(e) =>
                  onUpdateNote(note.id, { title: e.target.value })
                }
                className="w-full bg-transparent text-xl font-bold text-[#1C1917] focus:outline-none"
                placeholder="Not başlığı..."
              />

              {/* Pomodoro Stats from Linked Tasks */}
              {(() => {
                const linkedTasks = tasks.filter((t) =>
                  note.linkedTaskIds.includes(t.id)
                );
                const totalSessions = linkedTasks.reduce(
                  (sum, t) => sum + (t.pomodoroSessions ?? 0),
                  0
                );
                const totalMinutes = linkedTasks.reduce(
                  (sum, t) => sum + (t.pomodoroMinutes ?? 0),
                  0
                );
                const activeLinkedTask = linkedTasks.find(
                  (t) => pomodoro?.activeTaskId === t.id
                );

                if (totalSessions === 0 && !activeLinkedTask) return null;

                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-amber-700" />
                      <span className="font-medium">
                        {totalSessions > 0
                          ? `İlgili görevlerde ${totalSessions} Pomodoro (${totalMinutes} dk)`
                          : `Odaklanılıyor: ${activeLinkedTask?.title}`}
                      </span>
                    </div>
                    {activeLinkedTask && pomodoro && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 border border-amber-200">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            pomodoro.isRunning
                              ? "bg-amber-500 animate-pulse"
                              : "bg-amber-400"
                          }`}
                        />
                        {formatSeconds(pomodoro.secondsLeft)}
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Collapsible Note Space & Edit/Preview Bar */}
              <div className="rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] text-xs">
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setIsMetaExpanded((v) => !v)}
                    className="flex items-center gap-1.5 font-medium text-[#78716C] hover:text-[#1C1917]"
                  >
                    {isMetaExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <span>Alan</span>
                    {!isMetaExpanded && <SpaceBadge space={note.space} size="xs" />}
                  </button>

                  <div className="flex items-center rounded-lg border border-[#E7E5E4] bg-stone-100 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setNotePreviewMode(false)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${
                        !notePreviewMode
                          ? "bg-white text-[#1C1917] shadow-2xs"
                          : "text-[#78716C]"
                      }`}
                    >
                      <Pencil className="h-3 w-3" />
                      Yaz
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotePreviewMode(true)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${
                        notePreviewMode
                          ? "bg-white text-[#1C1917] shadow-2xs"
                          : "text-[#78716C]"
                      }`}
                    >
                      <Eye className="h-3 w-3" />
                      Önizle
                    </button>
                  </div>
                </div>

                {isMetaExpanded && (
                  <div className="flex items-center justify-between gap-2 border-t border-[#E7E5E4] px-3 py-2.5">
                    <span className="font-medium text-[#78716C]">Alan Seçimi</span>
                    {renderSpaceButtons(note.space, (space) =>
                      onUpdateNote(note.id, { space })
                    )}
                  </div>
                )}
              </div>

              {/* Note Content */}
              {notePreviewMode ? (
                <div className="min-h-[220px] rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-4">
                  <SimpleMarkdownPreview content={note.content} />
                </div>
              ) : (
                <textarea
                  rows={isExpanded ? 16 : 10}
                  value={note.content}
                  onChange={(e) =>
                    onUpdateNote(note.id, { content: e.target.value })
                  }
                  placeholder="Markdown destekli notunu yaz... (# Başlık, **kalın**, - liste)"
                  className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3.5 font-sans text-sm leading-relaxed text-[#1C1917] placeholder:text-[#78716C]/70 focus:border-indigo-300 focus:bg-white focus:outline-none"
                />
              )}

              {/* Tags */}
              <div className="space-y-2">
                <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                  <Tag className="h-3.5 w-3.5" />
                  Etiketler
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 text-xs text-[#1C1917]"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateNote(note.id, {
                            tags: note.tags.filter((t) => t !== tag),
                          })
                        }
                        className="text-[#78716C] hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const clean = newTag.trim().replace(/^#/, "");
                      if (!clean || note.tags.includes(clean)) {
                        setNewTag("");
                        return;
                      }
                      onUpdateNote(note.id, { tags: [...note.tags, clean] });
                      setNewTag("");
                    }}
                  >
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="+ etiket"
                      className="w-24 rounded-lg border border-dashed border-stone-300 bg-transparent px-2 py-1 text-xs focus:border-indigo-300 focus:outline-none"
                    />
                  </form>
                </div>
              </div>

              {/* Linked Tasks */}
              <div className="space-y-2.5 border-t border-[#E7E5E4] pt-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                  <Link2 className="h-3.5 w-3.5 text-[#059669]" />
                  İlgili Görevler ({note.linkedTaskIds.length})
                </span>

                {note.linkedTaskIds.length > 0 && (
                  <div className="space-y-1.5">
                    {note.linkedTaskIds.map((tid) => {
                      const linkedTask = tasks.find((t) => t.id === tid);
                      if (!linkedTask) return null;
                      const done = linkedTask.status === "done";
                      return (
                        <div
                          key={tid}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onToggleTask(linkedTask.id)}
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                done
                                  ? "border-[#4F46E5] bg-[#4F46E5] text-white"
                                  : "border-stone-300 bg-white"
                              }`}
                            >
                              {done && (
                                <Check className="h-2.5 w-2.5 stroke-[3]" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onSelect({ type: "task", id: linkedTask.id })
                              }
                              className={`truncate text-left text-xs font-medium hover:text-[#4F46E5] ${
                                done ? "line-through text-[#78716C]" : ""
                              }`}
                            >
                              {linkedTask.title}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              onUnlinkTaskNote(linkedTask.id, note.id)
                            }
                            title="Bağlantıyı kaldır"
                            className="rounded p-1 text-[#78716C] hover:text-rose-600"
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quick create linked task from note */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newLinkedTaskTitle.trim()) return;
                    onCreateTaskFromNote(note, newLinkedTaskTitle.trim());
                    setNewLinkedTaskTitle("");
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newLinkedTaskTitle}
                    onChange={(e) => setNewLinkedTaskTitle(e.target.value)}
                    placeholder="Bu nottan yeni görev oluştur..."
                    className="flex-1 rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-1.5 text-xs text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newLinkedTaskTitle.trim()}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#1C1917] px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:bg-stone-800"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Oluştur
                  </button>
                </form>

                {/* Link existing task */}
                {tasks.filter((t) => !note.linkedTaskIds.includes(t.id))
                  .length > 0 && (
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        onLinkTaskNote(e.target.value, note.id);
                      }
                    }}
                    className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs text-[#78716C] focus:outline-none"
                  >
                    <option value="">+ Mevcut bir görevi bağla...</option>
                    {tasks
                      .filter((t) => !note.linkedTaskIds.includes(t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
