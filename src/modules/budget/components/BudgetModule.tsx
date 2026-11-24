"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Lock,
  Plus,
  Repeat,
  StickyNote,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  getInstallmentForMonth,
  useBudgetData,
} from "../hooks/useBudgetData";
import type {
  BudgetTransaction,
  TransactionScope,
  TransactionType,
} from "../types";
import {
  ASSET_TYPE_META,
  formatAssetAmount,
  formatCurrency,
  formatMonthLabel,
  formatShortDate,
  shiftMonthKey,
} from "../utils";
import { AccountKindIcon, AccountsModal } from "./AccountsModal";
import { BudgetOverviewPage } from "./BudgetOverviewPage";
import { BudgetTable } from "./BudgetTable";
import { MonthClosureModal } from "./MonthClosureModal";
import { MonthNoteModal } from "./MonthNoteModal";
import { RecurringModal } from "./RecurringModal";
import { TransactionModal } from "./TransactionModal";

interface BudgetModuleProps {
  onExitBudget?: () => void;
}

type BudgetPage = "monthly" | "overview";

export function BudgetModule({ onExitBudget }: BudgetModuleProps) {
  const {
    isLoaded,
    selectedMonth,
    setSelectedMonth,
    accounts,
    transactions,
    monthTransactions,
    recurringRules,
    closures,
    monthNotes,
    includedOpenMonths,
    expenseCategories,
    incomeCategories,
    accountStats,
    monthlySummary,
    overallStats,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    saveMonthNote,
    addRecurringRule,
    applyRecurringRulesToMonth,
    loadSeedRecurringRules,
    updateRecurringRule,
    deleteRecurringRule,
    closeOrUpdateMonth,
    reopenMonth,
    toggleOpenMonthInBalance,
    closePastMonths,
  } = useBudgetData();

  const [activePage, setActivePageState] = useState<BudgetPage>(() => {
    if (typeof window === "undefined") return "monthly";
    try {
      const saved = window.localStorage.getItem("denge_budget_active_page_v1");
      if (saved === "monthly" || saved === "overview") return saved;
    } catch {
      // ignore
    }
    return "monthly";
  });

  const setActivePage = (page: BudgetPage) => {
    setActivePageState(page);
    try {
      window.localStorage.setItem("denge_budget_active_page_v1", page);
    } catch {
      // ignore
    }
  };
  const [tableTab, setTableTab] = useState<"expense" | "income" | "all">(
    "expense"
  );
  const [txModalState, setTxModalState] = useState<{
    open: boolean;
    initialType: TransactionType;
    initialScope?: TransactionScope;
    defaultMonth?: string;
    editingTx: BudgetTransaction | null;
  }>({ open: false, initialType: "expense", initialScope: "monthly", editingTx: null });
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [closureTargetMonth, setClosureTargetMonth] = useState<string | null>(
    null
  );
  const [noteTargetMonth, setNoteTargetMonth] = useState<string | null>(null);

  const currentMonthNote = useMemo(
    () => monthNotes.find((n) => n.monthKey === selectedMonth) ?? null,
    [monthNotes, selectedMonth]
  );

  const expenseTransactions = useMemo(
    () => monthTransactions.filter((tx) => tx.type === "expense"),
    [monthTransactions]
  );

  const incomeTransactions = useMemo(
    () => monthTransactions.filter((tx) => tx.type === "income"),
    [monthTransactions]
  );

  const transferTransactions = useMemo(
    () => monthTransactions.filter((tx) => tx.type === "transfer"),
    [monthTransactions]
  );

  const pendingExpenseRecurringCount = useMemo(
    () =>
      recurringRules.filter(
        (r) =>
          r.isActive &&
          (r.type ?? "expense") === "expense" &&
          selectedMonth >= r.startMonth &&
          getInstallmentForMonth(r, selectedMonth).isEligible &&
          !monthTransactions.some((tx) => tx.recurringRuleId === r.id)
      ).length,
    [recurringRules, selectedMonth, monthTransactions]
  );

  const pendingIncomeRecurringCount = useMemo(
    () =>
      recurringRules.filter(
        (r) =>
          r.isActive &&
          r.type === "income" &&
          selectedMonth >= r.startMonth &&
          getInstallmentForMonth(r, selectedMonth).isEligible &&
          !monthTransactions.some((tx) => tx.recurringRuleId === r.id)
      ).length,
    [recurringRules, selectedMonth, monthTransactions]
  );

  const currentClosure = useMemo(
    () => closures.find((c) => c.monthKey === selectedMonth) ?? null,
    [closures, selectedMonth]
  );

  const closureMonthStats = useMemo(() => {
    if (!closureTargetMonth) return null;
    const found = overallStats.monthsOverview.find(
      (m) => m.monthKey === closureTargetMonth
    );
    return (
      found ?? {
        monthKey: closureTargetMonth,
        income: 0,
        expense: 0,
        net: 0,
        closure: null,
      }
    );
  }, [closureTargetMonth, overallStats.monthsOverview]);

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#FAF9F6] py-12 text-xs text-[#78716C]">
        Bütçe uygulaması yükleniyor...
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 bg-[#FAF9F6] text-[#1C1917]">
      {/* Dedicated Budget PC Sidebar (No Todo/Notes items) */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between overflow-y-auto border-r border-[#E7E5E4] bg-[#FAF9F6] p-3.5">
        <div className="space-y-5">
          <button
            type="button"
            onClick={() =>
              setTxModalState({
                open: true,
                initialType: "expense",
                editingTx: null,
              })
            }
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1C1917] px-3 py-2.5 text-xs font-medium text-white hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Yeni Gelir / Gider
          </button>

          <nav className="space-y-1" aria-label="Bütçe Menüsü">
            <button
              type="button"
              onClick={() => setActivePage("monthly")}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                activePage === "monthly"
                  ? "bg-white text-[#1C1917] shadow-xs border border-[#E7E5E4]"
                  : "text-[#78716C] hover:bg-stone-200/50 hover:text-[#1C1917] border border-transparent"
              }`}
            >
              <CalendarRange
                className={`h-4 w-4 ${
                  activePage === "monthly" ? "text-[#4F46E5]" : "text-[#78716C]"
                }`}
              />
              Aylık Bütçe
            </button>

            <button
              type="button"
              onClick={() => setActivePage("overview")}
              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                activePage === "overview"
                  ? "bg-white text-[#1C1917] shadow-xs border border-[#E7E5E4]"
                  : "text-[#78716C] hover:bg-stone-200/50 hover:text-[#1C1917] border border-transparent"
              }`}
            >
              <Layers
                className={`h-4 w-4 ${
                  activePage === "overview"
                    ? "text-[#4F46E5]"
                    : "text-[#78716C]"
                }`}
              />
              Genel Durum (Total)
            </button>
          </nav>

          <div className="space-y-1 border-t border-[#E7E5E4] pt-4">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
              Araçlar
            </p>
            <button
              type="button"
              onClick={() => setIsAccountsOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#78716C] hover:bg-stone-200/50 hover:text-[#1C1917]"
            >
              <Wallet className="h-4 w-4 text-[#059669]" />
              Hesaplar ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setIsRecurringOpen(true)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[#78716C] hover:bg-stone-200/50 hover:text-[#1C1917]"
            >
              <span className="flex items-center gap-2.5">
                <Repeat className="h-4 w-4 text-[#4F46E5]" />
                Sabit İşlemler
              </span>
              <span className="rounded-full bg-stone-200/70 px-1.5 py-0.5 text-[10px]">
                {recurringRules.filter((r) => r.isActive).length}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                setTxModalState({
                  open: true,
                  initialType: "transfer",
                  editingTx: null,
                })
              }
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-[#78716C] hover:bg-stone-200/50 hover:text-[#1C1917]"
            >
              <ArrowRightLeft className="h-4 w-4 text-[#4F46E5]" />
              Hesaplar Arası Transfer
            </button>
          </div>
        </div>

        {/* Exit back to Todo/Notes App */}
        {onExitBudget && (
          <button
            type="button"
            onClick={onExitBudget}
            className="flex items-center gap-2 rounded-xl border border-[#E7E5E4] bg-white px-3 py-2.5 text-xs font-medium text-[#1C1917] hover:bg-stone-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4 text-[#78716C]" />
            Görevler & Notlar&apos;a Dön
          </button>
        )}
      </aside>

      {/* Budget Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-5 pb-24 md:px-7 md:py-6 md:pb-8">
        {activePage === "overview" ? (
          <BudgetOverviewPage
            accounts={accounts}
            allTimeAccountBalances={overallStats.allTimeAccountBalances}
            totalsByAssetType={overallStats.totalsByAssetType}
            presentAssetTypes={overallStats.presentAssetTypes}
            monthsOverview={overallStats.monthsOverview}
            overviewTransactions={overallStats.overviewTransactions}
            monthNotes={monthNotes}
            includedOpenMonths={includedOpenMonths}
            onSelectMonth={(mk) => {
              setSelectedMonth(mk);
              setActivePage("monthly");
            }}
            onOpenClosureForMonth={(mk) => setClosureTargetMonth(mk)}
            onOpenNoteForMonth={(mk) => setNoteTargetMonth(mk)}
            onToggleIncludeOpenMonth={toggleOpenMonthInBalance}
            onClosePastMonths={closePastMonths}
            onAddOverviewTx={(mk, txType) =>
              setTxModalState({
                open: true,
                initialType: txType,
                initialScope: "overview",
                defaultMonth: mk,
                editingTx: null,
              })
            }
            onEditOverviewTx={(tx) => {
              const actualTx = tx.id.startsWith("savings-")
                ? transactions.find(
                    (t) => t.id === tx.id.slice("savings-".length)
                  ) ?? tx
                : tx;
              setTxModalState({
                open: true,
                initialType: actualTx.type,
                initialScope: actualTx.scope ?? "overview",
                editingTx: actualTx,
              });
            }}
          />
        ) : (
          <div className="mx-auto max-w-6xl space-y-6">
            {/* Monthly Header & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Wallet className="h-5 w-5 text-[#4F46E5]" />
                <h1 className="text-2xl font-bold tracking-tight text-[#1C1917]">
                  Aylık Bütçe
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Month Switcher */}
                <div className="flex items-center gap-1 rounded-xl border border-[#E7E5E4] bg-white p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMonth(shiftMonthKey(selectedMonth, -1))
                    }
                    className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917]"
                    title="Önceki Ay"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[110px] text-center text-xs font-semibold capitalize text-[#1C1917]">
                    {formatMonthLabel(selectedMonth)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMonth(shiftMonthKey(selectedMonth, 1))
                    }
                    className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100 hover:text-[#1C1917]"
                    title="Sonraki Ay"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Month Note Button */}
                <button
                  type="button"
                  onClick={() => setNoteTargetMonth(selectedMonth)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-2xs transition-colors cursor-pointer ${
                    monthNotes.some((n) => n.monthKey === selectedMonth)
                      ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      : "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-stone-50"
                  }`}
                >
                  <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                  Ay Notu
                </button>

                {/* Month Closure Button */}
                <button
                  type="button"
                  onClick={() => setClosureTargetMonth(selectedMonth)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-2xs transition-colors ${
                    currentClosure
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                      : "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  }`}
                >
                  {currentClosure ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ay Kapandı (Düzenle)
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      Ay Kapanışı Yap
                    </>
                  )}
                </button>

                {/* Mobile quick tool buttons */}
                <button
                  type="button"
                  onClick={() => setIsAccountsOpen(true)}
                  className="md:hidden inline-flex items-center gap-1 rounded-xl border border-[#E7E5E4] bg-white px-2.5 py-2 text-xs font-medium text-[#1C1917]"
                >
                  <Wallet className="h-3.5 w-3.5 text-[#059669]" />
                  Hesaplar
                </button>
                <button
                  type="button"
                  onClick={() => setIsRecurringOpen(true)}
                  className="md:hidden inline-flex items-center gap-1 rounded-xl border border-[#E7E5E4] bg-white px-2.5 py-2 text-xs font-medium text-[#1C1917]"
                >
                  <Repeat className="h-3.5 w-3.5 text-[#4F46E5]" />
                  Sabit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTxModalState({
                      open: true,
                      initialType: "expense",
                      editingTx: null,
                    })
                  }
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#1C1917] px-3.5 py-2 text-xs font-medium text-white hover:bg-stone-800 shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  İşlem Ekle
                </button>
              </div>
            </div>

            {/* Monthly Account Status (Only This Month) */}
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                Bu Ayın Hesap Durumu
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {accounts
                  .filter((acc) => {
                    if (acc.id === "notion-acc-portfolio") return false;
                    const assetType = acc.assetType ?? "money";
                    const stat = accountStats[acc.id] ?? { monthDelta: 0 };
                    return (
                      assetType === "money" || Math.abs(stat.monthDelta) >= 0.001
                    );
                  })
                  .map((acc) => {
                    const assetType = acc.assetType ?? "money";
                    const stat = accountStats[acc.id] ?? {
                      totalBalance: 0,
                      monthDelta: 0,
                    };
                    return (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between rounded-xl border border-[#E7E5E4] bg-white p-3.5 shadow-2xs"
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
                              {ASSET_TYPE_META[assetType].label} • Bu Ay
                            </p>
                          </div>
                        </div>
                        <span
                          className={`font-mono text-sm font-bold tabular-nums ${
                            stat.monthDelta >= 0
                              ? "text-[#059669]"
                              : "text-rose-600"
                          }`}
                        >
                          {stat.monthDelta >= 0 ? "+" : ""}
                          {formatAssetAmount(stat.monthDelta, assetType)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* Monthly Summary Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTableTab("income")}
                className={`rounded-2xl border bg-white p-4 text-left shadow-2xs transition-all cursor-pointer ${
                  tableTab === "income"
                    ? "border-emerald-300 ring-2 ring-emerald-100"
                    : "border-[#E7E5E4] hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium text-[#78716C]">
                  <span>Aylık Gelir</span>
                  <TrendingUp className="h-4 w-4 text-[#059669]" />
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-[#059669] tabular-nums">
                  {formatCurrency(monthlySummary.totalIncome)}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTableTab("expense")}
                className={`rounded-2xl border bg-white p-4 text-left shadow-2xs transition-all cursor-pointer ${
                  tableTab === "expense"
                    ? "border-rose-300 ring-2 ring-rose-100"
                    : "border-[#E7E5E4] hover:border-rose-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-medium text-[#78716C]">
                  <span>Aylık Gider</span>
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </div>
                <p className="mt-2 font-mono text-2xl font-bold text-rose-600 tabular-nums">
                  {formatCurrency(monthlySummary.totalExpense)}
                </p>
              </button>

              <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-medium text-[#78716C]">
                  <span>Aylık Net Durum</span>
                  <Wallet className="h-4 w-4 text-[#4F46E5]" />
                </div>
                <p
                  className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
                    monthlySummary.netBalance >= 0
                      ? "text-[#1C1917]"
                      : "text-rose-600"
                  }`}
                >
                  {monthlySummary.netBalance >= 0 ? "+" : ""}
                  {formatCurrency(monthlySummary.netBalance)}
                </p>
              </div>
            </section>

            {/* Visible Month Note Banner above Tables (when note exists) */}
            {currentMonthNote && currentMonthNote.content.trim() && (
              <div
                onClick={() => setNoteTargetMonth(selectedMonth)}
                className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 shadow-2xs cursor-pointer hover:bg-amber-50/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                    <StickyNote className="h-3.5 w-3.5 text-amber-600" />
                    <span>Ay Notu</span>
                  </div>
                  <span className="text-[11px] font-medium text-amber-700">
                    Aç / Düzenle →
                  </span>
                </div>
                <div
                  className="text-xs leading-relaxed text-[#1C1917] line-clamp-3 [&_h3]:text-sm [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
                  dangerouslySetInnerHTML={{ __html: currentMonthNote.content }}
                />
              </div>
            )}

            {/* Quick Tab Switcher between Giderler & Gelirler */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-1">
                <button
                  type="button"
                  onClick={() => setTableTab("expense")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    tableTab === "expense"
                      ? "bg-white text-rose-600 shadow-2xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  Giderler ({expenseTransactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab("income")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    tableTab === "income"
                      ? "bg-white text-[#059669] shadow-2xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  Gelirler ({incomeTransactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableTab("all")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    tableTab === "all"
                      ? "bg-white text-[#1C1917] shadow-2xs"
                      : "text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  İkisi Birden
                </button>
              </div>
            </div>

            {/* Separate Expenses Table */}
            {(tableTab === "expense" || tableTab === "all") && (
              <BudgetTable
                variant="expense"
                title="Giderler"
                transactions={expenseTransactions}
                accounts={accounts}
                categories={expenseCategories}
                pendingRecurringCount={pendingExpenseRecurringCount}
                onApplyRecurringRules={() =>
                  applyRecurringRulesToMonth(selectedMonth, "expense")
                }
                onEdit={(tx) =>
                  setTxModalState({
                    open: true,
                    initialType: "expense",
                    editingTx: tx,
                  })
                }
                onAdd={() =>
                  setTxModalState({
                    open: true,
                    initialType: "expense",
                    editingTx: null,
                  })
                }
              />
            )}

            {/* Separate Income Table (includes transfer entries with distinct styling & source deductions) */}
            {(tableTab === "income" || tableTab === "all") && (
              <BudgetTable
                variant="income"
                title="Gelirler"
                transactions={[...incomeTransactions, ...transferTransactions]}
                accounts={accounts}
                categories={incomeCategories}
                pendingRecurringCount={pendingIncomeRecurringCount}
                onApplyRecurringRules={() =>
                  applyRecurringRulesToMonth(selectedMonth, "income")
                }
                onEdit={(tx) =>
                  setTxModalState({
                    open: true,
                    initialType: "income",
                    editingTx: tx,
                  })
                }
                onAdd={() =>
                  setTxModalState({
                    open: true,
                    initialType: "income",
                    editingTx: null,
                  })
                }
              />
            )}

            {/* Bottom Grid: Transfers + Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                    Hesaplar Arası Transferler ({transferTransactions.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setTxModalState({
                        open: true,
                        initialType: "transfer",
                        editingTx: null,
                      })
                    }
                    className="text-xs font-medium text-[#4F46E5] hover:underline"
                  >
                    + Transfer Yap
                  </button>
                </div>
                <div className="rounded-2xl border border-[#E7E5E4] bg-white p-3 shadow-2xs space-y-2">
                  {transferTransactions.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[#78716C]">
                      Bu ay hesaplar arası transfer kaydı yok.
                    </p>
                  ) : (
                    transferTransactions.map((tx) => {
                      const sourceAcc =
                        accounts.find((a) => a.id === tx.accountId)?.name ??
                        "Hesap";
                      const targetAcc =
                        accounts.find((a) => a.id === tx.toAccountId)?.name ??
                        "Hesap";
                      return (
                        <div
                          key={tx.id}
                          onClick={() =>
                            setTxModalState({
                              open: true,
                              initialType: "transfer",
                              editingTx: tx,
                            })
                          }
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3 cursor-pointer hover:border-stone-300"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-[#4F46E5]">
                              <ArrowRightLeft className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#1C1917]">
                                {tx.title}
                              </p>
                              <p className="text-xs text-[#78716C]">
                                {formatShortDate(tx.date)} • {sourceAcc} →{" "}
                                {targetAcc}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 font-mono text-sm font-semibold text-[#4F46E5] tabular-nums">
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                  Gider Kategorileri Dağılımı
                </h2>
                <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 shadow-2xs space-y-3.5">
                  {monthlySummary.categoryBreakdown.length === 0 ? (
                    <p className="py-6 text-center text-xs text-[#78716C]">
                      Bu ay henüz gider kaydı yok.
                    </p>
                  ) : (
                    monthlySummary.categoryBreakdown.map((item) => (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#1C1917]">
                            {item.category}
                          </span>
                          <span className="font-mono text-[#78716C] tabular-nums">
                            {formatCurrency(item.amount)} ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-[#4F46E5] transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Mobile FAB + Bottom Nav for Budget App */}
      <button
        type="button"
        onClick={() =>
          setTxModalState({
            open: true,
            initialType: "expense",
            editingTx: null,
          })
        }
        aria-label="Hızlı İşlem Ekle"
        className="md:hidden fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1C1917] text-white shadow-lg shadow-stone-900/20 active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>

      <nav
        aria-label="Bütçe Mobil Menü"
        className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[#E7E5E4] bg-white/95 backdrop-blur-md pb-safe"
      >
        <div
          className={`grid h-16 ${
            onExitBudget ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          <button
            type="button"
            onClick={() => setActivePage("monthly")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              activePage === "monthly" ? "text-[#4F46E5]" : "text-[#78716C]"
            }`}
          >
            <CalendarRange className="h-5 w-5" />
            <span>Aylık</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePage("overview")}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              activePage === "overview" ? "text-[#4F46E5]" : "text-[#78716C]"
            }`}
          >
            <Layers className="h-5 w-5" />
            <span>Genel Durum</span>
          </button>
          {onExitBudget && (
            <button
              type="button"
              onClick={onExitBudget}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#78716C]"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Görevler</span>
            </button>
          )}
        </div>
      </nav>

      {/* Modals */}
      {txModalState.open && (
        <TransactionModal
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          monthIncomes={incomeTransactions}
          hasLinkedRecurringRule={Boolean(
            txModalState.editingTx?.recurringRuleId &&
              recurringRules.some(
                (r) => r.id === txModalState.editingTx?.recurringRuleId
              )
          )}
          editingTx={txModalState.editingTx}
          initialType={txModalState.initialType}
          initialScope={txModalState.initialScope}
          defaultMonth={txModalState.defaultMonth ?? selectedMonth}
          onAddCategory={addCategory}
          onClose={() =>
            setTxModalState((s) => ({ ...s, open: false, editingTx: null }))
          }
          onSave={(input, editingId, updateRuleToo) => {
            if (editingId) {
              updateTransaction(
                editingId,
                {
                  type: input.type,
                  amount: input.amount,
                  title: input.title,
                  category: input.category,
                  accountId: input.accountId,
                  toAccountId: input.toAccountId,
                  sourceIncomeId: input.sourceIncomeId,
                  date: input.date,
                  note: input.note,
                  scope: input.scope,
                  savingsAmount: input.savingsAmount,
                },
                updateRuleToo
              );
            } else {
              addTransaction(input);
            }
          }}
          onDelete={deleteTransaction}
        />
      )}

      {isAccountsOpen && (
        <AccountsModal
          accounts={accounts}
          accountStats={accountStats}
          onClose={() => setIsAccountsOpen(false)}
          onAddAccount={(name, kind, assetType) =>
            addAccount(name, kind, assetType)
          }
          onUpdateAccount={updateAccount}
          onDeleteAccount={deleteAccount}
        />
      )}

      {isRecurringOpen && (
        <RecurringModal
          rules={recurringRules}
          accounts={accounts}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          onClose={() => setIsRecurringOpen(false)}
          onAddRule={addRecurringRule}
          onUpdateRule={updateRecurringRule}
          onDeleteRule={deleteRecurringRule}
          onLoadSeedRules={loadSeedRecurringRules}
        />
      )}

      {noteTargetMonth && (
        <MonthNoteModal
          monthKey={noteTargetMonth}
          existingNote={
            monthNotes.find((n) => n.monthKey === noteTargetMonth) ?? null
          }
          onClose={() => setNoteTargetMonth(null)}
          onSave={saveMonthNote}
        />
      )}

      {closureTargetMonth && closureMonthStats && (
        <MonthClosureModal
          monthKey={closureTargetMonth}
          totalIncome={closureMonthStats.income}
          totalExpense={closureMonthStats.expense}
          totalSavings={
            closureTargetMonth === selectedMonth
              ? monthlySummary.totalSavings
              : 0
          }
          netBalance={closureMonthStats.net}
          existingClosure={closureMonthStats.closure}
          accounts={accounts}
          onClose={() => setClosureTargetMonth(null)}
          onSaveClosure={closeOrUpdateMonth}
          onReopenMonth={reopenMonth}
        />
      )}
    </div>
  );
}
