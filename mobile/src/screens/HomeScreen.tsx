import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import fishData from "../../../data/fish.json";
import { fishAvatarEmoji } from "../constants/fishAvatars";
import { theme } from "../constants/theme";
import { useApp } from "../context/AppContext";
import { useScrollBottomInset } from "../hooks/useScrollBottomInset";
import { useAuth } from "../context/AuthContext";
import { examHorizonLabel } from "../lib/examLabels";
import { fishOfDayBlurb, pickFishOfDay, todayLocalISO } from "../lib/fishOfDay";
import { getFishImageSource } from "../lib/fishImages";
import { ACHIEVEMENT_DISPLAY_ORDER, ACHIEVEMENT_LABELS, progressService } from "../lib/progress";
import { isSupabaseConfigured } from "../lib/supabase";
import { fetchQuizRunSummary, type QuizRunSummary } from "../services/quizRemote";
import type { FishRecord } from "../types/fish";

export function HomeScreen() {
  const scrollPadBottom = useScrollBottomInset(32);
  const navigation = useNavigation();
  const {
    progress,
    hydrated,
    childAge,
    examHorizon,
    childNickname,
    fishAvatarId,
    setPendingTestyView,
    setPendingAtlasFishId,
    isPremium
  } = useApp();
  const { session } = useAuth();
  const nextXp = progressService.xpForNextLevel(progress.level);
  const [quizSummary, setQuizSummary] = useState<QuizRunSummary | null>(null);
  const [quizSummaryLoading, setQuizSummaryLoading] = useState(false);
  const [fishDayKey, setFishDayKey] = useState(todayLocalISO);

  useFocusEffect(
    useCallback(() => {
      setFishDayKey(todayLocalISO());
      const uid = session?.user?.id;
      if (!uid || !isSupabaseConfigured) {
        setQuizSummary(null);
        setQuizSummaryLoading(false);
        return;
      }
      let cancelled = false;
      setQuizSummaryLoading(true);
      void fetchQuizRunSummary(uid)
        .then((s) => {
          if (!cancelled) setQuizSummary(s);
        })
        .catch((e) => {
          console.warn("[home] fetchQuizRunSummary", e);
          if (!cancelled) setQuizSummary(null);
        })
        .finally(() => {
          if (!cancelled) setQuizSummaryLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [session?.user?.id])
  );

  if (!hydrated) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const uid = session?.user?.id;
  const challenge = progress.dailyChallenge;
  const unlockedBadges = new Set(progress.achievementIds ?? []);
  const greetingName = childNickname.trim() ? childNickname.trim() : "Malý rybář";
  const greetingEmoji = fishAvatarEmoji(fishAvatarId);
  const examFocused = examHorizon && examHorizon !== "jen_uceni";

  const fishBank = useMemo(() => {
    const all = fishData as FishRecord[];
    return isPremium ? all : all.filter((f) => !f.is_premium);
  }, [isPremium]);

  const fishOfToday = useMemo(() => pickFishOfDay(fishBank, fishDayKey), [fishBank, fishDayKey]);

  const fishOfDayThumb = fishOfToday ? getFishImageSource(fishOfToday.image) : null;
  const fishOfDayBlurbText = fishOfToday ? fishOfDayBlurb(fishOfToday) : "";

  return (
    <ScrollView contentContainerStyle={[styles.wrap, { paddingBottom: scrollPadBottom }]}>
      <View style={styles.greetingRow}>
        <Text style={styles.greetingEmoji}>{greetingEmoji}</Text>
        <View style={styles.greetingTextCol}>
          <Text style={styles.greetingHi}>Ahoj, {greetingName}!</Text>
          <Text style={styles.greetingSub}>Dnešní mise</Text>
        </View>
      </View>
      <Text style={styles.lead}>
        Zvládni krátký kvíz a posuň svůj pokrok. V Testech je i poznávání ryb z fotky a příprava na průkaz
        (míry, hájení, latina, podobné druhy).
      </Text>

      {fishOfToday ? (
        <View style={styles.fishDayCard}>
          <View style={styles.fishDayHeader}>
            <View style={styles.fishDayBadge}>
              <Ionicons name="sparkles" size={16} color={theme.accent} />
              <Text style={styles.fishDayBadgeText}>Ryba dne</Text>
            </View>
            <Text style={styles.fishDayHint}>Každý den jiná — jen tak pro radost</Text>
          </View>
          <View style={styles.fishDayBody}>
            {fishOfDayThumb ? (
              <Image source={fishOfDayThumb} style={styles.fishDayImg} resizeMode="cover" />
            ) : (
              <View style={styles.fishDayImgPlaceholder}>
                <Ionicons name="fish-outline" size={32} color={theme.muted} />
              </View>
            )}
            <View style={styles.fishDayTextCol}>
              <Text style={styles.fishDayName}>{fishOfToday.name_cz}</Text>
              <Text style={styles.fishDayBlurb}>{fishOfDayBlurbText}</Text>
            </View>
          </View>
          <Pressable
            style={styles.fishDayBtn}
            onPress={() => {
              setPendingAtlasFishId(fishOfToday.id);
              navigation.navigate("Atlas" as never);
            }}
          >
            <Text style={styles.fishDayBtnText}>Otevřít v atlasu</Text>
            <Ionicons name="chevron-forward" size={20} color="#042b26" />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.testyEntryCard}>
        <Text style={styles.label}>Testy</Text>
        {examFocused ? (
          <>
            <Pressable
              style={styles.testyPrimary}
              onPress={() => {
                setPendingTestyView("exam");
                navigation.navigate("Testy" as never);
              }}
            >
              <Text style={styles.testyPrimaryTitle}>Příprava na zkoušku</Text>
              <Text style={styles.testyPrimarySub}>Přímo do režimu podle tvého cíle</Text>
            </Pressable>
            <Pressable
              style={styles.testyLink}
              onPress={() => {
                setPendingTestyView("photo");
                navigation.navigate("Testy" as never);
              }}
            >
              <Text style={styles.testyLinkText}>Poznávání z fotky (přímo)</Text>
            </Pressable>
            <Pressable
              style={styles.testyLink}
              onPress={() => {
                setPendingTestyView("classic");
                navigation.navigate("Testy" as never);
              }}
            >
              <Text style={styles.testyLinkText}>Obecný kvíz (přímo)</Text>
            </Pressable>
            <Pressable style={styles.testyLinkMuted} onPress={() => navigation.navigate("Testy" as never)}>
              <Text style={styles.testyLinkMutedText}>Celé menu Testy</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.testyPrimary} onPress={() => navigation.navigate("Testy" as never)}>
            <Text style={styles.testyPrimaryTitle}>Otevřít Testy</Text>
            <Text style={styles.testyPrimarySub}>Kvíz, poznávání z fotky a příprava na průkaz</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Kvíz v účtu</Text>
        {!uid || !isSupabaseConfigured ? (
          <Text style={styles.hint}>
            Přihlas se v záložce Profil — u přihlášeného uživatele ukládáme dokončené kvízy do cloudu.
          </Text>
        ) : quizSummaryLoading ? (
          <ActivityIndicator color={theme.accent} style={{ marginVertical: 8 }} />
        ) : quizSummary && quizSummary.last ? (
          <>
            <Text style={styles.big}>
              Poslední: {quizSummary.last.score} / {quizSummary.last.maxScore}
            </Text>
            <Text style={styles.meta}>
              {new Date(quizSummary.last.createdAt).toLocaleString("cs-CZ", {
                dateStyle: "short",
                timeStyle: "short"
              })}
            </Text>
            <Text style={styles.meta}>Celkem dokončených běhů: {quizSummary.totalRuns}</Text>
          </>
        ) : (
          <Text style={styles.hint}>
            Zatím žádný uložený běh. Spusť kvíz v záložce Testy — po dokončení uvidíš výsledek tady.
          </Text>
        )}
      </View>

      {typeof childAge === "number" && examHorizon ? (
        <View style={styles.profileBanner}>
          <Text style={styles.profileText}>
            Věk {childAge} · {examHorizonLabel(examHorizon)}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Úroveň</Text>
        <Text style={styles.big}>{progress.level}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>XP k další úrovni</Text>
        <Text style={styles.big}>
          {progress.xp} / {nextXp}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Série dní</Text>
        <Text style={styles.big}>{progress.streakDays}</Text>
      </View>

      {challenge ? (
        <View style={styles.card}>
          <Text style={styles.label}>Denní výzva</Text>
          <Text style={styles.challengeTitle}>{challenge.title}</Text>
          <Text style={styles.meta}>
            Odměna: +{challenge.rewardXp} XP {challenge.isDone ? "· splněno" : "· čekáme na splnění"}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Odznaky</Text>
        <Text style={[styles.hint, styles.badgeIntro]}>
          Dokončuj testy, plň denní výzvy a posiluj sérii — odemčené jsou zvýrazněné.
        </Text>
        {ACHIEVEMENT_DISPLAY_ORDER.map((id) => {
          const on = unlockedBadges.has(id);
          return (
            <View key={id} style={styles.badgeRow}>
              <Text style={[styles.badgeText, on ? styles.badgeUnlocked : styles.badgeLocked]}>
                {on ? "✓ " : "○ "}
                {ACHIEVEMENT_LABELS[id]}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    backgroundColor: theme.bg,
    padding: 20,
    paddingBottom: 0
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12
  },
  greetingEmoji: {
    fontSize: 36
  },
  greetingTextCol: {
    flex: 1
  },
  greetingHi: {
    color: theme.text,
    fontSize: 20,
    fontWeight: "800"
  },
  greetingSub: {
    color: theme.muted,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2
  },
  lead: {
    color: theme.muted,
    fontSize: 15,
    marginBottom: 16
  },
  fishDayCard: {
    backgroundColor: "#0f1c1a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f6b5c",
    padding: 14,
    marginBottom: 14
  },
  fishDayHeader: {
    marginBottom: 10
  },
  fishDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  fishDayBadgeText: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  fishDayHint: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 4
  },
  fishDayBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12
  },
  fishDayImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#1c2128"
  },
  fishDayImgPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#161b22",
    borderWidth: 1,
    borderColor: "#30363d",
    alignItems: "center",
    justifyContent: "center"
  },
  fishDayTextCol: {
    flex: 1,
    minWidth: 0
  },
  fishDayName: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6
  },
  fishDayBlurb: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20
  },
  fishDayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.accent,
    paddingVertical: 12,
    borderRadius: 10
  },
  fishDayBtnText: {
    color: "#042b26",
    fontWeight: "800",
    fontSize: 15
  },
  testyEntryCard: {
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202733",
    padding: 16,
    marginBottom: 12
  },
  testyPrimary: {
    backgroundColor: "#0f1c1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f6b5c",
    padding: 14
  },
  testyPrimaryTitle: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "800"
  },
  testyPrimarySub: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18
  },
  testyLink: {
    marginTop: 10,
    paddingVertical: 6
  },
  testyLinkText: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: "700"
  },
  testyLinkMuted: {
    paddingVertical: 4
  },
  testyLinkMutedText: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "600"
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
    color: theme.accent,
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
    color: theme.muted,
    fontSize: 13,
    marginBottom: 6
  },
  big: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "700"
  },
  meta: {
    color: theme.muted,
    fontSize: 14,
    marginTop: 8
  },
  hint: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 20
  },
  challengeTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700"
  },
  badgeIntro: {
    marginBottom: 10
  },
  badgeRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#202733"
  },
  badgeText: {
    fontSize: 14,
    lineHeight: 20
  },
  badgeUnlocked: {
    color: theme.accent,
    fontWeight: "700"
  },
  badgeLocked: {
    color: theme.muted,
    fontWeight: "600"
  }
});
