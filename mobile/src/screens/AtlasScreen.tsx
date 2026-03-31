import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { useApp } from "../context/AppContext";
import fishData from "../../../data/fish.json";

const colors = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3",
  accent: "#00c2a8",
  lock: "#f0b429"
};

type FishRow = (typeof fishData)[number];

export function AtlasScreen() {
  const { isPremium } = useApp();
  const [selected, setSelected] = useState<FishRow | null>(null);

  const rows = useMemo(() => {
    if (isPremium) return fishData;
    return fishData.filter((f) => !f.is_premium);
  }, [isPremium]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Atlas ryb</Text>
      <Text style={styles.lead}>
        {isPremium ? "Plny atlas" : "Zakladni atlas (Free)"}
      </Text>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setSelected(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{item.name_cz}</Text>
              <Text style={styles.rowSub}>
                mira {item.min_size_cm || "—"} cm · {item.closed_season}
              </Text>
            </View>
            {item.is_premium && (
              <Text style={styles.badge}>Premium</Text>
            )}
          </Pressable>
        )}
      />

      {selected ? (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>{selected.name_cz}</Text>
          <Text style={styles.detailLine}>{selected.name_lat}</Text>
          <Text style={styles.detailLine}>
            Minimalni mira: {selected.min_size_cm || "viz pravidla"} cm
          </Text>
          <Text style={styles.detailLine}>Hajeni: {selected.closed_season}</Text>
          <Text style={styles.detailLine}>Tip: {selected.tips}</Text>
          <Pressable onPress={() => setSelected(null)}>
            <Text style={styles.close}>Zavrit</Text>
          </Pressable>
        </View>
      ) : null}
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
    marginTop: 6,
    marginBottom: 12
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202733",
    padding: 14
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  rowSub: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 13
  },
  badge: {
    color: colors.lock,
    fontWeight: "700",
    fontSize: 12
  },
  detail: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#30363d",
    padding: 16
  },
  detailTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },
  detailLine: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 6
  },
  close: {
    marginTop: 8,
    color: colors.accent,
    fontWeight: "700"
  }
});
