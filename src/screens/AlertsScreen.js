import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { subscribeToAlerts, markAlertAsRead } from "../services/alertsService";

const ALERT_META = {
  out: { icon: "warning-outline", color: colors.danger },
  in: { icon: "checkmark-circle-outline", color: colors.success },
  battery: { icon: "battery-dead-outline", color: colors.batteryLow },
  lost: { icon: "radio-outline", color: "#616161" },
  sim: { icon: "sim-outline", color: "#616161" },
  connexion: { icon: "wifi-outline", color: colors.danger },
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => subscribeToAlerts(setAlerts), []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alertes</Text>
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const meta = ALERT_META[item.type] || ALERT_META.out;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => markAlertAsRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: meta.color + "1A" }]}>
                <Ionicons name={meta.icon} size={19} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowBetween}>
                  <Text style={styles.animal}>{item.animalNom}</Text>
                  <Text style={styles.time}>{item.heure}</Text>
                </View>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
              {!item.lu && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Aucune alerte pour le moment.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 14 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  animal: { fontSize: 14, fontWeight: "700", color: colors.text },
  time: { fontSize: 12, color: colors.textSecondary },
  desc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  empty: { textAlign: "center", color: colors.textSecondary, marginTop: 30 },
});
