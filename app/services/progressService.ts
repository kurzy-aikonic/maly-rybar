export type ProgressState = {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string | null;
};

const XP_PER_LEVEL = 500;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export const progressService = {
  createInitialProgress(): ProgressState {
    return { xp: 0, level: 1, streakDays: 0, lastActiveDate: null };
  },

  xpForNextLevel(level: number): number {
    return level * XP_PER_LEVEL;
  },

  addXp(state: ProgressState, amount: number): ProgressState {
    let xp = state.xp + amount;
    let level = state.level;
    let nextNeeded = progressService.xpForNextLevel(level);

    while (xp >= nextNeeded) {
      xp -= nextNeeded;
      level += 1;
      nextNeeded = progressService.xpForNextLevel(level);
    }

    return { ...state, xp, level };
  },

  updateStreak(state: ProgressState): ProgressState {
    const today = todayISO();
    const last = state.lastActiveDate;

    if (!last) {
      return { ...state, streakDays: 1, lastActiveDate: today };
    }

    if (last === today) {
      return state;
    }

    if (last === addDays(today, -1)) {
      return { ...state, streakDays: state.streakDays + 1, lastActiveDate: today };
    }

    return { ...state, streakDays: 1, lastActiveDate: today };
  },

  quizXpFromScore(score: number, maxScore: number): number {
    if (maxScore <= 0) return 0;
    const ratio = score / maxScore;
    return Math.round(50 + ratio * 150);
  }
};
