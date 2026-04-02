export type FishSectionRow = { label: string; value: string };

export type FishMethodRow = { id: string; label: string; active: boolean };

/** Jedna logická sekce odborné karty (viz atlas / papírová karta druhu). */
export type FishDetailSection = {
  id: string;
  title: string;
  /** Sekce jen pro předplatitele (zamčeno bez Premium). */
  premium: boolean;
  intro?: string;
  rows?: FishSectionRow[];
  bullets?: string[];
  paragraphs?: string[];
  methods?: FishMethodRow[];
};

export type FishDetailJson = {
  family_cz?: string;
  taste_group?: string;
  names_i18n?: Record<string, string>;
  sections: FishDetailSection[];
};

export type FishRecord = {
  id: string;
  name_cz: string;
  name_lat: string;
  image: string;
  min_size_cm: number;
  closed_season: string;
  identification_marks: string[];
  similar_species: string[];
  tips: string;
  is_premium: boolean;
  detail?: FishDetailJson;
};

export type ResolvedFishSection = FishDetailSection & { locked: boolean };
