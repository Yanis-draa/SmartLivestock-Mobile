import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  function handleLogout() {
    Alert.alert("Déconnexion", "Veux-tu vraiment te déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: logout },
    ]);
  }

  const items = [
    { icon: "hardware-chip-outline", label: "Paramètres du collier", onPress: () => navigation.navigate("CollarSettings") },
    { icon: "globe-outline", label: "Langue", value: "Français" },
    { icon: "moon-outline", label: "Mode sombre", toggle: true },
    { icon: "notifications-outline", label: "Notifications", toggle: true, on: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 60 }}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
        <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
      </View>

      <Text style={styles.sectionTitle}>Paramètres</Text>
      <View style={styles.settingsCard}>
        {items.map((it, i) => (
          <View key={it.label}>
            <TouchableOpacity style={styles.row} onPress={it.onPress}>
              <Ionicons name={it.icon} size={19} color={colors.textSecondary} />
              <Text style={styles.rowLabel}>{it.label}</Text>
              {it.toggle ? (
                <View style={[styles.toggle, { backgroundColor: it.on ? colors.primary : colors.border }]}>
                  <View style={[styles.toggleDot, { alignSelf: it.on ? "flex-end" : "flex-start" }]} />
                </View>
              ) : it.value ? (
                <Text style={styles.rowValue}>{it.value}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            {i < items.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={17} color={colors.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 16 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 16 },
  avatar: { width: 58, height: 58, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 10 },
  settingsCard: { backgroundColor: colors.card, borderRadius: 20, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.text },
  rowValue: { fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 44 },
  toggle: { width: 42, height: 24, borderRadius: 999, padding: 3, justifyContent: "center" },
  toggleDot: { width: 18, height: 18, borderRadius: 999, backgroundColor: "#fff" },
  logoutBtn: {
    flexDirection: "row",
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  logoutText: { color: colors.danger, fontWeight: "700", fontSize: 14 },
});
