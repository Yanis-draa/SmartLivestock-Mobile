import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import DashboardScreen from "../screens/DashboardScreen";
import AnimalsScreen from "../screens/AnimalsScreen";
import AddAnimalScreen from "../screens/AddAnimalScreen";
import AnimalDetailScreen from "../screens/AnimalDetailScreen";
import MapScreen from "../screens/MapScreen";
import AlertsScreen from "../screens/AlertsScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CollarSettingsScreen from "../screens/CollarSettingsScreen";

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: "home",
            Animals: "paw",
            Map: "map",
            Alerts: "notifications",
            Profile: "person",
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Accueil" }} />
      <Tabs.Screen name="Animals" component={AnimalsScreen} options={{ title: "Animaux" }} />
      <Tabs.Screen name="Map" component={MapScreen} options={{ title: "Carte" }} />
      <Tabs.Screen name="Alerts" component={AlertsScreen} options={{ title: "Alertes" }} />
      <Tabs.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
    </Tabs.Navigator>
  );
}

function AppNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen name="AddAnimal" component={AddAnimalScreen} />
            <RootStack.Screen name="AnimalDetail" component={AnimalDetailScreen} />
            <RootStack.Screen name="History" component={HistoryScreen} />
            <RootStack.Screen name="CollarSettings" component={CollarSettingsScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
