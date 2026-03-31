import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useApp } from "../context/AppContext";
import { examHorizonLabel } from "../lib/examLabels";
import { progressService } from "../lib/progress";

const colors = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3",
  accent: "#00c2a8"
};

export function HomeScreen() {
  const { progress, hydrated, childAge, examHorizon } = useApp();
  const nextXp = progressService.xpForNextLevel(progress.level);

  if (!hydrated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Dnesni mise</Text>
      <Text style={styles.lead}>Zvladni kratky kviz a posun svuj pokrok.</Text>

      {typeof childAge === "number" && examHorizon ? (
        <View style={styles.profileBanner}>
          <Text style={styles.profileText}>
            Vek {childAge} · {examHorizonLabel(examHorizon)}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Uroven</Text>
        <Text style={styles.big}>{progress.level}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>XP k dalsi urovni</Text>
        <Text style={styles.big}>
          {progress.xp} / {nextXp}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Serie dni</Text>
        <Text style={styles.big}>{progress.streakDays}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  h1: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8
  },
  lead: {
    color: colors.muted,
    fontSize: 15,
    marginBottom: 16
  },
  profileBanner: {
    backgroundColor: "#0f1c1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f6b5c",
    padding: 12,
    marginBottom: 14
  },
  profileText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 14
  },
  card: {
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202733",
    padding: 16,
    marginBottom: 12
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 6
  },
  big: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700"
  }
});
