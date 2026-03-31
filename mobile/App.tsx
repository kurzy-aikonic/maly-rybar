import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppProvider, useApp } from "./src/context/AppContext";
import { AtlasScreen } from "./src/screens/AtlasScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { QuizScreen } from "./src/screens/QuizScreen";
import { WaterScreen } from "./src/screens/WaterScreen";

const Tab = createBottomTabNavigator();

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
          <Text style={errorStyles.title}>Chyba pri startu</Text>
          <ScrollView style={errorStyles.scroll}>
            <Text style={errorStyles.mono}>{this.state.error.message}</Text>
            <Text style={errorStyles.hint}>
              Zkontroluj terminal Metro a aktualizuj Expo Go na nejnovejsi verzi (SDK 54).
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0d1117", padding: 16, paddingTop: 48 },
  title: { color: "#ff7b72", fontSize: 18, fontWeight: "800", marginBottom: 12 },
  scroll: { flex: 1 },
  mono: { color: "#e6edf3", fontFamily: "monospace", fontSize: 12 },
  hint: { color: "#9da7b3", marginTop: 16, fontSize: 14 }
});

function MainTabs() {
  return (
    <>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0d1117" },
          headerTintColor: "#e6edf3",
          tabBarStyle: { backgroundColor: "#0d1117", borderTopColor: "#202733" },
          tabBarActiveTintColor: "#00c2a8",
          tabBarInactiveTintColor: "#9da7b3"
        }}
      >
        <Tab.Screen
          name="Domu"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Atlas"
          component={AtlasScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="fish" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Testy"
          component={QuizScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="U vody"
          component={WaterScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="water-outline" size={size} color={color} />
          }}
        />
        <Tab.Screen
          name="Profil"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
          }}
        />
      </Tab.Navigator>
    </>
  );
}

function AppGate() {
  const { hydrated, onboardingComplete } = useApp();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d1117", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#00c2a8" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <AppProvider>
        <AppGate />
      </AppProvider>
    </RootErrorBoundary>
  );
}
