import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, animalStateColors } from "../theme/colors";

export default function AnimalCard({ animal, onPress }) {
  const meta = animalStateColors[animal.etat] || animalStateColors.in;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconWrap}>
        <Ionicons name="paw" size={22} color={colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{animal.nom}</Text>
        <Text style={styles.subtitle}>
          {meta.dot} {meta.label} {animal.zoneNom ? `· ${animal.zoneNom}` : ""}
        </Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={[
            styles.battery,
            { color: animal.batterie < 30 ? colors.danger : colors.textSecondary },
          ]}
        >
          🔋 {animal.batterie ?? "--"}%
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.secondary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  battery: { fontSize: 12, fontWeight: "600" },
});
