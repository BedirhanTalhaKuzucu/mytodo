import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnvLocal();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

async function sbUpsert(table, rows, onConflict) {
  if (rows.length === 0) return;
  const chunkSize = 250;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      throw new Error(`Failed upsert on ${table} (${res.status}): ${await res.text()}`);
    }
  }
}

async function main() {
  const backupPath = path.join(process.cwd(), "src/modules/budget/storage/notion-backup.json");
  const data = JSON.parse(fs.readFileSync(backupPath, "utf8"));

  console.log(`Uploading ${data.accounts.length} accounts...`);
  await sbUpsert(
    "budget_accounts",
    data.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      kind: a.kind,
      asset_type: a.assetType ?? "money",
      is_default: Boolean(a.isDefault),
      created_at: a.createdAt,
    })),
    "id"
  );

  console.log(`Uploading ${data.transactions.length} transactions...`);
  await sbUpsert(
    "budget_transactions",
    data.transactions.map((t) => ({
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
    })),
    "id"
  );

  console.log(`Uploading ${data.recurringRules.length} recurring rules...`);
  await sbUpsert(
    "budget_recurring_rules",
    data.recurringRules.map((r) => ({
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
    })),
    "id"
  );

  console.log(`Uploading ${data.closures.length} month closures...`);
  await sbUpsert(
    "budget_closures",
    data.closures.map((c) => ({
      month_key: c.monthKey,
      net_at_close: c.netAtClose,
      carry_over_amount: c.carryOverAmount,
      to_total_amount: c.toTotalAmount,
      account_id: c.accountId,
      closed_at: c.closedAt,
    })),
    "month_key"
  );

  console.log("All Budget data imported to Supabase successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
