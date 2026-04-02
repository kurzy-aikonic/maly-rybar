import React from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LEGAL_INFO_WEB_URL, LEGAL_OPERATOR_INFO } from "../constants/legalOperator";
import { theme } from "../constants/theme";
import { LEGAL_FOOTER, LEGAL_SECTIONS } from "../legal/appLegalCs";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LegalInfoModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();

  function openWebLegal() {
    if (!LEGAL_INFO_WEB_URL) return;
    void Linking.openURL(LEGAL_INFO_WEB_URL);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}
      onRequestClose={onClose}
    >
      <View style={[styles.shell, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarTitle}>Právní informace</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Zavřít">
            <Text style={styles.close}>Hotovo</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.lead}>
            Shrnutí pro uživatele (GDPR, odpovědnost za výukové údaje, děti, předplatné). Úplné znění
            smluv a zásad může provozovatel zveřejnit na webu.
          </Text>

          <Text style={styles.blockTitle}>Provozovatel</Text>
          <Text style={styles.blockBody}>{LEGAL_OPERATOR_INFO}</Text>

          {LEGAL_SECTIONS.map((s) => (
            <View key={s.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Text style={styles.sectionBody}>{s.body}</Text>
            </View>
          ))}

          {LEGAL_INFO_WEB_URL ? (
            <Pressable style={styles.linkBtn} onPress={openWebLegal}>
              <Text style={styles.linkBtnText}>Úplné znění na webu</Text>
            </Pressable>
          ) : (
            <Text style={styles.hintWeb}>
              Úplné znění zásad na webu: nastav v projektu proměnnou EXPO_PUBLIC_LEGAL_INFO_URL (viz
              .env.example).
            </Text>
          )}

          <Text style={styles.footer}>{LEGAL_FOOTER}</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.bg
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  toolbarTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "800"
  },
  close: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: "700"
  },
  scroll: {
    padding: 16
  },
  lead: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 18
  },
  blockTitle: {
    color: theme.accent,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  blockBody: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace"
  },
  section: {
    marginBottom: 18
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8
  },
  sectionBody: {
    color: theme.muted,
    fontSize: 14,
    lineHeight: 22
  },
  linkBtn: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: theme.accent,
    alignItems: "center"
  },
  linkBtnText: {
    color: theme.accentOnAccent,
    fontWeight: "800",
    fontSize: 15
  },
  hintWeb: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
    fontStyle: "italic"
  },
  footer: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  }
});
