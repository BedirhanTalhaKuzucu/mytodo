"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const DAYS_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0=Monday … 6=Sunday for the first day of the given month. */
function getFirstDayMondayBased(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

function formatDateTR(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  required,
  className = "",
  placeholder = "Tarih seçin",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = todayISO();
  const todayParts = today.split("-").map(Number); // [y, m, d]

  // Derive initial view from value or today
  const initYear = value
    ? Number(value.split("-")[0])
    : todayParts[0];
  const initMonth = value
    ? Number(value.split("-")[1]) - 1
    : todayParts[1] - 1;

  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);

  // Click-outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Sync view month when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  // Which day is selected in the current view?
  const parsed = value ? value.split("-").map(Number) : null;
  const selectedDay =
    parsed && parsed[0] === viewYear && parsed[1] - 1 === viewMonth
      ? parsed[2]
      : null;

  const isTodayCell = (day: number) =>
    todayParts[0] === viewYear &&
    todayParts[1] - 1 === viewMonth &&
    todayParts[2] === day;

  // Build calendar grid (Monday-first)
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayMondayBased(viewYear, viewMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`w-full text-left rounded-xl border bg-white px-3 py-2 text-xs transition-colors ${
          isOpen
            ? "border-indigo-300 ring-2 ring-indigo-100"
            : "border-[#E7E5E4] hover:border-stone-300"
        } ${className}`}
      >
        {value ? (
          <span className="text-[#1C1917]">{formatDateTR(value)}</span>
        ) : (
          <span className="text-[#A8A29E]">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-[#E7E5E4] bg-white p-3 shadow-lg">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="rounded-lg p-1 hover:bg-stone-100 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-[#78716C]" />
            </button>
            <span className="text-xs font-semibold text-[#1C1917]">
              {MONTHS_TR[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="rounded-lg p-1 hover:bg-stone-100 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 text-[#78716C]" />
            </button>
          </div>

          {/* Day-of-week headers (Monday first) */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_TR.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-semibold text-[#78716C] py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day ? (
                  <button
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      selectedDay === day
                        ? "bg-[#4F46E5] text-white"
                        : isTodayCell(day)
                          ? "bg-indigo-50 text-[#4F46E5] font-bold ring-1 ring-indigo-200"
                          : "text-[#1C1917] hover:bg-stone-100"
                    }`}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="h-7 w-7" />
                )}
              </div>
            ))}
          </div>

          {/* Quick shortcuts */}
          <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-[#E7E5E4]">
            <button
              type="button"
              onClick={() => {
                onChange(today);
                setIsOpen(false);
              }}
              className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-colors cursor-pointer ${
                value === today
                  ? "border-indigo-200 bg-indigo-50 text-[#4F46E5]"
                  : "border-[#E7E5E4] bg-stone-50 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917]"
              }`}
            >
              Bugün
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="flex-1 rounded-lg border border-[#E7E5E4] bg-stone-50 py-1.5 text-[11px] font-medium text-[#78716C] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors cursor-pointer"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden native input for form validation when required */}
      {required && (
        <input
          type="text"
          value={value}
          required
          tabIndex={-1}
          className="sr-only"
          readOnly
        />
      )}
    </div>
  );
}
