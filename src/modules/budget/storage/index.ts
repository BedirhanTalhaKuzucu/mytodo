import type { BudgetStorageAdapter } from "./adapter";
import { LocalBudgetStorageAdapter } from "./local-adapter";
import { SupabaseBudgetStorageAdapter } from "./supabase-adapter";

const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const budgetStorageAdapter: BudgetStorageAdapter = hasSupabaseConfig
  ? new SupabaseBudgetStorageAdapter()
  : new LocalBudgetStorageAdapter();

export type { BudgetStorageAdapter };
