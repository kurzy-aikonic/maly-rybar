import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import React from "react";

import { AppProvider } from "./src/context/AppContext";
import { AtlasScreen } from "./src/screens/AtlasScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { QuizScreen } from "./src/screens/QuizScreen";
import { WaterScreen } from "./src/screens/WaterScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
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
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="home-outline" size={size} color={color} />
              )
            }}
          />
          <Tab.Screen
            name="Atlas"
            component={AtlasScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="fish-outline" size={size} color={color} />
              )
            }}
          />
          <Tab.Screen
            name="Testy"
            component={QuizScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="school-outline" size={size} color={color} />
              )
            }}
          />
          <Tab.Screen
            name="U vody"
            component={WaterScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="water-outline" size={size} color={color} />
              )
            }}
          />
          <Tab.Screen
            name="Profil"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              )
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
