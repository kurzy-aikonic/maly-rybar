import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { theme } from "../constants/theme";
import { STORAGE_GEAR_CHECKLIST, STORAGE_WATER_CHECKLIST } from "../constants/storageKeys";
import { useApp } from "../context/AppContext";
import { normalizeCs } from "../lib/normalizeCs";
import { getTackleImageSource } from "../lib/tackleImages";
import { useScrollBottomInset } from "../hooks/useScrollBottomInset";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  deleteCatchPhoto,
  getCatchPhotoSignedUrl,
  uploadCatchPhoto
} from "../services/diaryPhoto";
import {
  deleteRemoteDiaryEntry,
  upsertRemoteDiaryEntry
} from "../services/diaryRemote";
import {
  addCatchEntry,
  deleteCatchEntry
} from "../storage/diaryStorage";
import { mergeDiaryWithRemote } from "../storage/diaryMerge";
import type { CatchEntry } from "../types/catchEntry";
import type { FishRecord } from "../types/fish";
import type { TackleItem } from "../types/tackle";
import fishData from "../../../data/fish.json";
import knotsData from "../../../data/knots.json";
import tackleItemsData from "../../../data/tackle_items.json";
import regionsData from "../../../data/regions.json";
import beginnerGuideData from "../../../data/beginner_guide.json";
import gearGuideData from "../../../data/gear_guide.json";
import waterSafetyData from "../../../data/water_safety.json";

type WaterMode =
  | "hub"
  | "prepare"
  | "gear"
  | "tackle"
  | "tackleDetail"
  | "guide"
  | "diary"
  | "knots"
  | "knotDetail"
  | "regions"
  | "waters"
  | "waterDetail";
type KnotRow = (typeof knotsData)[number];
type RegionRow = (typeof regionsData)[number];
type WaterRow = RegionRow["waters"][number];

const WATER_TYPE_CS: Record<string, string> = {
  reka: "Řeka",
  rybnik: "Rybník",
  nadrz: "Nádrž"
};

const DIFF_CS: Record<string, string> = {
  easy: "Snadné",
  medium: "Střední",
  hard: "Náročné"
};

const FREE_DIARY_LIMIT = 3;

type IonName = React.ComponentProps<typeof Ionicons>["name"];

function BlockTitleWithIcon({ icon, title, iconTint }: { icon: IonName; title: string; iconTint?: string }) {
  const tint = iconTint ?? theme.accent;
  return (
    <View style={styles.blockTitleRow}>
      <View style={[styles.blockTitleIconCircle, { backgroundColor: `${tint}22` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.blockTitleFlat}>{title}</Text>
    </View>
  );
}

function gearSectionIcon(sectionId: string): IonName {
  switch (sectionId) {
    case "docs":
      return "document-text-outline";
    case "tackle":
      return "fish-outline";
    case "comfort":
      return "shirt-outline";
    default:
      return "cube-outline";
  }
}

function guideStepIcon(index: number): IonName {
  const icons: IonName[] = [
    "people-outline",
    "shield-checkmark-outline",
    "clipboard-outline",
    "link-outline",
    "water-outline",
    "book-outline"
  ];
  return icons[index] ?? "ellipse-outline";
}

type WaterHubTargetMode =
  | "prepare"
  | "gear"
  | "tackle"
  | "guide"
  | "regions"
  | "diary"
  | "knots";

const WATER_HUB: {
  mode: WaterHubTargetMode;
  title: string;
  icon: IonName;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    mode: "prepare",
    title: "Než vyrazíš k vodě",
    icon: "shield-checkmark-outline",
    iconColor: "#79c0ff",
    iconBg: "rgba(121, 192, 255, 0.18)"
  },
  {
    mode: "gear",
    title: "Výbava",
    icon: "bag-handle-outline",
    iconColor: theme.accent,
    iconBg: "rgba(0, 194, 168, 0.2)"
  },
  {
    mode: "tackle",
    title: "Poznávání výbavy",
    icon: "construct-outline",
    iconColor: "#a5d6ff",
    iconBg: "rgba(165, 214, 255, 0.16)"
  },
  {
    mode: "guide",
    title: "Průvodce začátečníka",
    icon: "map-outline",
    iconColor: "#d2a8ff",
    iconBg: "rgba(210, 168, 255, 0.15)"
  },
  {
    mode: "regions",
    title: "Revíry a voda",
    icon: "navigate-outline",
    iconColor: "#ffa657",
    iconBg: "rgba(255, 166, 87, 0.16)"
  },
  {
    mode: "diary",
    title: "Deník úlovků",
    icon: "journal-outline",
    iconColor: "#7ee787",
    iconBg: "rgba(126, 231, 135, 0.12)"
  },
  {
    mode: "knots",
    title: "Úvazy a montáže",
    icon: "infinite-outline",
    iconColor: "#ff7b72",
    iconBg: "rgba(255, 123, 114, 0.14)"
  }
];

function waterHubSubtitle(mode: WaterHubTargetMode, isPremium: boolean): string {
  switch (mode) {
    case "prepare":
      return "Tipy pro děti, checklist před výjezdem, odkaz na ČRS";
    case "gear":
      return `Doklady, montáž, pohodlí — odškrtni, co máš sbalené${!isPremium ? " (část položek Premium)" : ""}`;
    case "tackle":
      return "Jak vypadá náčiní, na co je, návody k montáži — propojeno s atlasem";
    case "guide":
      return "Kroky v pořadí — od domluvy po deník";
    case "regions":
      return "Kraje a ukázkové lokality z regions.json (bez mapy)";
    case "diary":
      return isPremium ? "Neomezený zápis" : `Free: max ${FREE_DIARY_LIMIT} záznamy`;
    case "knots":
      return isPremium ? "Plná knihovna" : "Základní úvazy + část Premium";
  }
}

type RegionBrowseRow = { kind: "region"; region: RegionRow };
type WaterHitRow = { kind: "waterHit"; region: RegionRow; water: WaterRow };
type RevSectionRow = RegionBrowseRow | WaterHitRow;

type GearItemRow = (typeof gearGuideData)["sections"][number]["items"][number];

const GEAR_ITEM_IDS: string[] = gearGuideData.sections.flatMap((s) =>
  s.items.map((i) => i.id)
);

const fishRows = fishData as FishRecord[];
const tackleAllItems = tackleItemsData.items as TackleItem[];

function DiaryEntryThumb({ storagePath }: { storagePath: string }) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void getCatchPhotoSignedUrl(storagePath, 7200).then((u) => {
      if (alive) setUri(u);
    });
    return () => {
      alive = false;
    };
  }, [storagePath]);
  if (!uri) {
    return <View style={diThumbStyles.placeholder} />;
  }
  return <Image source={{ uri }} style={diThumbStyles.image} />;
}

const diThumbStyles = StyleSheet.create({
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#0f141b"
  },
  placeholder: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: "#0f141b"
  }
});

export function WaterScreen() {
  const navigation = useNavigation();
  const { isPremium, recordActivity, takePendingTackleTarget, setPendingAtlasFishId } = useApp();
  const { session } = useAuth();
  const [mode, setMode] = useState<WaterMode>("hub");
  const [entries, setEntries] = useState<CatchEntry[]>([]);
  const [selectedKnot, setSelectedKnot] = useState<KnotRow | null>(null);
  const [selectedTackle, setSelectedTackle] = useState<TackleItem | null>(null);
  const [tackleSearch, setTackleSearch] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<RegionRow | null>(null);
  const [selectedWater, setSelectedWater] = useState<WaterRow | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [fishName, setFishName] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [water, setWater] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [revSearch, setRevSearch] = useState("");
  const [waterSubSearch, setWaterSubSearch] = useState("");

  const diaryLimit = isPremium ? 999 : FREE_DIARY_LIMIT;
  const listPadBottom = useScrollBottomInset(32);
  const wrapScroll = useMemo(
    () => [styles.wrap, { paddingBottom: listPadBottom }],
    [listPadBottom]
  );

  const normalizeChecklist = useCallback((raw: Record<string, unknown> | null): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    for (const c of waterSafetyData.checklist) {
      out[c.id] = !!(raw && raw[c.id] === true);
    }
    return out;
  }, []);

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    normalizeChecklist(null)
  );

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(STORAGE_WATER_CHECKLIST).then((raw) => {
      if (cancelled) return;
      try {
        const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
        setChecklist(normalizeChecklist(parsed));
      } catch {
        setChecklist(normalizeChecklist(null));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [normalizeChecklist]);

  const normalizeGearChecklist = useCallback((raw: Record<string, unknown> | null): Record<string, boolean> => {
    const out: Record<string, boolean> = {};
    for (const id of GEAR_ITEM_IDS) {
      out[id] = !!(raw && raw[id] === true);
    }
    return out;
  }, []);

  const [gearChecklist, setGearChecklist] = useState<Record<string, boolean>>(() =>
    normalizeGearChecklist(null)
  );

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(STORAGE_GEAR_CHECKLIST).then((raw) => {
      if (cancelled) return;
      try {
        const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
        setGearChecklist(normalizeGearChecklist(parsed));
      } catch {
        setGearChecklist(normalizeGearChecklist(null));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [normalizeGearChecklist]);

  const toggleGearChecklist = useCallback((id: string) => {
    setGearChecklist((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      void AsyncStorage.setItem(STORAGE_GEAR_CHECKLIST, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetGearChecklist = useCallback(() => {
    const empty = normalizeGearChecklist(null);
    setGearChecklist(empty);
    void AsyncStorage.setItem(STORAGE_GEAR_CHECKLIST, JSON.stringify(empty));
  }, [normalizeGearChecklist]);

  const onGearItemPress = useCallback(
    (item: GearItemRow) => {
      const locked = item.is_premium && !isPremium;
      if (locked) {
        Alert.alert(
          "Premium",
          "Některé doplňkové položky výbavy jsou v Premium. Základní řádky můžeš odškrtávat ve Free."
        );
        return;
      }
      toggleGearChecklist(item.id);
    },
    [isPremium, toggleGearChecklist]
  );

  const toggleChecklist = useCallback(
    (id: string) => {
      setChecklist((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        const ids = waterSafetyData.checklist.map((c) => c.id);
        const wasAll = ids.every((i) => !!prev[i]);
        const nowAll = ids.every((i) => !!next[i]);
        if (nowAll && !wasAll) {
          requestAnimationFrame(() => recordActivity("water_prepare"));
        }
        void AsyncStorage.setItem(STORAGE_WATER_CHECKLIST, JSON.stringify(next));
        return next;
      });
    },
    [recordActivity]
  );

  const resetChecklist = useCallback(() => {
    const empty = normalizeChecklist(null);
    setChecklist(empty);
    void AsyncStorage.setItem(STORAGE_WATER_CHECKLIST, JSON.stringify(empty));
  }, [normalizeChecklist]);

  const refreshDiary = useCallback(async () => {
    const list = await mergeDiaryWithRemote(!!session?.user, diaryLimit);
    setEntries(list);
  }, [session?.user?.id, diaryLimit]);

  useEffect(() => {
    if (mode === "diary") void refreshDiary();
  }, [mode, refreshDiary]);

  const knotRows = useMemo(() => {
    if (isPremium) return knotsData;
    return knotsData.filter((k) => !k.is_premium);
  }, [isPremium]);

  const tackleVisibleItems = useMemo(() => {
    if (isPremium) return tackleAllItems;
    return tackleAllItems.filter((i) => !i.is_premium);
  }, [isPremium]);

  const tackleSearchNorm = useMemo(() => normalizeCs(tackleSearch.trim()), [tackleSearch]);

  const tackleFiltered = useMemo(() => {
    if (!tackleSearchNorm) return tackleVisibleItems;
    return tackleVisibleItems.filter(
      (i) =>
        normalizeCs(i.title).includes(tackleSearchNorm) ||
        normalizeCs(i.subtitle).includes(tackleSearchNorm)
    );
  }, [tackleVisibleItems, tackleSearchNorm]);

  const tackleSections = useMemo(() => {
    return tackleItemsData.categories
      .map((c) => ({
        title: c.title,
        data: tackleFiltered.filter((i) => i.category_id === c.id)
      }))
      .filter((s) => s.data.length > 0);
  }, [tackleFiltered]);

  const openFishFromTackle = useCallback(
    (fishId: string) => {
      const fish = fishRows.find((f) => f.id === fishId);
      if (!fish) {
        Alert.alert("Atlas", "Tento druh v aplikaci není.");
        return;
      }
      if (!isPremium && fish.is_premium) {
        Alert.alert(
          "Premium",
          "Tento druh je v atlasu jen v Premium. V Profilu můžeš předplatné zapnout ve vývoji."
        );
        return;
      }
      setPendingAtlasFishId(fishId);
      navigation.navigate("Atlas" as never);
    },
    [isPremium, navigation, setPendingAtlasFishId]
  );

  useFocusEffect(
    useCallback(() => {
      const pending = takePendingTackleTarget();
      if (!pending) return;
      setTackleSearch("");
      if (pending.kind === "list") {
        setSelectedTackle(null);
        setMode("tackle");
        return;
      }
      const item = tackleAllItems.find((i) => i.id === pending.id);
      if (!item) {
        setSelectedTackle(null);
        setMode("tackle");
        return;
      }
      if (item.is_premium && !isPremium) {
        Alert.alert(
          "Premium",
          "Tato karta výbavy je v Premium. Otevřu seznam, kde jsou všechny free karty."
        );
        setSelectedTackle(null);
        setMode("tackle");
        return;
      }
      setSelectedTackle(item);
      setMode("tackleDetail");
    }, [isPremium, takePendingTackleTarget])
  );

  useEffect(() => {
    if (mode === "tackleDetail" && !selectedTackle) {
      setMode("tackle");
    }
  }, [mode, selectedTackle]);

  const revQueryNorm = useMemo(() => normalizeCs(revSearch.trim()), [revSearch]);
  const revSearchActive = revQueryNorm.length > 0;

  const regionSearchSections = useMemo(() => {
    if (!revSearchActive) {
      return [
        {
          title: "",
          data: regionsData.map(
            (region): RegionBrowseRow => ({ kind: "region", region })
          )
        }
      ];
    }
    const regionsHit = regionsData.filter((r) =>
      normalizeCs(r.name).includes(revQueryNorm)
    );
    const waterHits: WaterHitRow[] = [];
    for (const r of regionsData) {
      for (const w of r.waters) {
        if (normalizeCs(w.name).includes(revQueryNorm)) {
          waterHits.push({ kind: "waterHit", region: r, water: w });
        }
      }
    }
    const sections: { title: string; data: RevSectionRow[] }[] = [];
    if (regionsHit.length) {
      sections.push({
        title: "Kraje",
        data: regionsHit.map((region): RegionBrowseRow => ({ kind: "region", region }))
      });
    }
    if (waterHits.length) {
      sections.push({ title: "Lokality", data: waterHits });
    }
    return sections;
  }, [revQueryNorm, revSearchActive]);

  const watersFiltered = useMemo(() => {
    if (mode !== "waters" || !selectedRegion) return [];
    const waterQ = normalizeCs(waterSubSearch.trim());
    const list = selectedRegion.waters;
    if (!waterQ) return list;
    return list.filter((w) => normalizeCs(w.name).includes(waterQ));
  }, [mode, selectedRegion, waterSubSearch]);

  function openAddModal() {
    if (!isPremium && entries.length >= FREE_DIARY_LIMIT) {
      Alert.alert(
        "Limit Free verze",
        `Ve Free můžeš mít max ${FREE_DIARY_LIMIT} záznamy. Premium přidá neomezený deník.`
      );
      return;
    }
    setFishName("");
    setLengthCm("");
    setWater("");
    setNotes("");
    setPendingPhotoUri(null);
    setModalOpen(true);
  }

  async function pickCatchPhoto() {
    if (!session?.user?.id || !isSupabaseConfigured) {
      Alert.alert("Foto", "Pro přiložení fotky se přihlas v záložce Profil.");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Přístup", "Bez přístupu ke galerii nelze vybrat fotku.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.75,
      aspect: [4, 3]
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPendingPhotoUri(result.assets[0].uri);
    }
  }

  async function submitEntry() {
    const name = fishName.trim();
    if (!name) return;
    const len = lengthCm.trim() ? Number(lengthCm) : undefined;
    if (lengthCm.trim() && (!Number.isFinite(len) || (len ?? 0) <= 0)) {
      Alert.alert("Délka", "Zadej délku jako číslo v cm, nebo nech prázdné.");
      return;
    }
    const entryId = `${Date.now()}`;
    const uid = session?.user?.id;
    let photoPath: string | undefined;
    if (pendingPhotoUri && uid && isSupabaseConfigured) {
      try {
        photoPath = await uploadCatchPhoto(uid, entryId, pendingPhotoUri);
      } catch (e) {
        console.warn("[diary] upload photo", e);
        Alert.alert(
          "Foto",
          "Nepodařilo se nahrát fotku. Zkontroluj migrace Storage v Supabase, nebo ulož bez fotky."
        );
        return;
      }
    }
    const next = await addCatchEntry(
      { id: entryId, fishName: name, lengthCm: len, water, notes, photoStoragePath: photoPath },
      { maxVisible: diaryLimit }
    );
    recordActivity("diary_add");
    setEntries(next);
    setPendingPhotoUri(null);
    setModalOpen(false);
    if (uid && isSupabaseConfigured && next[0]) {
      try {
        await upsertRemoteDiaryEntry(uid, next[0]);
      } catch (e) {
        console.warn("[diary] upsert remote", e);
      }
    }
  }

  function openDiaryWithWater(waterLine: string) {
    if (!isPremium && entries.length >= FREE_DIARY_LIMIT) {
      Alert.alert(
        "Limit Free verze",
        `Ve Free můžeš mít max ${FREE_DIARY_LIMIT} záznamy. Premium přidá neomezený deník.`
      );
      return;
    }
    setFishName("");
    setLengthCm("");
    setWater(waterLine);
    setNotes("");
    setPendingPhotoUri(null);
    setMode("diary");
    setModalOpen(true);
  }

  async function removeEntry(id: string) {
    const prevEntry = entries.find((e) => e.id === id);
    const uid = session?.user?.id;
    if (uid && isSupabaseConfigured && prevEntry?.photoStoragePath) {
      try {
        await deleteCatchPhoto(prevEntry.photoStoragePath);
      } catch (e) {
        console.warn("[diary] delete photo", e);
      }
    }
    if (uid && isSupabaseConfigured) {
      try {
        await deleteRemoteDiaryEntry(uid, id);
      } catch (e) {
        console.warn("[diary] delete remote", e);
      }
    }
    const next = await deleteCatchEntry(id);
    setEntries(next);
  }

  if (mode === "hub") {
    return (
      <ScrollView style={styles.hubScroll} contentContainerStyle={wrapScroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>U vody</Text>
        <Text style={styles.lead}>
          Pořadí: bezpečnost → výbava → poznávání náčiní → průvodce → revíry → deník a úvazy.
        </Text>

        {WATER_HUB.map((item) => (
          <Pressable
            key={item.mode}
            style={({ pressed }) => [styles.hubBigCard, pressed && styles.hubBigCardPressed]}
            onPress={() => {
              if (item.mode === "regions") {
                setSelectedRegion(null);
                setSelectedWater(null);
              }
              if (item.mode === "tackle") {
                setSelectedTackle(null);
              }
              setMode(item.mode);
            }}
          >
            <View style={styles.hubBigCardRow}>
              <View style={[styles.hubIconCircle, { backgroundColor: item.iconBg }]}>
                <Ionicons name={item.icon} size={26} color={item.iconColor} />
              </View>
              <View style={styles.hubBigCardText}>
                <Text style={styles.bigCardTitle}>{item.title}</Text>
                <Text style={styles.bigCardSub}>{waterHubSubtitle(item.mode, isPremium)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.muted} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  if (mode === "prepare") {
    return (
      <ScrollView style={styles.hubScroll} contentContainerStyle={wrapScroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setMode("hub")}>
          <Text style={styles.back}>Zpět</Text>
        </Pressable>
        <Text style={styles.h1}>{waterSafetyData.title}</Text>
        <Text style={styles.lead}>{waterSafetyData.intro}</Text>

        <View style={styles.cardBlock}>
          <BlockTitleWithIcon icon="sparkles-outline" title="Tipy" iconTint="#79c0ff" />
          {waterSafetyData.tips.map((t, i) => (
            <Text key={i} style={styles.stepLine}>
              • {t}
            </Text>
          ))}
        </View>

        <View style={styles.cardBlock}>
          <BlockTitleWithIcon icon="checkbox-outline" title="Checklist před odjezdem" />
          {waterSafetyData.checklist.map((c) => (
            <Pressable key={c.id} style={styles.checkRow} onPress={() => toggleChecklist(c.id)}>
              <View style={[styles.checkBox, checklist[c.id] ? styles.checkBoxOn : null]}>
                {checklist[c.id] ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.checkLabel}>{c.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.secondaryBtnWide} onPress={resetChecklist}>
          <Text style={styles.secondaryBtnText}>Začít checklist znovu</Text>
        </Pressable>

        <View style={styles.cardBlock}>
          <BlockTitleWithIcon icon="people-outline" title="Pro dospělé" iconTint={theme.lock} />
          <Text style={styles.stepLine}>{waterSafetyData.parent_note}</Text>
          <Pressable onPress={() => void Linking.openURL(waterSafetyData.official_url)}>
            <Text style={styles.linkText}>{waterSafetyData.official_label}</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (mode === "gear") {
    return (
      <ScrollView style={styles.hubScroll} contentContainerStyle={wrapScroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setMode("hub")}>
          <Text style={styles.back}>Zpět</Text>
        </Pressable>
        <Text style={styles.h1}>{gearGuideData.title}</Text>
        <Text style={styles.lead}>{gearGuideData.intro}</Text>

        {gearGuideData.sections.map((section) => (
          <View key={section.id} style={styles.cardBlock}>
            <BlockTitleWithIcon icon={gearSectionIcon(section.id)} title={section.title} />
            {section.items.map((item) => {
              const locked = item.is_premium && !isPremium;
              const done = !locked && gearChecklist[item.id];
              return (
                <Pressable
                  key={item.id}
                  style={[styles.checkRow, locked ? styles.checkRowLocked : null]}
                  onPress={() => onGearItemPress(item)}
                >
                  <View style={[styles.checkBox, done ? styles.checkBoxOn : null]}>
                    {done ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checkLabel, locked ? styles.checkLabelMuted : null]}>
                      {item.label}
                    </Text>
                    {locked ? (
                      <Text style={styles.gearPremiumTag}>Premium — odemkni v Profilu</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Pressable style={styles.secondaryBtnWide} onPress={resetGearChecklist}>
          <Text style={styles.secondaryBtnText}>Začít výbavu znovu</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (mode === "tackle") {
    return (
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Pressable onPress={() => setMode("hub")}>
            <Text style={styles.back}>Zpět</Text>
          </Pressable>
          <Text style={styles.h1inline}>Náčiní</Text>
          <View style={{ width: 48 }} />
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={[styles.h1, { marginBottom: 4 }]}>{tackleItemsData.title}</Text>
          <Text style={[styles.lead, { marginTop: 0 }]}>{tackleItemsData.intro}</Text>
          <View style={styles.searchInputWrap}>
            <Ionicons name="search-outline" size={22} color={theme.muted} style={styles.searchInputIcon} />
            <TextInput
              style={styles.searchInputInner}
              placeholder="Hledat prut, splávek, podběrák…"
              placeholderTextColor={theme.muted}
              value={tackleSearch}
              onChangeText={setTackleSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>
        <SectionList
          style={{ flex: 1 }}
          sections={tackleSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: listPadBottom }}
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyTackle}>
              {tackleSearch.trim()
                ? `Nic neodpovídá „${tackleSearch.trim()}“ — zkus jiný výraz.`
                : "Žádné karty v této sekci."}
            </Text>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.revSectionHeaderRow}>
              <Text style={styles.revSectionTitle}>{title}</Text>
            </View>
          )}
          SectionSeparatorComponent={() => <View style={{ height: 10 }} />}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const locked = item.is_premium && !isPremium;
            const thumb = getTackleImageSource(item.image);
            return (
              <Pressable
                style={[styles.knotRow, locked ? styles.checkRowLocked : null]}
                onPress={() => {
                  if (locked) {
                    Alert.alert(
                      "Premium",
                      "Tato karta je v Premium. V Profilu můžeš předplatné zapnout ve vývoji."
                    );
                    return;
                  }
                  setSelectedTackle(item);
                  setMode("tackleDetail");
                }}
              >
                {thumb ? (
                  <Image source={thumb} style={styles.tackleRowThumb} accessibilityLabel={item.title} />
                ) : (
                  <View style={styles.knotRowIcon}>
                    <Ionicons name="hardware-chip-outline" size={22} color={theme.accent} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.knotName}>{item.title}</Text>
                  <Text style={styles.knotType} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                  {locked ? <Text style={styles.gearPremiumTag}>Premium</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.muted} />
              </Pressable>
            );
          }}
        />
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text style={styles.tackleFootnote}>{tackleItemsData.footnote}</Text>
        </View>
      </View>
    );
  }

  if (mode === "tackleDetail" && selectedTackle) {
    const tk = selectedTackle;
    const hero = getTackleImageSource(tk.image);
    return (
      <ScrollView style={styles.hubScroll} contentContainerStyle={wrapScroll} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => {
            setMode("tackle");
            setSelectedTackle(null);
          }}
        >
          <Text style={styles.back}>Zpět na seznam</Text>
        </Pressable>
        <Text style={styles.h1}>{tk.title}</Text>
        <Text style={styles.lead}>{tk.subtitle}</Text>
        {hero ? (
          <Image
            source={hero}
            style={styles.tackleHero}
            resizeMode="cover"
            accessibilityLabel={tk.title}
          />
        ) : (
          <View style={styles.tackleHeroPlaceholder} accessibilityLabel="Ilustrace doplníme">
            <Ionicons name="images-outline" size={48} color={theme.muted} />
            <Text style={styles.tackleHeroPlaceholderText}>Fotku doplníme do assets/tackle</Text>
          </View>
        )}
        {tk.paragraphs?.map((p, i) => (
          <Text key={i} style={[styles.stepLine, { marginBottom: 10 }]}>
            {p}
          </Text>
        ))}
        {tk.bullets?.length ? (
          <View style={styles.cardBlock}>
            <BlockTitleWithIcon icon="list-outline" title="Na co myslet" />
            {tk.bullets.map((b, i) => (
              <Text key={i} style={styles.stepLine}>
                • {b}
              </Text>
            ))}
          </View>
        ) : null}
        {tk.assembly_steps?.length ? (
          <View style={styles.cardBlock}>
            <BlockTitleWithIcon icon="build-outline" title="Návod — skládání / postup" />
            {tk.assembly_steps.map((s, i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <Text style={styles.tackleStepTitle}>{s.title}</Text>
                <Text style={styles.stepLine}>{s.body}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {tk.atlas_links?.length ? (
          <View style={styles.cardBlock}>
            <BlockTitleWithIcon icon="fish-outline" title="V atlasu ryb" />
            <Text style={styles.stepLine}>
              Jak na konkrétní druh a montáž najdeš u karty ryby v záložce Atlas.
            </Text>
            {tk.atlas_links.map((link) => (
              <Pressable
                key={link.fish_id}
                style={styles.tackleAtlasLink}
                onPress={() => openFishFromTackle(link.fish_id)}
              >
                <Ionicons name="open-outline" size={18} color={theme.accent} />
                <Text style={styles.tackleAtlasLinkText}>{link.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {tk.disclaimer ? (
          <View style={styles.cardBlock}>
            <BlockTitleWithIcon icon="alert-circle-outline" title="Bezpečně" iconTint={theme.lock} />
            <Text style={styles.stepLine}>{tk.disclaimer}</Text>
          </View>
        ) : null}
        <Text style={styles.tackleFootnote}>{tackleItemsData.footnote}</Text>
      </ScrollView>
    );
  }

  if (mode === "guide") {
    return (
      <ScrollView style={styles.hubScroll} contentContainerStyle={wrapScroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setMode("hub")}>
          <Text style={styles.back}>Zpět</Text>
        </Pressable>
        <Text style={styles.h1}>{beginnerGuideData.title}</Text>
        <Text style={styles.lead}>{beginnerGuideData.intro}</Text>
        {beginnerGuideData.steps.map((step, idx) => (
          <View key={step.title} style={styles.cardBlock}>
            <BlockTitleWithIcon icon={guideStepIcon(idx)} title={step.title} />
            <Text style={styles.stepLine}>{step.body}</Text>
          </View>
        ))}
      </ScrollView>
    );
  }

  if (mode === "diary") {
    return (
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Pressable onPress={() => setMode("hub")}>
            <Text style={styles.back}>Zpět</Text>
          </Pressable>
          <Text style={styles.h1inline}>Deník</Text>
          <Pressable onPress={openAddModal}>
            <Text style={styles.add}>+ Zapsat</Text>
          </Pressable>
        </View>
        <Text style={styles.leadSmall}>
          Záznamy: {entries.length}
          {!isPremium ? ` / max ${FREE_DIARY_LIMIT} (Free)` : ""}
        </Text>
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: listPadBottom }}
          ListEmptyComponent={
            <Text style={styles.empty}>Zatím nic — přidej první úlovek.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.entryCard}>
              {item.photoStoragePath && session?.user ? (
                <DiaryEntryThumb storagePath={item.photoStoragePath} />
              ) : null}
              <View
                style={{
                  flex: 1,
                  marginLeft: item.photoStoragePath && session?.user ? 10 : 0
                }}
              >
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
              <Text style={styles.modalTitle}>Nový úlovek</Text>
              <Text style={styles.label}>Ryba</Text>
              <TextInput
                style={styles.input}
                placeholder="např. Kapr obecný"
                placeholderTextColor={theme.muted}
                value={fishName}
                onChangeText={setFishName}
              />
              <Text style={styles.label}>Délka (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="volitelné"
                placeholderTextColor={theme.muted}
                value={lengthCm}
                onChangeText={setLengthCm}
              />
              <Text style={styles.label}>Revír / voda</Text>
              <TextInput
                style={styles.input}
                placeholder="volitelné"
                placeholderTextColor={theme.muted}
                value={water}
                onChangeText={setWater}
              />
              <Text style={styles.label}>Fotka (volitelné)</Text>
              {session?.user && isSupabaseConfigured ? (
                <>
                  {pendingPhotoUri ? (
                    <Image source={{ uri: pendingPhotoUri }} style={styles.previewImage} />
                  ) : null}
                  <View style={styles.photoRow}>
                    <Pressable style={styles.pickPhotoBtn} onPress={() => void pickCatchPhoto()}>
                      <Text style={styles.pickPhotoBtnText}>
                        {pendingPhotoUri ? "Změnit fotku" : "Vybrat z galerie"}
                      </Text>
                    </Pressable>
                    {pendingPhotoUri ? (
                      <Pressable onPress={() => setPendingPhotoUri(null)}>
                        <Text style={styles.removePhoto}>Odebrat</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </>
              ) : (
                <Text style={styles.photoHint}>Fotku lze přidat po přihlášení v Profilu.</Text>
              )}
              <Text style={styles.label}>Poznámka</Text>
              <TextInput
                style={[styles.input, { minHeight: 72 }]}
                multiline
                placeholder="např. nástraha, počasí"
                placeholderTextColor={theme.muted}
                value={notes}
                onChangeText={setNotes}
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setPendingPhotoUri(null);
                    setModalOpen(false);
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Zrušit</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={submitEntry}>
                  <Text style={styles.primaryBtnText}>Uložit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (mode === "regions") {
    return (
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Pressable
            onPress={() => {
              setRevSearch("");
              setSelectedRegion(null);
              setMode("hub");
            }}
          >
            <Text style={styles.back}>Zpět</Text>
          </Pressable>
          <Text style={styles.h1inline}>Revíry</Text>
          <View style={{ width: 48 }} />
        </View>
        <SectionList
          sections={regionSearchSections}
          keyExtractor={(item) =>
            item.kind === "region" ? item.region.id : `${item.region.id}:${item.water.id}`
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: listPadBottom,
            flexGrow: 1
          }}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.leadSmall, { paddingHorizontal: 0, marginBottom: 10 }]}>
                Vyber kraj nebo vyhledej lokalitu podle názvu. Údaje jsou ukázka k MVP — před lovem
                ověř pravidla revíru.
              </Text>
              <View style={styles.searchInputWrap}>
                <Ionicons name="search" size={22} color={theme.muted} style={styles.searchInputIcon} />
                <TextInput
                  style={styles.searchInputInner}
                  placeholder="Hledat kraj nebo lokalitu…"
                  placeholderTextColor={theme.muted}
                  value={revSearch}
                  onChangeText={setRevSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            </View>
          }
          renderSectionHeader={({ section: { title } }) =>
            title ? (
              <View style={styles.revSectionHeaderRow}>
                <Ionicons
                  name={title === "Kraje" ? "map-outline" : "water-outline"}
                  size={16}
                  color={theme.accent}
                />
                <Text style={styles.revSectionTitle}>{title}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            revSearchActive ? (
              <Text style={styles.empty}>Nic jsme nenašli — zkus jiný výraz.</Text>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === "region") {
              const r = item.region;
              return (
                <Pressable
                  style={styles.knotRow}
                  onPress={() => {
                    setSelectedRegion(r);
                    setWaterSubSearch("");
                    setMode("waters");
                  }}
                >
                  <View style={styles.knotRowIcon}>
                    <Ionicons name="map-outline" size={22} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.knotName}>{r.name}</Text>
                    <Text style={styles.knotType}>{r.waters.length} lokality v ukázce</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              );
            }
            const { region: r, water: w } = item;
            return (
              <Pressable
                style={styles.knotRow}
                onPress={() => {
                  setSelectedRegion(r);
                  setSelectedWater(w);
                  setMode("waterDetail");
                }}
              >
                <View style={styles.knotRowIcon}>
                  <Ionicons name="water-outline" size={22} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.knotName}>{w.name}</Text>
                  <Text style={styles.knotType}>
                    {r.name} · {WATER_TYPE_CS[w.type] ?? w.type}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  if (mode === "waters" && selectedRegion) {
    const r = selectedRegion;
    const waterQ = normalizeCs(waterSubSearch.trim());

    return (
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Pressable
            onPress={() => {
              setWaterSubSearch("");
              setSelectedRegion(null);
              setMode("regions");
            }}
          >
            <Text style={styles.back}>Zpět</Text>
          </Pressable>
          <Text style={styles.h1inline} numberOfLines={1}>
            {r.name}
          </Text>
          <View style={{ width: 48 }} />
        </View>
        <FlatList
          data={watersFiltered}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: listPadBottom, flexGrow: 1 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 12 }}>
              <View style={styles.searchInputWrap}>
                <Ionicons name="search" size={22} color={theme.muted} style={styles.searchInputIcon} />
                <TextInput
                  style={styles.searchInputInner}
                  placeholder="Filtrovat lokality v kraji…"
                  placeholderTextColor={theme.muted}
                  value={waterSubSearch}
                  onChangeText={setWaterSubSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            waterQ ? (
              <Text style={styles.empty}>V tomto kraji nic neodpovídá hledání.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.knotRow}
              onPress={() => {
                setSelectedWater(item);
                setMode("waterDetail");
              }}
            >
              <View style={styles.knotRowIcon}>
                <Ionicons name="location-outline" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.knotName}>{item.name}</Text>
                <Text style={styles.knotType}>
                  {WATER_TYPE_CS[item.type] ?? item.type}
                  {item.difficulty ? ` · ${DIFF_CS[item.difficulty] ?? item.difficulty}` : ""}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  if (mode === "waterDetail" && selectedRegion && selectedWater) {
    const r = selectedRegion;
    const w = selectedWater;
    const waterLine = `${w.name} · ${r.name}`;
    return (
      <ScrollView style={styles.hubScroll} contentContainerStyle={wrapScroll} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => {
            setSelectedWater(null);
            setMode("waters");
          }}
        >
          <Text style={styles.back}>Zpět na lokality</Text>
        </Pressable>
        <Text style={styles.h1}>{w.name}</Text>
        <Text style={styles.lead}>
          {r.name} · {WATER_TYPE_CS[w.type] ?? w.type}
          {w.difficulty ? ` · ${DIFF_CS[w.difficulty] ?? w.difficulty}` : ""}
        </Text>
        <View style={styles.cardBlock}>
          <BlockTitleWithIcon icon="document-text-outline" title="Poznámka" iconTint="#79c0ff" />
          <Text style={styles.stepLine}>{w.notes}</Text>
        </View>
        {w.target_species?.length ? (
          <View style={styles.cardBlock}>
            <BlockTitleWithIcon icon="fish-outline" title="Orientační druhy (ukázka)" />
            {w.target_species.map((s) => (
              <Text key={s} style={styles.stepLine}>
                · {s}
              </Text>
            ))}
          </View>
        ) : null}
        <Pressable style={styles.bigCard} onPress={() => openDiaryWithWater(waterLine)}>
          <View style={styles.inlineIconRow}>
            <Ionicons name="add-circle-outline" size={24} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bigCardTitle}>Zapsat úlovek zde</Text>
              <Text style={styles.bigCardSub}>Otevře deník s předvyplněným revírem</Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          style={styles.bigCard}
          onPress={() => void Linking.openURL(waterSafetyData.official_url)}
        >
          <View style={styles.inlineIconRow}>
            <Ionicons name="open-outline" size={24} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bigCardTitle}>Ověřit pravidla u ČRS</Text>
              <Text style={styles.bigCardSub}>Aktuální revíry a informace — otevře prohlížeč</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    );
  }

  if (mode === "knots") {
    return (
      <View style={styles.flex}>
        <View style={styles.rowHeader}>
          <Pressable onPress={() => setMode("hub")}>
            <Text style={styles.back}>Zpět</Text>
          </Pressable>
          <Text style={styles.h1inline}>Úvazy</Text>
          <View style={{ width: 48 }} />
        </View>
        <FlatList
          data={knotRows}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          contentContainerStyle={{ padding: 16, paddingBottom: listPadBottom }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.knotRow}
              onPress={() => {
                setSelectedKnot(item);
                setMode("knotDetail");
              }}
            >
              <View style={styles.knotRowIcon}>
                <Ionicons name="link-outline" size={22} color={theme.accent} />
              </View>
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
      <ScrollView style={styles.hubScroll} contentContainerStyle={wrapScroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setMode("knots")}>
          <Text style={styles.back}>Zpět na seznam</Text>
        </Pressable>
        <Text style={styles.h1}>{k.name}</Text>
        <Text style={styles.lead}>Typ: {k.type}</Text>
        <View style={styles.cardBlock}>
            <BlockTitleWithIcon icon="layers-outline" title="Kroky" />
          {k.steps.map((s, i) => (
            <Text key={i} style={styles.stepLine}>
              {i + 1}. {s}
            </Text>
          ))}
        </View>
        {k.common_mistakes?.length ? (
          <View style={styles.cardBlock}>
            <BlockTitleWithIcon icon="warning-outline" title="Nejčastější chyby" iconTint={theme.danger} />
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
  flex: { flex: 1, backgroundColor: theme.bg },
  hubScroll: { flex: 1, backgroundColor: theme.bg },
  wrap: { flexGrow: 1, padding: 16, paddingBottom: 0, backgroundColor: theme.bg },
  h1: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6
  },
  h1inline: { color: theme.text, fontSize: 18, fontWeight: "800" },
  lead: {
    color: theme.muted,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },
  leadSmall: { color: theme.muted, paddingHorizontal: 16, marginBottom: 6, fontSize: 13 },
  bigCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 18,
    marginBottom: 12
  },
  hubBigCard: {
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12
  },
  hubBigCardPressed: {
    borderColor: "rgba(0, 194, 168, 0.35)",
    opacity: 0.95
  },
  hubBigCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  hubIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center"
  },
  hubBigCardText: { flex: 1, minWidth: 0 },
  inlineIconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  bigCardTitle: { color: theme.text, fontSize: 18, fontWeight: "800" },
  bigCardSub: { color: theme.muted, marginTop: 6, fontSize: 14 },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  back: { color: theme.accent, fontWeight: "700", fontSize: 16 },
  add: { color: theme.accent, fontWeight: "800", fontSize: 15 },
  entryCard: {
    flexDirection: "row",
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    alignItems: "flex-start",
    gap: 0
  },
  previewImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#0f141b"
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8
  },
  pickPhotoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border
  },
  pickPhotoBtnText: {
    color: theme.accent,
    fontWeight: "700",
    fontSize: 14
  },
  removePhoto: {
    color: theme.danger,
    fontWeight: "700",
    fontSize: 14
  },
  photoHint: {
    color: theme.muted,
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18
  },
  entryFish: { color: theme.text, fontSize: 16, fontWeight: "800" },
  entryMeta: { color: theme.muted, marginTop: 4, fontSize: 13 },
  entryLine: { color: theme.text, marginTop: 6, fontSize: 14 },
  delete: { color: theme.danger, fontWeight: "700", fontSize: 13 },
  empty: { color: theme.muted, textAlign: "center", marginTop: 24 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end"
  },
  modalCard: {
    backgroundColor: theme.card,
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: theme.border
  },
  modalTitle: { color: theme.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  label: { color: theme.muted, marginTop: 8, marginBottom: 4, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    color: theme.text,
    backgroundColor: "#0f141b",
    fontSize: 15
  },
  searchInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    color: theme.text,
    backgroundColor: "#0f141b",
    fontSize: 15
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#3d444d",
    borderRadius: 12,
    backgroundColor: "#0f141b",
    paddingLeft: 12,
    paddingRight: 4
  },
  searchInputIcon: { marginRight: 4 },
  searchInputInner: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
    color: theme.text,
    fontSize: 16
  },
  revSectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginTop: 8
  },
  revSectionTitle: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center"
  },
  secondaryBtnText: { color: theme.text, fontWeight: "700" },
  primaryBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: theme.accent, alignItems: "center" },
  primaryBtnText: { color: "#042b26", fontWeight: "800" },
  knotRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
    gap: 12
  },
  knotRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 194, 168, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  knotName: { color: theme.text, fontSize: 16, fontWeight: "700" },
  knotType: { color: theme.muted, marginTop: 4, fontSize: 13 },
  badge: { color: theme.lock, fontWeight: "700", fontSize: 12 },
  chevron: { color: theme.muted, fontSize: 22, fontWeight: "300", marginLeft: 8 },
  cardBlock: {
    backgroundColor: theme.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginTop: 12
  },
  blockTitle: { color: theme.text, fontWeight: "800", marginBottom: 10 },
  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12
  },
  blockTitleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center"
  },
  blockTitleFlat: {
    flex: 1,
    color: theme.text,
    fontWeight: "800",
    fontSize: 16,
    lineHeight: 22
  },
  stepLine: { color: theme.muted, fontSize: 14, marginBottom: 8 },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    gap: 12
  },
  checkBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "#8b949e",
    backgroundColor: "#21262d",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1
  },
  checkBoxOn: {
    borderColor: theme.accent,
    backgroundColor: theme.accent
  },
  checkMark: { color: "#042b26", fontWeight: "900", fontSize: 20, lineHeight: 22 },
  checkLabel: { flex: 1, color: theme.text, fontSize: 14, lineHeight: 20 },
  checkLabelMuted: { color: theme.muted },
  checkRowLocked: { opacity: 0.85 },
  gearPremiumTag: {
    color: theme.lock,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  emptyTackle: {
    color: theme.muted,
    fontSize: 14,
    textAlign: "center",
    marginTop: 24,
    paddingHorizontal: 12
  },
  tackleRowThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#1c2128"
  },
  tackleHero: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#1c2128"
  },
  tackleHeroPlaceholder: {
    width: "100%",
    minHeight: 160,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: "#12171f",
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10
  },
  tackleHeroPlaceholderText: {
    color: theme.muted,
    fontSize: 13,
    textAlign: "center"
  },
  tackleStepTitle: {
    color: theme.text,
    fontWeight: "800",
    fontSize: 15,
    marginBottom: 6
  },
  tackleAtlasLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border
  },
  tackleAtlasLinkText: {
    flex: 1,
    color: theme.accent,
    fontWeight: "700",
    fontSize: 15
  },
  tackleFootnote: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  },
  linkText: {
    color: theme.accent,
    fontWeight: "700",
    fontSize: 14,
    marginTop: 12,
    textDecorationLine: "underline"
  },
  secondaryBtnWide: {
    marginTop: 4,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    backgroundColor: theme.card
  }
});
