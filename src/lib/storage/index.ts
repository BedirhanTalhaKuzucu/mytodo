import type { StorageAdapter } from "./adapter";
import { LocalStorageAdapter } from "./local-adapter";
import { SupabaseStorageAdapter } from "./supabase-adapter";

const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const storageAdapter: StorageAdapter = hasSupabaseConfig
  ? new SupabaseStorageAdapter()
  : new LocalStorageAdapter();

export type { StorageAdapter };
