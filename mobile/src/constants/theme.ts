/**
 * Jednotná paleta pro UI — importuj `theme` místo lokálního `colors` objektu
 * (menší duplicita, jedna změna = celá appka).
 */
export const theme = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3",
  accent: "#00c2a8",
  card: "#161b22",
  border: "#202733",
  danger: "#ff7b72",
  lock: "#f0b429",
  success: "#3fb950",
  accentOnAccent: "#04120f",
  /** Pozadí sekcí / karet v atlasu a podobně */
  sectionBg: "#12171f"
} as const;
