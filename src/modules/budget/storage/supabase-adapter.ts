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
import type { BudgetSnapshot, BudgetStorageAdapter } from "./adapter";
import { createBudgetSeedData } from "./seed";
import {
  getSupabaseUserId,
  getValidAccessToken,
} from "@/lib/supabase/auth";

interface DbAccountRow {
  id: string;
  name: string;
  kind: AccountKind;
  asset_type: AssetType;
  is_default: boolean;
  created_at: string;
}

interface DbTransactionRow {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  account_id: string;
  to_account_id: string | null;
  source_income_id: string | null;
  date: string;
  note: string | null;
  scope: TransactionScope;
  savings_amount: number | null;
  exclude_from_overview_balance: boolean;
  recurring_rule_id: string | null;
  installment_label: string | null;
  closure_source_month: string | null;
  created_at: string;
  updated_at: string;
}

interface DbRecurringRow {
  id: string;
  type: "expense" | "income";
  title: string;
  amount: number;
  category: string;
  account_id: string;
  day_of_month: number;
  is_active: boolean;
  start_month: string;
  is_installment: boolean;
  start_installment: number | null;
  total_installments: number | null;
  created_at: string;
}

interface DbClosureRow {
  month_key: string;
  net_at_close: number;
  carry_over_amount: number;
  to_total_amount: number;
  account_id: string;
  closed_at: string;
}

interface DbCustomCategoryRow {
  id?: string;
  type: "expense" | "income";
  name: string;
}

interface DbMonthNoteRow {
  month_key: string;
  content: string;
  updated_at: string;
}

function getConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, key };
}

async function sbFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { url, key } = getConfig();
  const token = await getValidAccessToken();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error (${res.status}) on ${path}: ${text}`);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function fetchAllRows<T>(tablePath: string): Promise<T[]> {
  const pageSize = 1000;
  let offset = 0;
  const all: T[] = [];

  while (true) {
    const batch = await sbFetch<T[]>(tablePath, {
      headers: {
        Range: `${offset}-${offset + pageSize - 1}`,
      },
    });
    all.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

async function upsertInChunks<T>(
  table: string,
  rows: T[],
  onConflict = "id"
): Promise<void> {
  if (rows.length === 0) return;
  const userId = getSupabaseUserId();
  const rowsWithUser = userId
    ? rows.map((r) => ({ ...r, user_id: userId }))
    : rows;
  const chunkSize = 250;
  for (let i = 0; i < rowsWithUser.length; i += chunkSize) {
    const chunk = rowsWithUser.slice(i, i + chunkSize);
    await sbFetch(`${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
  }
}

async function syncTableByKey<T>(
  table: string,
  keyCol: string,
  rows: T[],
  getKey: (row: T) => string
): Promise<void> {
  const existing = await fetchAllRows<Record<string, string>>(
    `${table}?select=${keyCol}`
  );
  const nextKeys = new Set(rows.map(getKey));
  const toDelete = existing
    .map((r) => r[keyCol])
    .filter((k) => !nextKeys.has(k));

  await upsertInChunks(table, rows, keyCol);

  if (toDelete.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const ids = toDelete
        .slice(i, i + chunkSize)
        .map((id) => `"${id.replace(/"/g, '\\"')}"`)
        .join(",");
      await sbFetch(`${table}?${keyCol}=in.(${encodeURIComponent(ids)})`, {
        method: "DELETE",
      });
    }
  }
}

function mapDbAccount(r: DbAccountRow): BudgetAccount {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    assetType: r.asset_type ?? "money",
    isDefault: r.is_default,
    createdAt: r.created_at,
  };
}

function toDbAccount(a: BudgetAccount): DbAccountRow {
  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    asset_type: a.assetType ?? "money",
    is_default: Boolean(a.isDefault),
    created_at: a.createdAt,
  };
}

function mapDbTx(r: DbTransactionRow): BudgetTransaction {
  return {
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    title: r.title,
    category: r.category,
    accountId: r.account_id,
    toAccountId: r.to_account_id ?? undefined,
    sourceIncomeId: r.source_income_id ?? undefined,
    date: r.date,
    note: r.note ?? undefined,
    scope: r.scope ?? "monthly",
    savingsAmount:
      r.savings_amount !== null && r.savings_amount !== undefined
        ? Number(r.savings_amount)
        : undefined,
    excludeFromOverviewBalance: r.exclude_from_overview_balance || undefined,
    recurringRuleId: r.recurring_rule_id ?? undefined,
    installmentLabel: r.installment_label ?? undefined,
    closureSourceMonth: r.closure_source_month ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toDbTx(t: BudgetTransaction): DbTransactionRow {
  return {
    id: t.id,
    type: t.type,
    amount: t.amount,
    title: t.title,
    category: t.category,
    account_id: t.accountId,
    to_account_id: t.toAccountId ?? null,
    source_income_id: t.sourceIncomeId ?? null,
    date: t.date,
    note: t.note ?? null,
    scope: t.scope ?? "monthly",
    savings_amount: t.savingsAmount ?? null,
    exclude_from_overview_balance: Boolean(t.excludeFromOverviewBalance),
    recurring_rule_id: t.recurringRuleId ?? null,
    installment_label: t.installmentLabel ?? null,
    closure_source_month: t.closureSourceMonth ?? null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
  };
}

function mapDbRecurring(r: DbRecurringRow): RecurringExpenseRule {
  return {
    id: r.id,
    type: r.type ?? "expense",
    title: r.title,
    amount: Number(r.amount),
    category: r.category,
    accountId: r.account_id,
    dayOfMonth: r.day_of_month,
    isActive: r.is_active,
    startMonth: r.start_month,
    isInstallment: r.is_installment || undefined,
    startInstallment: r.start_installment ?? undefined,
    totalInstallments: r.total_installments ?? undefined,
    createdAt: r.created_at,
  };
}

function toDbRecurring(r: RecurringExpenseRule): DbRecurringRow {
  return {
    id: r.id,
    type: r.type ?? "expense",
    title: r.title,
    amount: r.amount,
    category: r.category,
    account_id: r.accountId,
    day_of_month: r.dayOfMonth,
    is_active: r.isActive,
    start_month: r.startMonth,
    is_installment: Boolean(r.isInstallment),
    start_installment: r.startInstallment ?? null,
    total_installments: r.totalInstallments ?? null,
    created_at: r.createdAt,
  };
}

function mapDbClosure(r: DbClosureRow): MonthClosure {
  return {
    monthKey: r.month_key,
    netAtClose: Number(r.net_at_close),
    carryOverAmount: Number(r.carry_over_amount),
    toTotalAmount: Number(r.to_total_amount),
    accountId: r.account_id,
    closedAt: r.closed_at,
  };
}

function toDbClosure(c: MonthClosure): DbClosureRow {
  return {
    month_key: c.monthKey,
    net_at_close: c.netAtClose,
    carry_over_amount: c.carryOverAmount,
    to_total_amount: c.toTotalAmount,
    account_id: c.accountId,
    closed_at: c.closedAt,
  };
}

export class SupabaseBudgetStorageAdapter implements BudgetStorageAdapter {
  async getAccounts(): Promise<BudgetAccount[]> {
    const rows = await fetchAllRows<DbAccountRow>(
      "budget_accounts?select=*&order=created_at.asc"
    );
    return rows.map(mapDbAccount);
  }

  async saveAccounts(accounts: BudgetAccount[]): Promise<void> {
    await syncTableByKey(
      "budget_accounts",
      "id",
      accounts.map(toDbAccount),
      (r) => r.id
    );
  }

  async getTransactions(): Promise<BudgetTransaction[]> {
    const rows = await fetchAllRows<DbTransactionRow>(
      "budget_transactions?select=*&order=date.desc"
    );
    return rows.map(mapDbTx);
  }

  async saveTransactions(transactions: BudgetTransaction[]): Promise<void> {
    await syncTableByKey(
      "budget_transactions",
      "id",
      transactions.map(toDbTx),
      (r) => r.id
    );
  }

  async getRecurringRules(): Promise<RecurringExpenseRule[]> {
    const rows = await fetchAllRows<DbRecurringRow>(
      "budget_recurring_rules?select=*&order=created_at.desc"
    );
    return rows.map(mapDbRecurring);
  }

  async saveRecurringRules(rules: RecurringExpenseRule[]): Promise<void> {
    await syncTableByKey(
      "budget_recurring_rules",
      "id",
      rules.map(toDbRecurring),
      (r) => r.id
    );
  }

  async getClosures(): Promise<MonthClosure[]> {
    const rows = await fetchAllRows<DbClosureRow>(
      "budget_closures?select=*&order=month_key.desc"
    );
    return rows.map(mapDbClosure);
  }

  async saveClosures(closures: MonthClosure[]): Promise<void> {
    await syncTableByKey(
      "budget_closures",
      "month_key",
      closures.map(toDbClosure),
      (r) => r.month_key
    );
  }

  async getCustomCategories(): Promise<BudgetCustomCategories> {
    const rows = await fetchAllRows<DbCustomCategoryRow>(
      "budget_custom_categories?select=type,name"
    );
    return {
      expense: rows.filter((r) => r.type === "expense").map((r) => r.name),
      income: rows.filter((r) => r.type === "income").map((r) => r.name),
    };
  }

  async saveCustomCategories(
    categories: BudgetCustomCategories
  ): Promise<void> {
    await sbFetch("budget_custom_categories?type=in.(expense,income)", {
      method: "DELETE",
    });
    const userId = getSupabaseUserId();
    const rows: (DbCustomCategoryRow & { user_id?: string })[] = [
      ...categories.expense.map((name) => ({
        type: "expense" as const,
        name,
        ...(userId ? { user_id: userId } : {}),
      })),
      ...categories.income.map((name) => ({
        type: "income" as const,
        name,
        ...(userId ? { user_id: userId } : {}),
      })),
    ];
    if (rows.length > 0) {
      await sbFetch("budget_custom_categories", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(rows),
      });
    }
  }

  async getMonthNotes(): Promise<MonthNote[]> {
    const rows = await fetchAllRows<DbMonthNoteRow>(
      "budget_month_notes?select=*&order=month_key.desc"
    );
    return rows.map((r) => ({
      monthKey: r.month_key,
      content: r.content,
      updatedAt: r.updated_at,
    }));
  }

  async saveMonthNotes(notes: MonthNote[]): Promise<void> {
    await syncTableByKey(
      "budget_month_notes",
      "month_key",
      notes.map((n) => ({
        month_key: n.monthKey,
        content: n.content,
        updated_at: n.updatedAt,
      })),
      (r) => r.month_key
    );
  }

  async seedIfEmpty(): Promise<BudgetSnapshot> {
    const existingAccounts = await this.getAccounts();
    if (existingAccounts.length > 0) {
      const [
        transactions,
        recurringRules,
        closures,
        customCategories,
        monthNotes,
      ] = await Promise.all([
        this.getTransactions(),
        this.getRecurringRules(),
        this.getClosures(),
        this.getCustomCategories(),
        this.getMonthNotes(),
      ]);
      return {
        accounts: existingAccounts,
        transactions,
        recurringRules,
        closures,
        customCategories,
        monthNotes,
      };
    }

    const seed = createBudgetSeedData();
    await this.saveAccounts(seed.accounts);
    await Promise.all([
      this.saveTransactions(seed.transactions),
      this.saveRecurringRules(seed.recurringRules),
      this.saveClosures(seed.closures),
    ]);
    return seed;
  }
}
