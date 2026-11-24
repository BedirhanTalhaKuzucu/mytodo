"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Plus,
  Repeat,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { BudgetAccount, BudgetTransaction } from "../types";
import { formatAssetAmount, formatCurrency, formatShortDate } from "../utils";

type SortKey = "date" | "amount" | "title" | "category";
type SortDir = "asc" | "desc";

interface BudgetTableProps {
  variant: "expense" | "income";
  title: string;
  transactions: BudgetTransaction[];
  accounts: BudgetAccount[];
  categories: readonly string[];
  pendingRecurringCount?: number;
  onApplyRecurringRules?: () => void;
  onEdit: (tx: BudgetTransaction) => void;
  onAdd: () => void;
}

function SortIcon({
  column,
  activeKey,
  dir,
}: {
  column: SortKey;
  activeKey: SortKey;
  dir: SortDir;
}) {
  if (activeKey !== column) {
    return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  }
  return dir === "asc" ? (
    <ArrowUp className="h-3 w-3 text-[#4F46E5]" />
  ) : (
    <ArrowDown className="h-3 w-3 text-[#4F46E5]" />
  );
}

export function BudgetTable({
  variant,
  title,
  transactions,
  accounts,
  categories,
  pendingRecurringCount = 0,
  onApplyRecurringRules,
  onEdit,
  onAdd,
}: BudgetTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [expandedIncomeTransfers, setExpandedIncomeTransfers] = useState<
    Record<string, boolean>
  >({});

  const { presentCategories, extraCategories } = useMemo(() => {
    const presentSet = new Set<string>();
    for (const tx of transactions) {
      if (tx.category) presentSet.add(tx.category);
    }
    const present = Array.from(presentSet).sort((a, b) =>
      a.localeCompare(b, "tr")
    );
    const extra = categories.filter((c) => !presentSet.has(c));
    return { presentCategories: present, extraCategories: extra };
  }, [transactions, categories]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "date" || key === "amount" ? "desc" : "asc");
    }
  };

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();

    const filtered = transactions.filter((tx) => {
      if (categoryFilter !== "all" && tx.category !== categoryFilter) {
        return false;
      }
      if (accountFilter !== "all" && tx.accountId !== accountFilter) {
        return false;
      }
      if (q) {
        const hay = `${tx.title} ${tx.category} ${tx.note ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      // Sabit (recurring) gider ve gelirler her zaman en üstte
      const aRec = Boolean(a.recurringRuleId);
      const bRec = Boolean(b.recurringRuleId);
      if (aRec !== bRec) return aRec ? -1 : 1;

      let cmp = 0;
      if (sortKey === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortKey === "title") {
        cmp = a.title.localeCompare(b.title, "tr");
      } else if (sortKey === "category") {
        cmp = a.category.localeCompare(b.category, "tr");
      } else {
        cmp = a.date.localeCompare(b.date);
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [transactions, categoryFilter, accountFilter, search, sortKey, sortDir]);

  const getEffective = (tx: BudgetTransaction) =>
    tx.type === "income" && tx.savingsAmount && tx.savingsAmount > 0
      ? Math.max(0, tx.amount - tx.savingsAmount)
      : tx.amount;

  const filteredTotal = useMemo(
    () =>
      processed.reduce(
        (sum, tx) => (tx.type === "transfer" ? sum : sum + getEffective(tx)),
        0
      ),
    [processed]
  );

  const transfersByIncomeId = useMemo(() => {
    const map: Record<string, BudgetTransaction[]> = {};
    if (variant !== "income") return map;

    const incomes = transactions.filter((t) => t.type === "income");
    const transfers = transactions.filter((t) => t.type === "transfer");

    for (const tr of transfers) {
      let target: BudgetTransaction | undefined;
      if (tr.sourceIncomeId) {
        target = incomes.find(
          (i) => i.id === tr.sourceIncomeId && i.accountId === tr.accountId
        );
      }
      if (!target) {
        const sameAcc = incomes
          .filter((i) => i.accountId === tr.accountId)
          .sort((a, b) => b.amount - a.amount);
        target = sameAcc[0];
      }
      if (target) {
        if (!map[target.id]) map[target.id] = [];
        map[target.id].push(tr);
      }
    }
    return map;
  }, [transactions, variant]);

  const { recurringItems, regularItems, recurringTotal } = useMemo(() => {
    const rec: BudgetTransaction[] = [];
    const reg: BudgetTransaction[] = [];
    let recSum = 0;
    for (const tx of processed) {
      if (tx.recurringRuleId) {
        rec.push(tx);
        recSum += getEffective(tx);
      } else {
        reg.push(tx);
      }
    }
    return { recurringItems: rec, regularItems: reg, recurringTotal: recSum };
  }, [processed]);

  const isExpense = variant === "expense";

  return (
    <section className="rounded-2xl border border-[#E7E5E4] bg-white shadow-2xs overflow-hidden">
      {/* Table Header & Filters */}
      <div className="border-b border-[#E7E5E4] bg-[#FAF9F6]/60 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                isExpense
                  ? "bg-rose-50 text-rose-600"
                  : "bg-emerald-50 text-[#059669]"
              }`}
            >
              {isExpense ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
            </div>
            <h2 className="text-base font-semibold text-[#1C1917]">{title}</h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-[#78716C]">
              {processed.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`font-mono text-sm font-bold tabular-nums ${
                isExpense ? "text-rose-600" : "text-[#059669]"
              }`}
            >
              {isExpense ? "-" : "+"}
              {formatCurrency(filteredTotal)}
            </span>
            {pendingRecurringCount > 0 && onApplyRecurringRules && (
              <button
                type="button"
                onClick={onApplyRecurringRules}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-[#4F46E5] hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Kayıtlı sabit kuralları bu aya topluca ekle"
              >
                <Repeat className="h-3.5 w-3.5" />
                Sabitleri Ekle ({pendingRecurringCount})
              </button>
            )}
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-1 rounded-lg bg-[#1C1917] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Ekle
            </button>
          </div>
        </div>

        {/* Filter Bar inside Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#78716C]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Başlık veya not ara..."
              className="w-full rounded-xl border border-[#E7E5E4] bg-white py-1.5 pl-8 pr-3 text-xs text-[#1C1917] focus:border-indigo-300 focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "__show_more__") {
                setShowAllCategories(true);
                return;
              }
              if (val === "__show_less__") {
                setShowAllCategories(false);
                if (
                  categoryFilter !== "all" &&
                  !presentCategories.includes(categoryFilter)
                ) {
                  setCategoryFilter("all");
                }
                return;
              }
              setCategoryFilter(val);
            }}
            aria-label="Kategori Filtresi"
            className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-1.5 text-xs text-[#1C1917] focus:border-indigo-300 focus:outline-none"
          >
            <option value="all">
              Tüm Kategoriler ({presentCategories.length})
            </option>
            {presentCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            {showAllCategories && extraCategories.length > 0 && (
              <optgroup label="Diğer Tüm Kategoriler">
                {extraCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
            )}
            {extraCategories.length > 0 && !showAllCategories && (
              <option value="__show_more__">
                + Daha fazla ({extraCategories.length} kategori)...
              </option>
            )}
            {extraCategories.length > 0 && showAllCategories && (
              <option value="__show_less__">
                − Sadece tablodakileri göster
              </option>
            )}
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            aria-label="Hesap Filtresi"
            className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-1.5 text-xs text-[#1C1917] focus:border-indigo-300 focus:outline-none"
          >
            <option value="all">Tüm Hesaplar</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sıralama Ölçütü"
              className="flex-1 rounded-xl border border-[#E7E5E4] bg-white px-3 py-1.5 text-xs text-[#1C1917] focus:border-indigo-300 focus:outline-none"
            >
              <option value="date">Sırala: Tarih</option>
              <option value="amount">Sırala: Tutar</option>
              <option value="category">Sırala: Kategori</option>
              <option value="title">Sırala: Başlık</option>
            </select>
            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
              title={sortDir === "asc" ? "Artan" : "Azalan"}
              className="rounded-xl border border-[#E7E5E4] bg-white p-1.5 text-[#78716C] hover:text-[#1C1917]"
            >
              {sortDir === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {processed.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#78716C]">
          Bu kriterlere uygun {isExpense ? "gider" : "gelir"} kaydı bulunamadı.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E7E5E4] bg-stone-50/60 text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                  <th className="py-2.5 pl-4 pr-3">
                    <button
                      type="button"
                      onClick={() => handleSort("title")}
                      className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                    >
                      Başlık
                      <SortIcon column="title" activeKey={sortKey} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleSort("category")}
                      className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                    >
                      Kategori
                      <SortIcon
                        column="category"
                        activeKey={sortKey}
                        dir={sortDir}
                      />
                    </button>
                  </th>
                  <th className="px-3 py-2.5">Hesap</th>
                  <th className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleSort("date")}
                      className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                    >
                      Tarih
                      <SortIcon column="date" activeKey={sortKey} dir={sortDir} />
                    </button>
                  </th>
                  <th className="py-2.5 pl-3 pr-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("amount")}
                      className="inline-flex items-center gap-1 hover:text-[#1C1917]"
                    >
                      Tutar
                      <SortIcon
                        column="amount"
                        activeKey={sortKey}
                        dir={sortDir}
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E5E4] text-sm">
                {/* In-Table Sabit (Recurring) Accordion Row */}
                {recurringItems.length > 0 && (
                  <>
                    <tr
                      onClick={() => setIsRecurringOpen((v) => !v)}
                      className="bg-indigo-50/45 hover:bg-indigo-50/80 transition-colors cursor-pointer"
                    >
                      <td colSpan={4} className="py-2.5 pl-4 pr-3">
                        <div className="flex items-center gap-2">
                          {isRecurringOpen ? (
                            <ChevronDown className="h-4 w-4 text-[#4F46E5]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[#4F46E5]" />
                          )}
                          <Repeat className="h-3.5 w-3.5 text-[#4F46E5]" />
                          <span className="text-xs font-semibold text-[#1C1917]">
                            {isExpense ? "Sabit Giderler" : "Sabit Gelirler"}
                          </span>
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-[#4F46E5]">
                            {recurringItems.length}
                          </span>
                        </div>
                      </td>
                      <td
                        className={`py-2.5 pl-3 pr-4 text-right font-mono text-xs font-bold tabular-nums ${
                          isExpense ? "text-rose-600" : "text-[#059669]"
                        }`}
                      >
                        {isExpense ? "-" : "+"}
                        {formatCurrency(recurringTotal)}
                      </td>
                    </tr>

                    {isRecurringOpen &&
                      recurringItems.map((tx) => {
                        const acc = accounts.find((a) => a.id === tx.accountId);
                        const accName = acc?.name ?? "Hesap";
                        const accAsset = acc?.assetType ?? "money";
                        return (
                          <tr
                            key={tx.id}
                            onClick={() => onEdit(tx)}
                            className="bg-indigo-50/20 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                          >
                            <td className="py-2.5 pl-8 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-[#1C1917]">
                                  {tx.title}
                                </span>
                                <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-[#4F46E5]">
                                  <Repeat className="h-2.5 w-2.5" />
                                  Sabit
                                </span>
                                {tx.installmentLabel && (
                                  <span className="inline-flex rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                    {tx.installmentLabel}
                                  </span>
                                )}
                              </div>
                              {tx.note && (
                                <p className="mt-0.5 truncate max-w-xs text-xs text-[#78716C]">
                                  {tx.note}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex rounded-lg bg-stone-100 px-2 py-0.5 text-xs font-medium text-[#1C1917]">
                                {tx.category}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#78716C]">
                              {accName}
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[#78716C]">
                              {formatShortDate(tx.date)}
                            </td>
                            <td
                              className={`py-2.5 pl-3 pr-4 text-right font-mono text-sm font-semibold tabular-nums ${
                                isExpense ? "text-[#1C1917]" : "text-[#059669]"
                              }`}
                            >
                              {isExpense ? "-" : "+"}
                              {formatAssetAmount(tx.amount, accAsset)}
                            </td>
                          </tr>
                        );
                      })}
                  </>
                )}

                {regularItems.map((tx, rowIdx) => {
                  const isTransferRow = tx.type === "transfer";
                  const acc = accounts.find(
                    (a) =>
                      a.id === (isTransferRow ? tx.toAccountId : tx.accountId)
                  );
                  const srcAcc = isTransferRow
                    ? accounts.find((a) => a.id === tx.accountId)
                    : undefined;
                  const accName = acc?.name ?? "Hesap";
                  const accAsset = acc?.assetType ?? "money";
                  const isRecurring = Boolean(tx.recurringRuleId);
                  const outgoingTransfers = transfersByIncomeId[tx.id] ?? [];
                  const outgoingSum = outgoingTransfers.reduce(
                    (s, t) => s + t.amount,
                    0
                  );
                  const isTransferExpanded = Boolean(
                    expandedIncomeTransfers[tx.id]
                  );
                  const baseEff = getEffective(tx);
                  const netAfterTransfer = baseEff - outgoingSum;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr
                        onClick={() => onEdit(tx)}
                        className={`cursor-pointer transition-colors ${
                          isTransferRow
                            ? "bg-sky-50/55 hover:bg-sky-50/90"
                            : isRecurring
                            ? "bg-indigo-50/40 hover:bg-amber-50/50"
                            : rowIdx % 2 === 1
                            ? "bg-stone-50/75 hover:bg-amber-50/50"
                            : "bg-white hover:bg-amber-50/50"
                        }`}
                      >
                        <td className="py-3 pl-4 pr-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-[#1C1917]">
                              {tx.title}
                            </span>
                            {isTransferRow && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 border border-sky-200 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                                <ArrowRightLeft className="h-2.5 w-2.5" />
                                Transfer Girişi
                              </span>
                            )}
                            {isRecurring && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-[#4F46E5]">
                                <Repeat className="h-2.5 w-2.5" />
                                Sabit
                              </span>
                            )}
                            {outgoingTransfers.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedIncomeTransfers((prev) => ({
                                    ...prev,
                                    [tx.id]: !prev[tx.id],
                                  }));
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800 hover:bg-sky-100 cursor-pointer"
                                title="Bu gelirden çıkan transferleri göster/gizle"
                              >
                                {isTransferExpanded ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                                −{formatCurrency(outgoingSum)} Transfer
                              </button>
                            )}
                          </div>
                          {isTransferRow && srcAcc && (
                            <p className="mt-0.5 text-[11px] text-sky-700">
                              ← {srcAcc.name} hesabından aktarıldı
                            </p>
                          )}
                          {tx.note && (
                            <p className="mt-0.5 truncate max-w-xs text-xs text-[#78716C]">
                              {tx.note}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-medium ${
                              isTransferRow
                                ? "bg-sky-100/80 text-sky-900"
                                : "bg-stone-100 text-[#1C1917]"
                            }`}
                          >
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-[#78716C]">
                          {accName}
                        </td>
                        <td className="px-3 py-3 text-xs text-[#78716C]">
                          {formatShortDate(tx.date)}
                        </td>
                        <td
                          className={`py-3 pl-3 pr-4 text-right font-mono text-sm font-semibold tabular-nums ${
                            isTransferRow
                              ? "text-sky-700"
                              : isExpense
                              ? "text-[#1C1917]"
                              : "text-[#059669]"
                          }`}
                        >
                          <div>
                            {isExpense ? "-" : "+"}
                            {formatAssetAmount(
                              outgoingTransfers.length > 0
                                ? netAfterTransfer
                                : baseEff,
                              accAsset
                            )}
                          </div>
                          {outgoingTransfers.length > 0 && (
                            <div className="text-[10px] font-normal text-[#78716C]">
                              Brüt: {formatAssetAmount(baseEff, accAsset)}
                            </div>
                          )}
                          {tx.type === "income" &&
                            tx.savingsAmount &&
                            tx.savingsAmount > 0 && (
                              <span className="inline-block mt-0.5 rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                                +{formatCurrency(tx.savingsAmount)} Tasarruf
                              </span>
                            )}
                        </td>
                      </tr>

                      {isTransferExpanded && outgoingTransfers.length > 0 && (
                        <tr className="bg-sky-50/35">
                          <td colSpan={5} className="px-4 py-2.5 pl-8">
                            <div className="rounded-xl border border-sky-200/80 bg-white overflow-hidden">
                              <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/60 px-3 py-1.5 text-[11px] font-semibold text-sky-900">
                                <span>
                                  Bu gelirden yapılan transfer çıkışları
                                </span>
                                <span className="font-mono tabular-nums">
                                  Net Kalan: {formatCurrency(netAfterTransfer)}
                                </span>
                              </div>
                              <div className="divide-y divide-stone-100">
                                {outgoingTransfers.map((tr) => {
                                  const toAcc = accounts.find(
                                    (a) => a.id === tr.toAccountId
                                  );
                                  return (
                                    <div
                                      key={tr.id}
                                      onClick={() => onEdit(tr)}
                                      className="flex items-center justify-between gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-sky-50/50 transition-colors"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                                        <span className="truncate font-medium text-[#1C1917]">
                                          {tr.title}
                                        </span>
                                        <span className="text-[11px] text-[#78716C]">
                                          → {toAcc?.name ?? "Hesap"} •{" "}
                                          {formatShortDate(tr.date)}
                                        </span>
                                      </div>
                                      <span className="shrink-0 font-mono font-semibold text-rose-600 tabular-nums">
                                        −{formatCurrency(tr.amount)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-[#E7E5E4]">
            {recurringItems.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setIsRecurringOpen((v) => !v)}
                  className="flex w-full items-center justify-between bg-indigo-50/45 px-3.5 py-2.5 text-left hover:bg-indigo-50/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {isRecurringOpen ? (
                      <ChevronDown className="h-4 w-4 text-[#4F46E5]" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[#4F46E5]" />
                    )}
                    <Repeat className="h-3.5 w-3.5 text-[#4F46E5]" />
                    <span className="text-xs font-semibold text-[#1C1917]">
                      {isExpense ? "Sabit Giderler" : "Sabit Gelirler"}
                    </span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-[#4F46E5]">
                      {recurringItems.length}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${
                      isExpense ? "text-rose-600" : "text-[#059669]"
                    }`}
                  >
                    {isExpense ? "-" : "+"}
                    {formatCurrency(recurringTotal)}
                  </span>
                </button>
                {isRecurringOpen && (
                  <div className="divide-y divide-indigo-100/80 border-t border-indigo-100 bg-indigo-50/20">
                    {recurringItems.map((tx) => {
                      const acc = accounts.find((a) => a.id === tx.accountId);
                      const accName = acc?.name ?? "Hesap";
                      const accAsset = acc?.assetType ?? "money";
                      return (
                        <div
                          key={tx.id}
                          onClick={() => onEdit(tx)}
                          className="flex items-center justify-between gap-3 p-3.5 pl-6 cursor-pointer hover:bg-indigo-50/50"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-[#1C1917]">
                                {tx.title}
                              </span>
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#4F46E5]">
                                <Repeat className="h-2.5 w-2.5" />
                                Sabit
                              </span>
                              {tx.installmentLabel && (
                                <span className="inline-flex shrink-0 rounded-md bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                  {tx.installmentLabel}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-[#78716C]">
                              {formatShortDate(tx.date)} • {tx.category} • {accName}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                              isExpense ? "text-[#1C1917]" : "text-[#059669]"
                            }`}
                          >
                            {isExpense ? "-" : "+"}
                            {formatAssetAmount(tx.amount, accAsset)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {regularItems.map((tx, rowIdx) => {
              const acc = accounts.find((a) => a.id === tx.accountId);
              const accName = acc?.name ?? "Hesap";
              const accAsset = acc?.assetType ?? "money";
              const isRecurring = Boolean(tx.recurringRuleId);
              return (
                <div
                  key={tx.id}
                  onClick={() => onEdit(tx)}
                  className={`flex items-center justify-between gap-3 p-3.5 cursor-pointer transition-colors hover:bg-amber-50/50 ${
                    isRecurring
                      ? "bg-indigo-50/40"
                      : rowIdx % 2 === 1
                      ? "bg-stone-50/75"
                      : "bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-[#1C1917]">
                        {tx.title}
                      </span>
                      {isRecurring && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#4F46E5]">
                          <Repeat className="h-2.5 w-2.5" />
                          Sabit
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#78716C]">
                      {formatShortDate(tx.date)} • {tx.category} • {accName}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-sm font-semibold tabular-nums ${
                      isExpense ? "text-[#1C1917]" : "text-[#059669]"
                    }`}
                  >
                    {isExpense ? "-" : "+"}
                    {formatAssetAmount(tx.amount, accAsset)}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
