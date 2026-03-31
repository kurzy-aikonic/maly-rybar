import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { progressService, type ProgressState } from "../lib/progress";
import type { ChildProfile, ExamHorizonId } from "../types/profile";

const STORAGE_PREMIUM = "maly_rybar_is_premium";
const STORAGE_PROGRESS = "maly_rybar_progress";
const STORAGE_ONBOARDING = "maly_rybar_onboarding_done";
const STORAGE_CHILD_PROFILE = "maly_rybar_child_profile";

type AppContextValue = {
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
  progress: ProgressState;
  applyQuizResult: (score: number, maxScore: number) => void;
  hydrated: boolean;
  onboardingComplete: boolean;
  childAge?: number;
  examHorizon?: ExamHorizonId;
  completeOnboarding: (profile: ChildProfile) => void;
  resetOnboarding: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(() => progressService.createInitialProgress());
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [childAge, setChildAge] = useState<number | undefined>(undefined);
  const [examHorizon, setExamHorizon] = useState<ExamHorizonId | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [premiumRaw, progressRaw, doneRaw, profileRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_PREMIUM),
          AsyncStorage.getItem(STORAGE_PROGRESS),
          AsyncStorage.getItem(STORAGE_ONBOARDING),
          AsyncStorage.getItem(STORAGE_CHILD_PROFILE)
        ]);
        if (!alive) return;
        if (premiumRaw === "true") setIsPremiumState(true);
        if (progressRaw) {
          const parsed = JSON.parse(progressRaw) as ProgressState;
          setProgress(parsed);
        }
        if (doneRaw === "1") setOnboardingComplete(true);
        if (profileRaw) {
          const p = JSON.parse(profileRaw) as ChildProfile;
          if (typeof p.childAge === "number") setChildAge(p.childAge);
          if (p.examHorizon) setExamHorizon(p.examHorizon);
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

  const applyQuizResult = useCallback((score: number, maxScore: number) => {
    setProgress((prev) => {
      const afterStreak = progressService.updateStreak(prev);
      const xpGain = progressService.quizXpFromScore(score, maxScore);
      const next = progressService.addXp(afterStreak, xpGain);
      void AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(next));
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((profile: ChildProfile) => {
    setChildAge(profile.childAge);
    setExamHorizon(profile.examHorizon);
    setOnboardingComplete(true);
    void (async () => {
      await AsyncStorage.setItem(STORAGE_ONBOARDING, "1");
      await AsyncStorage.setItem(STORAGE_CHILD_PROFILE, JSON.stringify(profile));
    })();
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingComplete(false);
    setChildAge(undefined);
    setExamHorizon(undefined);
    void (async () => {
      await AsyncStorage.removeItem(STORAGE_ONBOARDING);
      await AsyncStorage.removeItem(STORAGE_CHILD_PROFILE);
    })();
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      setIsPremium,
      progress,
      applyQuizResult,
      hydrated,
      onboardingComplete,
      childAge,
      examHorizon,
      completeOnboarding,
      resetOnboarding
    }),
    [
      isPremium,
      setIsPremium,
      progress,
      applyQuizResult,
      hydrated,
      onboardingComplete,
      childAge,
      examHorizon,
      completeOnboarding,
      resetOnboarding
    ]
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
