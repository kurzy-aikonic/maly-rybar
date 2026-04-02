import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { theme } from "../constants/theme";
import { useApp } from "../context/AppContext";
import { useScrollBottomInset } from "../hooks/useScrollBottomInset";
import { useAuth } from "../context/AuthContext";
import { buildExamCoachLine } from "../lib/examCoach";
import {
  buildExamRound,
  buildImageOnlyPhotoRound,
  evaluateExam,
  examQuestionCounts,
  imageOnlyPhotoSpeciesCount,
  type ExamDrillMode,
  type ExamQuestion
} from "../lib/examPrep";
import { getFishImageSource } from "../lib/fishImages";
import { hapticLight, hapticSuccess } from "../lib/haptics";
import { isSupabaseConfigured } from "../lib/supabase";
import { insertQuizRun } from "../services/quizRemote";

const DRILLS: { id: ExamDrillMode; label: string; hint: string }[] = [
  {
    id: "photo",
    label: "Poznávání druhů",
    hint: "Fotka z atlasu, nebo znaky, pokud fotka není — jen z fotek máš samostatné „Poznávání z fotky“ v menu testů"
  },
  { id: "size", label: "Lovná míra", hint: "Zákonná míra v cm podle údajů v atlasu" },
  { id: "season", label: "Doba hájení", hint: "Období podle údajů v atlasu" },
  {
    id: "latin",
    label: "Latinské názvy",
    hint: "Jak se druh jmenuje česky podle latiny — bez fotek, jen podle atlasu"
  },
  {
    id: "similar",
    label: "Podobné druhy",
    hint: "Co atlas uvádí u vybraného druhu jako podobný — trénink záměn"
  },
  { id: "mix", label: "Mix jako u zkoušky", hint: "Náhodně všechny typy otázek dohromady" }
];

export type ExamPrepVariant = "examMenu" | "photoImageQuiz";

type Props = { onBack: () => void; variant?: ExamPrepVariant };

export function ExamPrepScreen({ onBack, variant = "examMenu" }: Props) {
  const scrollPadBottom = useScrollBottomInset(32);
  const { isPremium, applyQuizResult } = useApp();
  const { session } = useAuth();
  const photoQuiz = variant === "photoImageQuiz";
  const [drill, setDrill] = useState<ExamDrillMode>("mix");
  const [quiz, setQuiz] = useState<ExamQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "active" | "done">("idle");
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const current = quiz[index];

  const counts = useMemo(() => examQuestionCounts(isPremium), [isPremium]);
  const photoSpeciesCount = useMemo(() => imageOnlyPhotoSpeciesCount(isPremium), [isPremium]);

  const progressLabel =
    phase === "active" && quiz.length ? `${index + 1} / ${quiz.length}` : "";

  const drillLabel = photoQuiz ? "Poznávání z fotky" : DRILLS.find((d) => d.id === drill)?.label ?? "";

  function start() {
    const next = photoQuiz
      ? buildImageOnlyPhotoRound({ isPremium, limit: 10 })
      : buildExamRound({ drill, isPremium, limit: 10 });
    if (next.length === 0) {
      Alert.alert(
        photoQuiz ? "Poznávání z fotky" : "Příprava na zkoušku",
        photoQuiz
          ? "V atlasu není dost druhů s fotkou pro toto kolo. Zkus zapnout Premium (více druhů) nebo počkej na doplnění obrázků."
          : "Pro tento režim teď nemáme dost otázek. Zkus jiný typ nebo zapni Premium pro více druhů v atlasu."
      );
      return;
    }
    setQuiz(next);
    setAnswers([]);
    setIndex(0);
    setPhase("active");
    setResult(null);
  }

  function pick(optionIdx: number) {
    if (phase !== "active" || !current) return;
    hapticLight();
    const nextAnswers = [...answers];
    nextAnswers[index] = optionIdx;
    setAnswers(nextAnswers);

    if (index + 1 >= quiz.length) {
      const ev = evaluateExam(quiz, nextAnswers);
      setResult(ev);
      applyQuizResult(ev.score, ev.maxScore);
      hapticSuccess();
      setPhase("done");
      const uid = session?.user?.id;
      if (uid && isSupabaseConfigured) {
        void insertQuizRun({
          userId: uid,
          score: ev.score,
          maxScore: ev.maxScore,
          questionCount: quiz.length,
          isPremium
        }).catch((e) => console.warn("[exam] insertQuizRun", e));
      }
      return;
    }

    setIndex(index + 1);
  }

  function reset() {
    setPhase("idle");
    setQuiz([]);
    setIndex(0);
    setAnswers([]);
    setResult(null);
  }

  const imgSource = current?.imageFile ? getFishImageSource(current.imageFile) : null;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.wrap, { paddingBottom: scrollPadBottom }]}
      keyboardShouldPersistTaps="handled"
    >
      {phase === "idle" ? (
        <Pressable onPress={onBack} hitSlop={8}>
          <Text style={styles.back}>← Zpět na menu testů</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => {
            reset();
          }}
          hitSlop={8}
        >
          <Text style={styles.back}>← Ukončit kolo (bez uložení výsledku)</Text>
        </Pressable>
      )}

      <Text style={styles.h1}>{photoQuiz ? "Poznávání ryb z fotky" : "Příprava na zkoušku"}</Text>
      <Text style={styles.lead}>
        {photoQuiz
          ? "Uvidíš fotku ryby z atlasu a vybereš správný český název — podobně jako u dětských testů na ostro. V kole je až 10 náhodných druhů, u kterých má aplikace obrázek."
          : "Procvič si to, co bývá u průkazu často: druhy ryb, lovné míry, hájení i latinské názvy. Údaje vycházejí z atlasu v aplikaci — před ostrou zkouškou je vždy potřeba ověřit aktuální návní řád a pokyny spolku."}
      </Text>

      {!photoQuiz ? (
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Co k průkazu patří obecně</Text>
          <Text style={styles.noteBody}>
            Kromě poznání ryb, měr a hájení se obvykle zkouší i základy rybařského řádu a chování u vody — to
            najdeš v obecném kvízu (Pravidla, Praxe). Tady se soustředíme na tabulkové údaje k druhům.
          </Text>
        </View>
      ) : (
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Tip</Text>
          <Text style={styles.noteBody}>
            K mírám, hájení a latinským názvům máš v menu testů „Příprava na zkoušku“. Obecný řád a praxi
            procvič v obecném kvízu.
          </Text>
        </View>
      )}

      {phase === "idle" ? (
        <View style={styles.card}>
          {photoQuiz ? (
            <>
              <Text style={styles.blockLabel}>Kolo</Text>
              <Text style={[styles.modeCount, styles.photoQuizBankHint]}>
                Druhů s fotkou v atlasu: {photoSpeciesCount}
                {photoSpeciesCount < 2
                  ? " — potřebujeme aspoň dva, aby šlo sestavit kvíz."
                  : ` — v jednom kole použijeme až 10.`}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.blockLabel}>Typ procvičování</Text>
              {DRILLS.map((d) => {
                const n = counts[d.id];
                const selected = drill === d.id;
                return (
                  <Pressable
                    key={d.id}
                    style={[styles.modeRow, selected && styles.modeRowSelected]}
                    onPress={() => setDrill(d.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modeTitle}>{d.label}</Text>
                      <Text style={styles.modeHint}>{d.hint}</Text>
                      <Text style={styles.modeCount}>
                        {d.id === "mix"
                          ? `V bance celkem ${n} otázek, v kole jich použijeme až 10`
                          : `${n} otázek v bance`}
                      </Text>
                    </View>
                    <View style={[styles.modeDot, selected && styles.modeDotOn]} />
                  </Pressable>
                );
              })}
            </>
          )}
          <Pressable style={styles.primary} onPress={start}>
            <Text style={styles.primaryText}>Začít kolo (10 otázek)</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === "active" && current ? (
        <View style={styles.card}>
          <Text style={styles.meta}>
            {drillLabel} · {progressLabel}
          </Text>
          <Text style={styles.kindTag}>
            {photoQuiz
              ? "Z fotky"
              : current.kind === "photo"
              ? "Druh"
              : current.kind === "size"
                ? "Míra"
                : current.kind === "season"
                  ? "Hájení"
                  : current.kind === "latin"
                    ? "Latinský název"
                    : "Podobné druhy"}
          </Text>
          <Text style={styles.question}>{current.headline}</Text>
          {imgSource ? (
            <Image source={imgSource} style={styles.fishImg} resizeMode="contain" />
          ) : null}
          {current.markHints?.length ? (
            <View style={styles.hintBox}>
              <Text style={styles.hintLabel}>Znaky z atlasu:</Text>
              {current.markHints.map((m, i) => (
                <Text key={i} style={styles.hintLine}>
                  • {m}
                </Text>
              ))}
            </View>
          ) : null}
          {current.options.map((opt, i) => (
            <Pressable key={i} style={styles.option} onPress={() => pick(i)}>
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {phase === "done" && result ? (
        <View style={styles.card}>
          <Text style={styles.h2}>Hotovo</Text>
          <Text style={styles.score}>
            Skóre: {result.score} / {result.maxScore}
          </Text>
          {quiz.length ? (
            <Text style={styles.coach}>{buildExamCoachLine(quiz, answers)}</Text>
          ) : null}
          <Text style={styles.lead}>
            XP máš přičtené jako u běžného kvízu.
            {session?.user && isSupabaseConfigured ? " Výsledek se uložil k účtu." : ""}
          </Text>
          {quiz.map((q, qi) => {
            const ok = answers[qi] === q.correctIndex;
            return (
              <View key={q.id} style={styles.review}>
                <Text style={styles.questionSmall}>{q.headline}</Text>
                <Text style={ok ? styles.ok : styles.bad}>{ok ? "Správně" : "Špatně"}</Text>
                {!ok ? <Text style={styles.explain}>{q.explain}</Text> : null}
              </View>
            );
          })}
          <Pressable style={styles.secondary} onPress={reset}>
            <Text style={styles.secondaryText}>Znovu</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.bg
  },
  wrap: {
    flexGrow: 1,
    backgroundColor: theme.bg,
    padding: 16,
    paddingBottom: 0
  },
  back: {
    color: theme.accent,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 10
  },
  h1: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "700"
  },
  h2: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },
  lead: {
    color: theme.muted,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20
  },
  coach: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#0f1c1a",
    borderWidth: 1,
    borderColor: "#1f6b5c"
  },
  note: {
    backgroundColor: "#0f1c1a",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f6b5c",
    padding: 12,
    marginBottom: 14
  },
  noteTitle: {
    color: theme.accent,
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 6
  },
  noteBody: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 19
  },
  card: {
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202733",
    padding: 16
  },
  blockLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0f141b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a3341",
    padding: 12,
    marginBottom: 8
  },
  modeRowSelected: {
    borderColor: theme.accent,
    backgroundColor: "rgba(0, 194, 168, 0.08)"
  },
  modeTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800"
  },
  modeHint: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18
  },
  modeCount: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 6
  },
  photoQuizBankHint: {
    marginBottom: 4,
    fontSize: 14,
    lineHeight: 20
  },
  modeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3d4654",
    marginLeft: 10
  },
  modeDotOn: {
    borderColor: theme.accent,
    backgroundColor: theme.accent
  },
  primary: {
    backgroundColor: theme.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8
  },
  primaryText: {
    color: "#042b26",
    fontWeight: "800",
    fontSize: 16
  },
  meta: {
    color: theme.muted,
    marginBottom: 6
  },
  kindTag: {
    alignSelf: "flex-start",
    color: theme.accent,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8
  },
  question: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12
  },
  questionSmall: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6
  },
  fishImg: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    backgroundColor: "#0f141b",
    marginBottom: 12
  },
  hintBox: {
    backgroundColor: "#0f141b",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a3341"
  },
  hintLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6
  },
  hintLine: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 20
  },
  option: {
    backgroundColor: "#0f141b",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a3341",
    padding: 12,
    marginBottom: 8
  },
  optionText: {
    color: theme.text,
    fontSize: 14
  },
  secondary: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#30363d",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  secondaryText: {
    color: theme.text,
    fontWeight: "700"
  },
  score: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },
  review: {
    borderTopWidth: 1,
    borderTopColor: "#202733",
    paddingTop: 10,
    marginTop: 10
  },
  ok: { color: theme.accent, fontWeight: "700" },
  bad: { color: theme.danger, fontWeight: "700" },
  explain: { color: theme.muted, marginTop: 6, fontSize: 13, lineHeight: 18 }
});
