import type { BudgetAccount, BudgetTransaction } from "../types";

const HESAP_URL = "https://app.notion.com/p/236eb5170a64817195dbf955917a7ac0";
const EUWAX_URL = "https://app.notion.com/p/286eb5170a6480c492d9ce6136e03e24";

export const NOTION_ACCOUNTS: BudgetAccount[] = [
  {
    id: "notion-acc-hesap",
    name: "Hesap (Ana)",
    kind: "bank",
    assetType: "money",
    isDefault: true,
    createdAt: "2025-07-15T10:00:00.000Z",
  },
  {
    id: "notion-acc-portfolio",
    name: "Portfolio",
    kind: "other",
    assetType: "money",
    isDefault: false,
    createdAt: "2025-07-15T10:00:00.000Z",
  },
  {
    id: "notion-acc-euwax",
    name: "Euwax (Altın)",
    kind: "other",
    assetType: "gold",
    isDefault: false,
    createdAt: "2025-10-06T07:00:00.000Z",
  },
];

function inferCategory(name: string, type: "income" | "expense"): string {
  const lower = name.toLowerCase();
  if (lower.includes("euwax") || lower.includes("euwx") || lower.includes("euro wax")) {
    return type === "income" ? "Yatırım" : "Alışveriş";
  }
  if (lower.includes("vergi iade")) return "İade";
  if (lower.includes("borc")) return type === "income" ? "İade" : "Diğer";
  if (lower.includes("hava")) return "Ulaşım";
  if (lower.includes("eve(") || lower.includes("kyk")) return "Faturalar";
  if (lower.includes("tasarruf") || lower.includes("portfolio")) return "Yatırım";
  return type === "income" ? "Maaş" : "Diğer";
}

function resolveAccountId(accountUrl: string | null): string {
  if (accountUrl === EUWAX_URL) return "notion-acc-euwax";
  if (accountUrl === null) return "notion-acc-portfolio";
  return "notion-acc-hesap";
}

const RAW_INCOME: {
  id: string;
  name: string;
  amount: number;
  date: string;
  accountUrl: string | null;
}[] = [
  { id: "n-inc-1", name: "ekim", amount: 253, date: "2026-10-30", accountUrl: HESAP_URL },
  { id: "n-inc-2", name: "ekim euwax alimi", amount: 3, date: "2026-10-30", accountUrl: EUWAX_URL },
  { id: "n-inc-3", name: "eylül", amount: 460, date: "2026-09-30", accountUrl: HESAP_URL },
  { id: "n-inc-4", name: "eylül euwax alimi", amount: 2, date: "2026-09-30", accountUrl: EUWAX_URL },
  { id: "n-inc-5", name: "agustos 2026", amount: 756, date: "2026-08-31", accountUrl: HESAP_URL },
  { id: "n-inc-6", name: "euwax satin alma agustos", amount: 2, date: "2026-08-31", accountUrl: EUWAX_URL },
  { id: "n-inc-7", name: "temmuz", amount: 23, date: "2026-07-30", accountUrl: HESAP_URL },
  { id: "n-inc-8", name: "hashüs borcunu ödedi", amount: 45, date: "2026-07-04", accountUrl: HESAP_URL },
  { id: "n-inc-9", name: "euwax hazian alim", amount: 2, date: "2026-06-30", accountUrl: EUWAX_URL },
  { id: "n-inc-10", name: "haziran", amount: 271, date: "2026-06-22", accountUrl: HESAP_URL },
  { id: "n-inc-11", name: "vergi iadesi 2025", amount: 980, date: "2026-06-01", accountUrl: HESAP_URL },
  { id: "n-inc-12", name: "mayis", amount: 181, date: "2026-05-30", accountUrl: HESAP_URL },
  { id: "n-inc-13", name: "nisan", amount: 205, date: "2026-04-30", accountUrl: HESAP_URL },
  { id: "n-inc-14", name: "euwax alimi", amount: 2, date: "2026-04-01", accountUrl: EUWAX_URL },
  { id: "n-inc-15", name: "mart ayi tasarruf", amount: 280, date: "2026-03-17", accountUrl: HESAP_URL },
  { id: "n-inc-16", name: "euwax alimi", amount: 2, date: "2026-03-17", accountUrl: EUWAX_URL },
  { id: "n-inc-17", name: "hesaplanamamis para", amount: 332, date: "2026-03-17", accountUrl: HESAP_URL },
  { id: "n-inc-18", name: "euwax alimi kalan parayla", amount: 3, date: "2026-03-17", accountUrl: EUWAX_URL },
  { id: "n-inc-19", name: "subat gelir", amount: 292, date: "2026-02-28", accountUrl: HESAP_URL },
  { id: "n-inc-20", name: "subat euwax alim", amount: 2, date: "2026-02-15", accountUrl: EUWAX_URL },
  { id: "n-inc-21", name: "ocak 2026", amount: 298, date: "2026-01-31", accountUrl: HESAP_URL },
  { id: "n-inc-22", name: "euro wax alim ocak 2026", amount: 2, date: "2026-01-22", accountUrl: EUWAX_URL },
  { id: "n-inc-23", name: "aralik", amount: 265, date: "2025-12-31", accountUrl: HESAP_URL },
  { id: "n-inc-24", name: "euro wax alim", amount: 2, date: "2025-12-10", accountUrl: EUWAX_URL },
  { id: "n-inc-25", name: "kasim", amount: 424, date: "2025-11-30", accountUrl: HESAP_URL },
  { id: "n-inc-26", name: "ekim", amount: 519, date: "2025-10-31", accountUrl: HESAP_URL },
  { id: "n-inc-27", name: "ekim sonu euwax alimi", amount: 3, date: "2025-10-29", accountUrl: EUWAX_URL },
  { id: "n-inc-28", name: "euwax ikici alim(toplu)", amount: 28, date: "2025-10-08", accountUrl: EUWAX_URL },
  { id: "n-inc-29", name: "euwax ilk alim", amount: 1, date: "2025-10-06", accountUrl: EUWAX_URL },
  { id: "n-inc-30", name: "eylül", amount: 389, date: "2025-09-30", accountUrl: HESAP_URL },
  { id: "n-inc-31", name: "agustos", amount: 296, date: "2025-08-31", accountUrl: HESAP_URL },
  { id: "n-inc-32", name: "hesaptaki para", amount: 750, date: "2025-07-15", accountUrl: HESAP_URL },
  { id: "n-inc-33", name: "Portfolio", amount: 3548, date: "2025-07-15", accountUrl: null },
];

const RAW_EXPENSE: {
  id: string;
  name: string;
  amount: number;
  date: string;
  accountUrl: string | null;
}[] = [
  { id: "n-exp-1", name: "ekim gideri", amount: 190, date: "2026-10-30", accountUrl: HESAP_URL },
  { id: "n-exp-2", name: "ekim euwax alimi", amount: 350, date: "2026-10-30", accountUrl: HESAP_URL },
  { id: "n-exp-3", name: "eylül gider", amount: 0, date: "2026-09-30", accountUrl: HESAP_URL },
  { id: "n-exp-4", name: "eylül euwax alimi", amount: 250, date: "2026-09-30", accountUrl: HESAP_URL },
  { id: "n-exp-5", name: "agustos 2026", amount: 22, date: "2026-08-31", accountUrl: HESAP_URL },
  { id: "n-exp-6", name: "euwax agustos alim", amount: 265, date: "2026-08-31", accountUrl: HESAP_URL },
  { id: "n-exp-7", name: "temmuz", amount: 104, date: "2026-07-01", accountUrl: HESAP_URL },
  { id: "n-exp-8", name: "euwax haziran alim", amount: 232.45, date: "2026-06-30", accountUrl: HESAP_URL },
  { id: "n-exp-9", name: "haziran", amount: 14, date: "2026-06-30", accountUrl: HESAP_URL },
  { id: "n-exp-10", name: "vergi iadesi harcanan", amount: 275, date: "2026-06-01", accountUrl: HESAP_URL },
  { id: "n-exp-11", name: "mayis", amount: 639, date: "2026-05-30", accountUrl: HESAP_URL },
  { id: "n-exp-12", name: "nisan", amount: 340, date: "2026-04-30", accountUrl: HESAP_URL },
  { id: "n-exp-13", name: "euwax alimi", amount: 269, date: "2026-04-01", accountUrl: HESAP_URL },
  { id: "n-exp-14", name: "mart gider", amount: 46, date: "2026-03-31", accountUrl: HESAP_URL },
  { id: "n-exp-15", name: "mart euwax alimi", amount: 286, date: "2026-03-17", accountUrl: HESAP_URL },
  { id: "n-exp-16", name: "euwx alimi kalan parayla", amount: 432, date: "2026-03-17", accountUrl: HESAP_URL },
  { id: "n-exp-17", name: "subat gider", amount: 100, date: "2026-02-28", accountUrl: HESAP_URL },
  { id: "n-exp-18", name: "euwax aldim subat", amount: 275, date: "2026-02-15", accountUrl: HESAP_URL },
  { id: "n-exp-19", name: "ocak 2026 gider", amount: 50, date: "2026-01-31", accountUrl: HESAP_URL },
  { id: "n-exp-20", name: "euwax alim 2 adet ocak", amount: 275, date: "2026-01-15", accountUrl: HESAP_URL },
  { id: "n-exp-21", name: "hava gideri", amount: 100, date: "2026-01-01", accountUrl: HESAP_URL },
  { id: "n-exp-22", name: "aralik ayi (Mini job trink geldi eklendince)", amount: 175, date: "2025-12-31", accountUrl: HESAP_URL },
  { id: "n-exp-23", name: "kasim", amount: 308, date: "2025-11-30", accountUrl: HESAP_URL },
  { id: "n-exp-24", name: "ekim", amount: 665, date: "2025-10-31", accountUrl: HESAP_URL },
  { id: "n-exp-25", name: "euwax ixcn portfoliodan harcanan", amount: 3105, date: "2025-10-08", accountUrl: null },
  { id: "n-exp-26", name: "eylül ayi fazla gider", amount: 322, date: "2025-09-30", accountUrl: null },
  { id: "n-exp-27", name: "agustos ayi fazla gider", amount: 241, date: "2025-08-31", accountUrl: null },
  { id: "n-exp-28", name: "eve(heimetland) giden", amount: 80, date: "2025-08-18", accountUrl: HESAP_URL },
  { id: "n-exp-29", name: "kyk borcundan", amount: 8, date: "2025-08-01", accountUrl: HESAP_URL },
  { id: "n-exp-30", name: "temmuz ayi fazla gider", amount: 313, date: "2025-07-28", accountUrl: HESAP_URL },
  { id: "n-exp-31", name: "temmu ayi borc verme /hayir vs", amount: 70, date: "2025-07-28", accountUrl: null },
];

export function buildNotionFinanceTransactions(): BudgetTransaction[] {
  const now = new Date().toISOString();

  const incomes: BudgetTransaction[] = RAW_INCOME.map((row) => ({
    id: row.id,
    type: "income",
    amount: row.amount,
    title: row.name,
    category: inferCategory(row.name, "income"),
    accountId: resolveAccountId(row.accountUrl),
    date: row.date,
    note: "Notion Finance Tracker'dan aktarıldı",
    createdAt: now,
    updatedAt: now,
  }));

  const expenses: BudgetTransaction[] = RAW_EXPENSE.filter(
    (r) => r.amount > 0
  ).map((row) => ({
    id: row.id,
    type: "expense",
    amount: row.amount,
    title: row.name,
    category: inferCategory(row.name, "expense"),
    accountId: resolveAccountId(row.accountUrl),
    date: row.date,
    note: "Notion Finance Tracker'dan aktarıldı",
    createdAt: now,
    updatedAt: now,
  }));

  return [...incomes, ...expenses];
}

export const NOTION_UNIFIED_ACCOUNTS: BudgetAccount[] = [
  {
    id: "acc-default-bank",
    name: "Banka (Ana Hesap)",
    kind: "bank",
    assetType: "money",
    isDefault: true,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "acc-default-cash",
    name: "Nakit",
    kind: "cash",
    assetType: "money",
    isDefault: false,
    createdAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "notion-acc-portfolio",
    name: "Portfolio",
    kind: "other",
    assetType: "money",
    isDefault: false,
    createdAt: "2025-07-15T10:00:00.000Z",
  },
  {
    id: "notion-acc-euwax",
    name: "Euwax (Altın)",
    kind: "other",
    assetType: "gold",
    isDefault: false,
    createdAt: "2025-10-06T07:00:00.000Z",
  },
];

function resolveUnifiedOverviewAccountId(accountUrl: string | null): string {
  if (accountUrl === EUWAX_URL) return "notion-acc-euwax";
  if (accountUrl === null) return "notion-acc-portfolio";
  return "acc-default-bank";
}

export function buildNotionOverviewTransactions(): BudgetTransaction[] {
  const now = new Date().toISOString();

  const incomes: BudgetTransaction[] = [
    ...RAW_INCOME.map((row) => ({
      id: `ov-${row.id}`,
      type: "income" as const,
      amount: row.amount,
      title: row.name,
      category: inferCategory(row.name, "income"),
      accountId: resolveUnifiedOverviewAccountId(row.accountUrl),
      date: row.date,
      scope: "overview" as const,
      note: "Notion Finance Tracker",
      createdAt: now,
      updatedAt: now,
    })),
    {
      id: "ov-portfolio-joker",
      type: "income" as const,
      amount: 190,
      title: "Portföy Dengeleme (Başlangıç)",
      category: "Diğer",
      accountId: "notion-acc-portfolio",
      date: "2025-07-15",
      scope: "overview" as const,
      note: "Notion Finance Tracker'da Account alanı boş bırakılan 5 Portfolio satırının (Gelir: +3.548 € | Giderler: -3.105 € Euwax, -322 € Eylül, -241 € Ağustos, -70 € Temmuz = -190 € fark) Ana Hesap bakiyesini (955,55 €) bozmaması için eklenen başlangıç dengeleme kaydı.",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const expenses: BudgetTransaction[] = RAW_EXPENSE.filter(
    (r) => r.amount > 0
  ).map((row) => ({
    id: `ov-${row.id}`,
    type: "expense",
    amount: row.amount,
    title: row.name,
    category: inferCategory(row.name, "expense"),
    accountId: resolveUnifiedOverviewAccountId(row.accountUrl),
    date: row.date,
    scope: "overview",
    note: "Notion Finance Tracker",
    createdAt: now,
    updatedAt: now,
  }));

  return [...incomes, ...expenses];
}
