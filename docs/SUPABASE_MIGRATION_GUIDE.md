# Supabase Migration & Data Import Guide (For Next Code Agent)

This guide explains how to migrate the **Denge Budget** module from `localStorage` (`LocalBudgetStorageAdapter`) to **Supabase (PostgreSQL)** without losing any data or breaking accounting rules.

## 1. Source of Truth JSON Snapshot
All initial Notion-synced data is stored in:
- `src/modules/budget/storage/notion-backup.json` (**4 accounts**, **1,599 transactions**)

### Critical Accounting Flags in `transactions`
Do **NOT** drop these fields during migration — they prevent double-counting:
1. `scope`: `"monthly" | "overview"`
   - `"monthly"`: Appears in the selected month's **Aylık Bütçe** tables and **Ayların Total Özeti**.
   - `"overview"`: Appears in **Genel Durum** (account balances + month accordion), **excluded** from monthly `Gelir` / `Gider` / `Net`.
2. `exclude_from_overview_balance` (`excludeFromOverviewBalance?: boolean`):
   - `true` on historical 2025–2026 Notion monthly rows and month-closure rollover rows (`Devreden Fazlalık` / `Devreden Açık`).
   - These rows appear in monthly tables and `monthsOverview`, but are **excluded** from `allTimeAccountBalances` so they do not double-count against `Finance Tracker` overview rows or previous-month surpluses.
3. `savings_amount` (`savingsAmount?: number`):
   - Optional amount reserved from a monthly `income` row (`effective = amount - savingsAmount`). Settled at month closure (`to_total` or `keep_in_month`).
4. `source_income_id` (`sourceIncomeId?: string`):
   - Optional reference from a `transfer` transaction to the source `income` transaction for UI accordion grouping.
5. `closure_source_month` (`closureSourceMonth?: string`):
   - Links auto-generated rollover/savings transactions to the closed `month_key` (`YYYY-MM`).

---

## 2. Supabase PostgreSQL Schema (SQL)

Run the following SQL in the **Supabase SQL Editor**:

```sql
-- 1. Accounts
create table if not exists public.budget_accounts (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('bank', 'cash', 'card', 'other')),
  asset_type text not null default 'money' check (asset_type in ('money', 'gold', 'stock')),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Transactions
create table if not exists public.budget_transactions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(14, 2) not null check (amount >= 0),
  title text not null,
  category text not null,
  account_id text not null references public.budget_accounts(id) on delete restrict,
  to_account_id text references public.budget_accounts(id) on delete restrict,
  source_income_id text,
  date date not null,
  note text,
  scope text not null default 'monthly' check (scope in ('monthly', 'overview')),
  savings_amount numeric(14, 2),
  exclude_from_overview_balance boolean not null default false,
  recurring_rule_id text,
  closure_source_month text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_budget_tx_date on public.budget_transactions (date desc);
create index if not exists idx_budget_tx_scope on public.budget_transactions (scope);

-- 3. Recurring Rules
create table if not exists public.budget_recurring_rules (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null default 'expense' check (type in ('expense', 'income')),
  title text not null,
  amount numeric(14, 2) not null,
  category text not null,
  account_id text not null references public.budget_accounts(id) on delete restrict,
  day_of_month integer not null check (day_of_month between 1 and 28),
  is_active boolean not null default true,
  start_month text not null,
  created_at timestamptz not null default now()
);

-- 4. Month Closures
create table if not exists public.budget_closures (
  month_key text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  net_at_close numeric(14, 2) not null,
  carry_over_amount numeric(14, 2) not null default 0,
  to_total_amount numeric(14, 2) not null default 0,
  account_id text not null references public.budget_accounts(id) on delete restrict,
  closed_at timestamptz not null default now()
);

-- 5. Custom Categories
create table if not exists public.budget_custom_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, type, name)
);

-- 6. Month Notes (Rich Text HTML)
create table if not exists public.budget_month_notes (
  month_key text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  updated_at timestamptz not null default now()
);
```

*(If enabling Row Level Security / RLS, add policies `auth.uid() = user_id` on each table, or keep `user_id` nullable for single-user setup.)*

---

## 3. Importing `notion-backup.json` into Supabase

Create a one-off Node/TypeScript script (using `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`):

1. Read `src/modules/budget/storage/notion-backup.json`.
2. Upsert `accounts` into `budget_accounts` first (because `budget_transactions.account_id` has a foreign key).
3. Batch-upsert `transactions` in chunks of 500 into `budget_transactions`, mapping camelCase fields to snake_case:
   - `toAccountId` -> `to_account_id`
   - `sourceIncomeId` -> `source_income_id`
   - `savingsAmount` -> `savings_amount`
   - `excludeFromOverviewBalance` -> `exclude_from_overview_balance`
   - `recurringRuleId` -> `recurring_rule_id`
   - `closureSourceMonth` -> `closure_source_month`
4. Verify post-import balances in SQL:
   ```sql
   select
     account_id,
     sum(case when type = 'income' then amount else -amount end) as balance
   from public.budget_transactions
   where exclude_from_overview_balance = false
   group by account_id;
   ```
   Expected result for the baseline snapshot:
   - `acc-default-bank`: `955.55`
   - `notion-acc-portfolio`: `0.00`
   - `notion-acc-euwax`: `54`

---

## 4. Swapping the Storage Adapter in Code (Budget Module)

1. Implement `SupabaseBudgetStorageAdapter implements BudgetStorageAdapter` in `src/modules/budget/storage/supabase-adapter.ts` matching `src/modules/budget/storage/adapter.ts`.
2. Export it from `src/modules/budget/storage/index.ts` (e.g., switch based on `NEXT_PUBLIC_SUPABASE_URL` env var).
3. Keep `src/modules/budget/` isolated from `src/types`, `src/hooks`, and `src/lib/storage`.

---

## 5. Denge Todo & Notes App (Main App) Supabase Migration

The main Todo & Notes app (`src/types/index.ts`, `src/lib/storage/adapter.ts`) also uses a clean `StorageAdapter` repository pattern (`LocalStorageAdapter` in `src/lib/storage/local-adapter.ts`).

### PostgreSQL Schema for Todo & Notes

```sql
-- 1. Tasks
create table if not exists public.tasks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  space text check (space in ('work', 'personal')),
  status text not null default 'todo' check (status in ('todo', 'done')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  due_date date,
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'monthly')),
  subtasks jsonb not null default '[]'::jsonb,
  linked_note_ids text[] not null default '{}',
  tags text[] not null default '{}',
  pomodoro_sessions integer not null default 0,
  pomodoro_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Notes
create table if not exists public.notes (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  space text check (space in ('work', 'personal')),
  is_pinned boolean not null default false,
  linked_task_ids text[] not null default '{}',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Swapping the Main App Adapter
1. Implement `SupabaseStorageAdapter implements StorageAdapter` in `src/lib/storage/supabase-adapter.ts` matching `src/lib/storage/adapter.ts`.
2. Switch `storageAdapter` export in `src/lib/storage/index.ts` when `NEXT_PUBLIC_SUPABASE_URL` is configured.

