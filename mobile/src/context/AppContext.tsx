import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { progressService, type ProgressState } from "../lib/progress";

const STORAGE_PREMIUM = "maly_rybar_is_premium";
const STORAGE_PROGRESS = "maly_rybar_progress";

type AppContextValue = {
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
  progress: ProgressState;
  applyQuizResult: (score: number, maxScore: number) => void;
  hydrated: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(() => progressService.createInitialProgress());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [premiumRaw, progressRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_PREMIUM),
          AsyncStorage.getItem(STORAGE_PROGRESS)
        ]);
        if (!alive) return;
        if (premiumRaw === "true") setIsPremiumState(true);
        if (progressRaw) {
          const parsed = JSON.parse(progressRaw) as ProgressState;
          setProgress(parsed);
        }
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setIsPremium = useCallback((value: boolean) => {
    setIsPremiumState(value);
    void AsyncStorage.setItem(STORAGE_PREMIUM, value ? "true" : "false");
  }, []);

  const applyQuizResult = useCallback(
    (score: number, maxScore: number) => {
      setProgress((prev) => {
        const afterStreak = progressService.updateStreak(prev);
        const xpGain = progressService.quizXpFromScore(score, maxScore);
        const next = progressService.addXp(afterStreak, xpGain);
        void AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      isPremium,
      setIsPremium,
      progress,
      applyQuizResult,
      hydrated
    }),
    [isPremium, setIsPremium, progress, applyQuizResult, hydrated]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
