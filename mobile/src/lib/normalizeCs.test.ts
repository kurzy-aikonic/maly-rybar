import { normalizeCs } from "./normalizeCs";

describe("normalizeCs", () => {
  it("strips diacritics and lowercases", () => {
    expect(normalizeCs("Morava")).toBe(normalizeCs("mórava"));
    expect(normalizeCs("České")).toBe("ceske");
  });
});
