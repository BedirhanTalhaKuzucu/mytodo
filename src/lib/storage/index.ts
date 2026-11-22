import type { StorageAdapter } from "./adapter";
import { LocalStorageAdapter } from "./local-adapter";

// Single point of configuration: swap with SupabaseStorageAdapter when ready.
export const storageAdapter: StorageAdapter = new LocalStorageAdapter();

export type { StorageAdapter };
