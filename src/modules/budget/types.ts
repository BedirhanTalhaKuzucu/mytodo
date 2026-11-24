export type AccountKind = "bank" | "cash" | "card" | "other";

export type AssetType = "money" | "gold" | "stock";

export type TransactionScope = "monthly" | "overview";

export interface BudgetAccount {
  id: string;
  name: string;
  kind: AccountKind;
  assetType?: AssetType; // Defaults to "money"
  isDefault?: boolean;
  createdAt: string;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface BudgetTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  title: string;
  category: string;
  accountId: string; // Source account for expense/transfer, target account for income
  toAccountId?: string; // Target account when type === "transfer"
  sourceIncomeId?: string; // Optional income row from which transfer is deducted in UI
  date: string; // YYYY-MM-DD
  note?: string;
  scope?: TransactionScope;
  savingsAmount?: number;
  excludeFromOverviewBalance?: boolean;
  recurringRuleId?: string;
  installmentLabel?: string;
  closureSourceMonth?: string; // YYYY-MM if auto-created by closing previous month
  createdAt: string;
  updatedAt: string;
}

export interface MonthClosure {
  monthKey: string; // YYYY-MM
  netAtClose: number;
  carryOverAmount: number; // Always >= 0 (magnitude sent to next month as income if net>=0, expense if net<0)
  toTotalAmount: number; // Always >= 0 (magnitude added to Total if net>=0, deducted from Total if net<0)
  accountId: string;
  closedAt: string;
}

export interface RecurringExpenseRule {
  id: string;
  type?: "expense" | "income";
  title: string;
  amount: number;
  category: string;
  accountId: string;
  dayOfMonth: number; // 1 - 28 (safe for all months)
  isActive: boolean;
  startMonth: string; // YYYY-MM
  isInstallment?: boolean;
  startInstallment?: number;
  totalInstallments?: number;
  createdAt: string;
}

export interface BudgetCustomCategories {
  expense: string[];
  income: string[];
}

export interface MonthNote {
  monthKey: string; // YYYY-MM
  content: string; // HTML rich text
  updatedAt: string;
}
