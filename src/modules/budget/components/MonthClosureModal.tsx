"use client";

import React, { useState } from "react";
import { CheckCircle2, Lock, Unlock, X } from "lucide-react";
import type { BudgetAccount, MonthClosure } from "../types";
import { formatCurrency, formatMonthLabel, shiftMonthKey } from "../utils";

interface MonthClosureModalProps {
  monthKey: string;
  totalIncome: number;
  totalExpense: number;
  totalSavings?: number;
  netBalance: number;
  existingClosure: MonthClosure | null;
  accounts: BudgetAccount[];
  onClose: () => void;
  onSaveClosure: (input: {
    monthKey: string;
    netAtClose: number;
    carryOverAmount: number;
    toTotalAmount: number;
    accountId: string;
    savingsAction?: "to_total" | "keep_in_month";
  }) => void;
  onReopenMonth: (monthKey: string) => void;
}

export function MonthClosureModal({
  monthKey,
  totalIncome,
  totalExpense,
  totalSavings = 0,
  netBalance,
  existingClosure,
  accounts,
  onClose,
  onSaveClosure,
  onReopenMonth,
}: MonthClosureModalProps) {
  const absNet = Math.abs(netBalance);
  const isSurplus = netBalance >= 0;
  const nextMonthLabel = formatMonthLabel(shiftMonthKey(monthKey, 1));

  const [carryOver, setCarryOver] = useState<string>(
    existingClosure
      ? String(existingClosure.carryOverAmount)
      : isSurplus
      ? "0"
      : String(absNet)
  );
  const [toTotal, setToTotal] = useState<string>(
    existingClosure
      ? String(existingClosure.toTotalAmount)
      : isSurplus
      ? String(absNet)
      : "0"
  );
  const [accountId, setAccountId] = useState<string>(
    existingClosure?.accountId ?? accounts[0]?.id ?? ""
  );
  const [savingsAction, setSavingsAction] = useState<
    "to_total" | "keep_in_month"
  >("to_total");

  const handleCarryChange = (val: string) => {
    setCarryOver(val);
    const num = Number(val.replace(",", "."));
    if (Number.isFinite(num) && num >= 0 && num <= absNet) {
      setToTotal(String(Math.round((absNet - num) * 100) / 100));
    }
  };

  const handleToTotalChange = (val: string) => {
    setToTotal(val);
    const num = Number(val.replace(",", "."));
    if (Number.isFinite(num) && num >= 0 && num <= absNet) {
      setCarryOver(String(Math.round((absNet - num) * 100) / 100));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const carryNum = Math.max(0, Number(carryOver.replace(",", ".")) || 0);
    const totalNum = Math.max(0, Number(toTotal.replace(",", ".")) || 0);

    onSaveClosure({
      monthKey,
      netAtClose: netBalance,
      carryOverAmount: carryNum,
      toTotalAmount: totalNum,
      accountId,
      savingsAction: totalSavings > 0 ? savingsAction : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/35 sm:px-4 backdrop-blur-[2px]">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#4F46E5]" />
            <h2 className="text-sm font-semibold text-[#1C1917] capitalize">
              {formatMonthLabel(monthKey)} — Ay Kapanışı
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Month Financial Summary */}
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3 text-xs">
          <div>
            <p className="text-[#78716C]">Gelir</p>
            <p className="mt-0.5 font-mono font-semibold text-[#059669] tabular-nums">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-[#78716C]">Gider</p>
            <p className="mt-0.5 font-mono font-semibold text-rose-600 tabular-nums">
              {formatCurrency(totalExpense)}
            </p>
          </div>
          <div>
            <p className="text-[#78716C]">
              {isSurplus ? "Fazlalık (Net)" : "Açık (Net)"}
            </p>
            <p
              className={`mt-0.5 font-mono font-bold tabular-nums ${
                isSurplus ? "text-[#059669]" : "text-rose-600"
              }`}
            >
              {isSurplus ? "+" : "-"}
              {formatCurrency(absNet)}
            </p>
          </div>
        </div>

        {/* Separated Savings Decision */}
        {totalSavings > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900">
                Ayrılmış Tasarruf Payı
              </span>
              <span className="font-mono text-xs font-bold text-amber-800 tabular-nums">
                {formatCurrency(totalSavings)}
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              Bu ayda gelirlerden ayrılmış tasarruf payı kapanışta nasıl işlensin?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSavingsAction("to_total")}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                  savingsAction === "to_total"
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-100"
                    : "border-[#E7E5E4] bg-white text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                Totale / Birikime Aktar
              </button>
              <button
                type="button"
                onClick={() => setSavingsAction("keep_in_month")}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                  savingsAction === "keep_in_month"
                    ? "border-indigo-400 bg-indigo-50 text-indigo-900 font-semibold ring-2 ring-indigo-100"
                    : "border-[#E7E5E4] bg-white text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                Bu Aya Dahil Et
              </button>
            </div>
          </div>
        )}

        {absNet === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
            Bu ay gelir ve gider dengede (0 ₺). Doğrudan kapanış yapabilirsin.
          </div>
        ) : (
          <>
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                Hızlı Seçim
              </p>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setToTotal(String(absNet));
                    setCarryOver("0");
                  }}
                  className="rounded-lg border border-[#E7E5E4] bg-[#FAF9F6] px-2.5 py-1.5 font-medium text-[#1C1917] hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  {isSurplus
                    ? "Tamamını Totale (Birikime) Aktar"
                    : "Tamamını Totalden Kapat (Devretmez)"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCarryOver(String(absNet));
                    setToTotal("0");
                  }}
                  className="rounded-lg border border-[#E7E5E4] bg-[#FAF9F6] px-2.5 py-1.5 font-medium text-[#1C1917] hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  {isSurplus
                    ? "Tamamını Sonraki Aya Gelir Devret"
                    : "Tamamını Sonraki Aya Gider Ekle"}
                </button>
              </div>
            </div>

            {/* Editable Split Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E7E5E4] p-3 space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                  {isSurplus
                    ? "Totale (Birikime) Aktarılacak"
                    : "Total Kasadan Kapatılacak"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={toTotal}
                  onChange={(e) => handleToTotalChange(e.target.value)}
                  className="w-full rounded-lg border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 font-mono text-sm font-semibold text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
                />
                <p className="text-[11px] text-[#78716C]">
                  Sonraki aya devretmez, Genel Durum (Total) kasasına işlenir.
                </p>
              </div>

              <div className="rounded-xl border border-[#E7E5E4] p-3 space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] capitalize">
                  {nextMonthLabel} Ayına{" "}
                  {isSurplus ? "Gelir" : "Gider"} Olarak Aktar
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={carryOver}
                  onChange={(e) => handleCarryChange(e.target.value)}
                  className="w-full rounded-lg border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 font-mono text-sm font-semibold text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
                />
                <p className="text-[11px] text-[#78716C] capitalize">
                  {nextMonthLabel} ayının başına otomatik{" "}
                  {isSurplus ? "gelir" : "gider"} olarak eklenir.
                </p>
              </div>
            </div>

            {Number(carryOver) > 0 && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Devir İşleminin Yazılacağı Hesap
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E5E4] pt-4">
          {existingClosure ? (
            <button
              type="button"
              onClick={() => {
                onReopenMonth(monthKey);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              <Unlock className="h-3.5 w-3.5" />
              Kapanışı İptal Et
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1C1917] px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            {existingClosure ? "Kapanışı Güncelle" : "Ayı Kapat"}
          </button>
        </div>
      </form>
    </div>
  );
}
