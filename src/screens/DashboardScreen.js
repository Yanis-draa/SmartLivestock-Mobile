import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";
import { subscribeToAnimals } from "../services/animalsService";
import { subscribeToZones } from "../services/zonesService";
import { subscribeToAlerts } from "../services/alertsService";
import StatCard from "../components/StatCard";
import AnimalCard from "../components/AnimalCard";

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const unsubAnimals = subscribeToAnimals(setAnimals);
    const unsubZones = subscribeToZones(setZones);
    const unsubAlerts = subscribeToAlerts(setAlerts);
    return () => {
      unsubAnimals();
      unsubZones();
      unsubAlerts();
    };
  }, []);

  const batterieMoyenne = animals.length
    ? Math.round(animals.reduce((sum, a) => sum + (a.batterie || 0), 0) / animals.length)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <Text style={styles.welcome}>Bienvenue {user?.displayName?.split(" ")[0] || ""}</Text>

      <View style={styles.statsGrid}>
        <StatCard icon="paw" label="Animaux" value={animals.length} color={colors.primary} />
        <StatCard icon="map-outline" label="Zones" value={zones.length} color={colors.info} />
        <StatCard icon="notifications-outline" label="Alertes" value={alerts.length} color={colors.danger} />
        <StatCard icon="battery-half-outline" label="Batterie moy." value={`${batterieMoyenne}%`} color="#FBC02D" />
      </View>

      <Text style={styles.sectionTitle}>Animaux récents</Text>
      {animals.slice(0, 4).map((a) => (
        <AnimalCard
          key={a.id}
          animal={a}
          onPress={() => navigation.navigate("AnimalDetail", { animal: a })}
        />
      ))}
      {animals.length === 0 && (
        <Text style={styles.empty}>Aucun animal ajouté pour le moment.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  welcome: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginVertical: 10 },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginTop: 20 },
});
