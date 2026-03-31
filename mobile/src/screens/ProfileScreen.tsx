import React from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { useApp } from "../context/AppContext";

const colors = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3",
  accent: "#00c2a8"
};

export function ProfileScreen() {
  const { isPremium, setIsPremium, resetOnboarding } = useApp();

  function confirmResetIntro() {
    Alert.alert(
      "Znovu uvod",
      "Chces znovu vyplnit vek a cil? Tim se zobrazi prvni obrazovka aplikace.",
      [
        { text: "Zrusit", style: "cancel" },
        { text: "Ano", style: "destructive", onPress: () => resetOnboarding() }
      ]
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Profil</Text>
      <Text style={styles.lead}>
        Tento prepinac simuluje Premium jen pro vyvoj a testovani.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Premium (test)</Text>
        <Switch value={isPremium} onValueChange={setIsPremium} />
      </View>

      <Pressable style={styles.secondary} onPress={confirmResetIntro}>
        <Text style={styles.secondaryText}>Znovu spustit uvodni nastaveni</Text>
      </Pressable>

      <Pressable style={[styles.secondary, { marginTop: 10 }]} disabled>
        <Text style={[styles.secondaryText, { opacity: 0.5 }]}>Brzy: prihlaseni a platby</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 16
  },
  h1: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700"
  },
  lead: {
    color: colors.muted,
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202733",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  label: {
    color: colors.text,
    fontWeight: "700"
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
    color: colors.accent,
    fontWeight: "700"
  }
});
