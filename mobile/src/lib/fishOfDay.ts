import type { FishRecord } from "../types/fish";

/** Lokální kalendářní den (ne UTC) — stejná „ryba dne“ celý den u uživatele. */
export function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hashStringToPositiveInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Jedna ryba z banky pro daný den — stabilní pro všechny s touž bankou a datem.
 * Banka = stejný filtr jako atlas (Free / Premium).
 */
export function pickFishOfDay(bank: FishRecord[], localDateISO: string): FishRecord | null {
  if (bank.length === 0) return null;
  const idx = hashStringToPositiveInt(`fishday:${localDateISO}`) % bank.length;
  return bank[idx] ?? null;
}

/** Krátká zábavná / naučná věta na kartu Domů. */
export function fishOfDayBlurb(fish: FishRecord): string {
  const mark = fish.identification_marks?.find((x) => x.trim().length > 0)?.trim();
  if (mark) return mark;
  const t = fish.tips?.trim();
  if (t) return t.length > 118 ? `${t.slice(0, 115)}…` : t;
  const parts: string[] = [];
  if (fish.min_size_cm > 0) parts.push(`V atlasu lovná míra ${fish.min_size_cm} cm`);
  if (fish.closed_season?.trim()) parts.push(`hájení ${fish.closed_season.trim()}`);
  if (parts.length) return `${parts.join(" · ")}.`;
  return "Otevři kartu v atlasu — uvidíš míru, hájení a znaky druhu.";
}
