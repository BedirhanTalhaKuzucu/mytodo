"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { budgetStorageAdapter } from "../storage";
import {
  NOTION_ACCOUNTS,
  NOTION_UNIFIED_ACCOUNTS,
  buildNotionFinanceTransactions,
  buildNotionOverviewTransactions,
} from "../storage/notion-import";
import { buildNotion2026Transactions } from "../storage/notion-2026-import";
import { buildNotion2025Transactions } from "../storage/notion-2025-import";
import type {
  AccountKind,
  AssetType,
  BudgetAccount,
  BudgetCustomCategories,
  BudgetTransaction,
  MonthClosure,
  MonthNote,
  RecurringExpenseRule,
  TransactionScope,
  TransactionType,
} from "../types";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  buildDateInMonth,
  formatMonthLabel,
  generateBudgetId,
  getCurrentMonthKey,
  shiftMonthKey,
} from "../utils";

export interface SaveTransactionInput {
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  accountId: string;
  toAccountId?: string;
  sourceIncomeId?: string;
  date: string;
  note?: string;
  scope?: TransactionScope;
  savingsAmount?: number;
  makeRecurring?: boolean;
}

function getEffectiveTxAmount(tx: BudgetTransaction): number {
  if (tx.type === "income" && tx.savingsAmount && tx.savingsAmount > 0) {
    return Math.max(0, tx.amount - tx.savingsAmount);
  }
  return tx.amount;
}

function materializeRecurringForMonth(
  monthKey: string,
  rules: RecurringExpenseRule[],
  existingTransactions: BudgetTransaction[]
): { nextTransactions: BudgetTransaction[]; added: boolean } {
  const now = new Date().toISOString();
  const toAdd: BudgetTransaction[] = [];

  for (const rule of rules) {
    if (!rule.isActive) continue;
    if (monthKey < rule.startMonth) continue;

    const alreadyExists = existingTransactions.some(
      (tx) => tx.recurringRuleId === rule.id && tx.date.startsWith(monthKey)
    );
    if (!alreadyExists) {
      toAdd.push({
        id: generateBudgetId(),
        type: rule.type ?? "expense",
        amount: rule.amount,
        title: rule.title,
        category: rule.category,
        accountId: rule.accountId,
        date: buildDateInMonth(monthKey, rule.dayOfMonth),
        recurringRuleId: rule.id,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (toAdd.length === 0) {
    return { nextTransactions: existingTransactions, added: false };
  }

  return {
    nextTransactions: [...toAdd, ...existingTransactions],
    added: true,
  };
}

export function useBudgetData() {
  const [selectedMonth, setSelectedMonthState] = useState<string>(() => {
    if (typeof window === "undefined") return getCurrentMonthKey();
    try {
      const saved = window.localStorage.getItem("denge_budget_selected_month_v1");
      if (saved && /^\d{4}-\d{2}$/.test(saved)) return saved;
    } catch {
      // ignore
    }
    return getCurrentMonthKey();
  });
  const [accounts, setAccounts] = useState<BudgetAccount[]>([]);
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringExpenseRule[]>(
    []
  );
  const [closures, setClosures] = useState<MonthClosure[]>([]);
  const [customCategories, setCustomCategories] =
    useState<BudgetCustomCategories>({ expense: [], income: [] });
  const [monthNotes, setMonthNotes] = useState<MonthNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    budgetStorageAdapter
      .seedIfEmpty()
      .then((snap) => {
        if (!mounted) return;
        const { nextTransactions, added } = materializeRecurringForMonth(
          getCurrentMonthKey(),
          snap.recurringRules,
          snap.transactions
        );
        if (added) {
          void budgetStorageAdapter.saveTransactions(nextTransactions);
        }
        setAccounts(snap.accounts);
        setTransactions(nextTransactions);
        setRecurringRules(snap.recurringRules);
        setClosures(snap.closures ?? []);
        setCustomCategories(
          snap.customCategories ?? { expense: [], income: [] }
        );
        setMonthNotes(snap.monthNotes ?? []);
      })
      .catch((err) => {
        console.error("Bütçe verisi yüklenemedi:", err);
      })
      .finally(() => {
        if (mounted) setIsLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setSelectedMonth = useCallback(
    (nextMonth: string) => {
      setSelectedMonthState(nextMonth);
      try {
        window.localStorage.setItem("denge_budget_selected_month_v1", nextMonth);
      } catch {
        // ignore
      }
      setTransactions((prev) => {
        const { nextTransactions, added } = materializeRecurringForMonth(
          nextMonth,
          recurringRules,
          prev
        );
        if (added) {
          void budgetStorageAdapter.saveTransactions(nextTransactions);
        }
        return nextTransactions;
      });
    },
    [recurringRules]
  );

  const addTransaction = useCallback(
    (input: SaveTransactionInput) => {
      const now = new Date().toISOString();
      const txMonth = input.date.slice(0, 7);
      let recurringRuleId: string | undefined;

      if (
        (input.type === "expense" || input.type === "income") &&
        input.makeRecurring
      ) {
        const dayOfMonth = Math.min(
          28,
          Math.max(1, Number(input.date.split("-")[2]) || 1)
        );
        const newRule: RecurringExpenseRule = {
          id: generateBudgetId(),
          type: input.type,
          title: input.title.trim(),
          amount: input.amount,
          category: input.category,
          accountId: input.accountId,
          dayOfMonth,
          isActive: true,
          startMonth: txMonth,
          createdAt: now,
        };
        recurringRuleId = newRule.id;
        setRecurringRules((prev) => {
          const updated = [newRule, ...prev];
          void budgetStorageAdapter.saveRecurringRules(updated);
          return updated;
        });
      }

      const newTx: BudgetTransaction = {
        id: generateBudgetId(),
        type: input.type,
        amount: input.amount,
        title: input.title.trim(),
        category: input.type === "transfer" ? "Transfer" : input.category,
        accountId: input.accountId,
        toAccountId:
          input.type === "transfer" ? input.toAccountId : undefined,
        sourceIncomeId:
          input.type === "transfer" ? input.sourceIncomeId : undefined,
        date: input.date,
        note: input.note?.trim() || undefined,
        scope: input.scope ?? "monthly",
        savingsAmount:
          input.type === "income" &&
          (input.scope ?? "monthly") === "monthly" &&
          input.savingsAmount &&
          input.savingsAmount > 0
            ? input.savingsAmount
            : undefined,
        recurringRuleId,
        createdAt: now,
        updatedAt: now,
      };

      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        void budgetStorageAdapter.saveTransactions(updated);
        return updated;
      });
    },
    []
  );

  const updateTransaction = useCallback(
    (id: string, patch: Partial<BudgetTransaction>) => {
      const now = new Date().toISOString();
      setTransactions((prev) => {
        const updated = prev.map((tx) =>
          tx.id === id ? { ...tx, ...patch, updatedAt: now } : tx
        );
        void budgetStorageAdapter.saveTransactions(updated);
        return updated;
      });
    },
    []
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.id !== id);
      void budgetStorageAdapter.saveTransactions(updated);
      return updated;
    });
  }, []);

  const addAccount = useCallback(
    (name: string, kind: AccountKind, assetType: AssetType = "money") => {
      const newAcc: BudgetAccount = {
        id: generateBudgetId(),
        name: name.trim(),
        kind,
        assetType,
        isDefault: false,
        createdAt: new Date().toISOString(),
      };
      setAccounts((prev) => {
        const updated = [...prev, newAcc];
        void budgetStorageAdapter.saveAccounts(updated);
        return updated;
      });
      return newAcc;
    },
    []
  );

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      void budgetStorageAdapter.saveAccounts(updated);
      return updated;
    });
  }, []);

  const addRecurringRule = useCallback(
    (input: {
      type?: "expense" | "income";
      title: string;
      amount: number;
      category: string;
      accountId: string;
      dayOfMonth: number;
    }) => {
      const now = new Date().toISOString();
      const newRule: RecurringExpenseRule = {
        id: generateBudgetId(),
        type: input.type ?? "expense",
        title: input.title.trim(),
        amount: input.amount,
        category: input.category,
        accountId: input.accountId,
        dayOfMonth: Math.min(28, Math.max(1, input.dayOfMonth)),
        isActive: true,
        startMonth: selectedMonth,
        createdAt: now,
      };

      setRecurringRules((prev) => {
        const updated = [newRule, ...prev];
        void budgetStorageAdapter.saveRecurringRules(updated);
        return updated;
      });

      setTransactions((prev) => {
        const { nextTransactions, added } = materializeRecurringForMonth(
          selectedMonth,
          [newRule],
          prev
        );
        if (added) {
          void budgetStorageAdapter.saveTransactions(nextTransactions);
        }
        return nextTransactions;
      });
    },
    [selectedMonth]
  );

  const toggleRecurringRule = useCallback((id: string) => {
    setRecurringRules((prev) => {
      const updated = prev.map((r) =>
        r.id === id ? { ...r, isActive: !r.isActive } : r
      );
      void budgetStorageAdapter.saveRecurringRules(updated);
      return updated;
    });
  }, []);

  const deleteRecurringRule = useCallback((id: string) => {
    setRecurringRules((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      void budgetStorageAdapter.saveRecurringRules(updated);
      return updated;
    });
  }, []);

  const closeOrUpdateMonth = useCallback(
    (input: {
      monthKey: string;
      netAtClose: number;
      carryOverAmount: number;
      toTotalAmount: number;
      accountId: string;
      savingsAction?: "to_total" | "keep_in_month";
    }) => {
      const now = new Date().toISOString();
      const newClosure: MonthClosure = {
        monthKey: input.monthKey,
        netAtClose: input.netAtClose,
        carryOverAmount: Math.max(0, input.carryOverAmount),
        toTotalAmount: Math.max(0, input.toTotalAmount),
        accountId: input.accountId,
        closedAt: now,
      };

      setClosures((prev) => {
        const filtered = prev.filter((c) => c.monthKey !== input.monthKey);
        const updated = [newClosure, ...filtered];
        void budgetStorageAdapter.saveClosures(updated);
        return updated;
      });

      const nextMonth = shiftMonthKey(input.monthKey, 1);
      const label = formatMonthLabel(input.monthKey);

      setTransactions((prev) => {
        let monthSavingsTotal = 0;
        let savingsAccountId = input.accountId;

        const base = prev
          .filter((tx) => tx.closureSourceMonth !== input.monthKey)
          .map((tx) => {
            if (
              input.savingsAction &&
              (tx.scope ?? "monthly") === "monthly" &&
              tx.type === "income" &&
              tx.date.startsWith(input.monthKey) &&
              tx.savingsAmount &&
              tx.savingsAmount > 0
            ) {
              monthSavingsTotal += tx.savingsAmount;
              savingsAccountId = tx.accountId;
              if (input.savingsAction === "to_total") {
                return {
                  ...tx,
                  amount: Math.max(0, tx.amount - tx.savingsAmount),
                  savingsAmount: undefined,
                  updatedAt: now,
                };
              }
              return {
                ...tx,
                savingsAmount: undefined,
                updatedAt: now,
              };
            }
            return tx;
          });

        const extraTxs: BudgetTransaction[] = [];

        if (input.savingsAction === "to_total" && monthSavingsTotal > 0) {
          extraTxs.push({
            id: generateBudgetId(),
            type: "income",
            amount: monthSavingsTotal,
            title: `Tasarruf Payı (${label})`,
            category: "Yatırım",
            accountId: savingsAccountId,
            date: `${input.monthKey}-28`,
            scope: "overview",
            note: `${label} gelirinden ayrılan tasarruf payı`,
            closureSourceMonth: input.monthKey,
            createdAt: now,
            updatedAt: now,
          });
        }

        if (input.carryOverAmount > 0) {
          const isSurplus = input.netAtClose >= 0;
          extraTxs.push({
            id: generateBudgetId(),
            type: isSurplus ? "income" : "expense",
            amount: input.carryOverAmount,
            title: isSurplus
              ? `Devreden Fazlalık (${label})`
              : `Devreden Açık (${label})`,
            category: isSurplus ? "Ek Gelir" : "Diğer",
            accountId: input.accountId,
            date: `${nextMonth}-01`,
            note: `${label} ay kapanışından otomatik aktarıldı`,
            excludeFromOverviewBalance: true,
            closureSourceMonth: input.monthKey,
            createdAt: now,
            updatedAt: now,
          });
        }

        const updated = [...extraTxs, ...base];
        void budgetStorageAdapter.saveTransactions(updated);
        return updated;
      });
    },
    []
  );

  const reopenMonth = useCallback((monthKey: string) => {
    setClosures((prev) => {
      const updated = prev.filter((c) => c.monthKey !== monthKey);
      void budgetStorageAdapter.saveClosures(updated);
      return updated;
    });
    setTransactions((prev) => {
      const updated = prev.filter((tx) => tx.closureSourceMonth !== monthKey);
      void budgetStorageAdapter.saveTransactions(updated);
      return updated;
    });
  }, []);

  const importNotionFinanceData = useCallback(() => {
    const notionTxs = buildNotionFinanceTransactions();
    setAccounts(NOTION_ACCOUNTS);
    setTransactions(notionTxs);
    setRecurringRules([]);
    setClosures([]);
    void budgetStorageAdapter.saveAccounts(NOTION_ACCOUNTS);
    void budgetStorageAdapter.saveTransactions(notionTxs);
    void budgetStorageAdapter.saveRecurringRules([]);
    void budgetStorageAdapter.saveClosures([]);
    setSelectedMonthState("2026-10");
  }, []);

  const importNotion2026Data = useCallback(() => {
    const monthly2026 = buildNotion2026Transactions().map((tx) => ({
      ...tx,
      excludeFromOverviewBalance: true,
    }));
    const monthly2025 = buildNotion2025Transactions().map((tx) => ({
      ...tx,
      excludeFromOverviewBalance: true,
    }));
    const allTxs = [
      ...buildNotionOverviewTransactions(),
      ...monthly2026,
      ...monthly2025,
    ];
    setAccounts(NOTION_UNIFIED_ACCOUNTS);
    setTransactions(allTxs);
    setRecurringRules([]);
    setClosures([]);
    void budgetStorageAdapter.saveAccounts(NOTION_UNIFIED_ACCOUNTS);
    void budgetStorageAdapter.saveTransactions(allTxs);
    void budgetStorageAdapter.saveRecurringRules([]);
    void budgetStorageAdapter.saveClosures([]);
    setSelectedMonthState("2026-11");
  }, []);

  // Transactions in the currently selected month (excluding overview-only entries)
  const monthTransactions = useMemo(
    () =>
      transactions
        .filter(
          (tx) =>
            (tx.scope ?? "monthly") === "monthly" &&
            tx.date.startsWith(selectedMonth)
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth]
  );

  // Account balances (total up to selected month + selected month net delta)
  const accountStats = useMemo(() => {
    const map: Record<
      string,
      { totalBalance: number; monthDelta: number; txCount: number }
    > = {};
    for (const acc of accounts) {
      map[acc.id] = { totalBalance: 0, monthDelta: 0, txCount: 0 };
    }

    for (const tx of transactions) {
      const txMonth = tx.date.slice(0, 7);
      const isMonthly = (tx.scope ?? "monthly") === "monthly";
      const isUpToSelected = txMonth <= selectedMonth;
      const isInSelected = isMonthly && txMonth === selectedMonth;

      const eff = getEffectiveTxAmount(tx);
      if (tx.type === "income") {
        if (map[tx.accountId]) {
          map[tx.accountId].txCount += 1;
          if (isUpToSelected) map[tx.accountId].totalBalance += eff;
          if (isInSelected) map[tx.accountId].monthDelta += eff;
        }
      } else if (tx.type === "expense") {
        if (map[tx.accountId]) {
          map[tx.accountId].txCount += 1;
          if (isUpToSelected) map[tx.accountId].totalBalance -= eff;
          if (isInSelected) map[tx.accountId].monthDelta -= eff;
        }
      } else if (tx.type === "transfer") {
        if (map[tx.accountId]) {
          map[tx.accountId].txCount += 1;
          if (isUpToSelected) map[tx.accountId].totalBalance -= tx.amount;
          if (isInSelected) map[tx.accountId].monthDelta -= tx.amount;
        }
        if (tx.toAccountId && map[tx.toAccountId]) {
          map[tx.toAccountId].txCount += 1;
          if (isUpToSelected) map[tx.toAccountId].totalBalance += tx.amount;
          if (isInSelected) map[tx.toAccountId].monthDelta += tx.amount;
        }
      }
    }

    return map;
  }, [accounts, transactions, selectedMonth]);

  // Monthly income/expense summary (only "money" accounts, transfers excluded)
  const monthlySummary = useMemo(() => {
    const accountAssetMap: Record<string, AssetType> = {};
    for (const acc of accounts) {
      accountAssetMap[acc.id] = acc.assetType ?? "money";
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;
    const byCategory: Record<string, number> = {};

    for (const tx of monthTransactions) {
      const asset = accountAssetMap[tx.accountId] ?? "money";
      if (asset !== "money") continue;

      const eff = getEffectiveTxAmount(tx);
      if (tx.type === "income") {
        totalIncome += eff;
        if (tx.savingsAmount && tx.savingsAmount > 0) {
          totalSavings += tx.savingsAmount;
        }
      } else if (tx.type === "expense") {
        totalExpense += eff;
        byCategory[tx.category] = (byCategory[tx.category] ?? 0) + eff;
      }
    }

    const categoryBreakdown = Object.entries(byCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome,
      totalExpense,
      totalSavings,
      netBalance: totalIncome - totalExpense,
      categoryBreakdown,
    };
  }, [monthTransactions, accounts]);

  // Overall all-time account balances & Total page overview (grouped by AssetType)
  const overallStats = useMemo(() => {
    const allTimeAccountBalances: Record<string, number> = {};
    const accountAssetMap: Record<string, AssetType> = {};
    for (const acc of accounts) {
      allTimeAccountBalances[acc.id] = 0;
      accountAssetMap[acc.id] = acc.assetType ?? "money";
    }

    const monthMap: Record<
      string,
      { income: number; expense: number; net: number }
    > = {};

    const overviewTransactions: BudgetTransaction[] = [];
    let overviewIncome = 0;
    let overviewExpense = 0;

    for (const tx of transactions) {
      const isOverview = tx.scope === "overview";
      const mk = tx.date.slice(0, 7);
      if (!monthMap[mk]) {
        monthMap[mk] = { income: 0, expense: 0, net: 0 };
      }

      const txAsset = accountAssetMap[tx.accountId] ?? "money";

      if (isOverview) {
        overviewTransactions.push(tx);
        if (txAsset === "money") {
          if (tx.type === "income") overviewIncome += tx.amount;
          else if (tx.type === "expense") overviewExpense += tx.amount;
        }
      }

      const eff = getEffectiveTxAmount(tx);
      if (tx.type === "income") {
        if (!isOverview && txAsset === "money") {
          monthMap[mk].income += eff;
          monthMap[mk].net += eff;
        }
        if (
          !tx.excludeFromOverviewBalance &&
          allTimeAccountBalances[tx.accountId] !== undefined
        ) {
          allTimeAccountBalances[tx.accountId] += eff;
        }
      } else if (tx.type === "expense") {
        if (!isOverview && txAsset === "money") {
          monthMap[mk].expense += eff;
          monthMap[mk].net -= eff;
        }
        if (
          !tx.excludeFromOverviewBalance &&
          allTimeAccountBalances[tx.accountId] !== undefined
        ) {
          allTimeAccountBalances[tx.accountId] -= eff;
        }
      } else if (tx.type === "transfer") {
        if (
          !tx.excludeFromOverviewBalance &&
          allTimeAccountBalances[tx.accountId] !== undefined
        ) {
          allTimeAccountBalances[tx.accountId] -= tx.amount;
        }
        if (
          !tx.excludeFromOverviewBalance &&
          tx.toAccountId &&
          allTimeAccountBalances[tx.toAccountId] !== undefined
        ) {
          allTimeAccountBalances[tx.toAccountId] += tx.amount;
        }
      }
    }

    overviewTransactions.sort((a, b) => b.date.localeCompare(a.date));

    const currentMk = getCurrentMonthKey();
    if (!monthMap[currentMk]) {
      monthMap[currentMk] = { income: 0, expense: 0, net: 0 };
    }
    for (const c of closures) {
      if (!monthMap[c.monthKey]) {
        monthMap[c.monthKey] = { income: 0, expense: 0, net: 0 };
      }
    }

    const monthsOverview = Object.entries(monthMap)
      .map(([monthKey, sums]) => ({
        monthKey,
        ...sums,
        closure: closures.find((c) => c.monthKey === monthKey) ?? null,
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

    const totalsByAssetType: Record<AssetType, number> = {
      money: 0,
      gold: 0,
      stock: 0,
    };
    const presentAssetTypesSet = new Set<AssetType>();

    for (const acc of accounts) {
      const aType: AssetType = acc.assetType ?? "money";
      presentAssetTypesSet.add(aType);
      totalsByAssetType[aType] += allTimeAccountBalances[acc.id] ?? 0;
    }

    const presentAssetTypes = (["money", "gold", "stock"] as AssetType[]).filter(
      (t) => presentAssetTypesSet.has(t)
    );

    const totalVaultReserve = closures.reduce((sum, c) => {
      const sign = c.netAtClose >= 0 ? 1 : -1;
      return sum + sign * c.toTotalAmount;
    }, 0);

    return {
      allTimeAccountBalances,
      totalsByAssetType,
      presentAssetTypes,
      totalVaultReserve,
      monthsOverview,
      overviewTransactions,
      overviewTotals: {
        income: overviewIncome,
        expense: overviewExpense,
        net: overviewIncome - overviewExpense,
      },
    };
  }, [accounts, transactions, closures]);

  const expenseCategories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    const push = (cat: string) => {
      const trimmed = cat.trim();
      if (!trimmed) return;
      const key = trimmed.toLocaleLowerCase("tr-TR");
      if (seen.has(key)) return;
      seen.add(key);
      list.push(trimmed);
    };
    for (const c of EXPENSE_CATEGORIES) push(c);
    for (const c of customCategories.expense) push(c);
    for (const tx of transactions) {
      if (tx.type === "expense") push(tx.category);
    }
    for (const r of recurringRules) {
      if ((r.type ?? "expense") === "expense") push(r.category);
    }
    return list;
  }, [customCategories.expense, transactions, recurringRules]);

  const incomeCategories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    const push = (cat: string) => {
      const trimmed = cat.trim();
      if (!trimmed) return;
      const key = trimmed.toLocaleLowerCase("tr-TR");
      if (seen.has(key)) return;
      seen.add(key);
      list.push(trimmed);
    };
    for (const c of INCOME_CATEGORIES) push(c);
    for (const c of customCategories.income) push(c);
    for (const tx of transactions) {
      if (tx.type === "income") push(tx.category);
    }
    for (const r of recurringRules) {
      if (r.type === "income") push(r.category);
    }
    return list;
  }, [customCategories.income, transactions, recurringRules]);

  const addCategory = useCallback(
    (type: "expense" | "income", rawName: string): string => {
      const trimmed = rawName.trim();
      if (!trimmed) return "";
      const existingList =
        type === "expense" ? expenseCategories : incomeCategories;
      const existingMatch = existingList.find(
        (c) => c.toLocaleLowerCase("tr-TR") === trimmed.toLocaleLowerCase("tr-TR")
      );
      if (existingMatch) return existingMatch;

      setCustomCategories((prev) => {
        const next: BudgetCustomCategories = {
          ...prev,
          [type]: [...prev[type], trimmed],
        };
        void budgetStorageAdapter.saveCustomCategories(next);
        return next;
      });
      return trimmed;
    },
    [expenseCategories, incomeCategories]
  );

  const saveMonthNote = useCallback((monthKey: string, content: string) => {
    const now = new Date().toISOString();
    setMonthNotes((prev) => {
      const filtered = prev.filter((n) => n.monthKey !== monthKey);
      const updated = content.trim()
        ? [{ monthKey, content, updatedAt: now }, ...filtered]
        : filtered;
      void budgetStorageAdapter.saveMonthNotes(updated);
      return updated;
    });
  }, []);

  return {
    isLoaded,
    selectedMonth,
    setSelectedMonth,
    accounts,
    transactions,
    monthTransactions,
    recurringRules,
    closures,
    monthNotes,
    expenseCategories,
    incomeCategories,
    accountStats,
    monthlySummary,
    overallStats,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    deleteAccount,
    addCategory,
    saveMonthNote,
    addRecurringRule,
    toggleRecurringRule,
    deleteRecurringRule,
    closeOrUpdateMonth,
    reopenMonth,
    importNotionFinanceData,
    importNotion2026Data,
  };
}
