"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Coins,
  Landmark,
  Layers,
  Lock,
  PiggyBank,
  Plus,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import type {
  AssetType,
  BudgetAccount,
  BudgetTransaction,
  MonthClosure,
  MonthNote,
} from "../types";
import {
  ASSET_TYPE_META,
  formatAssetAmount,
  formatCurrency,
  formatMonthLabel,
  formatShortDate,
  getCurrentMonthKey,
} from "../utils";
import { AccountKindIcon } from "./AccountsModal";

interface BudgetOverviewPageProps {
  accounts: BudgetAccount[];
  allTimeAccountBalances: Record<string, number>;
  totalsByAssetType: Record<AssetType, number>;
  presentAssetTypes: AssetType[];
  totalVaultReserve: number;
  monthsOverview: {
    monthKey: string;
    income: number;
    expense: number;
    net: number;
    closure: MonthClosure | null;
  }[];
  overviewTransactions: BudgetTransaction[];
  monthNotes: MonthNote[];
  includedOpenMonths: string[];
  onSelectMonth: (monthKey: string) => void;
  onOpenClosureForMonth: (monthKey: string) => void;
  onOpenNoteForMonth: (monthKey: string) => void;
  onToggleIncludeOpenMonth: (monthKey: string) => void;
  onClosePastMonths: () => void;
  onAddOverviewTx: (monthKey: string, type: "income" | "expense") => void;
  onEditOverviewTx: (tx: BudgetTransaction) => void;
}

function AssetIcon({ assetType }: { assetType: AssetType }) {
  if (assetType === "gold") {
    return <Coins className="h-4 w-4 text-amber-600" />;
  }
  if (assetType === "stock") {
    return <TrendingUp className="h-4 w-4 text-emerald-600" />;
  }
  return <Landmark className="h-4 w-4 text-[#4F46E5]" />;
}

export function BudgetOverviewPage({
  accounts,
  allTimeAccountBalances,
  totalsByAssetType,
  presentAssetTypes,
  totalVaultReserve,
  monthsOverview,
  overviewTransactions,
  monthNotes,
  includedOpenMonths,
  onSelectMonth,
  onOpenClosureForMonth,
  onOpenNoteForMonth,
  onToggleIncludeOpenMonth,
  onClosePastMonths,
  onAddOverviewTx,
  onEditOverviewTx,
}: BudgetOverviewPageProps) {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>(
    {}
  );

  const overviewByMonth = useMemo(() => {
    const map: Record<string, BudgetTransaction[]> = {};
    for (const tx of overviewTransactions) {
      const mk = tx.date.slice(0, 7);
      if (!map[mk]) map[mk] = [];
      map[mk].push(tx);
    }
    return map;
  }, [overviewTransactions]);

  const toggleMonthAccordion = (monthKey: string) => {
    setExpandedMonths((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="h-5 w-5 text-[#4F46E5]" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
              Genel Durum (Total)
            </h1>
            <p className="text-xs text-[#78716C]">
              Varlık cinsine göre ayrı toplamlar, hesap bakiyeleri ve ay kapanışı devirleri.
            </p>
          </div>
        </div>
      </div>

      {/* Asset-Type Grouped Total Cards + Vault Reserve */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {presentAssetTypes.map((assetType) => {
          const total = totalsByAssetType[assetType] ?? 0;
          const count = accounts.filter(
            (a) => (a.assetType ?? "money") === assetType
          ).length;

          return (
            <div
              key={assetType}
              className="rounded-2xl border border-[#E7E5E4] bg-white p-4 shadow-2xs"
            >
              <div className="flex items-center justify-between text-xs font-medium text-[#78716C]">
                <span>Toplam {ASSET_TYPE_META[assetType].label}</span>
                <AssetIcon assetType={assetType} />
              </div>
              <p
                className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
                  total >= 0 ? "text-[#1C1917]" : "text-rose-600"
                }`}
              >
                {formatAssetAmount(total, assetType)}
              </p>
              <p className="mt-1 text-[11px] text-[#78716C]">
                {count} hesap toplamı
              </p>
            </div>
          );
        })}

        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-medium text-[#78716C]">
            <span>Kapanış Kasası (Birikim)</span>
            <PiggyBank className="h-4 w-4 text-[#059669]" />
          </div>
          <p
            className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
              totalVaultReserve >= 0 ? "text-[#059669]" : "text-rose-600"
            }`}
          >
            {totalVaultReserve >= 0 ? "+" : ""}
            {formatCurrency(totalVaultReserve)}
          </p>
          <p className="mt-1 text-[11px] text-[#78716C]">
            Ay kapanışlarından totale işlenen
          </p>
        </div>
      </section>

      {/* Per-Account Total Balances */}
      <section className="space-y-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
          Hesapların Total Durumu
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {accounts
            .filter((acc) => {
              const bal = allTimeAccountBalances[acc.id] ?? 0;
              if (
                (acc.kind === "cash" || acc.id === "notion-acc-portfolio") &&
                Math.abs(bal) < 0.001
              ) {
                return false;
              }
              return true;
            })
            .map((acc) => {
              const assetType = acc.assetType ?? "money";
              const bal = allTimeAccountBalances[acc.id] ?? 0;
            return (
              <div
                key={acc.id}
                className="flex items-center justify-between rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      assetType === "gold"
                        ? "bg-amber-50 text-amber-600"
                        : assetType === "stock"
                        ? "bg-emerald-50 text-emerald-600"
                        : acc.kind === "cash"
                        ? "bg-emerald-50 text-[#059669]"
                        : "bg-indigo-50 text-[#4F46E5]"
                    }`}
                  >
                    <AccountKindIcon kind={acc.kind} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1C1917]">
                      {acc.name}
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      {ASSET_TYPE_META[assetType].label}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${
                    bal >= 0 ? "text-[#1C1917]" : "text-rose-600"
                  }`}
                >
                  {formatAssetAmount(bal, assetType)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* All Months Summary Table */}
      <section className="rounded-2xl border border-[#E7E5E4] bg-white shadow-2xs overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E5E4] bg-[#FAF9F6]/60 px-4 py-3">
          <h2 className="text-sm font-semibold text-[#1C1917]">
            Ayların Total Özeti & Kapanış Durumu
          </h2>
          {monthsOverview.some(
            (m) => m.monthKey < getCurrentMonthKey() && !m.closure
          ) && (
            <button
              type="button"
              onClick={onClosePastMonths}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 transition-colors cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              Önceki Ayları Kapat
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E7E5E4] bg-stone-50/60 text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                <th className="py-2.5 pl-4 pr-3">Ay</th>
                <th className="px-3 py-2.5 text-right">Gelir</th>
                <th className="px-3 py-2.5 text-right">Gider</th>
                <th className="px-3 py-2.5 text-right">Net Fark</th>
                <th className="px-3 py-2.5">Kapanış Durumu</th>
                <th className="px-3 py-2.5 text-right">Totale İşlenen</th>
                <th className="px-3 py-2.5 text-right">Sonraki Aya Devir</th>
                <th className="py-2.5 pl-3 pr-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4] text-sm">
              {monthsOverview.map((m, rowIdx) => {
                const c = m.closure;
                const signedTotal = c
                  ? (c.netAtClose >= 0 ? 1 : -1) * c.toTotalAmount
                  : 0;
                const signedCarry = c
                  ? (c.netAtClose >= 0 ? 1 : -1) * c.carryOverAmount
                  : 0;
                const monthOv = overviewByMonth[m.monthKey] ?? [];
                const isExpanded = Boolean(expandedMonths[m.monthKey]);

                return (
                  <React.Fragment key={m.monthKey}>
                    <tr
                      className={`transition-colors hover:bg-amber-50/40 ${
                        rowIdx % 2 === 1 ? "bg-stone-50/75" : "bg-white"
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3 font-medium capitalize text-[#1C1917]">
                        <div className="flex items-center gap-2">
                          <span>{formatMonthLabel(m.monthKey)}</span>
                          <button
                            type="button"
                            onClick={() => toggleMonthAccordion(m.monthKey)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                              monthOv.length > 0
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-stone-200 bg-stone-50 text-[#78716C] hover:bg-stone-100"
                            }`}
                            title="Bu aya ait genel kasa işlemlerini aç/kapat"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                            {monthOv.length > 0
                              ? `${monthOv.length} genel`
                              : "+ Genel"}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs font-medium text-[#059669] tabular-nums">
                        +{formatCurrency(m.income)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs font-medium text-rose-600 tabular-nums">
                        -{formatCurrency(m.expense)}
                      </td>
                      <td
                        className={`px-3 py-3 text-right font-mono text-xs font-bold tabular-nums ${
                          m.net >= 0 ? "text-[#1C1917]" : "text-rose-600"
                        }`}
                      >
                        {m.net >= 0 ? "+" : ""}
                        {formatCurrency(m.net)}
                      </td>
                      <td className="px-3 py-3">
                        {c ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Kapandı
                          </span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              Açık
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                onToggleIncludeOpenMonth(m.monthKey)
                              }
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                                includedOpenMonths.includes(m.monthKey)
                                  ? "border-indigo-300 bg-indigo-50 text-[#4F46E5] hover:bg-indigo-100"
                                  : "border-stone-200 bg-stone-50 text-[#78716C] hover:bg-stone-100"
                              }`}
                              title="Bu açık ayın aylık netinin genel kasa bakiyesine dahil edilip edilmeyeceğini seç"
                            >
                              <Calculator className="h-3 w-3" />
                              {includedOpenMonths.includes(m.monthKey)
                                ? "Hesaba Dahil"
                                : "Hesaba Dahil Değil"}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-[#78716C] tabular-nums">
                        {c
                          ? `${signedTotal >= 0 ? "+" : ""}${formatCurrency(
                              signedTotal
                            )}`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs text-[#78716C] tabular-nums">
                        {c
                          ? `${signedCarry >= 0 ? "+" : ""}${formatCurrency(
                              signedCarry
                            )}`
                          : "—"}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenNoteForMonth(m.monthKey)}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
                              monthNotes.some((n) => n.monthKey === m.monthKey)
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-[#E7E5E4] bg-white text-[#78716C] hover:text-[#1C1917] hover:bg-stone-50"
                            }`}
                            title="Ay Notunu Aç"
                          >
                            <StickyNote className="h-3 w-3" />
                            Not
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenClosureForMonth(m.monthKey)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#E7E5E4] bg-white px-2 py-1 text-xs font-medium text-[#1C1917] hover:bg-stone-50"
                          >
                            <Lock className="h-3 w-3 text-[#4F46E5]" />
                            {c ? "Düzenle" : "Kapat"}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectMonth(m.monthKey)}
                            className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 text-xs font-medium text-[#1C1917] hover:bg-stone-200"
                            title="Bu aya git"
                          >
                            Aç
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (() => {
                      const ovIncomes = monthOv.filter(
                        (tx) => tx.type === "income"
                      );
                      const ovExpenses = monthOv.filter(
                        (tx) => tx.type === "expense"
                      );
                      const moneyIncomeSum = ovIncomes.reduce((s, tx) => {
                        const acc = accounts.find((a) => a.id === tx.accountId);
                        return (acc?.assetType ?? "money") === "money"
                          ? s + tx.amount
                          : s;
                      }, 0);
                      const moneyExpenseSum = ovExpenses.reduce((s, tx) => {
                        const acc = accounts.find((a) => a.id === tx.accountId);
                        return (acc?.assetType ?? "money") === "money"
                          ? s + tx.amount
                          : s;
                      }, 0);

                      const renderOvList = (
                        items: BudgetTransaction[],
                        emptyText: string
                      ) =>
                        items.length === 0 ? (
                          <p className="px-3 py-4 text-center text-[11px] text-[#78716C]">
                            {emptyText}
                          </p>
                        ) : (
                          <div className="divide-y divide-stone-100">
                            {items.map((tx) => {
                              const acc = accounts.find(
                                (a) => a.id === tx.accountId
                              );
                              const accName = acc?.name ?? "Hesap";
                              const accAsset = acc?.assetType ?? "money";
                              const isExp = tx.type === "expense";
                              return (
                                <div
                                  key={tx.id}
                                  onClick={() => onEditOverviewTx(tx)}
                                  className="flex items-center justify-between gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-amber-50/40 transition-colors"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate font-medium text-[#1C1917]">
                                        {tx.title}
                                      </span>
                                      <span className="inline-flex shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-[#78716C]">
                                        {tx.category}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-[#78716C]">
                                      {formatShortDate(tx.date)} • {accName}
                                    </p>
                                  </div>
                                  <span
                                    className={`shrink-0 font-mono font-semibold tabular-nums ${
                                      isExp
                                        ? "text-rose-600"
                                        : "text-[#059669]"
                                    }`}
                                  >
                                    {isExp ? "-" : "+"}
                                    {formatAssetAmount(tx.amount, accAsset)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );

                      const moneyNet = moneyIncomeSum - moneyExpenseSum;

                      return (
                        <tr className="bg-amber-50/35">
                          <td colSpan={8} className="px-4 py-3 space-y-2.5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {/* Genel Gelirler */}
                              <div className="rounded-xl border border-emerald-200/80 bg-white overflow-hidden">
                                <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs font-semibold text-emerald-900">
                                  <div className="flex items-center gap-2">
                                    <span>
                                      Genel Gelirler ({ovIncomes.length})
                                    </span>
                                    {moneyIncomeSum > 0 && (
                                      <span className="font-mono tabular-nums text-[#059669]">
                                        +{formatCurrency(moneyIncomeSum)}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddOverviewTx(m.monthKey, "income")
                                    }
                                    className="inline-flex items-center gap-0.5 rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Ekle
                                  </button>
                                </div>
                                {renderOvList(
                                  ovIncomes,
                                  "Bu ayda genel gelir yok."
                                )}
                              </div>

                              {/* Genel Giderler */}
                              <div className="rounded-xl border border-rose-200/80 bg-white overflow-hidden">
                                <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/60 px-3 py-2 text-xs font-semibold text-rose-900">
                                  <div className="flex items-center gap-2">
                                    <span>
                                      Genel Giderler ({ovExpenses.length})
                                    </span>
                                    {moneyExpenseSum > 0 && (
                                      <span className="font-mono tabular-nums text-rose-600">
                                        -{formatCurrency(moneyExpenseSum)}
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onAddOverviewTx(m.monthKey, "expense")
                                    }
                                    className="inline-flex items-center gap-0.5 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-rose-700 transition-colors cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Ekle
                                  </button>
                                </div>
                                {renderOvList(
                                  ovExpenses,
                                  "Bu ayda genel gider yok."
                                )}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/70 bg-white px-3.5 py-2 text-xs">
                              <span className="font-medium text-[#78716C]">
                                Bu Ayın Genel İşlem Neti (Para):
                              </span>
                              <div className="flex items-center gap-3 font-mono tabular-nums">
                                <span className="text-[#059669]">
                                  +{formatCurrency(moneyIncomeSum)}
                                </span>
                                <span className="text-rose-600">
                                  -{formatCurrency(moneyExpenseSum)}
                                </span>
                                <span
                                  className={`font-bold ${
                                    moneyNet >= 0
                                      ? "text-[#059669]"
                                      : "text-rose-600"
                                  }`}
                                >
                                  = {moneyNet >= 0 ? "+" : ""}
                                  {formatCurrency(moneyNet)}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })()}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
