import type { FishRecord } from "../types/fish";
import { pickFishOfDay } from "./fishOfDay";

const bank: FishRecord[] = [
  {
    id: "a",
    name_cz: "A",
    name_lat: "A a",
    image: "",
    min_size_cm: 0,
    closed_season: "",
    identification_marks: [],
    similar_species: [],
    tips: "",
    is_premium: false
  },
  {
    id: "b",
    name_cz: "B",
    name_lat: "B b",
    image: "",
    min_size_cm: 0,
    closed_season: "",
    identification_marks: [],
    similar_species: [],
    tips: "",
    is_premium: false
  }
];

describe("pickFishOfDay", () => {
  it("returns stable fish for same date", () => {
    const d = "2026-04-02";
    expect(pickFishOfDay(bank, d)).toEqual(pickFishOfDay(bank, d));
  });

  it("returns null for empty bank", () => {
    expect(pickFishOfDay([], "2026-01-01")).toBeNull();
  });
});
