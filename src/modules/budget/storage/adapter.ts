import type {
  BudgetAccount,
  BudgetCustomCategories,
  BudgetTransaction,
  MonthClosure,
  MonthNote,
  RecurringExpenseRule,
} from "../types";

export interface BudgetSnapshot {
  accounts: BudgetAccount[];
  transactions: BudgetTransaction[];
  recurringRules: RecurringExpenseRule[];
  closures: MonthClosure[];
  customCategories?: BudgetCustomCategories;
  monthNotes?: MonthNote[];
}

export interface BudgetStorageAdapter {
  getAccounts(): Promise<BudgetAccount[]>;
  saveAccounts(accounts: BudgetAccount[]): Promise<void>;

  getTransactions(): Promise<BudgetTransaction[]>;
  saveTransactions(transactions: BudgetTransaction[]): Promise<void>;

  getRecurringRules(): Promise<RecurringExpenseRule[]>;
  saveRecurringRules(rules: RecurringExpenseRule[]): Promise<void>;

  getClosures(): Promise<MonthClosure[]>;
  saveClosures(closures: MonthClosure[]): Promise<void>;

  getCustomCategories(): Promise<BudgetCustomCategories>;
  saveCustomCategories(categories: BudgetCustomCategories): Promise<void>;

  getMonthNotes(): Promise<MonthNote[]>;
  saveMonthNotes(notes: MonthNote[]): Promise<void>;

  seedIfEmpty(): Promise<BudgetSnapshot>;
}
