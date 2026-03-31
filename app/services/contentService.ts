import fish from "../../data/fish.json";
import knots from "../../data/knots.json";
import regulations from "../../data/regulations_summary.json";
import regions from "../../data/regions.json";

type FishItem = (typeof fish)[number];
type KnotItem = (typeof knots)[number];
type RegionItem = (typeof regions)[number];

function byPremium<T extends { is_premium?: boolean }>(items: T[], isPremium: boolean): T[] {
  if (isPremium) return items;
  return items.filter((item) => !item.is_premium);
}

export const contentService = {
  getFish(isPremium: boolean): FishItem[] {
    return byPremium(fish, isPremium);
  },

  getFishById(id: string): FishItem | undefined {
    return fish.find((item) => item.id === id);
  },

  getKnots(isPremium: boolean): KnotItem[] {
    return byPremium(knots, isPremium);
  },

  getRegulations() {
    return regulations;
  },

  getRegions(): RegionItem[] {
    return regions;
  }
};
