import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";

import { LegalInfoModal } from "../components/LegalInfoModal";
import { DEFAULT_FISH_AVATAR_ID, FISH_AVATARS, type FishAvatarId } from "../constants/fishAvatars";
import { theme } from "../constants/theme";
import { useApp } from "../context/AppContext";
import { useScrollBottomInset } from "../hooks/useScrollBottomInset";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  isPurchasesConfigured,
  pollPremiumFromSupabase,
  purchaseDefaultSubscription,
  restorePurchases
} from "../services/purchasesBridge";

export function ProfileScreen() {
  const {
    isPremium,
    setIsPremium,
    refetchPremiumFromSupabase,
    resetOnboarding,
    onboardingComplete,
    childNickname,
    fishAvatarId,
    updateChildIdentity
  } = useApp();
  const { session, signInWithMagicLink, signOut } = useAuth();
  const [draftNickname, setDraftNickname] = useState("");
  const [draftAvatarId, setDraftAvatarId] = useState<FishAvatarId>(DEFAULT_FISH_AVATAR_ID);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [linkSentHint, setLinkSentHint] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const [billingHint, setBillingHint] = useState<string | null>(null);
  const [legalOpen, setLegalOpen] = useState(false);
  const scrollPadBottom = useScrollBottomInset(40);

  useFocusEffect(
    useCallback(() => {
      setDraftNickname(childNickname);
      setDraftAvatarId(fishAvatarId);
    }, [childNickname, fishAvatarId])
  );

  async function onSaveIdentity() {
    if (!onboardingComplete) return;
    setIdentityBusy(true);
    try {
      await updateChildIdentity(draftNickname, draftAvatarId);
    } finally {
      setIdentityBusy(false);
    }
  }

  function confirmResetIntro() {
    Alert.alert(
      "Znovu úvod",
      "Chceš znovu vyplnit věk a cíl? Zobrazí se první obrazovka aplikace.",
      [
        { text: "Zrušit", style: "cancel" },
        { text: "Ano", style: "destructive", onPress: () => resetOnboarding() }
      ]
    );
  }

  async function onSendMagicLink() {
    const trimmed = email.trim();
    if (!trimmed) {
      setInlineError("Zadej e-mail.");
      return;
    }
    setLinkSentHint(false);
    setInlineError(null);
    setSending(true);
    try {
      const { error } = await signInWithMagicLink(trimmed);
      if (error) {
        setInlineError(error.message);
        return;
      }
      setLinkSentHint(true);
    } catch (e) {
      setInlineError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function onSignOut() {
    await signOut();
  }

  async function onPurchasePremium() {
    const uid = session?.user?.id;
    if (!uid) return;
    setBillingHint(null);
    setPurchaseBusy(true);
    try {
      const res = await purchaseDefaultSubscription();
      if (res.cancelled) {
        setBillingHint("Nákup zrušen.");
        return;
      }
      if (!res.ok) {
        setBillingHint(res.message ?? "Nákup se nepovedl.");
        return;
      }
      setBillingHint("Čekám na potvrzení z účtu…");
      const synced = await pollPremiumFromSupabase(uid);
      if (synced) {
        await refetchPremiumFromSupabase();
        setBillingHint("Premium aktivní.");
      } else {
        await refetchPremiumFromSupabase();
        setBillingHint(
          "Platbu RevenueCat zpracoval — pokud ještě nevidíš Premium, klepni na „Obnovit stav účtu“ za chvíli (webhook zapisuje do Supabase)."
        );
      }
    } finally {
      setPurchaseBusy(false);
    }
  }

  async function onRestorePurchases() {
    setBillingHint(null);
    setPurchaseBusy(true);
    try {
      const res = await restorePurchases();
      if (!res.ok) {
        setBillingHint(res.message ?? "Obnova se nepovedla.");
        return;
      }
      const uid = session?.user?.id;
      if (uid) {
        await pollPremiumFromSupabase(uid, { attempts: 8, delayMs: 1200 });
      }
      await refetchPremiumFromSupabase();
      setBillingHint("Obnova dokončena — stav zkontroluj výše.");
    } finally {
      setPurchaseBusy(false);
    }
  }

  const userEmail = session?.user?.email;
  const showBilling = Boolean(userEmail && isSupabaseConfigured);

  return (
    <>
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.wrap, { paddingBottom: scrollPadBottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h1}>Profil</Text>

      <Pressable style={styles.legalRow} onPress={() => setLegalOpen(true)}>
        <Text style={styles.legalRowText}>Právní informace · GDPR · odpovědnost za výukové údaje</Text>
      </Pressable>

      {onboardingComplete ? (
        <>
          <Text style={styles.h2}>Přezdívka a rybí avatar</Text>
          <Text style={styles.mutedBlock}>
            Jak tě má appka oslovovat na hlavní obrazovce (prázdné = „Malý rybář“). Avatar je jen pro
            zábavu.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="např. Matýsek"
            placeholderTextColor={theme.muted}
            autoCapitalize="sentences"
            maxLength={24}
            value={draftNickname}
            onChangeText={setDraftNickname}
            editable={!identityBusy}
          />
          <View style={styles.avatarGrid}>
            {FISH_AVATARS.map((a) => {
              const selected = draftAvatarId === a.id;
              return (
                <Pressable
                  key={a.id}
                  style={[styles.avatarCell, selected && styles.avatarCellSelected]}
                  onPress={() => setDraftAvatarId(a.id)}
                  disabled={identityBusy}
                >
                  <Text style={styles.avatarEmoji}>{a.emoji}</Text>
                  <Text style={styles.avatarLabel} numberOfLines={1}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={[styles.primary, identityBusy && styles.primaryDisabled]}
            onPress={() => void onSaveIdentity()}
            disabled={identityBusy}
          >
            {identityBusy ? (
              <ActivityIndicator color="#04120f" />
            ) : (
              <Text style={styles.primaryText}>Uložit jméno a avatara</Text>
            )}
          </Pressable>
        </>
      ) : null}

      {__DEV__ ? (
        <>
          <Text style={styles.lead}>
            Vývoj: přepínač níže zapisuje do Supabase jen v __DEV__. Ostré předplatné řeší RevenueCat +
            webhook na Vercelu.
          </Text>
          <View style={styles.card}>
            <Text style={styles.label}>Premium (test, jen Dev)</Text>
            <Switch value={Boolean(isPremium)} onValueChange={setIsPremium} />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.lead}>
            Premium se po zaplacení propíše do účtu přes server (Supabase). V aplikaci se stav načítá po
            přihlášení.
          </Text>
          <View style={styles.card}>
            <Text style={styles.label}>Stav účtu</Text>
            <Text style={styles.statusPill}>{isPremium ? "Premium" : "Free"}</Text>
          </View>
        </>
      )}

      {showBilling ? (
        <>
          <Text style={styles.h2}>Předplatné Premium</Text>
          <Text style={styles.mutedBlock}>
            Potřebuješ nativní build (ne Expo Go) a klíče v .env. Účet v RevenueCat musí používat stejné{" "}
            <Text style={{ fontWeight: "700" }}>app user ID</Text> jako tvůj Supabase user (řeší appka po
            přihlášení).
          </Text>
          {billingHint ? <Text style={styles.billingHint}>{billingHint}</Text> : null}
          {isPurchasesConfigured() ? (
            <>
              <Pressable
                style={[styles.primary, purchaseBusy && styles.primaryDisabled]}
                onPress={() => void onPurchasePremium()}
                disabled={purchaseBusy}
              >
                {purchaseBusy ? (
                  <ActivityIndicator color="#04120f" />
                ) : (
                  <Text style={styles.primaryText}>Předplatit / změnit tarif</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.secondary, { marginTop: 10 }, purchaseBusy && styles.primaryDisabled]}
                onPress={() => void onRestorePurchases()}
                disabled={purchaseBusy}
              >
                <Text style={styles.secondaryText}>Obnovit nákupy (Restore)</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.mutedBlock}>
              RevenueCat klíče v .env chybí nebo běžíš v Expo Go — nákupní tlačítka jsou vypnutá.
            </Text>
          )}
          <Pressable
            style={[styles.secondary, { marginTop: 12 }]}
            onPress={() => void refetchPremiumFromSupabase()}
          >
            <Text style={styles.secondaryText}>Obnovit stav účtu ze serveru</Text>
          </Pressable>
        </>
      ) : null}

      <Text style={styles.h2}>Účet</Text>
      {!isSupabaseConfigured ? (
        <Text style={styles.mutedBlock}>
          Supabase není nakonfigurovaný. Vytvoř v mobile soubor .env podle .env.example
          (EXPO_PUBLIC_SUPABASE_URL a EXPO_PUBLIC_SUPABASE_ANON_KEY) a restartuj Metro.
        </Text>
      ) : userEmail ? (
        <>
          <Text style={styles.signedIn}>Přihlášen jako{"\n"}{userEmail}</Text>
          <Pressable style={styles.secondary} onPress={onSignOut}>
            <Text style={styles.secondaryText}>Odhlasit</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.mutedBlock}>
            E-mailový odkaz (magic link). Po přihlášení se synchronizuje deník U vody.
          </Text>
          {inlineError ? <Text style={styles.errorHint}>{inlineError}</Text> : null}
          {linkSentHint ? (
            <Text style={styles.successHint}>
              Hotovo — zkontroluj e-mail (i spam) a klikni na odkaz. Redirect URL v Supabase musí sedět s
              http://localhost:8081/** — stejný port jako v terminálu u Expo.
            </Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="e-mail"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!sending}
          />
          <Pressable
            style={[styles.primary, sending && styles.primaryDisabled]}
            onPress={() => void onSendMagicLink()}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#04120f" />
            ) : (
              <Text style={styles.primaryText}>Poslat přihlašovací odkaz</Text>
            )}
          </Pressable>
        </>
      )}

      <Pressable style={styles.secondary} onPress={confirmResetIntro}>
        <Text style={styles.secondaryText}>Znovu spustit úvodní nastavení</Text>
      </Pressable>
    </ScrollView>
    <LegalInfoModal visible={legalOpen} onClose={() => setLegalOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.bg
  },
  wrap: {
    flexGrow: 1,
    backgroundColor: theme.bg,
    padding: 16,
    paddingBottom: 0
  },
  legalRow: {
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card
  },
  legalRowText: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  avatarCell: {
    width: "30%",
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center"
  },
  avatarCellSelected: {
    borderColor: theme.accent,
    backgroundColor: "#0f1c1a"
  },
  avatarEmoji: {
    fontSize: 28,
    marginBottom: 4
  },
  avatarLabel: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center"
  },
  h1: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "700"
  },
  h2: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 22,
    marginBottom: 8
  },
  lead: {
    color: theme.muted,
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20
  },
  mutedBlock: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  successHint: {
    color: "#3fb950",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  errorHint: {
    color: "#ff7b72",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  billingHint: {
    color: "#9da7b3",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  signedIn: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  label: {
    color: theme.text,
    fontWeight: "700"
  },
  statusPill: {
    color: theme.accent,
    fontWeight: "800",
    fontSize: 16
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: theme.card
  },
  primary: {
    backgroundColor: theme.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
  },
  primaryDisabled: {
    opacity: 0.7
  },
  primaryText: {
    color: "#04120f",
    fontWeight: "700",
    fontSize: 16
  },
  secondary: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#30363d",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  secondaryText: {
    color: theme.accent,
    fontWeight: "700"
  }
});
