export type FishAvatarId =
  | "kapr"
  | "pstruh"
  | "stika"
  | "sumec"
  | "candat"
  | "okoun"
  | "lipan";

export const DEFAULT_FISH_AVATAR_ID: FishAvatarId = "kapr";

export const FISH_AVATARS: { id: FishAvatarId; emoji: string; label: string }[] = [
  { id: "kapr", emoji: "🐟", label: "Kapr" },
  { id: "pstruh", emoji: "🐠", label: "Pstruh" },
  { id: "stika", emoji: "🦈", label: "Štika" },
  { id: "sumec", emoji: "🐡", label: "Sumec" },
  { id: "candat", emoji: "✨", label: "Candát" },
  { id: "okoun", emoji: "🎯", label: "Okoun" },
  { id: "lipan", emoji: "🪽", label: "Lipan" }
];

export function isFishAvatarId(raw: string | null | undefined): raw is FishAvatarId {
  return FISH_AVATARS.some((a) => a.id === raw);
}

export function fishAvatarEmoji(id: FishAvatarId): string {
  return FISH_AVATARS.find((a) => a.id === id)?.emoji ?? "🐟";
}
