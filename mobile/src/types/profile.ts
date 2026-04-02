import type { FishAvatarId } from "../constants/fishAvatars";

export type ExamHorizonId =
  | "do_3_mesicu"
  | "do_roka"
  | "jen_uceni"
  | "nezacinam";

export type ChildProfile = {
  childAge: number;
  examHorizon: ExamHorizonId;
  /** Přezdívka (prázdná = zobrazí se „Malý rybář“). */
  nickname?: string;
  fishAvatarId?: FishAvatarId;
};
