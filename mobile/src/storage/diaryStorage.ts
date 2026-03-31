import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CatchEntry } from "../types/catchEntry";

const KEY = "maly_rybar_catch_entries";

export async function loadEntries(): Promise<CatchEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CatchEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function persistEntries(entries: CatchEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(entries));
}

export async function addCatchEntry(
  input: Omit<CatchEntry, "id" | "createdAt">,
  options: { maxVisible: number }
): Promise<CatchEntry[]> {
  const now = new Date().toISOString();
  const entry: CatchEntry = {
    id: `${Date.now()}`,
    createdAt: now,
    fishName: input.fishName.trim(),
    lengthCm: input.lengthCm,
    water: input.water?.trim() || undefined,
    notes: input.notes?.trim() || undefined
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
