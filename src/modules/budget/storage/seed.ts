import type { BudgetSnapshot } from "./adapter";
import notionBackup from "./notion-backup.json";

export function createBudgetSeedData(): BudgetSnapshot {
  const data = notionBackup as unknown as BudgetSnapshot;
  return {
    accounts: data.accounts ?? [],
    transactions: data.transactions ?? [],
    recurringRules: data.recurringRules ?? [],
    closures: data.closures ?? [],
    customCategories: data.customCategories ?? { expense: [], income: [] },
    monthNotes: data.monthNotes ?? [],
  };
}
