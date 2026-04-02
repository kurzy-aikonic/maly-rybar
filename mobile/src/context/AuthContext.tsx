import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { DEFAULT_FISH_AVATAR_ID, isFishAvatarId } from "../constants/fishAvatars";
import { STORAGE_CHILD_PROFILE, STORAGE_ONBOARDING } from "../constants/storageKeys";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { purchasesSetAppUserId } from "../services/purchasesBridge";

type ChildProfileRow = {
  childAge: number;
  examHorizon: string;
  nickname?: string;
  fishAvatarId?: string;
};

function parseAuthTokensFromUrl(rawUrl: string): { access_token: string; refresh_token: string } | null {
  const hashIdx = rawUrl.indexOf("#");
  if (hashIdx === -1) return null;
  const fragment = rawUrl.slice(hashIdx + 1);
  const params = new URLSearchParams(fragment);
  const access = params.get("access_token");
  const refresh = params.get("refresh_token");
  if (!access || !refresh) return null;
  return { access_token: access, refresh_token: refresh };
}

async function upsertProfileFromLocalStorage(userId: string): Promise<void> {
  const [done, raw] = await Promise.all([
    AsyncStorage.getItem(STORAGE_ONBOARDING),
    AsyncStorage.getItem(STORAGE_CHILD_PROFILE)
  ]);
  if (done !== "1" || !raw) return;
  let profile: ChildProfileRow;
  try {
    profile = JSON.parse(raw) as ChildProfileRow;
  } catch {
    return;
  }
  if (typeof profile.childAge !== "number" || !profile.examHorizon) return;

  const nickRaw = typeof profile.nickname === "string" ? profile.nickname.replace(/\s+/g, " ").trim() : "";
  const displayName = nickRaw.length > 0 ? nickRaw.slice(0, 24) : null;
  const fishId =
    profile.fishAvatarId && isFishAvatarId(profile.fishAvatarId)
      ? profile.fishAvatarId
      : DEFAULT_FISH_AVATAR_ID;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      child_age: profile.childAge,
      exam_horizon: profile.examHorizon,
      display_name: displayName,
      fish_avatar_id: fishId,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
  if (error) {
    console.warn("[supabase] profile upsert", error.message);
  }
}

type AuthContextValue = {
  session: Session | null;
  authReady: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session ?? null);
      if (!cancelled) setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    async function consumeUrl(rawUrl: string) {
      const tokens = parseAuthTokensFromUrl(rawUrl);
      if (!tokens) return;
      const { error } = await supabase.auth.setSession({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token
      });
      if (error) {
        console.warn("[auth] setSession from url", error.message);
        return;
      }
      if (Platform.OS === "web" && typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      void consumeUrl(window.location.href);
      return;
    }

    void Linking.getInitialURL().then((u) => {
      if (u) void consumeUrl(u);
    });

    const sub = Linking.addEventListener("url", (ev) => void consumeUrl(ev.url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !session?.user?.id) return;
    void upsertProfileFromLocalStorage(session.user.id);
  }, [session?.user?.id]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase není nakonfigurovaný (chybí .env).") };
    }
    const redirectTo = Linking.createURL("auth/callback");
    if (__DEV__) {
      console.log("[auth] magic link redirectTo:", redirectTo);
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true
        }
      });
      if (error) {
        if (__DEV__) {
          console.warn("[auth] signInWithOtp:", error.message, error);
        }
        const msg =
          (error.message && error.message.trim()) ||
          "Nepodařilo se odeslat odkaz (zkontroluj Supabase Auth → Providers → Email).";
        return { error: new Error(msg) };
      }
      return { error: null };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const isNetwork =
        raw.includes("Failed to fetch") ||
        raw.includes("Network request failed") ||
        raw.includes("network error") ||
        raw.toLowerCase().includes("load failed");
      if (__DEV__) {
        console.warn("[auth] signInWithOtp threw:", e);
      }
      if (isNetwork) {
        return {
          error: new Error(
            "Prohlížeč nedosáhl na internet nebo na Supabase. Zkus: vypnout VPN/proxy a blokovače; " +
              "v .env zkontrolovat EXPO_PUBLIC_SUPABASE_URL (přesně z Project Settings, bez uvozovek a bez koncového /), " +
              "poté úplně zastavit Metro a znovu spustit + tvrdý reload stránky. V Chrome: F12 → Síť (Network) → znovu poslat odkaz a zkontrolovat, kam request jde."
          )
        };
      }
      return { error: e instanceof Error ? e : new Error(raw) };
    }
  }, []);

  const signOut = useCallback(async () => {
    await purchasesSetAppUserId(null);
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("[auth] signOut", e);
    }
  }, []);

  const value = useMemo(
    () => ({ session, authReady, signInWithMagicLink, signOut }),
    [session, authReady, signInWithMagicLink, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
