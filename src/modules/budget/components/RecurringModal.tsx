"use client";

import React, { useState } from "react";
import { Edit3, Plus, Repeat, Trash2, X } from "lucide-react";
import type { BudgetAccount, RecurringExpenseRule } from "../types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatCurrency } from "../utils";

interface RecurringModalProps {
  rules: RecurringExpenseRule[];
  accounts: BudgetAccount[];
  expenseCategories?: readonly string[];
  incomeCategories?: readonly string[];
  onClose: () => void;
  onAddRule: (input: {
    type?: "expense" | "income";
    title: string;
    amount: number;
    category: string;
    accountId: string;
    dayOfMonth: number;
    isInstallment?: boolean;
    startInstallment?: number;
    totalInstallments?: number;
  }) => void;
  onUpdateRule?: (id: string, patch: Partial<RecurringExpenseRule>) => void;
  onDeleteRule: (id: string) => void;
  onLoadSeedRules?: () => void;
}

export function RecurringModal({
  rules,
  accounts,
  expenseCategories = EXPENSE_CATEGORIES,
  incomeCategories = INCOME_CATEGORIES,
  onClose,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
  onLoadSeedRules,
}: RecurringModalProps) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleType, setRuleType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[1]);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [isInstallment, setIsInstallment] = useState(false);
  const [startInstallment, setStartInstallment] = useState("1");
  const [totalInstallments, setTotalInstallments] = useState("");

  const startEdit = (rule: RecurringExpenseRule) => {
    setEditingRuleId(rule.id);
    setRuleType(rule.type ?? "expense");
    setTitle(rule.title);
    setAmount(String(rule.amount));
    setCategory(rule.category);
    setAccountId(rule.accountId);
    setDayOfMonth(String(rule.dayOfMonth));
    setIsInstallment(Boolean(rule.isInstallment));
    setStartInstallment(String(rule.startInstallment ?? 1));
    setTotalInstallments(
      rule.totalInstallments ? String(rule.totalInstallments) : ""
    );
  };

  const resetForm = () => {
    setEditingRuleId(null);
    setRuleType("expense");
    setTitle("");
    setAmount("");
    setCategory(expenseCategories[1] ?? EXPENSE_CATEGORIES[1]);
    setAccountId(accounts[0]?.id ?? "");
    setDayOfMonth("1");
    setIsInstallment(false);
    setStartInstallment("1");
    setTotalInstallments("");
  };

  const handleRuleTypeChange = (next: "expense" | "income") => {
    setRuleType(next);
    setCategory(
      next === "income"
        ? incomeCategories[0] ?? INCOME_CATEGORIES[0]
        : expenseCategories[1] ?? EXPENSE_CATEGORIES[1]
    );
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amount.replace(",", "."));
    if (!title.trim() || !Number.isFinite(numeric) || numeric <= 0) return;

    const startInstNum = Math.max(1, Number(startInstallment) || 1);
    const totalInstNum = Number(totalInstallments) || 0;

    if (editingRuleId && onUpdateRule) {
      onUpdateRule(editingRuleId, {
        type: ruleType,
        title: title.trim(),
        amount: numeric,
        category,
        accountId,
        dayOfMonth: Math.min(28, Math.max(1, Number(dayOfMonth) || 1)),
        isInstallment: isInstallment || undefined,
        startInstallment: isInstallment ? startInstNum : undefined,
        totalInstallments:
          isInstallment && totalInstNum > 0 ? totalInstNum : undefined,
      });
      resetForm();
      return;
    }

    onAddRule({
      type: ruleType,
      title: title.trim(),
      amount: numeric,
      category,
      accountId,
      dayOfMonth: Math.min(28, Math.max(1, Number(dayOfMonth) || 1)),
      isInstallment: isInstallment || undefined,
      startInstallment: isInstallment ? startInstNum : undefined,
      totalInstallments:
        isInstallment && totalInstNum > 0 ? totalInstNum : undefined,
    });
    resetForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/35 sm:px-4 backdrop-blur-[2px]">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-[#4F46E5]" />
            <h2 className="text-sm font-semibold text-[#1C1917]">
              Sabit (Tekrarlayan) Aylık İşlemler
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#78716C] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-[#78716C]">
          Kayıtlı sabit kuralları istediğin ayın tablosundaki &ldquo;Sabitleri Ekle&rdquo; butonuyla tek tıkla o aya aktarabilirsin.
        </p>

        {/* Existing Rules */}
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {rules.length === 0 ? (
            <div className="py-4 text-center space-y-2.5">
              <p className="text-xs text-[#78716C]">
                Henüz tanımlı sabit gider yok.
              </p>
              {onLoadSeedRules && (
                <button
                  type="button"
                  onClick={onLoadSeedRules}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-[#4F46E5] hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <Repeat className="h-3.5 w-3.5" />
                  Kasım 2026 Sabitlerini Yükle (13)
                </button>
              )}
            </div>
          ) : (
            rules.map((rule) => {
              const accName =
                accounts.find((a) => a.id === rule.accountId)?.name ?? "Hesap";
              return (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
                    rule.isActive
                      ? "border-[#E7E5E4] bg-[#FAF9F6]"
                      : "border-stone-200 bg-stone-100/70 opacity-65"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-[#1C1917]">
                        {rule.title}
                      </p>
                      {rule.isInstallment && (
                        <span className="inline-flex shrink-0 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          {rule.totalInstallments
                            ? `${rule.startInstallment ?? 1}/${rule.totalInstallments} Taksit`
                            : `${rule.startInstallment ?? 1}+ Taksit`}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#78716C]">
                      Her ayın {rule.dayOfMonth}. günü • {rule.category} •{" "}
                      {accName}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`font-mono text-xs font-semibold tabular-nums mr-1 ${
                        rule.type === "income"
                          ? "text-[#059669]"
                          : "text-rose-700"
                      }`}
                    >
                      {rule.type === "income" ? "+" : "-"}
                      {formatCurrency(rule.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(rule)}
                      title="Kuralı Düzenle"
                      className="rounded-lg border border-[#E7E5E4] bg-white p-1.5 text-[#78716C] hover:text-[#4F46E5] cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editingRuleId === rule.id) resetForm();
                        onDeleteRule(rule.id);
                      }}
                      title="Kuralı Sil"
                      className="rounded-lg border border-[#E7E5E4] bg-white p-1.5 text-[#78716C] hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Recurring Rule */}
        <form
          onSubmit={handleAdd}
          className="space-y-2.5 border-t border-[#E7E5E4] pt-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              {editingRuleId ? "Sabit İşlemi Düzenle" : "Yeni Sabit İşlem Tanımla"}
            </p>
            <div className="flex items-center rounded-lg bg-stone-100 p-0.5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => handleRuleTypeChange("expense")}
                className={`rounded-md px-2 py-1 ${
                  ruleType === "expense"
                    ? "bg-white text-rose-700 shadow-2xs"
                    : "text-[#78716C]"
                }`}
              >
                Gider
              </button>
              <button
                type="button"
                onClick={() => handleRuleTypeChange("income")}
                className={`rounded-md px-2 py-1 ${
                  ruleType === "income"
                    ? "bg-white text-[#059669] shadow-2xs"
                    : "text-[#78716C]"
                }`}
              >
                Gelir
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                ruleType === "income"
                  ? "Örn: Maaş, Kira Geliri"
                  : "Örn: Kira, Spor Salonu, Netflix"
              }
              className="rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1917] focus:bg-white focus:outline-none"
            />
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Tutar (€)"
              className="rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1917] focus:bg-white focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-[#E7E5E4] bg-white px-2.5 py-2 text-xs text-[#1C1917]"
            >
              {(ruleType === "income"
                ? incomeCategories
                : expenseCategories
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="rounded-xl border border-[#E7E5E4] bg-white px-2.5 py-2 text-xs text-[#1C1917]"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              title="Ayın kaçıncı günü (1-28)"
              placeholder="Gün (1-28)"
              className="rounded-xl border border-[#E7E5E4] bg-white px-2.5 py-2 text-xs text-[#1C1917]"
            />
          </div>

          {/* Installment (Taksit) Option */}
          <div className="rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] p-2.5 space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
              <input
                type="checkbox"
                checked={isInstallment}
                onChange={(e) => setIsInstallment(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Taksitli işlem (aya göre taksit numarasını otomatik say)</span>
            </label>
            {isInstallment && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#78716C] mb-0.5">
                    Başlangıç Taksiti
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={startInstallment}
                    onChange={(e) => setStartInstallment(e.target.value)}
                    placeholder="Örn: 1"
                    className="w-full rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-xs text-[#1C1917]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-[#78716C] mb-0.5">
                    Toplam Taksit (İsteğe Bağlı)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    placeholder="Örn: 24"
                    className="w-full rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-xs text-[#1C1917]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editingRuleId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[#E7E5E4] bg-white px-4 py-2 text-xs font-medium text-[#78716C] hover:text-[#1C1917] cursor-pointer"
              >
                İptal
              </button>
            )}
            <button
              type="submit"
              disabled={!title.trim() || !amount || Number(amount) <= 0}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1C1917] py-2 text-xs font-medium text-white disabled:opacity-40 hover:bg-stone-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {editingRuleId ? "Değişiklikleri Kaydet" : "Sabit Kural Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
