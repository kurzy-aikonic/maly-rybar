import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { useApp } from "../context/AppContext";
import {
  addCatchEntry,
  deleteCatchEntry,
  loadEntries
} from "../storage/diaryStorage";
import type { CatchEntry } from "../types/catchEntry";
import knotsData from "../../../data/knots.json";

const colors = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3",
  accent: "#00c2a8",
  card: "#161b22",
  border: "#202733",
  danger: "#ff7b72",
  lock: "#f0b429"
};

type WaterMode = "hub" | "diary" | "knots" | "knotDetail";
type KnotRow = (typeof knotsData)[number];

const FREE_DIARY_LIMIT = 3;

export function WaterScreen() {
  const { isPremium } = useApp();
  const [mode, setMode] = useState<WaterMode>("hub");
  const [entries, setEntries] = useState<CatchEntry[]>([]);
  const [selectedKnot, setSelectedKnot] = useState<KnotRow | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [fishName, setFishName] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [water, setWater] = useState("");
  const [notes, setNotes] = useState("");

  const diaryLimit = isPremium ? 999 : FREE_DIARY_LIMIT;

  const refreshDiary = useCallback(async () => {
    const list = await loadEntries();
    setEntries(list);
  }, []);

  useEffect(() => {
    if (mode === "diary") void refreshDiary();
  }, [mode, refreshDiary]);

  const knotRows = useMemo(() => {
    if (isPremium) return knotsData;
    return knotsData.filter((k) => !k.is_premium);
  }, [isPremium]);

  function openAddModal() {
    if (!isPremium && entries.length >= FREE_DIARY_LIMIT) {
      Alert.alert(
        "Limit Free verze",
        `Ve Free muzes mit max ${FREE_DIARY_LIMIT} zaznamy. Premium prida neomezeny denik.`
      );
      return;
    }
    setFishName("");
    setLengthCm("");
    setWater("");
    setNotes("");
    setModalOpen(true);
  }

  async function submitEntry() {
    const name = fishName.trim();
    if (!name) return;
    const len = lengthCm.trim() ? Number(lengthCm) : undefined;
    if (lengthCm.trim() && (!Number.isFinite(len) || (len ?? 0) <= 0)) {
      Alert.alert("Delka", "Zadej delku jako cislo v cm nebo nech prazdne.");
      return;
    }
    const next = await addCatchEntry(
      { fishName: name, lengthCm: len, water, notes },
      { maxVisible: diaryLimit }
    );
    setEntries(next);
    setModalOpen(false);
  }

  async function removeEntry(id: string) {
    const next = await deleteCatchEntry(id);
    setEntries(next);
  }

  if (mode === "hub") {
    return (
      <ScrollView contentContainerStyle={styles.wrap}>
        <Text style={styles.h1}>U vody</Text>
        <Text style={styles.lead}>Denik ulovku a uzly pro praxi na brehu.</Text>

        <Pressable style={styles.bigCard} onPress={() => setMode("diary")}>
          <Text style={styles.bigCardTitle}>Denik ulovku</Text>
          <Text style={styles.bigCardSub}>
            {isPremium ? "Neomezeny zapis" : `Free: max ${FREE_DIARY_LIMIT} zaznamy`}
          </Text>
        </Pressable>

        <Pressable style={styles.bigCard} onPress={() => setMode("knots")}>
          <Text style={styles.bigCardTitle}>Uzly a montaze</Text>
          <Text style={styles.bigCardSub}>
            {isPremium ? "Plna knihovna" : "Zakladni uzly + cast Premium"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (mode === "diary") {
    return (
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Pressable onPress={() => setMode("hub")}>
            <Text style={styles.back}>Zpet</Text>
          </Pressable>
          <Text style={styles.h1inline}>Denik</Text>
          <Pressable onPress={openAddModal}>
            <Text style={styles.add}>+ Zapsat</Text>
          </Pressable>
        </View>
        <Text style={styles.leadSmall}>
          Zaznamy: {entries.length}
          {!isPremium ? ` / max ${FREE_DIARY_LIMIT} (Free)` : ""}
        </Text>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Zatim nic — pridaj prvni ulovek.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.entryFish}>{item.fishName}</Text>
                <Text style={styles.entryMeta}>
                  {new Date(item.createdAt).toLocaleString("cs-CZ")}
                  {item.lengthCm ? ` · ${item.lengthCm} cm` : ""}
                </Text>
                {item.water ? <Text style={styles.entryLine}>Revír: {item.water}</Text> : null}
                {item.notes ? <Text style={styles.entryLine}>{item.notes}</Text> : null}
              </View>
              <Pressable onPress={() => removeEntry(item.id)} hitSlop={8}>
                <Text style={styles.delete}>Smazat</Text>
              </Pressable>
            </View>
          )}
        />

        <Modal visible={modalOpen} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Novy ulovek</Text>
              <Text style={styles.label}>Ryba</Text>
              <TextInput
                style={styles.input}
                placeholder="napr. Kapr obecny"
                placeholderTextColor={colors.muted}
                value={fishName}
                onChangeText={setFishName}
              />
              <Text style={styles.label}>Delka (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="volitelne"
                placeholderTextColor={colors.muted}
                value={lengthCm}
                onChangeText={setLengthCm}
              />
              <Text style={styles.label}>Revír / voda</Text>
              <TextInput
                style={styles.input}
                placeholder="volitelne"
                placeholderTextColor={colors.muted}
                value={water}
                onChangeText={setWater}
              />
              <Text style={styles.label}>Poznamka</Text>
              <TextInput
                style={[styles.input, { minHeight: 72 }]}
                multiline
                placeholder="napr. nastraha, pocasi"
                placeholderTextColor={colors.muted}
                value={notes}
                onChangeText={setNotes}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryBtn} onPress={() => setModalOpen(false)}>
                  <Text style={styles.secondaryBtnText}>Zrusit</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={submitEntry}>
                  <Text style={styles.primaryBtnText}>Ulozit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (mode === "knots") {
    return (
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Pressable onPress={() => setMode("hub")}>
            <Text style={styles.back}>Zpet</Text>
          </Pressable>
          <Text style={styles.h1inline}>Uzly</Text>
          <View style={{ width: 48 }} />
        </View>
        <FlatList
          data={knotRows}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.knotRow}
              onPress={() => {
                setSelectedKnot(item);
                setMode("knotDetail");
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.knotName}>{item.name}</Text>
                <Text style={styles.knotType}>Typ: {item.type}</Text>
              </View>
              {item.is_premium ? <Text style={styles.badge}>Premium</Text> : null}
            </Pressable>
          )}
        />
      </View>
    );
  }

  if (mode === "knotDetail" && selectedKnot) {
    const k = selectedKnot;
    return (
      <ScrollView contentContainerStyle={styles.wrap}>
        <Pressable onPress={() => setMode("knots")}>
          <Text style={styles.back}>Zpet na seznam</Text>
        </Pressable>
        <Text style={styles.h1}>{k.name}</Text>
        <Text style={styles.lead}>Typ: {k.type}</Text>
        <View style={styles.cardBlock}>
          <Text style={styles.blockTitle}>Kroky</Text>
          {k.steps.map((s, i) => (
            <Text key={i} style={styles.stepLine}>
              {i + 1}. {s}
            </Text>
          ))}
        </View>
        {k.common_mistakes?.length ? (
          <View style={styles.cardBlock}>
            <Text style={styles.blockTitle}>Nejcastejsi chyby</Text>
            {k.common_mistakes.map((m, i) => (
              <Text key={i} style={styles.stepLine}>
                - {m}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  wrap: { padding: 16, paddingBottom: 32, backgroundColor: colors.bg },
  h1: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6
  },
  h1inline: { color: colors.text, fontSize: 18, fontWeight: "800" },
  lead: {
    color: colors.muted,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  leadSmall: { color: colors.muted, paddingHorizontal: 16, marginBottom: 6, fontSize: 13 },
  bigCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12
  },
  bigCardTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  bigCardSub: { color: colors.muted, marginTop: 6, fontSize: 14 },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  back: { color: colors.accent, fontWeight: "700", fontSize: 16 },
  add: { color: colors.accent, fontWeight: "800", fontSize: 15 },
  entryCard: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: "flex-start"
  },
  entryFish: { color: colors.text, fontSize: 16, fontWeight: "800" },
  entryMeta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  entryLine: { color: colors.text, marginTop: 6, fontSize: 14 },
  delete: { color: colors.danger, fontWeight: "700", fontSize: 13 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  label: { color: colors.muted, marginTop: 8, marginBottom: 4, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    backgroundColor: "#0f141b",
    fontSize: 15
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center"
  },
  secondaryBtnText: { color: colors.text, fontWeight: "700" },
  primaryBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center" },
  primaryBtnText: { color: "#042b26", fontWeight: "800" },
  knotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14
  },
  knotName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  knotType: { color: colors.muted, marginTop: 4, fontSize: 13 },
  badge: { color: colors.lock, fontWeight: "700", fontSize: 12 },
  cardBlock: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 12
  },
  blockTitle: { color: colors.text, fontWeight: "800", marginBottom: 10 },
  stepLine: { color: colors.muted, fontSize: 14, marginBottom: 8 }
});
