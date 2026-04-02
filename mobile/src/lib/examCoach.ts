import type { ExamQuestion } from "./examPrep";

const KIND_LABEL: Record<ExamQuestion["kind"], string> = {
  photo: "poznávání druhů",
  size: "lovné míry",
  season: "doba hájení",
  latin: "latinské názvy",
  similar: "podobné druhy"
};

/** Jedna věta po kole přípravy na zkoušku. */
export function buildExamCoachLine(questions: ExamQuestion[], answers: number[]): string | null {
  if (questions.length === 0) return null;
  const wrongByKind: Record<ExamQuestion["kind"], number> = {
    photo: 0,
    size: 0,
    season: 0,
    latin: 0,
    similar: 0
  };
  let wrong = 0;
  questions.forEach((q, i) => {
    if (answers[i] !== q.correctIndex) {
      wrong += 1;
      wrongByKind[q.kind] += 1;
    }
  });
  if (wrong === 0) {
    return "Skvěle — zkus příště mix nebo jiný typ otázek, ať máš jistotu ve všem.";
  }
  let worst: ExamQuestion["kind"] = "photo";
  let max = -1;
  (Object.keys(wrongByKind) as ExamQuestion["kind"][]).forEach((k) => {
    if (wrongByKind[k] > max) {
      max = wrongByKind[k];
      worst = k;
    }
  });
  return `Tip: nejvíc chyb bylo u „${KIND_LABEL[worst]}“. V menu přípravy zvol znovu tento typ nebo atlas.`;
}
