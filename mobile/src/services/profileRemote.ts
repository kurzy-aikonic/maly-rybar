import { supabase } from "../lib/supabase";
import type { FishAvatarId } from "../constants/fishAvatars";
import { isFishAvatarId } from "../constants/fishAvatars";

export async function fetchProfilePremium(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_premium")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  const v = data?.is_premium;
  return v === true || v === "true" || v === 1;
}

export async function persistProfilePremium(userId: string, isPremium: boolean): Promise<void> {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      is_premium: isPremium,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export type ProfileIdentity = {
  displayName: string | null;
  fishAvatarId: FishAvatarId | null;
};

export async function fetchProfileIdentity(userId: string): Promise<ProfileIdentity | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, fish_avatar_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data.fish_avatar_id;
  const fishAvatarId = typeof raw === "string" && isFishAvatarId(raw) ? raw : null;

  return {
    displayName: typeof data.display_name === "string" && data.display_name.trim()
      ? data.display_name.trim()
      : null,
    fishAvatarId
  };
}

export async function persistProfileIdentity(
  userId: string,
  params: { displayName: string; fishAvatarId: FishAvatarId }
): Promise<void> {
  const name = params.displayName.trim();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: name.length > 0 ? name : null,
      fish_avatar_id: params.fishAvatarId,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}
