import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LegalInfoModal } from "../components/LegalInfoModal";
import { theme } from "../constants/theme";
import { useApp } from "../context/AppContext";
import { useScrollBottomInset } from "../hooks/useScrollBottomInset";
import type { ExamHorizonId } from "../types/profile";

const GOALS = [
  { id: "do_3_mesicu", label: "Zkoušky do 3 měsíců" },
  { id: "do_roka", label: "Zkoušky do roku" },
  { id: "jen_uceni", label: "Zatím jen učení a zábava" },
  { id: "nezacinam", label: "Teprve začínám" }
] as const;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const scrollPadBottom = useScrollBottomInset(40);
  const { completeOnboarding } = useApp();
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState<ExamHorizonId>("jen_uceni");
  const [parentConsent, setParentConsent] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);

  function submit() {
    const n = Number(age);
    if (!Number.isInteger(n) || n < 8 || n > 15 || !parentConsent) {
      return;
    }
    completeOnboarding({ childAge: n, examHorizon: goal });
  }

  const ageNum = Number(age);
  const ageOk = Number.isInteger(ageNum) && ageNum >= 8 && ageNum <= 15;
  const canContinue = ageOk && parentConsent;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.wrap,
          { paddingTop: Math.max(20, insets.top + 12), paddingBottom: scrollPadBottom }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.h1}>Vítej v aplikaci Malý rybář</Text>
        <Text style={styles.lead}>
          Dva rychlé údaje nám pomůžou připravit domovskou obrazovku a testy.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Kolik ti je let?</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="např. 11"
            placeholderTextColor={theme.muted}
            value={age}
            onChangeText={setAge}
          />
          {!ageOk && age.length > 0 ? (
            <Text style={styles.warn}>Zadej věk 8–15.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Co je tvůj cíl?</Text>
          {GOALS.map((g) => (
            <Pressable
              key={g.id}
              style={[styles.goalRow, goal === g.id && styles.goalRowActive]}
              onPress={() => setGoal(g.id)}
            >
              <Text style={styles.goalText}>{g.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Souhlas rodiče nebo zákonného zástupce</Text>
          <Text style={styles.consentLead}>
            Aplikace je určena dětem 8–15 let. Osobní údaje a účet musí být v souladu s pravidly GDPR —
            rodič nebo zákonný zástupce by měl vědět o používání aplikace.
          </Text>
          <Pressable
            style={[styles.consentRow, parentConsent && styles.consentRowOn]}
            onPress={() => setParentConsent((v) => !v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: parentConsent }}
          >
            <View style={[styles.checkbox, parentConsent && styles.checkboxOn]}>
              {parentConsent ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>
              Potvrzuji, že rodič nebo zákonný zástupce souhlasí s používáním aplikace a seznámil se s
              právními informacemi (také v záložce Profil).
            </Text>
          </Pressable>
          <Pressable onPress={() => setLegalOpen(true)} style={styles.legalOpenHit}>
            <Text style={styles.legalLink}>Zobrazit právní informace</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.cta, !canContinue && styles.ctaDisabled]} disabled={!canContinue} onPress={submit}>
          <Text style={styles.ctaText}>Pokračovat do aplikace</Text>
        </Pressable>
      </ScrollView>
      <LegalInfoModal visible={legalOpen} onClose={() => setLegalOpen(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.bg },
  wrap: { paddingHorizontal: 20, paddingBottom: 0 },
  consentLead: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: "#0f141b"
  },
  consentRowOn: {
    borderColor: theme.accent,
    backgroundColor: "#0f1c1a"
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.muted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2
  },
  checkboxOn: {
    borderColor: theme.accent,
    backgroundColor: theme.accent
  },
  checkboxMark: {
    color: "#042b26",
    fontWeight: "900",
    fontSize: 14
  },
  consentText: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    lineHeight: 21
  },
  legalOpenHit: {
    marginTop: 12,
    alignSelf: "flex-start"
  },
  legalLink: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline"
  },
  h1: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8
  },
  lead: {
    color: theme.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 14
  },
  label: {
    color: theme.text,
    fontWeight: "700",
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    color: theme.text,
    backgroundColor: "#0f141b",
    fontSize: 16
  },
  warn: { color: "#ff7b72", marginTop: 8, fontSize: 13 },
  goalRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 8
  },
  goalRowActive: {
    borderColor: theme.accent,
    backgroundColor: "#0f1c1a"
  },
  goalText: { color: theme.text, fontSize: 15 },
  cta: {
    backgroundColor: theme.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#042b26", fontWeight: "800", fontSize: 16 }
});
