"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  CheckSquare,
  Edit3,
  Eye,
  Heading2,
  Italic,
  List,
  ListOrdered,
  StickyNote,
  Trash2,
  Underline,
  X,
} from "lucide-react";
import type { MonthNote } from "../types";
import { formatMonthLabel } from "../utils";

interface MonthNoteModalProps {
  monthKey: string;
  existingNote: MonthNote | null;
  onClose: () => void;
  onSave: (monthKey: string, content: string) => void;
}

function isHtmlEmpty(html: string): boolean {
  const stripped = html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return stripped.length === 0;
}

export function MonthNoteModal({
  monthKey,
  existingNote,
  onClose,
  onSave,
}: MonthNoteModalProps) {
  const hasInitialContent = Boolean(
    existingNote && !isHtmlEmpty(existingNote.content)
  );
  const [mode, setMode] = useState<"read" | "edit">(
    hasInitialContent ? "read" : "edit"
  );
  const [htmlContent, setHtmlContent] = useState<string>(
    existingNote?.content ?? ""
  );
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "edit" && editorRef.current) {
      editorRef.current.innerHTML = htmlContent;
    }
    // Only sync DOM when switching into edit mode so typing never resets the caret
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const insertChecklistItem = () => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, "<div>☐ </div>");
    if (editorRef.current) {
      setHtmlContent(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    const latest =
      mode === "edit" && editorRef.current
        ? editorRef.current.innerHTML
        : htmlContent;
    onSave(monthKey, isHtmlEmpty(latest) ? "" : latest);
    onClose();
  };

  const handleDelete = () => {
    onSave(monthKey, "");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-[#E7E5E4] bg-white shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#E7E5E4] bg-[#FAF9F6] px-5 py-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <StickyNote className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold capitalize text-[#1C1917]">
                {formatMonthLabel(monthKey)} — Ay Notu
              </h2>
              {existingNote?.updatedAt && (
                <p className="text-[11px] text-[#78716C]">
                  Son güncelleme:{" "}
                  {new Date(existingNote.updatedAt).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-[#E7E5E4] bg-white p-0.5">
              <button
                type="button"
                onClick={() => {
                  if (mode === "edit" && editorRef.current) {
                    setHtmlContent(editorRef.current.innerHTML);
                  }
                  setMode("read");
                }}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  mode === "read"
                    ? "bg-amber-50 text-amber-900"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Okuma
              </button>
              <button
                type="button"
                onClick={() => setMode("edit")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  mode === "edit"
                    ? "bg-amber-50 text-amber-900"
                    : "text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Düzenle
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-200/60 hover:text-[#1C1917] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Rich Text Toolbar in Edit Mode */}
        {mode === "edit" && (
          <div className="flex flex-wrap items-center gap-1 border-b border-[#E7E5E4] bg-stone-50/70 px-4 py-2">
            <button
              type="button"
              onClick={() => exec("bold")}
              title="Kalın"
              className="rounded-lg p-1.5 text-[#1C1917] hover:bg-stone-200/70 cursor-pointer"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("italic")}
              title="İtalik"
              className="rounded-lg p-1.5 text-[#1C1917] hover:bg-stone-200/70 cursor-pointer"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("underline")}
              title="Altı Çizili"
              className="rounded-lg p-1.5 text-[#1C1917] hover:bg-stone-200/70 cursor-pointer"
            >
              <Underline className="h-3.5 w-3.5" />
            </button>
            <div className="mx-1 h-4 w-px bg-[#E7E5E4]" />
            <button
              type="button"
              onClick={() => exec("formatBlock", "H3")}
              title="Başlık"
              className="rounded-lg p-1.5 text-[#1C1917] hover:bg-stone-200/70 cursor-pointer"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("insertUnorderedList")}
              title="Madde Listesi"
              className="rounded-lg p-1.5 text-[#1C1917] hover:bg-stone-200/70 cursor-pointer"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => exec("insertOrderedList")}
              title="Numaralı Liste"
              className="rounded-lg p-1.5 text-[#1C1917] hover:bg-stone-200/70 cursor-pointer"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={insertChecklistItem}
              title="Kontrol Maddesi"
              className="rounded-lg p-1.5 text-[#1C1917] hover:bg-stone-200/70 cursor-pointer"
            >
              <CheckSquare className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {mode === "read" ? (
            isHtmlEmpty(htmlContent) ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm text-[#78716C]">
                  Bu ay için henüz not eklenmemiş.
                </p>
                <button
                  type="button"
                  onClick={() => setMode("edit")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Not Yaz
                </button>
              </div>
            ) : (
              <div
                onClick={() => setMode("edit")}
                className="min-h-[220px] rounded-xl border border-stone-100 bg-[#FAF9F6]/60 p-4 text-sm leading-relaxed text-[#1C1917] [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 cursor-text"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )
          ) : (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setHtmlContent(e.currentTarget.innerHTML)}
              data-placeholder="Bu ay için planlarını, önemli harcama notlarını veya hatırlatmaları buraya yaz..."
              className="min-h-[260px] w-full rounded-xl border border-[#E7E5E4] bg-white p-4 text-sm leading-relaxed text-[#1C1917] focus:border-amber-400 focus:outline-none [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-[#E7E5E4] bg-[#FAF9F6] px-5 py-3">
          {hasInitialContent ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Notu Temizle
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E7E5E4] bg-white px-3.5 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] cursor-pointer"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#1C1917] px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 cursor-pointer"
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
