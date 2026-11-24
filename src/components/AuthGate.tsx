"use client";

import React, { useEffect, useState } from "react";
import { Lock, LogIn, LogOut, Mail, UserPlus } from "lucide-react";
import {
  getStoredSession,
  isSupabaseConfigured,
  signInWithPassword,
  signOutSupabase,
  signUpWithPassword,
  type SupabaseSession,
} from "@/lib/supabase/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [configured] = useState(() => isSupabaseConfigured());
  const [session, setSession] = useState<SupabaseSession | null>(() =>
    getStoredSession()
  );
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => setSession(getStoredSession());
    window.addEventListener("denge-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("denge-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!configured) {
    return <>{children}</>;
  }

  if (session) {
    return (
      <>
        {children}
        <button
          type="button"
          onClick={() => void signOutSupabase()}
          title={`${session.user.email} — Çıkış Yap`}
          className="fixed bottom-3 right-3 z-40 hidden md:inline-flex items-center gap-1.5 rounded-full border border-[#E7E5E4] bg-white/90 px-3 py-1.5 text-[11px] font-medium text-[#78716C] shadow-xs backdrop-blur-xs hover:text-[#1C1917] hover:bg-white transition-colors cursor-pointer"
        >
          <LogOut className="h-3 w-3" />
          <span className="max-w-[140px] truncate">{session.user.email}</span>
        </button>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
      } else {
        const res = await signUpWithPassword(email, password);
        if (res.needsEmailConfirmation) {
          setInfo(
            "Kayıt oluşturuldu! E-posta doğrulamasını tamamladıktan sonra giriş yapabilirsin."
          );
          setMode("login");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm space-y-5">
        <div className="space-y-1 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-[#4F46E5]">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#1C1917]">
            Denge
          </h1>
          <p className="text-xs text-[#78716C]">
            Kişisel bütçe, görev ve notlarına erişmek için giriş yap.
          </p>
        </div>

        <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-lg py-1.5 transition-colors cursor-pointer ${
              mode === "login"
                ? "bg-white text-[#1C1917] shadow-2xs"
                : "text-[#78716C]"
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`rounded-lg py-1.5 transition-colors cursor-pointer ${
              mode === "signup"
                ? "bg-white text-[#1C1917] shadow-2xs"
                : "text-[#78716C]"
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
              E-posta
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#78716C]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] py-2 pl-9 pr-3 text-sm text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#78716C] mb-1">
              Şifre
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
              className="w-full rounded-xl border border-[#E7E5E4] bg-[#FAF9F6] px-3 py-2 text-sm text-[#1C1917] focus:border-indigo-300 focus:bg-white focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#4F46E5] py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {mode === "login" ? (
              <>
                <LogIn className="h-4 w-4" />
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {loading ? "Oluşturuluyor..." : "Hesap Oluştur"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
