import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DEFAULT_FISH_AVATAR_ID,
  isFishAvatarId,
  type FishAvatarId
} from "../constants/fishAvatars";
import {
  STORAGE_CHILD_PROFILE,
  STORAGE_ONBOARDING,
  STORAGE_PREMIUM,
  STORAGE_PROGRESS
} from "../constants/storageKeys";
import { useAuth } from "./AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  buildProgressCelebrationMessage,
  progressService,
  type ActivityType,
  type ProgressState
} from "../lib/progress";
import {
  fetchProfileIdentity,
  fetchProfilePremium,
  persistProfileIdentity,
  persistProfilePremium
} from "../services/profileRemote";
import { purchasesSetAppUserId } from "../services/purchasesBridge";
import type { ChildProfile, ExamHorizonId } from "../types/profile";

/** Po přepnutí na záložku Testy otevři tuto část (spotřebuje se jednou). */
export type PendingTestyView = "exam" | "classic" | "photo";

/** Po přepnutí na „U vody“ otevři průvodce výbavou (seznam nebo konkrétní kartu). */
export type PendingTackleTarget =
  | { kind: "list" }
  | { kind: "detail"; id: string };

type AppContextValue = {
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
  /** Načte `profiles.is_premium` ze serveru (po nákupu / webhooku). */
  refetchPremiumFromSupabase: () => Promise<void>;
  progress: ProgressState;
  recordActivity: (activity: ActivityType) => void;
  applyQuizResult: (score: number, maxScore: number) => void;
  hydrated: boolean;
  onboardingComplete: boolean;
  childAge?: number;
  examHorizon?: ExamHorizonId;
  /** Prázdná přezdívka = v UI „Malý rybář“. */
  childNickname: string;
  fishAvatarId: FishAvatarId;
  updateChildIdentity: (nickname: string, fishAvatarId: FishAvatarId) => Promise<void>;
  completeOnboarding: (profile: ChildProfile) => void;
  resetOnboarding: () => void;
  /** Nastaví úvodní obrazovku záložky Testy po příštím focuse (např. před `navigate('Testy')`). */
  setPendingTestyView: (view: PendingTestyView) => void;
  /** Vezme a zruší čekající cíl záložky Testy, nebo `null`. */
  takePendingTestyView: () => PendingTestyView | null;
  /** Po přepnutí na Atlas otevři detail ryby (`fish.id`) jednou. */
  setPendingAtlasFishId: (fishId: string | null) => void;
  takePendingAtlasFishId: () => string | null;
  /** Po přepnutí na U vody otevři Poznávání výbavy (seznam nebo detail). */
  setPendingTackleTarget: (target: PendingTackleTarget | null) => void;
  takePendingTackleTarget: () => PendingTackleTarget | null;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  /** Produkční buildy: nelze spolehat na lokální přepínač Premium (bezpecnost + Faze 6). */
  const prevUserIdRef = useRef<string | undefined>(undefined);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPremium, setIsPremiumState] = useState(false);
  const [progress, setProgress] = useState<ProgressState>(() => progressService.createInitialProgress());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [childAge, setChildAge] = useState<number | undefined>(undefined);
  const [examHorizon, setExamHorizon] = useState<ExamHorizonId | undefined>(undefined);
  const [childNickname, setChildNickname] = useState("");
  const [fishAvatarId, setFishAvatarId] = useState<FishAvatarId>(DEFAULT_FISH_AVATAR_ID);
  const pendingTestyViewRef = useRef<PendingTestyView | null>(null);
  const pendingAtlasFishIdRef = useRef<string | null>(null);
  const pendingTackleTargetRef = useRef<PendingTackleTarget | null>(null);

  const setPendingTestyView = useCallback((view: PendingTestyView) => {
    pendingTestyViewRef.current = view;
  }, []);

  const takePendingTestyView = useCallback((): PendingTestyView | null => {
    const v = pendingTestyViewRef.current;
    pendingTestyViewRef.current = null;
    return v;
  }, []);

  const setPendingAtlasFishId = useCallback((fishId: string | null) => {
    pendingAtlasFishIdRef.current = fishId;
  }, []);

  const takePendingAtlasFishId = useCallback((): string | null => {
    const id = pendingAtlasFishIdRef.current;
    pendingAtlasFishIdRef.current = null;
    return id;
  }, []);

  const setPendingTackleTarget = useCallback((target: PendingTackleTarget | null) => {
    pendingTackleTargetRef.current = target;
  }, []);

  const takePendingTackleTarget = useCallback((): PendingTackleTarget | null => {
    const t = pendingTackleTargetRef.current;
    pendingTackleTargetRef.current = null;
    return t;
  }, []);

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
        if (__DEV__ && premiumRaw === "true") setIsPremiumState(true);
        if (progressRaw) {
          try {
            const parsed = JSON.parse(progressRaw) as ProgressState;
            if (parsed && typeof parsed === "object") setProgress(parsed);
          } catch {
            /* ignoruj poskozeny stav */
          }
        }
        if (doneRaw === "1") setOnboardingComplete(true);
        if (profileRaw) {
          try {
            const p = JSON.parse(profileRaw) as ChildProfile;
            if (typeof p.childAge === "number") setChildAge(p.childAge);
            if (p.examHorizon) setExamHorizon(p.examHorizon);
            setChildNickname(typeof p.nickname === "string" ? p.nickname : "");
            setFishAvatarId(isFishAvatarId(p.fishAvatarId) ? p.fishAvatarId : DEFAULT_FISH_AVATAR_ID);
          } catch {
            /* ignoruj */
          }
        }
      } finally {
        if (alive) setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const TOAST_MS = 3400;

  const showAppToast = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(trimmed);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_MS);
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid || !isSupabaseConfigured) return;

    let cancelled = false;
    void (async () => {
      try {
        const fromServer = await fetchProfilePremium(uid);
        if (cancelled) return;
        setIsPremiumState(fromServer);
        await AsyncStorage.setItem(STORAGE_PREMIUM, fromServer ? "true" : "false");
      } catch (e) {
        console.warn("[app] fetchProfilePremium", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid || !isSupabaseConfigured) return;

    let cancelled = false;
    void (async () => {
      try {
        const identity = await fetchProfileIdentity(uid);
        if (cancelled || !identity) return;
        const nextName = identity.displayName ?? "";
        const nextAvatar = identity.fishAvatarId ?? DEFAULT_FISH_AVATAR_ID;
        setChildNickname(nextName);
        setFishAvatarId(nextAvatar);
        const profileRaw = await AsyncStorage.getItem(STORAGE_CHILD_PROFILE);
        if (!profileRaw) return;
        try {
          const p = JSON.parse(profileRaw) as ChildProfile;
          if (typeof p.childAge !== "number" || !p.examHorizon) return;
          await AsyncStorage.setItem(
            STORAGE_CHILD_PROFILE,
            JSON.stringify({
              ...p,
              nickname: nextName,
              fishAvatarId: nextAvatar
            })
          );
        } catch {
          /* ignoruj */
        }
      } catch (e) {
        console.warn("[app] fetchProfileIdentity", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const uid = session?.user?.id;
    if (__DEV__) {
      prevUserIdRef.current = uid;
      return;
    }
    if (prevUserIdRef.current && !uid) {
      setIsPremiumState(false);
      void AsyncStorage.setItem(STORAGE_PREMIUM, "false");
    }
    prevUserIdRef.current = uid;
  }, [session?.user?.id]);

  useEffect(() => {
    void purchasesSetAppUserId(session?.user?.id ?? null);
  }, [session?.user?.id]);

  const refetchPremiumFromSupabase = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid || !isSupabaseConfigured) return;
    try {
      const fromServer = await fetchProfilePremium(uid);
      setIsPremiumState(fromServer);
      await AsyncStorage.setItem(STORAGE_PREMIUM, fromServer ? "true" : "false");
    } catch (e) {
      console.warn("[app] refetchPremiumFromSupabase", e);
    }
  }, [session?.user?.id]);

  const setIsPremium = useCallback(
    (value: boolean) => {
      if (!__DEV__) {
        console.warn("[app] setIsPremium je jen pro vyvoj (__DEV__); v produkci ridi Premium Supabase / platby.");
        return;
      }
      setIsPremiumState(value);
      void AsyncStorage.setItem(STORAGE_PREMIUM, value ? "true" : "false");
      const uid = session?.user?.id;
      if (uid && isSupabaseConfigured) {
        void persistProfilePremium(uid, value).catch((e) => console.warn("[app] persistProfilePremium", e));
      }
    },
    [session?.user?.id]
  );

  const recordActivity = useCallback(
    (activity: ActivityType) => {
      setProgress((prev) => {
        const next = progressService.applyActivity(prev, { activity });
        void AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(next));
        const celebration = buildProgressCelebrationMessage(prev, next, activity);
        if (celebration) {
          requestAnimationFrame(() => showAppToast(celebration));
        }
        return next;
      });
    },
    [showAppToast]
  );

  const applyQuizResult = useCallback(
    (score: number, maxScore: number) => {
      setProgress((prev) => {
        const xpGain = progressService.quizXpFromScore(score, maxScore);
        const next = progressService.applyActivity(prev, {
          activity: "quiz_complete",
          baseXp: xpGain
        });
        void AsyncStorage.setItem(STORAGE_PROGRESS, JSON.stringify(next));
        const celebration = buildProgressCelebrationMessage(prev, next, "quiz_complete");
        if (celebration) {
          requestAnimationFrame(() => showAppToast(celebration));
        }
        return next;
      });
    },
    [showAppToast]
  );

  const completeOnboarding = useCallback((profile: ChildProfile) => {
    const nick = typeof profile.nickname === "string" ? profile.nickname : "";
    const avatar = isFishAvatarId(profile.fishAvatarId) ? profile.fishAvatarId : DEFAULT_FISH_AVATAR_ID;
    const full: ChildProfile = {
      childAge: profile.childAge,
      examHorizon: profile.examHorizon,
      nickname: nick,
      fishAvatarId: avatar
    };
    setChildAge(profile.childAge);
    setExamHorizon(profile.examHorizon);
    setChildNickname(nick);
    setFishAvatarId(avatar);
    setOnboardingComplete(true);
    void (async () => {
      await AsyncStorage.setItem(STORAGE_ONBOARDING, "1");
      await AsyncStorage.setItem(STORAGE_CHILD_PROFILE, JSON.stringify(full));
    })();
  }, []);

  const updateChildIdentity = useCallback(
    async (nickname: string, nextAvatar: FishAvatarId) => {
      const sanitized = nickname.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim().slice(0, 24);
      setChildNickname(sanitized);
      setFishAvatarId(nextAvatar);
      if (onboardingComplete && typeof childAge === "number" && examHorizon) {
        const profile: ChildProfile = {
          childAge,
          examHorizon,
          nickname: sanitized,
          fishAvatarId: nextAvatar
        };
        await AsyncStorage.setItem(STORAGE_CHILD_PROFILE, JSON.stringify(profile));
      }
      const uid = session?.user?.id;
      if (uid && isSupabaseConfigured) {
        try {
          await persistProfileIdentity(uid, { displayName: sanitized, fishAvatarId: nextAvatar });
        } catch (e) {
          console.warn("[app] persistProfileIdentity", e);
        }
      }
    },
    [onboardingComplete, childAge, examHorizon, session?.user?.id]
  );

  const resetOnboarding = useCallback(() => {
    setOnboardingComplete(false);
    setChildAge(undefined);
    setExamHorizon(undefined);
    setChildNickname("");
    setFishAvatarId(DEFAULT_FISH_AVATAR_ID);
    void (async () => {
      await AsyncStorage.removeItem(STORAGE_ONBOARDING);
      await AsyncStorage.removeItem(STORAGE_CHILD_PROFILE);
    })();
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      setIsPremium,
      refetchPremiumFromSupabase,
      progress,
      recordActivity,
      applyQuizResult,
      hydrated,
      onboardingComplete,
      childAge,
      examHorizon,
      childNickname,
      fishAvatarId,
      updateChildIdentity,
      completeOnboarding,
      resetOnboarding,
      setPendingTestyView,
      takePendingTestyView,
      setPendingAtlasFishId,
      takePendingAtlasFishId,
      setPendingTackleTarget,
      takePendingTackleTarget
    }),
    [
      isPremium,
      setIsPremium,
      refetchPremiumFromSupabase,
      progress,
      recordActivity,
      applyQuizResult,
      hydrated,
      onboardingComplete,
      childAge,
      examHorizon,
      childNickname,
      fishAvatarId,
      updateChildIdentity,
      completeOnboarding,
      resetOnboarding,
      setPendingTestyView,
      takePendingTestyView,
      setPendingAtlasFishId,
      takePendingAtlasFishId,
      setPendingTackleTarget,
      takePendingTackleTarget
    ]
  );

  return (
    <AppContext.Provider value={value}>
      <View style={toastStyles.root}>
        {children}
        {toastMessage ? (
          <View style={[toastStyles.wrap, { paddingTop: insets.top + 8 }]} pointerEvents="none">
            <View style={toastStyles.bubble}>
              <Text style={toastStyles.text}>{toastMessage}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </AppContext.Provider>
  );
}

const toastStyles = StyleSheet.create({
  root: { flex: 1 },
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 9999,
    elevation: 10
  },
  bubble: {
    backgroundColor: "#161b22",
    borderWidth: 1,
    borderColor: "#00c2a8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    maxWidth: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6
  },
  text: {
    color: "#e6edf3",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22
  }
});

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }
  return ctx;
}
