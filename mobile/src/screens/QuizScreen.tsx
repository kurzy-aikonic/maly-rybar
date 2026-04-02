import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { theme } from "../constants/theme";
import { useApp } from "../context/AppContext";
import { useScrollBottomInset } from "../hooks/useScrollBottomInset";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import { hapticLight, hapticSuccess } from "../lib/haptics";
import { quizService, type QuizCategory, type QuizQuestion } from "../lib/quiz";
import { buildClassicQuizCoachLine } from "../lib/quizCoach";
import { insertQuizRun } from "../services/quizRemote";
import { ExamPrepScreen } from "./ExamPrepScreen";

type QuizMode = "mix" | QuizCategory;

const QUIZ_MODE_OPTIONS: {
  id: QuizMode;
  label: string;
  hint: string;
}[] = [
  { id: "mix", label: "Náhodný mix", hint: "Všechna témata dohromady" },
  { id: "rules", label: "Pravidla", hint: "Řád, povolenka, etika u vody" },
  { id: "fish", label: "Ryby", hint: "Znaky druhů, rozpoznávání" },
  { id: "biology", label: "Příroda", hint: "Voda, ryby, ekologie" },
  { id: "practice", label: "Praxe", hint: "Úvazy, výbava, bezpečnost u vody" }
];

type TestyView = "hub" | "classic" | "exam" | "photoQuiz";

const HUB_ENTRIES: {
  view: Exclude<TestyView, "hub">;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    view: "photoQuiz",
    title: "Poznávání z fotky",
    sub: "Jen obrázek ryby a čtyři názvy — jako u testů na ostro",
    icon: "images-outline",
    iconColor: theme.accent,
    iconBg: "rgba(0, 194, 168, 0.2)"
  },
  {
    view: "classic",
    title: "Obecný kvíz",
    sub: "Pravidla, ryby, příroda, praxe — výběr tématu, 10 otázek",
    icon: "bulb-outline",
    iconColor: "#79c0ff",
    iconBg: "rgba(121, 192, 255, 0.15)"
  },
  {
    view: "exam",
    title: "Příprava na zkoušku",
    sub: "Foto nebo znaky, míra, hájení, latina, podobné druhy, mix",
    icon: "ribbon-outline",
    iconColor: theme.lock,
    iconBg: "rgba(240, 180, 41, 0.18)"
  }
];

export function QuizScreen() {
  const hubPadBottom = useScrollBottomInset(32);
  const { takePendingTestyView } = useApp();
  const [view, setView] = useState<TestyView>("hub");

  useFocusEffect(
    useCallback(() => {
      const pending = takePendingTestyView();
      if (pending === "exam") setView("exam");
      else if (pending === "classic") setView("classic");
      else if (pending === "photo") setView("photoQuiz");
    }, [takePendingTestyView])
  );

  if (view === "exam") {
    return <ExamPrepScreen onBack={() => setView("hub")} />;
  }

  if (view === "photoQuiz") {
    return <ExamPrepScreen variant="photoImageQuiz" onBack={() => setView("hub")} />;
  }

  if (view === "classic") {
    return <ClassicQuizFlow onBack={() => setView("hub")} />;
  }

  return (
    <ScrollView
      style={hubStyles.scroll}
      contentContainerStyle={[hubStyles.wrap, { paddingBottom: hubPadBottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={hubStyles.kicker}>Záložka Testy</Text>
      <Text style={hubStyles.h1}>Co si dnes procvičíš?</Text>
      <Text style={hubStyles.lead}>
        Fotky ryb, obecný kvíz nebo příprava na průkaz — stejné téma máš i v horní liště jako „Testy“.
      </Text>

      {HUB_ENTRIES.map((item) => (
        <Pressable
          key={item.view}
          style={({ pressed }) => [hubStyles.bigCard, pressed && hubStyles.bigCardPressed]}
          onPress={() => setView(item.view)}
        >
          <View style={hubStyles.bigCardRow}>
            <View style={[hubStyles.bigCardIconCircle, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={26} color={item.iconColor} />
            </View>
            <View style={hubStyles.bigCardTextCol}>
              <Text style={hubStyles.bigCardTitle}>{item.title}</Text>
              <Text style={hubStyles.bigCardSub}>{item.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={theme.muted} style={hubStyles.bigCardChevron} />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ClassicQuizFlow({ onBack }: { onBack: () => void }) {
  const scrollPadBottom = useScrollBottomInset(32);
  const { isPremium, applyQuizResult } = useApp();
  const { session } = useAuth();
  const [quizMode, setQuizMode] = useState<QuizMode>("mix");
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "active" | "done">("idle");
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const current = quiz[index];

  const questionCounts = useMemo(() => {
    const bank = quizService.getQuestionBank(isPremium);
    const counts: Record<QuizMode, number> = {
      mix: bank.length,
      rules: bank.filter((q) => q.category === "rules").length,
      fish: bank.filter((q) => q.category === "fish").length,
      biology: bank.filter((q) => q.category === "biology").length,
      practice: bank.filter((q) => q.category === "practice").length
    };
    return counts;
  }, [isPremium]);

  const progressLabel = useMemo(() => {
    if (phase !== "active" || !quiz.length) return "";
    return `${index + 1} / ${quiz.length}`;
  }, [phase, quiz.length, index]);

  const activeModeLabel = useMemo(() => {
    const opt = QUIZ_MODE_OPTIONS.find((o) => o.id === quizMode);
    return opt?.label ?? "";
  }, [quizMode]);

  function start() {
    const next = quizService.buildQuiz({
      isPremium,
      limit: 10,
      category: quizMode === "mix" ? undefined : quizMode
    });
    if (next.length === 0) {
      Alert.alert(
        "Kvíz",
        "V tomto tématu teď nemáš žádné otázky. Zkus jiné téma, nebo Premium."
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
      const evalResult = quizService.evaluateQuiz(quiz, nextAnswers);
      setResult({ score: evalResult.score, maxScore: evalResult.maxScore });
      applyQuizResult(evalResult.score, evalResult.maxScore);
      hapticSuccess();
      setPhase("done");
      const uid = session?.user?.id;
      if (uid && isSupabaseConfigured) {
        void insertQuizRun({
          userId: uid,
          score: evalResult.score,
          maxScore: evalResult.maxScore,
          questionCount: quiz.length,
          isPremium
        }).catch((e) => console.warn("[quiz] insertQuizRun", e));
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
        <Pressable onPress={reset} hitSlop={8}>
          <Text style={styles.back}>← Ukončit kvíz (bez uložení výsledku)</Text>
        </Pressable>
      )}

      <Text style={styles.h1}>Obecný kvíz</Text>
      <Text style={styles.lead}>
        Deset otázek podle zvoleného tématu. Ve Free jsou některé otázky zamčené v Premium.
      </Text>

      {phase === "idle" ? (
        <View style={styles.card}>
          <Text style={styles.blockLabel}>Téma kvízu</Text>
          {QUIZ_MODE_OPTIONS.map((opt) => {
            const n = questionCounts[opt.id];
            const selected = quizMode === opt.id;
            return (
              <Pressable
                key={opt.id}
                style={[styles.modeRow, selected && styles.modeRowSelected]}
                onPress={() => setQuizMode(opt.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>{opt.label}</Text>
                  <Text style={styles.modeHint}>{opt.hint}</Text>
                  <Text style={styles.modeCount}>
                    {opt.id === "mix"
                      ? `${n} otázek v bance`
                      : `${n} otázek k dispozici`}
                  </Text>
                </View>
                <View style={[styles.modeDot, selected && styles.modeDotOn]} />
              </Pressable>
            );
          })}
          <Pressable style={styles.primary} onPress={start}>
            <Text style={styles.primaryText}>Začít kvíz</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === "active" && current ? (
        <View style={styles.card}>
          <Text style={styles.meta}>
            {activeModeLabel} · {progressLabel}
          </Text>
          <Text style={styles.question}>{current.question}</Text>
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
            <Text style={styles.coach}>{buildClassicQuizCoachLine(quiz, answers)}</Text>
          ) : null}
          <Text style={styles.lead}>
            XP už máš přičtené na domovské obrazovce.
            {session?.user && isSupabaseConfigured ? " Výsledek je uložen k účtu." : ""}
          </Text>
          {isPremium && quiz.length > 0
            ? quiz.map((q, qi) => {
                const ok = answers[qi] === q.correct_index;
                return (
                  <View key={q.id} style={styles.review}>
                    <Text style={styles.questionSmall}>{q.question}</Text>
                    <Text style={ok ? styles.ok : styles.bad}>
                      {ok ? "Správně" : "Špatně"}
                    </Text>
                    {!ok ? (
                      <Text style={styles.explain}>{q.explanation}</Text>
                    ) : null}
                  </View>
                );
              })
            : !isPremium ? (
                <Text style={styles.muted}>
                  Ve Free verzi neukazujeme detailní rozbor. Premium přidá vysvětlení chyb.
                </Text>
              ) : null}
          <Pressable style={styles.secondary} onPress={reset}>
            <Text style={styles.secondaryText}>Znovu</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const hubStyles = StyleSheet.create({
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
  kicker: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4
  },
  h1: {
    color: theme.text,
    fontSize: 22,
    fontWeight: "700"
  },
  lead: {
    color: theme.muted,
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20
  },
  bigCard: {
    backgroundColor: "#161b22",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#202733",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12
  },
  bigCardPressed: {
    opacity: 0.92,
    borderColor: "rgba(0, 194, 168, 0.35)"
  },
  bigCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  bigCardIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center"
  },
  bigCardTextCol: {
    flex: 1,
    minWidth: 0
  },
  bigCardChevron: { opacity: 0.85 },
  bigCardTitle: { color: theme.text, fontSize: 17, fontWeight: "800" },
  bigCardSub: { color: theme.muted, marginTop: 5, fontSize: 13, lineHeight: 19 }
});

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
    fontSize: 14
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
  card: {
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202733",
    padding: 16
  },
  meta: {
    color: theme.muted,
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
  explain: { color: theme.muted, marginTop: 6 },
  muted: { color: theme.muted, marginTop: 8 }
});
