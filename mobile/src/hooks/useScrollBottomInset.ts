import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EXTRA = 10;

/**
 * Celkový spodní padding pro `contentContainerStyle` u ScrollView / FlatList
 * (základní padding z layoutu + systémová lišta / gesta).
 */
export function useScrollBottomInset(basePadding: number): number {
  const { bottom } = useSafeAreaInsets();
  return useMemo(() => basePadding + bottom + EXTRA, [basePadding, bottom]);
}
