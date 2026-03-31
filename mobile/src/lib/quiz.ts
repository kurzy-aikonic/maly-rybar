import questions from "../../../data/quiz_questions.json";

export type QuizCategory = "rules" | "fish" | "biology" | "practice";
export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestion = (typeof questions)[number];

function shuffle<T>(arr: T[]): T[] {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = clone[i];
    clone[i] = clone[j];
    clone[j] = tmp;
  }
  return clone;
}

export const quizService = {
  getQuestionBank(isPremium: boolean): QuizQuestion[] {
    if (isPremium) return questions;
    return questions.filter((q) => !q.is_premium);
  },

  buildQuiz(params: {
    isPremium: boolean;
    category?: QuizCategory;
    difficulty?: QuizDifficulty;
    limit?: number;
  }): QuizQuestion[] {
    const { isPremium, category, difficulty, limit = 10 } = params;
    let filtered = quizService.getQuestionBank(isPremium);

    if (category) filtered = filtered.filter((q) => q.category === category);
    if (difficulty) filtered = filtered.filter((q) => q.difficulty === difficulty);

    return shuffle(filtered).slice(0, limit);
  },

  evaluateQuiz(
    quiz: QuizQuestion[],
    answers: number[]
  ): { score: number; maxScore: number; wrongQuestionIds: string[] } {
    let score = 0;
    const wrongQuestionIds: string[] = [];

    quiz.forEach((question, index) => {
      if (answers[index] === question.correct_index) {
        score += 1;
      } else {
        wrongQuestionIds.push(question.id);
      }
    });

    return { score, maxScore: quiz.length, wrongQuestionIds };
  }
};
