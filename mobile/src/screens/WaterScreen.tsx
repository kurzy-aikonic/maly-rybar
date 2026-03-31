import React from "react";
import { StyleSheet, Text, View } from "react-native";

const colors = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3"
};

export function WaterScreen() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>U vody</Text>
      <Text style={styles.lead}>
        Denik ulovku, revíry a mapa prijdou v dalsi fazi. Tady budes mit vse pro realny lov.
      </Text>
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
    fontSize: 14,
    lineHeight: 20
  }
});
