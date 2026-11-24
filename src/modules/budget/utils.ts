import type { AssetType } from "./types";

export const ASSET_TYPE_META: Record<
  AssetType,
  { label: string; unit: string }
> = {
  money: { label: "Para (€)", unit: "€" },
  gold: { label: "Altın (gr)", unit: "gr" },
  stock: { label: "Hisse (lot)", unit: "lot" },
};

export const EXPENSE_CATEGORIES = [
  "Gıda",
  "Kredi Kartı",
  "Sabit Gider",
  "Araba",
  "Gezi & Eğlence",
  "Takım Yemeği / İş Gideri",
  "Misafir",
  "Zorunlu Gider",
  "Tek Seferlik",
  "Beyza",
  "Bedirhan",
  "Terapist",
  "İsviçre",
  "Türkiye",
  "Tatil",
  "Bosna",
  "KYK",
  "Borç & Taksit",
  "Ehliyet",
  "Hediye",
  "Mehir",
  "Ahiret",
  "Girişim",
  "Market",
  "Faturalar",
  "Kira & Aidat",
  "Yeme & İçme",
  "Ulaşım",
  "Abonelikler",
  "Sağlık",
  "Alışveriş",
  "Eğlence",
  "Diğer",
] as const;

export const INCOME_CATEGORIES = [
  "Maaş",
  "Ek Gelir",
  "Freelance",
  "Yatırım",
  "İade",
  "Diğer",
] as const;

export function generateBudgetId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getCurrentMonthKey(): string {
  return getTodayISO().slice(0, 7); // YYYY-MM
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatShortDate(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatAssetAmount(
  amount: number,
  assetType: AssetType = "money"
): string {
  if (assetType === "money") {
    return formatCurrency(amount);
  }
  const formatted = new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${ASSET_TYPE_META[assetType].unit}`;
}

export function buildDateInMonth(monthKey: string, dayOfMonth: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const safeDay = Math.min(Math.max(1, dayOfMonth), daysInMonth);
  return `${monthKey}-${String(safeDay).padStart(2, "0")}`;
}
