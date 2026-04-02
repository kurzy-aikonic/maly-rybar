import type { ImageSourcePropType } from "react-native";

/**
 * Mapování `image` z `data/tackle_items.json` na soubory v `mobile/assets/tackle/`.
 * Přidej řádek po vložení souboru (stejně jako u ryb — Metro vyžaduje statické require).
 */
const tackleImageMap: Record<string, ImageSourcePropType> = {
  // "priklad.webp": require("../../assets/tackle/priklad.webp"),
};

export function getTackleImageSource(
  filename: string | undefined
): ImageSourcePropType | undefined {
  if (!filename?.trim()) return undefined;
  return tackleImageMap[filename];
}
