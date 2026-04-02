import {
  buildExamRound,
  evaluateExam,
  examFishBank,
  examQuestionCounts,
  type ExamQuestion
} from "./examPrep";

describe("evaluateExam", () => {
  const sample = (correctIndex: number): ExamQuestion => ({
    id: "q1",
    kind: "size",
    fishId: "x",
    fishName: "Ryba",
    headline: "",
    options: ["a", "b"],
    correctIndex,
    imageFile: null,
    markHints: null,
    explain: ""
  });

  it("counts only matching indices", () => {
    const qs = [sample(0), sample(1)];
    expect(evaluateExam(qs, [0, 1])).toEqual({ score: 2, maxScore: 2 });
    expect(evaluateExam(qs, [1, 0])).toEqual({ score: 0, maxScore: 2 });
  });

  it("handles empty list", () => {
    expect(evaluateExam([], [])).toEqual({ score: 0, maxScore: 0 });
  });
});

describe("examFishBank", () => {
  it("free tier is subset of premium bank", () => {
    const premium = examFishBank(true);
    const free = examFishBank(false);
    expect(free.length).toBeLessThanOrEqual(premium.length);
    const premiumIds = new Set(premium.map((f) => f.id));
    for (const f of free) {
      expect(premiumIds.has(f.id)).toBe(true);
    }
  });
});

describe("buildExamRound", () => {
  it("respects limit for photo drill", () => {
    const q = buildExamRound({ drill: "photo", isPremium: true, limit: 5 });
    expect(q.length).toBeLessThanOrEqual(5);
    expect(q.length).toBeGreaterThan(0);
  });
});

describe("examQuestionCounts", () => {
  it("returns non-negative integers", () => {
    const c = examQuestionCounts(true);
    expect(c.photo).toBeGreaterThanOrEqual(0);
    expect(c.mix).toBe(c.photo + c.size + c.season + c.latin + c.similar);
  });
});
