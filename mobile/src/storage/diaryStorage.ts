import AsyncStorage from "@react-native-async-storage/async-storage";

import { STORAGE_CATCH_ENTRIES } from "../constants/storageKeys";
import type { CatchEntry } from "../types/catchEntry";

export async function loadEntries(): Promise<CatchEntry[]> {
  const raw = await AsyncStorage.getItem(STORAGE_CATCH_ENTRIES);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CatchEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function persistEntries(entries: CatchEntry[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_CATCH_ENTRIES, JSON.stringify(entries));
}

export async function addCatchEntry(
  input: Omit<CatchEntry, "id" | "createdAt"> & { id?: string },
  options: { maxVisible: number }
): Promise<CatchEntry[]> {
  const now = new Date().toISOString();
  const id = input.id ?? `${Date.now()}`;
  const entry: CatchEntry = {
    id,
    createdAt: now,
    fishName: input.fishName.trim(),
    lengthCm: input.lengthCm,
    water: input.water?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    photoStoragePath: input.photoStoragePath
  };

  const prev = await loadEntries();
  const next = [entry, ...prev];
  const trimmed = next.slice(0, Math.max(1, options.maxVisible));
  await persistEntries(trimmed);
  return trimmed;
}

export async function deleteCatchEntry(id: string): Promise<CatchEntry[]> {
  const prev = await loadEntries();
  const next = prev.filter((e) => e.id !== id);
  await persistEntries(next);
  return next;
}
