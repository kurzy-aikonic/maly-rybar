import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

/** Odstrani mezery a omylem zkopirovane uvozovky z .env (casta pricina „Failed to fetch“). */
function stripEnv(raw: string): string {
  return raw.trim().replace(/^["']+|["']+$/g, "");
}

const rawUrl = stripEnv(process.env.EXPO_PUBLIC_SUPABASE_URL ?? "");
const rawAnon = stripEnv(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "");
const url = rawUrl.replace(/\/+$/, "");

let urlIsValid = false;
try {
  const u = new URL(url);
  urlIsValid = (u.protocol === "https:" || u.protocol === "http:") && Boolean(u.host);
} catch {
  urlIsValid = false;
}

export const isSupabaseConfigured = Boolean(url && rawAnon && urlIsValid);

export const supabase = createClient(url, rawAnon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Na webu Supabase musi nacist tokeny z # fragmentu po navcitku z magic linku.
    detectSessionInUrl: Platform.OS === "web"
  }
});
