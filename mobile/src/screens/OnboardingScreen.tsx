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

import { useApp } from "../context/AppContext";
import type { ExamHorizonId } from "../types/profile";

const colors = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3",
  accent: "#00c2a8",
  card: "#161b22",
  border: "#202733"
};

const GOALS = [
  { id: "do_3_mesicu", label: "Zkousky do 3 mesicu" },
  { id: "do_roka", label: "Zkousky do roku" },
  { id: "jen_uceni", label: "Zatim jen uceni a zabava" },
  { id: "nezacinam", label: "Teprve zacinam" }
] as const;

export function OnboardingScreen() {
  const { completeOnboarding } = useApp();
  const [age, setAge] = useState("");
  const [goal, setGoal] = useState<ExamHorizonId>("jen_uceni");

  function submit() {
    const n = Number(age);
    if (!Number.isInteger(n) || n < 8 || n > 15) {
      return;
    }
    completeOnboarding({ childAge: n, examHorizon: goal });
  }

  const ageNum = Number(age);
  const ageOk = Number.isInteger(ageNum) && ageNum >= 8 && ageNum <= 15;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Vitej v aplikaci Maly rybar</Text>
        <Text style={styles.lead}>
          Dva rychle udaje nam pomuzou pripravit domovskou obrazovku a testy.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Kolik ti je let?</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="napr. 11"
            placeholderTextColor={colors.muted}
            value={age}
            onChangeText={setAge}
          />
          {!ageOk && age.length > 0 ? (
            <Text style={styles.warn}>Zadej vek 8–15.</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Co je tvuj cil?</Text>
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

        <Pressable style={[styles.cta, !ageOk && styles.ctaDisabled]} disabled={!ageOk} onPress={submit}>
          <Text style={styles.ctaText}>Pokracovat do aplikace</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  h1: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8
  },
  lead: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14
  },
  label: {
    color: colors.text,
    fontWeight: "700",
    marginBottom: 10
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: "#0f141b",
    fontSize: 16
  },
  warn: { color: "#ff7b72", marginTop: 8, fontSize: 13 },
  goalRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8
  },
  goalRowActive: {
    borderColor: colors.accent,
    backgroundColor: "#0f1c1a"
  },
  goalText: { color: colors.text, fontSize: 15 },
  cta: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { color: "#042b26", fontWeight: "800", fontSize: 16 }
});
