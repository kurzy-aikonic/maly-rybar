import { Ionicons } from "@expo/vector-icons";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

/** Expo Go + RN 0.8x: nativní RNScreen umí spadnout na „String cannot be cast to Boolean“. */
enableScreens(false);

import { AppProvider, useApp } from "./src/context/AppContext";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AtlasScreen } from "./src/screens/AtlasScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { QuizScreen } from "./src/screens/QuizScreen";
import { theme } from "./src/constants/theme";
import { WaterScreen } from "./src/screens/WaterScreen";

const Tab = createBottomTabNavigator();

/** Jednotné pozadí scén (jinak Android pod krátkým obsahem často ukáže bílou plochu). */
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.accent,
    background: theme.bg,
    card: theme.bg,
    text: theme.text,
    border: theme.border,
    notification: theme.accent
  }
};

type ErrorBoundaryState = { error: Error | null };

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={errorStyles.wrap}>
          <Text style={errorStyles.title}>Chyba při startu</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.mono}>{this.state.error.message}</Text>
            <Text style={errorStyles.hint}>
              Zkontroluj terminál Metro a aktualizuj Expo Go na nejnovější verzi (SDK 54).
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.bg, padding: 16, paddingTop: 48 },
  title: { color: theme.danger, fontSize: 18, fontWeight: "800", marginBottom: 12 },
  scroll: { flex: 1 },
  mono: { color: theme.text, fontFamily: "monospace", fontSize: 12 },
  hint: { color: theme.muted, marginTop: 16, fontSize: 14 }
});

function MainTabs() {
  return (
    <>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: "700", fontSize: 17 },
          tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.border },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" }
        }}
      >
        <Tab.Screen
          name="Domu"
          component={HomeScreen}
          options={{
            title: "Domů",
            tabBarLabel: "Domů",
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Atlas"
          component={AtlasScreen}
          options={{
            title: "Atlas",
            tabBarIcon: ({ color, size }) => <Ionicons name="fish" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Testy"
          component={QuizScreen}
          options={{
            title: "Testy",
            tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="U vody"
          component={WaterScreen}
          options={{
            title: "U vody",
            tabBarIcon: ({ color, size }) => <Ionicons name="water-outline" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Profil"
          component={ProfileScreen}
          options={{
            title: "Profil",
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
          }}
        />
      </Tab.Navigator>
    </>
  );
}

function AppGate() {
  const { hydrated, onboardingComplete } = useApp();
  const { authReady } = useAuth();

  if (!hydrated || !authReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={navigationTheme}>
        <MainTabs />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProvider>
            <AppGate />
          </AppProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}
