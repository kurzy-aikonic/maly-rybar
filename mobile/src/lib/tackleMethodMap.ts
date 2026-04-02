import type { TackleMethodTag } from "../types/tackle";

/**
 * Hlavní karta průvodce pro danou metodu z atlasu (FishMethodRow.id).
 * Slouží k tlačítkům „Jak na to“ u sekce náčiní.
 */
export const PRIMARY_TACKLE_BY_METHOD: Record<TackleMethodTag, string> = {
  float: "tackle_plavana_navod",
  ledger: "tackle_polozena_navod",
  spin: "tackle_privlac_navod",
  fly: "tackle_muska_navod",
  other: "tackle_obecne_pomucky"
};

export function methodLabelCs(methodId: TackleMethodTag): string {
  switch (methodId) {
    case "float":
      return "Plavaná";
    case "ledger":
      return "Položená / feeder";
    case "spin":
      return "Přívlač";
    case "fly":
      return "Muškaření";
    case "other":
      return "Ostatní";
  }
}
