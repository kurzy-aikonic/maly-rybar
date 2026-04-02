import { supabase } from "../lib/supabase";
import type { CatchEntry } from "../types/catchEntry";

type Row = {
  client_id: string;
  fish_name: string;
  length_cm: number | null;
  water: string | null;
  notes: string | null;
  created_at: string;
  photo_storage_path: string | null;
};

function rowToEntry(row: Row): CatchEntry {
  return {
    id: row.client_id,
    createdAt: row.created_at,
    fishName: row.fish_name,
    lengthCm: row.length_cm ?? undefined,
    water: row.water ?? undefined,
    notes: row.notes ?? undefined,
    photoStoragePath: row.photo_storage_path ?? undefined
  };
}

export async function fetchRemoteDiaryEntries(): Promise<CatchEntry[]> {
  const { data, error } = await supabase
    .from("diary_entries")
    .select("client_id, fish_name, length_cm, water, notes, created_at, photo_storage_path")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return (data ?? []).map((r) => rowToEntry(r as Row));
}

export async function upsertRemoteDiaryEntry(userId: string, entry: CatchEntry): Promise<void> {
  const { error } = await supabase.from("diary_entries").upsert(
    {
      user_id: userId,
      client_id: entry.id,
      fish_name: entry.fishName,
      length_cm: entry.lengthCm ?? null,
      water: entry.water ?? null,
      notes: entry.notes ?? null,
      created_at: entry.createdAt,
      photo_storage_path: entry.photoStoragePath ?? null
    },
    { onConflict: "user_id,client_id" }
  );
  if (error) throw error;
}

export async function deleteRemoteDiaryEntry(userId: string, clientId: string): Promise<void> {
  const { error } = await supabase
    .from("diary_entries")
    .delete()
    .eq("user_id", userId)
    .eq("client_id", clientId);
  if (error) throw error;
}
