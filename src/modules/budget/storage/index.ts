import type { BudgetStorageAdapter } from "./adapter";
import { LocalBudgetStorageAdapter } from "./local-adapter";

export const budgetStorageAdapter: BudgetStorageAdapter =
  new LocalBudgetStorageAdapter();

export type { BudgetStorageAdapter };
