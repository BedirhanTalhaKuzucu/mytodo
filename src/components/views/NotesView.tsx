"use client";

import React, { useMemo, useState } from "react";
import { CheckSquare, FileText, Pin, Plus, Search } from "lucide-react";
import type { Note, SpaceFilter } from "@/types";
import { SpaceBadge } from "@/components/SpaceBadge";

interface NotesViewProps {
  notes: Note[];
  spaceFilter: SpaceFilter;
  selectedId: string | null;
  onSelectNote: (id: string) => void;
  onTogglePin: (id: string, currentPinned: boolean) => void;
  onCreateNote: () => void;
}

export function NotesView({
  notes,
  spaceFilter,
  selectedId,
  onSelectNote,
  onTogglePin,
  onCreateNote,
}: NotesViewProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [onlyPinned, setOnlyPinned] = useState(false);

  const spaceFilteredNotes = useMemo(
    () =>
      notes.filter((n) => spaceFilter === "all" || n.space === spaceFilter),
    [notes, spaceFilter]
  );

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    spaceFilteredNotes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [spaceFilteredNotes]);

  const visibleNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spaceFilteredNotes
      .filter((n) => {
        if (onlyPinned && !n.isPinned) return false;
        if (selectedTag && !n.tags.includes(selectedTag)) return false;
        if (q) {
          const hay = `${n.title} ${n.content} ${n.tags.join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [spaceFilteredNotes, onlyPinned, selectedTag, search]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#4F46E5]" />
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
            Notlar
          </h1>
        </div>
        <button
          type="button"
          onClick={onCreateNote}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C1917] px-3.5 py-2 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4" />
          Yeni Not
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Notlarda ara..."
            className="w-full rounded-xl border border-[#E7E5E4] bg-white py-2 pl-9 pr-3 text-sm text-[#1C1917] placeholder:text-[#78716C]/70 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>

        <button
          type="button"
          onClick={() => setOnlyPinned((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
            onlyPinned
              ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-[#E7E5E4] bg-white text-[#78716C] hover:text-[#1C1917]"
          }`}
        >
          <Pin className="h-3.5 w-3.5" />
          Sabitlenenler
        </button>
      </div>

      {/* Tag Chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTag(null)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedTag === null
                ? "bg-[#1C1917] text-white"
                : "bg-stone-200/70 text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            Tümü
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() =>
                setSelectedTag((prev) => (prev === tag ? null : tag))
              }
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-[#4F46E5] text-white"
                  : "bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes Grid */}
      {visibleNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E7E5E4] bg-white/60 py-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-[#78716C]/60" />
          <p className="mt-2 text-sm font-medium text-[#1C1917]">
            Eşleşen not bulunamadı
          </p>
          <p className="mt-1 text-xs text-[#78716C]">
            Arama filtresini temizleyin veya yeni bir not oluşturun.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleNotes.map((note) => {
            const isSelected = selectedId === note.id;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all ${
                  isSelected
                    ? "border-indigo-300 bg-white ring-2 ring-indigo-500/10 shadow-sm"
                    : "border-[#E7E5E4] bg-white hover:border-stone-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-[#1C1917] leading-snug line-clamp-2">
                      {note.title}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(note.id, note.isPinned);
                      }}
                      title={note.isPinned ? "Sabitlemeyi kaldır" : "Sabitle"}
                      className={`shrink-0 rounded-lg p-1 transition-colors ${
                        note.isPinned
                          ? "text-[#D97706] bg-amber-50"
                          : "text-stone-300 opacity-0 group-hover:opacity-100 hover:text-stone-600"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="mt-2 line-clamp-4 text-xs text-[#78716C] leading-relaxed whitespace-pre-line">
                    {note.content.replace(/[#*_`]/g, "").trim() ||
                      "Henüz içerik eklenmedi..."}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <SpaceBadge space={note.space} size="xs" />
                    {note.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[11px] text-[#78716C]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {note.linkedTaskIds.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700">
                      <CheckSquare className="h-3 w-3" />
                      {note.linkedTaskIds.length} görev
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
