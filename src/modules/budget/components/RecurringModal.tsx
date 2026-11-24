"use client";

import React, { useState } from "react";
import { Pause, Play, Plus, Repeat, Trash2, X } from "lucide-react";
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
  }) => void;
  onToggleRule: (id: string) => void;
  onDeleteRule: (id: string) => void;
}

export function RecurringModal({
  rules,
  accounts,
  expenseCategories = EXPENSE_CATEGORIES,
  incomeCategories = INCOME_CATEGORIES,
  onClose,
  onAddRule,
  onToggleRule,
  onDeleteRule,
}: RecurringModalProps) {
  const [ruleType, setRuleType] = useState<"expense" | "income">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[1]);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const handleRuleTypeChange = (next: "expense" | "income") => {
    setRuleType(next);
    setCategory(
      next === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[1]
    );
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(amount.replace(",", "."));
    if (!title.trim() || !Number.isFinite(numeric) || numeric <= 0) return;
    onAddRule({
      type: ruleType,
      title: title.trim(),
      amount: numeric,
      category,
      accountId,
      dayOfMonth: Number(dayOfMonth) || 1,
    });
    setTitle("");
    setAmount("");
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
          Aktif sabit giderler, yeni bir aya geçtiğinde otomatik olarak o ayın giderlerine eklenir.
        </p>

        {/* Existing Rules */}
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {rules.length === 0 ? (
            <p className="py-4 text-center text-xs text-[#78716C]">
              Henüz tanımlı sabit gider yok.
            </p>
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
                    <p className="truncate text-sm font-medium text-[#1C1917]">
                      {rule.title}
                    </p>
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
                      onClick={() => onToggleRule(rule.id)}
                      title={rule.isActive ? "Duraklat" : "Aktifleştir"}
                      className="rounded-lg border border-[#E7E5E4] bg-white p-1.5 text-[#78716C] hover:text-[#1C1917]"
                    >
                      {rule.isActive ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRule(rule.id)}
                      title="Kuralı Sil"
                      className="rounded-lg border border-[#E7E5E4] bg-white p-1.5 text-[#78716C] hover:text-rose-600"
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
              Yeni Sabit İşlem Tanımla
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
          <button
            type="submit"
            disabled={!title.trim() || !amount || Number(amount) <= 0}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1C1917] py-2 text-xs font-medium text-white disabled:opacity-40 hover:bg-stone-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Sabit Gider Ekle
          </button>
        </form>
      </div>
    </div>
  );
}
