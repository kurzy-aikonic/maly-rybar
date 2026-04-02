/** Porovnání textu bez ohledu na velikost písmen a diakritiku (např. „morava“ ≈ „Morava“). */
export function normalizeCs(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}
