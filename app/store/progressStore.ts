import { progressService, type ProgressState } from "../services/progressService";

export type ProgressStore = {
  progress: ProgressState;
};

export const progressStore = {
  createInitial(): ProgressStore {
    return { progress: progressService.createInitialProgress() };
  },

  afterQuiz(store: ProgressStore, score: number, maxScore: number): ProgressStore {
    const streakProgress = progressService.updateStreak(store.progress);
    const xpGain = progressService.quizXpFromScore(score, maxScore);
    const nextProgress = progressService.addXp(streakProgress, xpGain);
    return { progress: nextProgress };
  }
};
