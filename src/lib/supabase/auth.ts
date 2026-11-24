export interface SupabaseAuthUser {
  id: string;
  email: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix seconds
  user: SupabaseAuthUser;
}

const SESSION_KEY = "denge_sb_session_v1";

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function getAuthConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return { url, key };
}

export function getStoredSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabaseSession;
    if (!parsed?.access_token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session: SupabaseSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
    window.dispatchEvent(new Event("denge-auth-change"));
  } catch {
    // ignore storage errors
  }
}

export async function refreshSupabaseSession(): Promise<SupabaseSession | null> {
  const current = getStoredSession();
  if (!current?.refresh_token) return null;
  const { url, key } = getAuthConfig();
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: current.refresh_token }),
    });
    if (!res.ok) {
      saveSession(null);
      return null;
    }
    const data = await res.json();
    const next: SupabaseSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at:
        data.expires_at ??
        Math.floor(Date.now() / 1000) + Number(data.expires_in ?? 3600),
      user: {
        id: data.user?.id ?? current.user.id,
        email: data.user?.email ?? current.user.email,
      },
    };
    saveSession(next);
    return next;
  } catch {
    return null;
  }
}

export async function getValidAccessToken(): Promise<string> {
  const { key } = getAuthConfig();
  const session = getStoredSession();
  if (!session) return key;

  const nowSec = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at - nowSec < 60) {
    const refreshed = await refreshSupabaseSession();
    return refreshed?.access_token ?? key;
  }
  return session.access_token;
}

export function getSupabaseUserId(): string | null {
  return getStoredSession()?.user?.id ?? null;
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<SupabaseSession> {
  const { url, key } = getAuthConfig();
  const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.error_description || data?.msg || "Giriş başarısız. Bilgileri kontrol et."
    );
  }

  const session: SupabaseSession = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at:
      data.expires_at ??
      Math.floor(Date.now() / 1000) + Number(data.expires_in ?? 3600),
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  };
  saveSession(session);
  return session;
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ session: SupabaseSession | null; needsEmailConfirmation: boolean }> {
  const { url, key } = getAuthConfig();
  const res = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      data?.error_description || data?.msg || "Kayıt oluşturulamadı."
    );
  }

  if (data?.access_token && data?.user?.id) {
    const session: SupabaseSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at:
        data.expires_at ??
        Math.floor(Date.now() / 1000) + Number(data.expires_in ?? 3600),
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
    saveSession(session);
    return { session, needsEmailConfirmation: false };
  }

  return { session: null, needsEmailConfirmation: true };
}

export async function signOutSupabase(): Promise<void> {
  const { url, key } = getAuthConfig();
  const session = getStoredSession();
  if (session && url && key) {
    try {
      await fetch(`${url}/auth/v1/logout`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${session.access_token}`,
        },
      });
    } catch {
      // ignore network errors on logout
    }
  }
  saveSession(null);
}
