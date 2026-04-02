import fishData from "../../../data/fish.json";
import type { FishRecord } from "../types/fish";
import { getFishImageSource } from "./fishImages";

export type ExamDrillMode = "photo" | "size" | "season" | "latin" | "similar" | "mix";

export type ExamQuestion = {
  id: string;
  kind: "photo" | "size" | "season" | "latin" | "similar";
  fishId: string;
  fishName: string;
  headline: string;
  options: string[];
  correctIndex: number;
  /** Soubor z fish.json — zobrazí se jen pokud je v mapě `fishImages`. */
  imageFile: string | null;
  /** Když není lokální fotka: znaky z atlasu. */
  markHints: string[] | null;
  /** Po vyhodnocení / špatné odpovědi. */
  explain: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j]!;
    a[j] = t!;
  }
  return a;
}

export function examFishBank(isPremium: boolean): FishRecord[] {
  return (fishData as FishRecord[]).filter((f) => isPremium || !f.is_premium);
}

function distinctWrongNames(bank: FishRecord[], fishId: string, need: number): string[] {
  const pool = shuffle(bank.filter((f) => f.id !== fishId));
  const out: string[] = [];
  for (const f of pool) {
    if (!out.includes(f.name_cz)) out.push(f.name_cz);
    if (out.length >= need) break;
  }
  return out;
}

export function buildPhotoExamQuestions(bank: FishRecord[]): ExamQuestion[] {
  return shuffle(bank).map((fish) => {
    const wrong = distinctWrongNames(bank, fish.id, 3);
    const options = shuffle([fish.name_cz, ...wrong]);
    const correctIndex = options.indexOf(fish.name_cz);
    const bundled = getFishImageSource(fish.image) != null;
    return {
      id: `exam_photo_${fish.id}`,
      kind: "photo",
      fishId: fish.id,
      fishName: fish.name_cz,
      headline: bundled
        ? "Která ryba je na obrázku?"
        : "Který druh odpovídá těmto znakům z atlasu?",
      options,
      correctIndex,
      imageFile: bundled ? fish.image : null,
      markHints: bundled ? null : fish.identification_marks.slice(0, 4),
      explain: `Správně: ${fish.name_cz}. V ostré zkoušce ověř aktuální požadavky spolku.`
    };
  });
}

export function buildSizeExamQuestions(bank: FishRecord[]): ExamQuestion[] {
  const withSize = bank.filter((f) => f.min_size_cm > 0);
  const allSizes = [...new Set(withSize.map((f) => f.min_size_cm))].sort((a, b) => a - b);
  if (allSizes.length < 2) return [];
  return shuffle(withSize).map((fish) => {
    const wrongNums = shuffle(allSizes.filter((n) => n !== fish.min_size_cm)).slice(0, 3);
    while (wrongNums.length < 3 && allSizes.length > 1) {
      const extra = allSizes.find((n) => n !== fish.min_size_cm && !wrongNums.includes(n));
      if (extra === undefined) break;
      wrongNums.push(extra);
    }
    const correctLabel = `${fish.min_size_cm} cm`;
    const wrongLabels = wrongNums.map((n) => `${n} cm`);
    const options = shuffle([correctLabel, ...wrongLabels]);
    const correctIndex = options.indexOf(correctLabel);
    return {
      id: `exam_size_${fish.id}`,
      kind: "size",
      fishId: fish.id,
      fishName: fish.name_cz,
      headline: `Zákonná míra (údaj z atlasu): ${fish.name_cz}`,
      options,
      correctIndex,
      imageFile: null,
      markHints: null,
      explain: `U tohoto druhu je v datech aplikace míra ${fish.min_size_cm} cm. Na konkrétním revíru vždy platí návní řád.`
    };
  });
}

export function buildSeasonExamQuestions(bank: FishRecord[]): ExamQuestion[] {
  const withS = bank.filter((f) => f.closed_season && f.closed_season.trim().length > 0);
  const uniq = [...new Set(withS.map((f) => f.closed_season.trim()))];
  if (uniq.length < 2) return [];
  return shuffle(withS).map((fish) => {
    const c = fish.closed_season.trim();
    const wrong = shuffle(uniq.filter((s) => s !== c)).slice(0, 3);
    while (wrong.length < 3 && uniq.length > 1) {
      const w = uniq.find((s) => s !== c && !wrong.includes(s));
      if (w === undefined) break;
      wrong.push(w);
    }
    const options = shuffle([c, ...wrong]);
    const correctIndex = options.indexOf(c);
    return {
      id: `exam_season_${fish.id}`,
      kind: "season",
      fishId: fish.id,
      fishName: fish.name_cz,
      headline: `Doba hájení (údaj z atlasu): ${fish.name_cz}`,
      options,
      correctIndex,
      imageFile: null,
      markHints: null,
      explain: `V aplikaci: „${c}“. Vždy ověř aktuální stav v návním řádu pro tvůj revír.`
    };
  });
}

export function buildSimilarExamQuestions(bank: FishRecord[]): ExamQuestion[] {
  const withSim = bank.filter((f) => f.similar_species && f.similar_species.length > 0);
  return shuffle(withSim).map((fish) => {
    const pick =
      fish.similar_species[Math.floor(Math.random() * fish.similar_species.length)] ?? "";
    const wrong: string[] = [];
    for (const f of shuffle(bank.filter((b) => b.id !== fish.id))) {
      const n = f.name_cz;
      if (n === pick || n === fish.name_cz || fish.similar_species.includes(n)) continue;
      if (!wrong.includes(n)) wrong.push(n);
      if (wrong.length >= 3) break;
    }
    const options = shuffle([pick, ...wrong.slice(0, 3)]);
    const correctIndex = options.indexOf(pick);
    return {
      id: `exam_similar_${fish.id}`,
      kind: "similar",
      fishId: fish.id,
      fishName: fish.name_cz,
      headline: `Který druh atlas uvádí jako podobný druhu „${fish.name_cz}“?`,
      options,
      correctIndex,
      imageFile: null,
      markHints: null,
      explain: `Správně: „${pick}“. V detailu druhu v atlasu najdeš blok podobných druhů.`
    };
  });
}

export function buildLatinExamQuestions(bank: FishRecord[]): ExamQuestion[] {
  const withLat = bank.filter((f) => f.name_lat && f.name_lat.trim().length > 0);
  return shuffle(withLat).map((fish) => {
    const wrong = distinctWrongNames(bank, fish.id, 3);
    const options = shuffle([fish.name_cz, ...wrong]);
    const correctIndex = options.indexOf(fish.name_cz);
    return {
      id: `exam_latin_${fish.id}`,
      kind: "latin",
      fishId: fish.id,
      fishName: fish.name_cz,
      headline: `Latinský název: ${fish.name_lat} — jaký je správný český název druhu?`,
      options,
      correctIndex,
      imageFile: null,
      markHints: null,
      explain: `Správně: ${fish.name_cz} (${fish.name_lat}).`
    };
  });
}

export function buildExamRound(params: {
  drill: ExamDrillMode;
  isPremium: boolean;
  limit?: number;
}): ExamQuestion[] {
  const limit = params.limit ?? 10;
  const bank = examFishBank(params.isPremium);
  if (bank.length < 2) return [];

  if (params.drill === "photo") {
    return shuffle(buildPhotoExamQuestions(bank)).slice(0, limit);
  }
  if (params.drill === "size") {
    const sizes = buildSizeExamQuestions(bank);
    if (sizes.length === 0) return [];
    return shuffle(sizes).slice(0, limit);
  }
  if (params.drill === "season") {
    const seasons = buildSeasonExamQuestions(bank);
    if (seasons.length === 0) return [];
    return shuffle(seasons).slice(0, limit);
  }
  if (params.drill === "latin") {
    const lat = buildLatinExamQuestions(bank);
    if (lat.length === 0) return [];
    return shuffle(lat).slice(0, limit);
  }
  if (params.drill === "similar") {
    const sim = buildSimilarExamQuestions(bank);
    if (sim.length === 0) return [];
    return shuffle(sim).slice(0, limit);
  }

  const merged = shuffle([
    ...buildPhotoExamQuestions(bank),
    ...buildSizeExamQuestions(bank),
    ...buildSeasonExamQuestions(bank),
    ...buildLatinExamQuestions(bank),
    ...buildSimilarExamQuestions(bank)
  ]);
  return merged.slice(0, limit);
}

/**
 * Kolo jen s otázkami „co je na fotce“ — výhradně druhy, které mají v aplikaci lokální obrázek
 * (bez náhrady znaky z atlasu), jako bývá u dětských testů „na ostro“.
 */
export function buildImageOnlyPhotoRound(params: {
  isPremium: boolean;
  limit?: number;
}): ExamQuestion[] {
  const limit = params.limit ?? 10;
  const bank = examFishBank(params.isPremium);
  const withImg = bank.filter((f) => getFishImageSource(f.image) != null);
  if (withImg.length < 2) return [];
  const pool = buildPhotoExamQuestions(withImg);
  const visual = pool.filter((q) => q.imageFile != null);
  return shuffle(visual).slice(0, Math.min(limit, visual.length));
}

/** Kolik druhů v bance má fotku a jde je použít v režimu jen-z-obrázku. */
export function imageOnlyPhotoSpeciesCount(isPremium: boolean): number {
  const bank = examFishBank(isPremium);
  return bank.filter((f) => getFishImageSource(f.image) != null).length;
}

export function evaluateExam(
  questions: ExamQuestion[],
  answers: number[]
): { score: number; maxScore: number } {
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) score += 1;
  });
  return { score, maxScore: questions.length };
}

export function examQuestionCounts(isPremium: boolean): {
  photo: number;
  size: number;
  season: number;
  latin: number;
  similar: number;
  mix: number;
} {
  const bank = examFishBank(isPremium);
  if (bank.length < 2) {
    return { photo: 0, size: 0, season: 0, latin: 0, similar: 0, mix: 0 };
  }
  const photos = buildPhotoExamQuestions(bank).length;
  const sizes = buildSizeExamQuestions(bank).length;
  const seasons = buildSeasonExamQuestions(bank).length;
  const latins = buildLatinExamQuestions(bank).length;
  const similars = buildSimilarExamQuestions(bank).length;
  const mixTotal = photos + sizes + seasons + latins + similars;
  return {
    photo: photos,
    size: sizes,
    season: seasons,
    latin: latins,
    similar: similars,
    mix: mixTotal
  };
}
