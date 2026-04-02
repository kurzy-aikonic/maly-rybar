import type { ExamHorizonId } from "../types/profile";

const LABELS: Record<ExamHorizonId, string> = {
  do_3_mesicu: "Zkoušky do 3 měsíců",
  do_roka: "Zkoušky do roku",
  jen_uceni: "Zatím jen učení a zábava",
  nezacinam: "Teprve začínám"
};

export function examHorizonLabel(id: ExamHorizonId): string {
  return LABELS[id] ?? id;
}
