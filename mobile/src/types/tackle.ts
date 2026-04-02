export type TackleMethodTag = "float" | "ledger" | "spin" | "fly" | "other";

export type TackleAssemblyStep = {
  title: string;
  body: string;
};

export type TackleAtlasLink = {
  fish_id: string;
  label: string;
};

export type TackleItem = {
  id: string;
  category_id: string;
  title: string;
  subtitle: string;
  /** Název souboru v `mobile/assets/tackle/` + řádek v `tackleImages.ts` (volitelné). */
  image?: string;
  is_premium: boolean;
  /** Odpovídá `FishMethodRow.id` v atlasu (Způsob lovu / náčiní). */
  method_tags?: TackleMethodTag[];
  paragraphs?: string[];
  bullets?: string[];
  assembly_steps?: TackleAssemblyStep[];
  atlas_links?: TackleAtlasLink[];
  disclaimer?: string;
};

export type TackleCategory = {
  id: string;
  title: string;
};

export type TackleGuideJson = {
  title: string;
  intro: string;
  footnote: string;
  categories: TackleCategory[];
  items: TackleItem[];
};
