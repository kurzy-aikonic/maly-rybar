import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../constants/theme";
import { useApp } from "../context/AppContext";
import { useScrollBottomInset } from "../hooks/useScrollBottomInset";
import {
  getFishDetailHeader,
  resolveFishSections
} from "../lib/fishDetailBuild";
import { getFishImageSource } from "../lib/fishImages";
import { normalizeCs } from "../lib/normalizeCs";
import { methodLabelCs, PRIMARY_TACKLE_BY_METHOD } from "../lib/tackleMethodMap";
import type { FishRecord, ResolvedFishSection } from "../types/fish";
import type { TackleItem, TackleMethodTag } from "../types/tackle";
import fishData from "../../../data/fish.json";
import tackleItemsData from "../../../data/tackle_items.json";

const fishRows = fishData as FishRecord[];
const tackleGuideItems = tackleItemsData.items as TackleItem[];

type IonName = React.ComponentProps<typeof Ionicons>["name"];

function isTackleMethodTag(id: string): id is TackleMethodTag {
  return id === "float" || id === "ledger" || id === "spin" || id === "fly" || id === "other";
}

function AtlasTackleBridge({
  methods,
  isPremium
}: {
  methods: NonNullable<ResolvedFishSection["methods"]>;
  isPremium: boolean;
}) {
  const navigation = useNavigation();
  const { setPendingTackleTarget } = useApp();
  const active = methods.filter(
    (m): m is (typeof m & { id: TackleMethodTag }) => m.active && isTackleMethodTag(m.id)
  );
  if (!active.length) return null;

  return (
    <View style={styles.tackleBridgeCard}>
      <Text style={styles.tackleBridgeTitle}>Průvodce výbavou</Text>
      <Text style={styles.tackleBridgeLead}>
        Návody, jak náčiní vypadá a jak se skládá základní montáž — v záložce U vody.
      </Text>
      {active.map((m) => {
        const methodTag = m.id;
        const tackleId = PRIMARY_TACKLE_BY_METHOD[methodTag];
        const item = tackleGuideItems.find((t) => t.id === tackleId);
        if (!item) return null;
        if (item.is_premium && !isPremium) {
          return (
            <View key={methodTag} style={styles.tackleBridgeRowMuted}>
              <Text style={styles.tackleBridgeMutedText}>
                {methodLabelCs(methodTag)} — podrobný návod v Premium
              </Text>
            </View>
          );
        }
        return (
          <Pressable
            key={methodTag}
            style={styles.tackleBridgeBtn}
            onPress={() => {
              setPendingTackleTarget({ kind: "detail", id: tackleId });
              navigation.navigate("U vody" as never);
            }}
          >
            <Ionicons name="construct-outline" size={18} color={theme.accent} />
            <Text style={styles.tackleBridgeBtnText}>Návod: {methodLabelCs(methodTag)}</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </Pressable>
        );
      })}
      <Pressable
        style={styles.tackleBridgeBtnSecondary}
        onPress={() => {
          setPendingTackleTarget({ kind: "list" });
          navigation.navigate("U vody" as never);
        }}
      >
        <Text style={styles.tackleBridgeBtnSecondaryText}>Všechny karty výbavy</Text>
      </Pressable>
    </View>
  );
}

function atlasSectionIcon(sectionId: string): IonName {
  switch (sectionId) {
    case "tips":
      return "sparkles-outline";
    case "rules":
      return "scale-outline";
    case "quick_id":
      return "eye-outline";
    case "similar":
      return "git-compare-outline";
    case "card_note":
      return "information-circle-outline";
    case "morphology":
      return "body-outline";
    case "biology_angling":
      return "fish-outline";
    case "significance":
      return "globe-outline";
    default:
      return "reader-outline";
  }
}

function MethodChips({
  methods
}: {
  methods: NonNullable<ResolvedFishSection["methods"]>;
}) {
  return (
    <View style={styles.methodsRow}>
      {methods.map((m) => (
        <View
          key={m.id}
          style={[styles.methodChip, m.active && styles.methodChipOn]}
        >
          <Text
            style={[
              styles.methodChipText,
              m.active && styles.methodChipTextOn
            ]}
          >
            {m.label}
            {m.active ? " \u2713" : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

function DetailSectionBlock({ section }: { section: ResolvedFishSection }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionHeadMain}>
          <View style={styles.sectionIconCircle}>
            <Ionicons name={atlasSectionIcon(section.id)} size={18} color={theme.accent} />
          </View>
          <Text style={styles.sectionTitle} numberOfLines={3}>
            {section.title}
          </Text>
        </View>
        {section.premium ? (
          <Text style={styles.sectionBadge}>Premium</Text>
        ) : null}
      </View>

      {section.locked ? (
        <View style={styles.lockedBox}>
          <Text style={styles.lockedLead}>Jen v Premium</Text>
          <Text style={styles.lockedHint}>
            V Profilu zapni Premium a uvidíš morfologii, biologii, náčiní a
            doplněné pasáže jako na odborné kartě druhu.
          </Text>
        </View>
      ) : (
        <>
          {section.intro ? (
            <Text style={styles.sectionIntro}>{section.intro}</Text>
          ) : null}
          {section.paragraphs?.map((p, i) => (
            <Text key={i} style={styles.paragraph}>
              {p}
            </Text>
          ))}
          {section.methods?.length ? (
            <MethodChips methods={section.methods} />
          ) : null}
          {section.rows?.map((row, i) => (
            <View key={i} style={styles.kvRow}>
              <Text style={styles.kvLabel}>{row.label}</Text>
              <Text style={styles.kvValue}>{row.value}</Text>
            </View>
          ))}
          {section.bullets?.map((b, i) => (
            <Text key={i} style={styles.bullet}>
              {"\u2022"} {b}
            </Text>
          ))}
        </>
      )}
    </View>
  );
}

export function AtlasScreen() {
  const listPadBottom = useScrollBottomInset(24);
  const modalPadBottom = useScrollBottomInset(32);
  const { isPremium, recordActivity, takePendingAtlasFishId } = useApp();
  const [selected, setSelected] = useState<FishRecord | null>(null);
  const [atlasQuery, setAtlasQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      const id = takePendingAtlasFishId();
      if (!id) return;
      const fish = fishRows.find((f) => f.id === id);
      if (!fish) return;
      if (!isPremium && fish.is_premium) return;
      setSelected(fish);
      recordActivity("atlas_open");
    }, [isPremium, recordActivity, takePendingAtlasFishId])
  );

  const rows = useMemo(() => {
    if (isPremium) return fishRows;
    return fishRows.filter((f) => !f.is_premium);
  }, [isPremium]);

  const filteredRows = useMemo(() => {
    const q = normalizeCs(atlasQuery.trim());
    if (!q) return rows;
    return rows.filter(
      (f) =>
        normalizeCs(f.name_cz).includes(q) ||
        normalizeCs(f.name_lat).includes(q)
    );
  }, [rows, atlasQuery]);

  const detailSections = useMemo(() => {
    if (!selected) return [];
    return resolveFishSections(selected, isPremium);
  }, [selected, isPremium]);

  const headerMeta = selected ? getFishDetailHeader(selected) : null;
  const detailImage = selected ? getFishImageSource(selected.image) : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Atlas ryb</Text>
      <Text style={styles.lead}>
        {isPremium ? "Plný atlas" : "Základní atlas (Free)"}
        {!isPremium ? " — část karet jen v Premium." : ""}
      </Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={22} color={theme.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hledat podle českého nebo latinského názvu…"
          placeholderTextColor={theme.muted}
          value={atlasQuery}
          onChangeText={setAtlasQuery}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredRows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: listPadBottom }}
        initialNumToRender={14}
        maxToRenderPerBatch={12}
        windowSize={7}
        updateCellsBatchingPeriod={50}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          atlasQuery.trim() ? (
            <Text style={styles.emptySearch}>Nic neodpovídá „{atlasQuery.trim()}“ — zkus jiný výraz.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const thumb = getFishImageSource(item.image);
          const pendingAsset = Boolean(item.image) && !thumb;
          return (
            <Pressable
              style={styles.row}
              onPress={() => {
                setSelected(item);
                recordActivity("atlas_open");
              }}
            >
              {thumb ? (
                <Image
                  source={thumb}
                  style={styles.rowThumb}
                  accessibilityLabel={`Fotografie: ${item.name_cz}`}
                />
              ) : pendingAsset ? (
                <View
                  style={styles.rowThumbPending}
                  accessibilityLabel="Fotografie doplníme"
                >
                  <Text style={styles.rowThumbPendingText}>?</Text>
                </View>
              ) : null}
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle} numberOfLines={2}>
                  {item.name_cz}
                </Text>
                <Text style={styles.rowSub} numberOfLines={3}>
                  míra {item.min_size_cm || "—"} cm · {item.closed_season}
                </Text>
              </View>
              {item.is_premium ? (
                <Text style={styles.badge}>Druh Premium</Text>
              ) : null}
            </Pressable>
          );
        }}
      />

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
        onRequestClose={() => setSelected(null)}
      >
        <SafeAreaView style={styles.modalWrap} edges={["top", "bottom"]}>
          {selected ? (
            <>
              <View style={styles.modalToolbar}>
                <Pressable
                  onPress={() => setSelected(null)}
                  hitSlop={12}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalClose}>Zavřít</Text>
                </Pressable>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={[styles.modalScrollContent, { paddingBottom: modalPadBottom }]}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.detailH1}>{selected.name_cz}</Text>
                <Text style={styles.detailLat}>{selected.name_lat}</Text>

                {detailImage ? (
                  <Image
                    source={detailImage}
                    style={styles.detailHero}
                    resizeMode="cover"
                    accessibilityLabel={`Fotografie: ${selected.name_cz}`}
                  />
                ) : selected.image ? (
                  <View
                    style={styles.detailHeroPending}
                    accessibilityLabel="Fotografie doplníme"
                  >
                    <Text style={styles.detailHeroPendingText}>
                      Fotka v přípravě ({selected.image})
                    </Text>
                  </View>
                ) : null}

                {headerMeta &&
                (headerMeta.family_cz ||
                  headerMeta.taste_group ||
                  headerMeta.names_i18n) ? (
                  <View style={styles.headerCard}>
                    {headerMeta.family_cz ? (
                      <Text style={styles.headerLine}>
                        Čeleď: {headerMeta.family_cz}
                      </Text>
                    ) : null}
                    {headerMeta.taste_group ? (
                      <Text style={styles.headerLine}>
                        Chuť: {headerMeta.taste_group}
                      </Text>
                    ) : null}
                    {headerMeta.names_i18n &&
                    Object.keys(headerMeta.names_i18n).length > 0 ? (
                      <Text style={styles.i18nLine}>
                        {Object.entries(headerMeta.names_i18n)
                          .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
                          .join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                {detailSections.map((section) => (
                  <React.Fragment key={section.id}>
                    <DetailSectionBlock section={section} />
                    {section.id === "methods" &&
                    !section.locked &&
                    section.methods?.some((m) => m.active) ? (
                      <AtlasTackleBridge methods={section.methods} isPremium={isPremium} />
                    ) : null}
                  </React.Fragment>
                ))}
              </ScrollView>
            </>
          ) : null}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.bg,
    padding: 16
  },
  h1: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "700"
  },
  lead: {
    color: theme.muted,
    marginTop: 6,
    marginBottom: 12
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3d444d",
    borderRadius: 12,
    backgroundColor: "#0f141b",
    paddingLeft: 12,
    marginBottom: 12
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 10,
    color: theme.text,
    fontSize: 16
  },
  emptySearch: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 8
  },
  rowTextCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    gap: 12
  },
  rowThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#1c2128"
  },
  rowThumbPending: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#1c2128",
    borderWidth: 1,
    borderColor: "#30363d",
    alignItems: "center",
    justifyContent: "center"
  },
  rowThumbPendingText: {
    color: theme.muted,
    fontSize: 18,
    fontWeight: "700"
  },
  rowTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700"
  },
  rowSub: {
    color: theme.muted,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18
  },
  badge: {
    color: theme.lock,
    fontWeight: "700",
    fontSize: 12
  },
  modalWrap: {
    flex: 1,
    backgroundColor: theme.bg
  },
  modalToolbar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  modalClose: {
    color: theme.accent,
    fontWeight: "700",
    fontSize: 16
  },
  modalScroll: { flex: 1 },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 0
  },
  detailH1: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "800"
  },
  detailLat: {
    color: theme.muted,
    fontSize: 15,
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 12
  },
  detailHero: {
    width: "100%",
    aspectRatio: 16 / 10,
    maxHeight: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#1c2128"
  },
  detailHeroPending: {
    width: "100%",
    aspectRatio: 16 / 10,
    maxHeight: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#1c2128",
    borderWidth: 1,
    borderColor: "#30363d",
    alignItems: "center",
    justifyContent: "center",
    padding: 16
  },
  detailHeroPendingText: {
    color: theme.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20
  },
  headerCard: {
    backgroundColor: theme.sectionBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 16
  },
  headerLine: {
    color: theme.text,
    fontSize: 14,
    marginBottom: 4
  },
  i18nLine: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
  },
  sectionCard: {
    backgroundColor: theme.sectionBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    marginBottom: 12
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10
  },
  sectionHeadMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 194, 168, 0.14)",
    alignItems: "center",
    justifyContent: "center"
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    minWidth: 0
  },
  sectionBadge: {
    color: theme.lock,
    fontWeight: "700",
    fontSize: 11
  },
  sectionIntro: {
    color: theme.muted,
    fontSize: 14,
    marginBottom: 10,
    lineHeight: 20
  },
  paragraph: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10
  },
  kvRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 8
  },
  kvLabel: {
    color: theme.muted,
    fontSize: 13,
    width: 118,
    flexShrink: 0
  },
  kvValue: {
    color: theme.text,
    fontSize: 14,
    flex: 1,
    lineHeight: 20
  },
  bullet: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 4
  },
  methodsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    marginTop: 4
  },
  methodChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#1c2128",
    borderWidth: 1,
    borderColor: theme.border
  },
  methodChipOn: {
    borderColor: theme.accent,
    backgroundColor: "#0d2620"
  },
  methodChipText: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "600"
  },
  methodChipTextOn: {
    color: theme.accent
  },
  lockedBox: {
    backgroundColor: "#1a1408",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#3d2f0a"
  },
  lockedLead: {
    color: theme.lock,
    fontWeight: "700",
    marginBottom: 6
  },
  lockedHint: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 19
  },
  tackleBridgeCard: {
    backgroundColor: "#121a24",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 194, 168, 0.28)",
    padding: 14,
    marginBottom: 12
  },
  tackleBridgeTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6
  },
  tackleBridgeLead: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12
  },
  tackleBridgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border
  },
  tackleBridgeBtnText: {
    flex: 1,
    color: theme.text,
    fontSize: 15,
    fontWeight: "700"
  },
  tackleBridgeBtnSecondary: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center"
  },
  tackleBridgeBtnSecondaryText: {
    color: theme.accent,
    fontWeight: "800",
    fontSize: 14
  },
  tackleBridgeRowMuted: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.border
  },
  tackleBridgeMutedText: {
    color: theme.muted,
    fontSize: 13
  }
});
