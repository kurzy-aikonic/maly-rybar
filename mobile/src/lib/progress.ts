/** Počty dokončených kol testů (obecný kvíz + příprava na zkoušku). */
export type ProgressLifetime = {
  testRoundsCompleted: number;
};

export type ProgressState = {
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string | null;
  dailyChallenge?: DailyChallengeState;
  achievementIds?: AchievementId[];
  lifetime?: ProgressLifetime;
};

export type ActivityType = "quiz_complete" | "atlas_open" | "diary_add" | "water_prepare";

export type AchievementId =
  | "milestone_first_test"
  | "milestone_ten_tests"
  | "milestone_fifty_tests"
  | "milestone_level_5"
  | "milestone_level_10"
  | "daily_streak_3"
  | "daily_streak_7";

export const ACHIEVEMENT_LABELS: Record<AchievementId, string> = {
  milestone_first_test: "První kolo testů",
  milestone_ten_tests: "10 dokončených kol",
  milestone_fifty_tests: "50 dokončených kol",
  milestone_level_5: "Úroveň 5",
  milestone_level_10: "Úroveň 10",
  daily_streak_3: "Ranní ptáče (3 dny v řadě)",
  daily_streak_7: "Týdenní tah (7 dní v řadě)"
};

/** Pořadí zobrazení na Domě (všechny odznaky včetně těch, co ještě nejsou odemčeny). */
export const ACHIEVEMENT_DISPLAY_ORDER: AchievementId[] = [
  "milestone_first_test",
  "milestone_ten_tests",
  "milestone_fifty_tests",
  "milestone_level_5",
  "milestone_level_10",
  "daily_streak_3",
  "daily_streak_7"
];

export type DailyChallengeState = {
  date: string;
  type: ActivityType;
  title: string;
  rewardXp: number;
  isDone: boolean;
};

const XP_PER_LEVEL = 500;
const DAILY_CHALLENGE_REWARD_XP = 15;

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
    const date = todayISO();
    return {
      xp: 0,
      level: 1,
      streakDays: 0,
      lastActiveDate: null,
      dailyChallenge: progressService.buildDailyChallenge(date),
      achievementIds: []
    };
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
  },

  buildDailyChallenge(dateISO: string): DailyChallengeState {
    const seed = Number(dateISO.replaceAll("-", ""));
    const selector = seed % 4;
    if (selector === 0) {
      return {
        date: dateISO,
        type: "quiz_complete",
        title: "Dokonči dnes 1 kvíz",
        rewardXp: DAILY_CHALLENGE_REWARD_XP,
        isDone: false
      };
    }
    if (selector === 1) {
      return {
        date: dateISO,
        type: "atlas_open",
        title: "Otevři detail 1 ryby v atlasu",
        rewardXp: DAILY_CHALLENGE_REWARD_XP,
        isDone: false
      };
    }
    if (selector === 2) {
      return {
        date: dateISO,
        type: "diary_add",
        title: "Zapiš 1 úlovek do deníku",
        rewardXp: DAILY_CHALLENGE_REWARD_XP,
        isDone: false
      };
    }
    return {
      date: dateISO,
      type: "water_prepare",
      title: "Odškrtni celý checklist „Než vyrazíš k vodě“",
      rewardXp: DAILY_CHALLENGE_REWARD_XP,
      isDone: false
    };
  },

  ensureCurrentDailyChallenge(state: ProgressState): ProgressState {
    const today = todayISO();
    if (state.dailyChallenge?.date === today) return state;
    return {
      ...state,
      dailyChallenge: progressService.buildDailyChallenge(today)
    };
  },

  applyActivity(
    state: ProgressState,
    params: { activity: ActivityType; baseXp?: number }
  ): ProgressState {
    let withToday = progressService.ensureCurrentDailyChallenge(state);
    if (params.activity === "quiz_complete" && params.baseXp !== undefined) {
      const tr = (withToday.lifetime?.testRoundsCompleted ?? 0) + 1;
      withToday = {
        ...withToday,
        lifetime: { testRoundsCompleted: tr }
      };
    }
    const afterStreak = progressService.updateStreak(withToday);
    const withBase = params.baseXp ? progressService.addXp(afterStreak, params.baseXp) : afterStreak;
    const challenge = withBase.dailyChallenge;
    if (!challenge || challenge.isDone || challenge.type !== params.activity) {
      return progressService.unlockAllBadges(withBase);
    }

    const doneChallenge: DailyChallengeState = { ...challenge, isDone: true };
    const afterReward = progressService.addXp(
      { ...withBase, dailyChallenge: doneChallenge },
      doneChallenge.rewardXp
    );
    return progressService.unlockAllBadges(afterReward);
  },

  unlockAllBadges(state: ProgressState): ProgressState {
    const ids = new Set(state.achievementIds ?? []);
    if (state.streakDays >= 3) ids.add("daily_streak_3");
    if (state.streakDays >= 7) ids.add("daily_streak_7");
    const tr = state.lifetime?.testRoundsCompleted ?? 0;
    if (tr >= 1) ids.add("milestone_first_test");
    if (tr >= 10) ids.add("milestone_ten_tests");
    if (tr >= 50) ids.add("milestone_fifty_tests");
    if (state.level >= 5) ids.add("milestone_level_5");
    if (state.level >= 10) ids.add("milestone_level_10");
    return { ...state, achievementIds: Array.from(ids) };
  }
};

/** Po `applyActivity`: kolik bonus XP z denní výzvy právě přibylo (0 = výzva se neuzavřela). */
export function getDailyChallengeBonusIfJustCompleted(
  prev: ProgressState,
  next: ProgressState,
  activity: ActivityType
): number {
  const before = progressService.ensureCurrentDailyChallenge(prev);
  const bc = before.dailyChallenge;
  const nc = next.dailyChallenge;
  if (!bc || !nc || bc.date !== nc.date) return 0;
  if (bc.isDone || !nc.isDone) return 0;
  if (bc.type !== activity) return 0;
  return nc.rewardXp;
}

export function getNewlyUnlockedAchievements(
  prev: ProgressState,
  next: ProgressState
): AchievementId[] {
  const prevSet = new Set(prev.achievementIds ?? []);
  const out: AchievementId[] = [];
  for (const id of next.achievementIds ?? []) {
    if (!prevSet.has(id) && id in ACHIEVEMENT_LABELS) {
      out.push(id as AchievementId);
    }
  }
  return out;
}

/** Texty pro toast: splněná denní výzva + nové odznaky. */
export function buildProgressCelebrationMessage(
  prev: ProgressState,
  next: ProgressState,
  activity: ActivityType
): string {
  const lines: string[] = [];
  const bonus = getDailyChallengeBonusIfJustCompleted(prev, next, activity);
  if (bonus > 0) lines.push(`Denní výzva splněna! +${bonus} XP`);
  for (const id of getNewlyUnlockedAchievements(prev, next)) {
    lines.push(`Nový odznak: ${ACHIEVEMENT_LABELS[id]}`);
  }
  return lines.join("\n");
}
