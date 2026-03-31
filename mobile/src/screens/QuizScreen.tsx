import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useApp } from "../context/AppContext";
import { quizService, type QuizQuestion } from "../lib/quiz";

const colors = {
  bg: "#0d1117",
  text: "#e6edf3",
  muted: "#9da7b3",
  accent: "#00c2a8",
  danger: "#ff7b72"
};

export function QuizScreen() {
  const { isPremium, applyQuizResult } = useApp();
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "active" | "done">("idle");
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);

  const current = quiz[index];

  const progressLabel = useMemo(() => {
    if (phase !== "active" || !quiz.length) return "";
    return `${index + 1} / ${quiz.length}`;
  }, [phase, quiz.length, index]);

  function start() {
    const next = quizService.buildQuiz({ isPremium, limit: 10 });
    setQuiz(next);
    setAnswers([]);
    setIndex(0);
    setPhase("active");
    setResult(null);
  }

  function pick(optionIdx: number) {
    if (phase !== "active" || !current) return;
    const nextAnswers = [...answers];
    nextAnswers[index] = optionIdx;
    setAnswers(nextAnswers);

    if (index + 1 >= quiz.length) {
      const evalResult = quizService.evaluateQuiz(quiz, nextAnswers);
      setResult({ score: evalResult.score, maxScore: evalResult.maxScore });
      applyQuizResult(evalResult.score, evalResult.maxScore);
      setPhase("done");
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
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Testy</Text>
      <Text style={styles.lead}>
        10 nahodnych otazek podle tve verze ucetu.
      </Text>

      {phase === "idle" ? (
        <Pressable style={styles.primary} onPress={start}>
          <Text style={styles.primaryText}>Zacit kviz</Text>
        </Pressable>
      ) : null}

      {phase === "active" && current ? (
        <View style={styles.card}>
          <Text style={styles.meta}>{progressLabel}</Text>
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
            Skore: {result.score} / {result.maxScore}
          </Text>
          <Text style={styles.lead}>XP uz mas prictene na domovske obrazovce.</Text>
          {isPremium && quiz.length > 0
            ? quiz.map((q, qi) => {
                const ok = answers[qi] === q.correct_index;
                return (
                  <View key={q.id} style={styles.review}>
                    <Text style={styles.questionSmall}>{q.question}</Text>
                    <Text style={ok ? styles.ok : styles.bad}>
                      {ok ? "Spravne" : "Spatne"}
                    </Text>
                    {!ok ? (
                      <Text style={styles.explain}>{q.explanation}</Text>
                    ) : null}
                  </View>
                );
              })
            : !isPremium ? (
                <Text style={styles.muted}>
                  Ve Free verzi neukazujeme detailni rozbor. Premium prida vysvetleni chyb.
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

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bg,
    padding: 16,
    paddingBottom: 32
  },
  h1: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700"
  },
  h2: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8
  },
  lead: {
    color: colors.muted,
    marginTop: 6,
    marginBottom: 14,
    fontSize: 14
  },
  card: {
    backgroundColor: "#161b22",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#202733",
    padding: 16
  },
  meta: {
    color: colors.muted,
    marginBottom: 8
  },
  question: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12
  },
  questionSmall: {
    color: colors.text,
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
    color: colors.text,
    fontSize: 14
  },
  primary: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center"
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
    color: colors.text,
    fontWeight: "700"
  },
  score: {
    color: colors.text,
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
  ok: { color: colors.accent, fontWeight: "700" },
  bad: { color: colors.danger, fontWeight: "700" },
  explain: { color: colors.muted, marginTop: 6 },
  muted: { color: colors.muted, marginTop: 8 }
});
