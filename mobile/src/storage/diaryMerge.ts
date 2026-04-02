import { fetchRemoteDiaryEntries } from "../services/diaryRemote";
import { isSupabaseConfigured } from "../lib/supabase";
import type { CatchEntry } from "../types/catchEntry";
import { loadEntries, persistEntries } from "./diaryStorage";

/**
 * @param maxPersistedEntries — stejny limit jako u addCatchEntry (Free 3, Premium napr. 999), aby sync neobesel paywall.
 */
export async function mergeDiaryWithRemote(
  hasSession: boolean,
  maxPersistedEntries: number
): Promise<CatchEntry[]> {
  const local = await loadEntries();
  if (!hasSession || !isSupabaseConfigured) return local;

  try {
    const remote = await fetchRemoteDiaryEntries();
    const seen = new Set<string>();
    const merged: CatchEntry[] = [];
    for (const e of remote) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        merged.push(e);
      }
    }
    for (const e of local) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        merged.push(e);
      }
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const cap = Math.max(1, maxPersistedEntries);
    const capped = merged.slice(0, cap);
    await persistEntries(capped);
    return capped;
  } catch (err) {
    console.warn("[diary] merge remote", err);
    return local;
  }
}
