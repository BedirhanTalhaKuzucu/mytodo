"use client";

import React, { useState } from "react";
import { ArrowRightLeft, Plus, Repeat, Trash2, X } from "lucide-react";
import type {
  BudgetAccount,
  BudgetTransaction,
  TransactionScope,
  TransactionType,
} from "../types";
import {
  ASSET_TYPE_META,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getTodayISO,
} from "../utils";
import type { SaveTransactionInput } from "../hooks/useBudgetData";

interface TransactionModalProps {
  accounts: BudgetAccount[];
  expenseCategories?: readonly string[];
  incomeCategories?: readonly string[];
  monthIncomes?: BudgetTransaction[];
  hasLinkedRecurringRule?: boolean;
  editingTx?: BudgetTransaction | null;
  initialType?: TransactionType;
  initialScope?: TransactionScope;
  defaultMonth: string;
  onClose: () => void;
  onSave: (
    input: SaveTransactionInput,
    editingId?: string,
    updateRuleToo?: boolean
  ) => void;
  onDelete?: (id: string) => void;
  onAddCategory?: (type: "expense" | "income", name: string) => string;
}

export function TransactionModal({
  accounts,
  expenseCategories = EXPENSE_CATEGORIES,
  incomeCategories = INCOME_CATEGORIES,
  monthIncomes = [],
  hasLinkedRecurringRule = false,
  editingTx,
  initialType = "expense",
  initialScope = "monthly",
  defaultMonth,
  onClose,
  onSave,
  onDelete,
  onAddCategory,
}: TransactionModalProps) {
  const defaultBank = accounts.find((a) => a.kind === "bank")?.id ?? accounts[0]?.id ?? "";
  const defaultCash = accounts.find((a) => a.kind === "cash")?.id ?? accounts[1]?.id ?? defaultBank;

  const today = getTodayISO();
  const initialDate = editingTx
    ? editingTx.date
    : today.startsWith(defaultMonth)
    ? today
    : `${defaultMonth}-01`;

  const [type, setType] = useState<TransactionType>(
    editingTx?.type ?? initialType
  );
  const [title, setTitle] = useState(editingTx?.title ?? "");
  const [amount, setAmount] = useState(
    editingTx ? String(editingTx.amount) : ""
  );
  const [category, setCategory] = useState(
    editingTx?.category ??
      (initialType === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
  );
  const [accountId, setAccountId] = useState(
    editingTx?.accountId ?? defaultBank
  );
  const [toAccountId, setToAccountId] = useState(
    editingTx?.toAccountId ?? defaultCash
  );
  const [sourceIncomeId, setSourceIncomeId] = useState(
    editingTx?.sourceIncomeId ?? ""
  );
  const [date, setDate] = useState(initialDate);
  const [note, setNote] = useState(editingTx?.note ?? "");
  const [scope, setScope] = useState<TransactionScope>(
    editingTx?.scope ?? initialScope
  );
  const [savingsAmount, setSavingsAmount] = useState(
    editingTx?.savingsAmount ? String(editingTx.savingsAmount) : ""
  );
  const [makeRecurring, setMakeRecurring] = useState(false);
  const [updateRuleToo, setUpdateRuleToo] = useState(false);

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === "expense") {
      setCategory(EXPENSE_CATEGORIES[0]);
    } else if (nextType === "income") {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory("Transfer");
    }
  };

  const sourceAccount = accounts.find((a) => a.id === accountId);
  const targetAccount = accounts.find((a) => a.id === toAccountId);
  const sourceAsset = sourceAccount?.assetType ?? "money";
  const targetAsset = targetAccount?.assetType ?? "money";
  const isDifferentAssetTransfer =
    type === "transfer" && sourceAsset !== targetAsset;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return;

    const finalTitle =
      title.trim() ||
      (type === "transfer"
        ? "Hesaplar Arası Transfer"
        : category);

    if (
      type === "transfer" &&
      (accountId === toAccountId || isDifferentAssetTransfer)
    ) {
      return;
    }

    const numericSavings = Number(savingsAmount.replace(",", ".")) || 0;
    const validSavings =
      type === "income" &&
      scope === "monthly" &&
      numericSavings > 0 &&
      numericSavings < numericAmount
        ? numericSavings
        : undefined;

    onSave(
      {
        type,
        amount: numericAmount,
        title: finalTitle,
        category: type === "transfer" ? "Transfer" : category,
        accountId,
        toAccountId: type === "transfer" ? toAccountId : undefined,
        sourceIncomeId:
          type === "transfer" && sourceIncomeId ? sourceIncomeId : undefined,
        date,
        note,
        scope,
        savingsAmount: validSavings,
        makeRecurring:
          !editingTx &&
          (type === "expense" || type === "income") &&
          makeRecurring,
      },
      editingTx?.id,
      editingTx && hasLinkedRecurringRule ? updateRuleToo : false
    );
    onClose();
  };

  const categories =
    type === "income" ? incomeCategories : expenseCategories;
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/35 sm:px-4 backdrop-blur-[2px]">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        {/* Header & Type Tabs */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center rounded-xl bg-stone-100 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleTypeChange("expense")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                type === "expense"
                  ? "bg-white text-rose-700 shadow-2xs"
                  : "text-[#78716C]"
              }`}
            >
              Gider
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("income")}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                type === "income"
                  ? "bg-white text-emerald-700 shadow-2xs"
                  : "text-[#78716C]"
              }`}
            >
              Gelir
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("transfer")}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 transition-colors ${
                type === "transfer"
                  ? "bg-white text-[#4F46E5] shadow-2xs"
                  : "text-[#78716C]"
              }`}
            >
              <ArrowRightLeft className="h-3 w-3" />
              Transfer
            </button>
          </div>

          <div className="flex items-center gap-1">
            {editingTx && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingTx.id);
                  onClose();
                }}
                className="rounded-lg p-1.5 text-[#78716C] hover:bg-rose-50 hover:text-rose-600"
                title="İşlemi Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Tutar / Miktar ({ASSET_TYPE_META[sourceAsset].unit})
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            autoFocus
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3.5 py-2.5 text-2xl font-bold text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none tabular-nums"
          />
          {type === "income" && scope === "monthly" && (
            <div className="mt-2 rounded-xl border border-amber-200/80 bg-amber-50/40 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-semibold text-amber-900">
                  Tasarruf Payı (İsteğe Bağlı, €)
                </label>
                {Number(amount.replace(",", ".")) > 0 &&
                  Number(savingsAmount.replace(",", ".")) > 0 && (
                    <span className="text-[11px] font-mono font-semibold text-[#059669]">
                      Kullanılabilir:{" "}
                      {Math.max(
                        0,
                        Number(amount.replace(",", ".")) -
                          Number(savingsAmount.replace(",", "."))
                      ).toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      €
                    </span>
                  )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                placeholder="Örn: 200 (aylık harcanabilir gelire eklenmez)"
                className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-1.5 text-xs text-[#1C1917] focus:border-amber-400 focus:outline-none tabular-nums"
              />
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Açıklama / Başlık
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "transfer"
                ? "Örn: Bankadan Nakit Çekim"
                : type === "income"
                ? "Örn: Maaş, Freelance Ödeme"
                : "Örn: Market alışverişi, Elektrik faturası"
            }
            className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 text-sm text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Account(s) */}
        {type === "transfer" ? (
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Çıkış Hesabı
                </label>
                <select
                  value={accountId}
                  onChange={(e) => {
                    setAccountId(e.target.value);
                    setSourceIncomeId("");
                  }}
                  className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Giriş Hesabı
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {monthIncomes.filter((inc) => inc.accountId === accountId).length >
              0 && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                  Hangi Gelirden Çıkılsın? (İsteğe Bağlı)
                </label>
                <select
                  value={sourceIncomeId}
                  onChange={(e) => setSourceIncomeId(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
                >
                  <option value="">Otomatik (En büyük gelir kalemi)</option>
                  {monthIncomes
                    .filter((inc) => inc.accountId === accountId)
                    .map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.title} ({inc.amount.toLocaleString("tr-TR")} €)
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
                Hesap
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C]">
                  Kategori
                </label>
                {onAddCategory && (type === "expense" || type === "income") && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory((v) => !v)}
                    className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-700 hover:text-amber-800 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    Yeni
                  </button>
                )}
              </div>
              {isAddingCategory ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Kategori adı..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (newCategoryName.trim() && onAddCategory && (type === "expense" || type === "income")) {
                          const created = onAddCategory(type, newCategoryName);
                          if (created) setCategory(created);
                          setNewCategoryName("");
                          setIsAddingCategory(false);
                        }
                      }
                    }}
                    className="w-full rounded-xl border border-[#E7E5E4] bg-white px-2.5 py-2 text-xs text-[#1C1917] focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategoryName.trim() && onAddCategory && (type === "expense" || type === "income")) {
                        const created = onAddCategory(type, newCategoryName);
                        if (created) setCategory(created);
                        setNewCategoryName("");
                        setIsAddingCategory(false);
                      }
                    }}
                    className="shrink-0 rounded-xl bg-amber-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer"
                  >
                    Ekle
                  </button>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        )}

        {type === "transfer" && accountId === toAccountId && (
          <p className="text-xs text-rose-600">
            Çıkış ve giriş hesabı aynı olamaz.
          </p>
        )}
        {isDifferentAssetTransfer && (
          <p className="text-xs text-rose-600">
            Farklı varlık cinsleri arasında ({ASSET_TYPE_META[sourceAsset].label} →{" "}
            {ASSET_TYPE_META[targetAsset].label}) doğrudan transfer yapılamaz.
          </p>
        )}

        {/* Date & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
              Tarih
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs text-[#1C1917]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
              Not (İsteğe Bağlı)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detay..."
              className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1917] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Overview-Only Scope Checkbox */}
        {type !== "transfer" && (
          <label className="flex items-center gap-2.5 rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3 cursor-pointer hover:border-stone-300">
            <input
              type="checkbox"
              checked={scope === "overview"}
              onChange={(e) =>
                setScope(e.target.checked ? "overview" : "monthly")
              }
              className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <div className="text-xs">
              <span className="font-medium text-[#1C1917]">
                Sadece Genel Durum&apos;da göster (aylık detaya ekleme)
              </span>
              <p className="text-[11px] text-[#78716C]">
                İşaretlenirse seçili tarihe rağmen o ayın detay tablosuna yansımaz, yalnızca Genel Durum&apos;da görünür.
              </p>
            </div>
          </label>
        )}

        {/* Edit Scope Choice for Linked Recurring Item */}
        {editingTx && hasLinkedRecurringRule && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-950">
              <Repeat className="h-3.5 w-3.5 text-[#4F46E5]" />
              <span>Bu işlem bir Sabit Kurala bağlı. Değişiklik nereye uygulansın?</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUpdateRuleToo(false)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                  !updateRuleToo
                    ? "border-indigo-400 bg-white text-[#1C1917] font-semibold ring-2 ring-indigo-100"
                    : "border-[#E7E5E4] bg-white/70 text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                Sadece Bu Ayı Güncelle
              </button>
              <button
                type="button"
                onClick={() => setUpdateRuleToo(true)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                  updateRuleToo
                    ? "border-indigo-400 bg-indigo-600 text-white font-semibold"
                    : "border-[#E7E5E4] bg-white/70 text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                Sabit Kuralı da Güncelle
              </button>
            </div>
          </div>
        )}

        {/* Fixed / Recurring Checkbox */}
        {!editingTx &&
          scope === "monthly" &&
          (type === "expense" || type === "income") && (
          <label className="flex items-center gap-2.5 rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-3 cursor-pointer hover:border-stone-300">
            <input
              type="checkbox"
              checked={makeRecurring}
              onChange={(e) => setMakeRecurring(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-[#4F46E5] focus:ring-indigo-500"
            />
            <div className="flex items-center gap-1.5 text-xs">
              <Repeat className="h-3.5 w-3.5 text-[#4F46E5]" />
              <span className="font-medium text-[#1C1917]">
                {type === "income"
                  ? "Sabit gelir (Her ay otomatik oluştur)"
                  : "Sabit gider (Her ay otomatik oluştur)"}
              </span>
            </div>
          </label>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={
              !amount ||
              Number(amount) <= 0 ||
              (type === "transfer" &&
                (accountId === toAccountId || isDifferentAssetTransfer))
            }
            className="w-full sm:w-auto rounded-xl bg-[#1C1917] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40 hover:bg-stone-800 transition-colors"
          >
            {editingTx ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
