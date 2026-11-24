import type {
  BudgetAccount,
  BudgetCustomCategories,
  BudgetTransaction,
  MonthClosure,
  MonthNote,
  RecurringExpenseRule,
} from "../types";
import type { BudgetSnapshot, BudgetStorageAdapter } from "./adapter";
import { createBudgetSeedData } from "./seed";

const ACCOUNTS_KEY = "denge_budget_accounts_v1";
const TRANSACTIONS_KEY = "denge_budget_transactions_v1";
const RECURRING_KEY = "denge_budget_recurring_v1";
const CLOSURES_KEY = "denge_budget_closures_v1";
const CATEGORIES_KEY = "denge_budget_custom_categories_v1";
const MONTH_NOTES_KEY = "denge_budget_month_notes_v1";
const SEEDED_KEY = "denge_budget_seeded_v1";

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Budget localStorage write error (${key}):`, err);
  }
}

export class LocalBudgetStorageAdapter implements BudgetStorageAdapter {
  async getAccounts(): Promise<BudgetAccount[]> {
    return safeRead<BudgetAccount[]>(ACCOUNTS_KEY, []);
  }

  async saveAccounts(accounts: BudgetAccount[]): Promise<void> {
    safeWrite(ACCOUNTS_KEY, accounts);
  }

  async getTransactions(): Promise<BudgetTransaction[]> {
    return safeRead<BudgetTransaction[]>(TRANSACTIONS_KEY, []);
  }

  async saveTransactions(transactions: BudgetTransaction[]): Promise<void> {
    safeWrite(TRANSACTIONS_KEY, transactions);
  }

  async getRecurringRules(): Promise<RecurringExpenseRule[]> {
    return safeRead<RecurringExpenseRule[]>(RECURRING_KEY, []);
  }

  async saveRecurringRules(rules: RecurringExpenseRule[]): Promise<void> {
    safeWrite(RECURRING_KEY, rules);
  }

  async getClosures(): Promise<MonthClosure[]> {
    return safeRead<MonthClosure[]>(CLOSURES_KEY, []);
  }

  async saveClosures(closures: MonthClosure[]): Promise<void> {
    safeWrite(CLOSURES_KEY, closures);
  }

  async getCustomCategories(): Promise<BudgetCustomCategories> {
    return safeRead<BudgetCustomCategories>(CATEGORIES_KEY, {
      expense: [],
      income: [],
    });
  }

  async saveCustomCategories(
    categories: BudgetCustomCategories
  ): Promise<void> {
    safeWrite(CATEGORIES_KEY, categories);
  }

  async getMonthNotes(): Promise<MonthNote[]> {
    return safeRead<MonthNote[]>(MONTH_NOTES_KEY, []);
  }

  async saveMonthNotes(notes: MonthNote[]): Promise<void> {
    safeWrite(MONTH_NOTES_KEY, notes);
  }

  async seedIfEmpty(): Promise<BudgetSnapshot> {
    if (typeof window === "undefined") {
      return {
        accounts: [],
        transactions: [],
        recurringRules: [],
        closures: [],
        customCategories: { expense: [], income: [] },
        monthNotes: [],
      };
    }

    try {
      const alreadySeeded = window.localStorage.getItem(SEEDED_KEY);
      if (alreadySeeded) {
        const [
          accounts,
          transactions,
          recurringRules,
          closures,
          customCategories,
          monthNotes,
        ] = await Promise.all([
          this.getAccounts(),
          this.getTransactions(),
          this.getRecurringRules(),
          this.getClosures(),
          this.getCustomCategories(),
          this.getMonthNotes(),
        ]);
        return {
          accounts,
          transactions,
          recurringRules,
          closures,
          customCategories,
          monthNotes,
        };
      }

      const seed = createBudgetSeedData();
      safeWrite(ACCOUNTS_KEY, seed.accounts);
      safeWrite(TRANSACTIONS_KEY, seed.transactions);
      safeWrite(RECURRING_KEY, seed.recurringRules);
      safeWrite(CLOSURES_KEY, seed.closures);
      window.localStorage.setItem(SEEDED_KEY, "true");
      return seed;
    } catch {
      return {
        accounts: [],
        transactions: [],
        recurringRules: [],
        closures: [],
      };
    }
  }
}
