import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { colors, animalStateColors } from "../theme/colors";
import { deleteAnimal } from "../services/animalsService";

export default function AnimalDetailScreen({ route, navigation }) {
  const { animal: initialAnimal } = route.params;
  const [animal, setAnimal] = useState(initialAnimal);

  // Écoute en direct des changements (position, batterie, état) sur ce document
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "animals", initialAnimal.id), (snap) => {
      if (snap.exists()) setAnimal({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, []);

  const meta = animalStateColors[animal.etat] || animalStateColors.in;

  // Envoie une commande de vibration : on écrit une consigne que le collier
  // lira au prochain cycle de synchronisation avec Firebase.
  async function triggerVibration() {
    try {
      await updateDoc(doc(db, "collars", animal.collierId), {
        commande: "vibrate",
        commandeAt: new Date().toISOString(),
      });
      Alert.alert("Commande envoyée", "Le collier vibrera au prochain cycle de synchronisation.");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'envoyer la commande au collier.");
    }
  }

  function confirmDelete() {
    Alert.alert("Supprimer l'animal", `Confirmer la suppression de ${animal.nom} ?`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteAnimal(animal.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 55 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="paw" size={40} color={colors.primary} />
        </View>
        <Text style={styles.name}>{animal.nom}</Text>
        <Text style={styles.subtitle}>{animal.espece} · Collier {animal.collierId}</Text>
        <View style={[styles.pill, { backgroundColor: meta.color + "1A" }]}>
          <Text style={{ color: meta.color, fontWeight: "700", fontSize: 12 }}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>Zone assignée</Text>
          <Text style={styles.gridValue}>{animal.zoneNom || "Non assignée"}</Text>
        </View>
        <View style={styles.gridCard}>
          <Text style={styles.gridLabel}>Batterie</Text>
          <Text style={[styles.gridValue, { color: animal.batterie < 30 ? colors.danger : colors.text }]}>
            {animal.batterie ?? "--"}%
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Position en temps réel</Text>
      <View style={styles.infoCard}>
        <InfoRow icon="location-outline" label="Latitude" value={animal.latitude?.toFixed(5) ?? "--"} />
        <InfoRow icon="location-outline" label="Longitude" value={animal.longitude?.toFixed(5) ?? "--"} />
        <InfoRow icon="speedometer-outline" label="Vitesse" value={`${animal.vitesse ?? 0} km/h`} />
        <InfoRow icon="time-outline" label="Dernière mise à jour" value={animal.derniereMaj || "--"} />
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 30 }}>
        <TouchableOpacity style={styles.accentBtn} onPress={triggerVibration}>
          <Text style={styles.accentBtnText}>Faire vibrer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => navigation.navigate("History", { animal })}
        >
          <Text style={styles.outlineBtnText}>Voir historique</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={colors.info} style={{ width: 24 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  profileCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, alignItems: "center", marginBottom: 16 },
  avatar: { width: 84, height: 84, borderRadius: 24, backgroundColor: colors.secondary + "22", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  grid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  gridCard: { flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 14 },
  gridLabel: { fontSize: 12, color: colors.textSecondary },
  gridValue: { fontSize: 15, fontWeight: "700", color: colors.text },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginBottom: 10 },
  infoCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoLabel: { flex: 1, fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  accentBtn: { flex: 1, height: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  accentBtnText: { color: "#fff", fontWeight: "700" },
  outlineBtn: { flex: 1, height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
  outlineBtnText: { color: colors.primary, fontWeight: "700" },
});
