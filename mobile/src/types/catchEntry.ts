export type CatchEntry = {
  id: string;
  createdAt: string;
  fishName: string;
  lengthCm?: number;
  water?: string;
  notes?: string;
  /** Relativni cesta v bucketu catch-photos (jen pri sync do Supabase). */
  photoStoragePath?: string;
};
