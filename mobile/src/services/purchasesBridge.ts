import { Platform } from "react-native";

import { isSupabaseConfigured } from "../lib/supabase";
import { fetchProfilePremium } from "./profileRemote";

type PurchasesModule = typeof import("react-native-purchases").default;

let cachedPurchases: PurchasesModule | null | undefined;

function getPurchasesModule(): PurchasesModule | null {
  if (Platform.OS === "web") return null;
  if (cachedPurchases !== undefined) return cachedPurchases;
  try {
    cachedPurchases = require("react-native-purchases").default as PurchasesModule;
  } catch {
    cachedPurchases = null;
  }
  return cachedPurchases;
}

function getCancelledErrorCode(): number | undefined {
  try {
    const { PURCHASES_ERROR_CODE } = require("react-native-purchases") as {
      PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: number };
    };
    return PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
  } catch {
    return undefined;
  }
}

let configureAttempted = false;

function iosKey(): string | undefined {
  return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() || undefined;
}

function androidKey(): string | undefined {
  return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim() || undefined;
}

export function entitlementId(): string {
  return process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim() || "premium";
}

export function isPurchasesConfigured(): boolean {
  const key = Platform.OS === "ios" ? iosKey() : androidKey();
  return Boolean(key && getPurchasesModule());
}

export function initPurchases(): void {
  const Purchases = getPurchasesModule();
  if (!Purchases || configureAttempted) return;

  const apiKey = Platform.OS === "ios" ? iosKey() : androidKey();
  if (!apiKey) return;

  configureAttempted = true;
  Purchases.configure({ apiKey });
}

export async function purchasesSetAppUserId(userId: string | null): Promise<void> {
  const Purchases = getPurchasesModule();
  if (!Purchases) return;

  initPurchases();
  if (!isPurchasesConfigured()) return;

  try {
    if (userId) await Purchases.logIn(userId);
    else await Purchases.logOut();
  } catch (e) {
    console.warn("[purchases] logIn/logOut", e);
  }
}

export async function restorePurchases(): Promise<{ ok: boolean; message?: string }> {
  const Purchases = getPurchasesModule();
  if (!Purchases || !isPurchasesConfigured()) {
    return {
      ok: false,
      message:
        "Nákupy nejsou dostupné (web/Expo Go bez dev buildu, nebo chybí REVENUECAT API klíč v .env)."
    };
  }
  initPurchases();
  try {
    await Purchases.restorePurchases();
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

export async function purchaseDefaultSubscription(): Promise<{
  ok: boolean;
  cancelled?: boolean;
  message?: string;
}> {
  const Purchases = getPurchasesModule();
  if (!Purchases || !isPurchasesConfigured()) {
    return { ok: false, message: "Nákupy nejsou v tomto prostředí dostupné." };
  }
  initPurchases();
  const cancelCode = getCancelledErrorCode();
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const pkg = current?.availablePackages?.[0];
    if (!pkg) {
      return {
        ok: false,
        message: "V RevenueCat chybí aktivní Offering s balíčkem."
      };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const ent = customerInfo.entitlements.active[entitlementId()];
    if (ent) {
      return { ok: true };
    }
    return {
      ok: false,
      message: "Entitlement zatím není aktivní — zkontroluj RevenueCat / webhook."
    };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; code?: number };
    if (err.userCancelled === true) {
      return { ok: false, cancelled: true };
    }
    if (cancelCode !== undefined && err.code === cancelCode) {
      return { ok: false, cancelled: true };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

export async function pollPremiumFromSupabase(
  userId: string,
  opts?: { attempts?: number; delayMs?: number }
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const attempts = opts?.attempts ?? 12;
  const delayMs = opts?.delayMs ?? 1500;
  for (let i = 0; i < attempts; i++) {
    try {
      const v = await fetchProfilePremium(userId);
      if (v) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
