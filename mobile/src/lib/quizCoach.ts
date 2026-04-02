import type { QuizCategory, QuizQuestion } from "./quiz";

const CATEGORY_LABEL: Record<QuizCategory, string> = {
  rules: "Pravidla a řád",
  fish: "Ryby a druhy",
  biology: "Příroda u vody",
  practice: "Úvazy a praxe"
};

/** Jedna věta po dokončení obecného kvízu — kam se příště zaměřit. */
export function buildClassicQuizCoachLine(quiz: QuizQuestion[], answers: number[]): string | null {
  if (quiz.length === 0) return null;
  const wrongByCat: Record<QuizCategory, number> = {
    rules: 0,
    fish: 0,
    biology: 0,
    practice: 0
  };
  let wrong = 0;
  quiz.forEach((q, i) => {
    if (answers[i] !== q.correct_index) {
      wrong += 1;
      const cat = q.category as QuizCategory;
      wrongByCat[cat] += 1;
    }
  });
  if (wrong === 0) {
    return "Paráda — zkus příště jiné téma nebo náhodný mix, ať máš pestrost.";
  }
  let worst: QuizCategory = "rules";
  let max = -1;
  (Object.keys(wrongByCat) as QuizCategory[]).forEach((c) => {
    if (wrongByCat[c] > max) {
      max = wrongByCat[c];
      worst = c;
    }
  });
  return `Tip: nejvíc chyb bylo v oblasti „${CATEGORY_LABEL[worst]}“. Zopakuj toto téma v Testech nebo si otevři související část v atlasu a U vody.`;
}
