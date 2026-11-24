"use client";

import React, { useState } from "react";
import {
  Banknote,
  Check,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { AccountKind, AssetType, BudgetAccount } from "../types";
import { ASSET_TYPE_META, formatAssetAmount } from "../utils";

interface AccountsModalProps {
  accounts: BudgetAccount[];
  accountStats: Record<
    string,
    { totalBalance: number; monthDelta: number; txCount: number }
  >;
  onClose: () => void;
  onAddAccount: (name: string, kind: AccountKind, assetType: AssetType) => void;
  onUpdateAccount: (
    id: string,
    patch: { name: string; kind: AccountKind; assetType: AssetType }
  ) => void;
  onDeleteAccount: (id: string) => void;
}

const KIND_OPTIONS: { value: AccountKind; label: string }[] = [
  { value: "bank", label: "Banka" },
  { value: "cash", label: "Nakit" },
  { value: "card", label: "Kredi / Banka Kartı" },
  { value: "other", label: "Diğer Hesap" },
];

export function AccountKindIcon({
  kind,
  className = "h-4 w-4",
}: {
  kind: AccountKind;
  className?: string;
}) {
  if (kind === "bank") return <Landmark className={className} />;
  if (kind === "cash") return <Banknote className={className} />;
  if (kind === "card") return <CreditCard className={className} />;
  return <Wallet className={className} />;
}

export function AccountsModal({
  accounts,
  accountStats,
  onClose,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
}: AccountsModalProps) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("card");
  const [assetType, setAssetType] = useState<AssetType>("money");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editKind, setEditKind] = useState<AccountKind>("card");
  const [editAssetType, setEditAssetType] = useState<AssetType>("money");

  const startEditing = (acc: BudgetAccount) => {
    setEditingId(acc.id);
    setEditName(acc.name);
    setEditKind(acc.kind);
    setEditAssetType(acc.assetType ?? "money");
  };

  const handleSaveEdit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editName.trim()) return;
    onUpdateAccount(id, {
      name: editName.trim(),
      kind: editKind,
      assetType: editAssetType,
    });
    setEditingId(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddAccount(name.trim(), kind, assetType);
    setName("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/35 sm:px-4 backdrop-blur-[2px]">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-[#4F46E5]" />
            <h2 className="text-sm font-semibold text-[#1C1917]">
              Hesap Türleri & Yönetimi
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

        {/* Existing Accounts */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {accounts.map((acc) => {
            const stat = accountStats[acc.id] ?? {
              totalBalance: 0,
              monthDelta: 0,
              txCount: 0,
            };
            const canDelete = !acc.isDefault && stat.txCount === 0;
            const isEditing = editingId === acc.id;

            if (isEditing) {
              return (
                <form
                  key={acc.id}
                  onSubmit={(e) => handleSaveEdit(e, acc.id)}
                  className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-2.5 space-y-2"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                    placeholder="Hesap adı"
                    className="w-full rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1C1917] focus:border-indigo-300 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editAssetType}
                      onChange={(e) =>
                        setEditAssetType(e.target.value as AssetType)
                      }
                      disabled={stat.txCount > 0}
                      title={
                        stat.txCount > 0
                          ? "İşlem bulunan hesabın varlık cinsi değiştirilemez"
                          : "Varlık Cinsi"
                      }
                      aria-label="Varlık Cinsi"
                      className="rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1C1917] disabled:opacity-60"
                    >
                      <option value="money">Para (€)</option>
                      <option value="gold">Altın (gr)</option>
                      <option value="stock">Hisse (lot)</option>
                    </select>
                    <select
                      value={editKind}
                      onChange={(e) =>
                        setEditKind(e.target.value as AccountKind)
                      }
                      aria-label="Hesap Türü"
                      className="rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1.5 text-xs text-[#1C1917]"
                    >
                      {KIND_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#E7E5E4] bg-white px-2.5 py-1 text-[11px] font-medium text-[#78716C] hover:bg-stone-50 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={!editName.trim()}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#4F46E5] px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-40 hover:bg-indigo-700 cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                      Kaydet
                    </button>
                  </div>
                </form>
              );
            }

            return (
              <div
                key={acc.id}
                className="flex items-center justify-between rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#E7E5E4] text-[#4F46E5]">
                    <AccountKindIcon kind={acc.kind} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#1C1917]">
                      {acc.name}
                    </p>
                    <p className="text-[11px] text-[#78716C]">
                      {ASSET_TYPE_META[acc.assetType ?? "money"].label} •{" "}
                      {KIND_OPTIONS.find((k) => k.value === acc.kind)?.label}
                      {acc.isDefault ? " • Varsayılan" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-semibold text-[#1C1917] tabular-nums mr-0.5">
                    {formatAssetAmount(
                      stat.totalBalance,
                      acc.assetType ?? "money"
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditing(acc)}
                    title="Hesabı Düzenle"
                    className="rounded p-1 text-[#78716C] hover:bg-stone-200/70 hover:text-[#1C1917] cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {!acc.isDefault && (
                    <button
                      type="button"
                      onClick={() => {
                        if (canDelete) onDeleteAccount(acc.id);
                      }}
                      disabled={!canDelete}
                      title={
                        canDelete
                          ? "Hesabı Sil"
                          : `Bu hesapta ${stat.txCount} işlem olduğu için silinemez`
                      }
                      className={`rounded p-1 ${
                        canDelete
                          ? "text-[#78716C] hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                          : "text-stone-300 cursor-not-allowed"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Account */}
        <form
          onSubmit={handleAdd}
          className="space-y-2.5 border-t border-[#E7E5E4] pt-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
            Yeni Hesap Ekle
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Altın Hesabım, BIST Portföy, Enpara..."
            className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 text-xs text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
              aria-label="Varlık Cinsi"
              className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs font-medium text-[#1C1917]"
            >
              <option value="money">Para (€)</option>
              <option value="gold">Altın (gr)</option>
              <option value="stock">Hisse (lot)</option>
            </select>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as AccountKind)}
              aria-label="Hesap Türü"
              className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-xs text-[#1C1917]"
            >
              {KIND_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1C1917] py-2 text-xs font-medium text-white disabled:opacity-40 hover:bg-stone-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Hesap Ekle
          </button>
        </form>
      </div>
    </div>
  );
}
