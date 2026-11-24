"use client";

import React from "react";
import { CalendarDays, FileText, Inbox, Plus, Sun, Wallet } from "lucide-react";
import type { NavView } from "@/types";

interface MobileNavProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  counts: {
    today: number;
    inbox: number;
    weekly: number;
    notes: number;
  };
  onOpenQuickAdd: () => void;
  onOpenBudgetApp: () => void;
}

const MOBILE_ITEMS: {
  id: NavView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "today", label: "Bugün", icon: Sun },
  { id: "inbox", label: "Gelen", icon: Inbox },
  { id: "weekly", label: "Haftalık", icon: CalendarDays },
  { id: "notes", label: "Notlar", icon: FileText },
];

export function MobileNav({
  activeView,
  onSelectView,
  counts,
  onOpenQuickAdd,
  onOpenBudgetApp,
}: MobileNavProps) {
  return (
    <>
      {/* Thumb-friendly Floating Action Button */}
      <button
        type="button"
        onClick={onOpenQuickAdd}
        aria-label="Hızlı Ekle"
        className="md:hidden fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1C1917] text-white shadow-lg shadow-stone-900/20 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Mobil Navigasyon"
        className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[#E7E5E4] bg-white/95 backdrop-blur-md pb-safe"
      >
        <div className="grid grid-cols-5 h-16">
          {MOBILE_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            const count = counts[item.id] ?? 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? "text-[#4F46E5]" : "text-[#78716C]"
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {count > 0 && item.id !== "notes" && (
                    <span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-200 px-1 text-[10px] font-semibold text-[#1C1917]">
                      {count}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onOpenBudgetApp}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#78716C] hover:text-[#4F46E5]"
          >
            <Wallet className="h-5 w-5" />
            <span>Bütçe</span>
          </button>
        </div>
      </nav>
    </>
  );
}
