import { progressService, type ProgressState } from "./progress";

describe("progressService", () => {
  it("xpForNextLevel scales with level", () => {
    expect(progressService.xpForNextLevel(1)).toBe(500);
    expect(progressService.xpForNextLevel(2)).toBe(1000);
  });

  it("addXp rolls overflow into next level", () => {
    let s = progressService.createInitialProgress();
    s = progressService.addXp(s, 500);
    expect(s.level).toBe(2);
    expect(s.xp).toBe(0);
  });

  it("quizXpFromScore maps ratio to 50–200", () => {
    expect(progressService.quizXpFromScore(0, 10)).toBe(50);
    expect(progressService.quizXpFromScore(10, 10)).toBe(200);
  });

  it("quizXpFromScore returns 0 for invalid max", () => {
    expect(progressService.quizXpFromScore(5, 0)).toBe(0);
  });

  it("applyActivity with quiz_complete increments lifetime test rounds", () => {
    let s = progressService.createInitialProgress();
    const xpGain = progressService.quizXpFromScore(5, 10);
    s = progressService.applyActivity(s, { activity: "quiz_complete", baseXp: xpGain });
    expect(s.lifetime?.testRoundsCompleted).toBe(1);
    expect(s.achievementIds).toContain("milestone_first_test");
  });

  it("unlockAllBadges adds level milestones", () => {
    let s: ProgressState = {
      ...progressService.createInitialProgress(),
      level: 5,
      achievementIds: []
    };
    s = progressService.unlockAllBadges(s);
    expect(s.achievementIds).toContain("milestone_level_5");
  });
});
