import type { ExamHorizonId } from "../types/profile";

const LABELS: Record<ExamHorizonId, string> = {
  do_3_mesicu: "Zkousky do 3 mesicu",
  do_roka: "Zkousky do roku",
  jen_uceni: "Zatim jen uceni a zabava",
  nezacinam: "Teprve zacinam"
};

export function examHorizonLabel(id: ExamHorizonId): string {
  return LABELS[id] ?? id;
}
