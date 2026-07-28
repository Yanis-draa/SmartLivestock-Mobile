import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { colors } from "../theme/colors";

export default function CollarSettingsScreen({ navigation }) {
  const [intensite, setIntensite] = useState(60);
  const [duree, setDuree] = useState(3);
  const [frequenceGps, setFrequenceGps] = useState(10);
  const [modeEconomie, setModeEconomie] = useState(false);
  const [saving, setSaving] = useState(false);

  const settingsDoc = doc(db, "settings", auth.currentUser.uid);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(settingsDoc);
      if (snap.exists()) {
        const d = snap.data();
        setIntensite(d.intensiteVibration ?? 60);
        setDuree(d.dureeVibration ?? 3);
        setFrequenceGps(d.frequenceGps ?? 10);
        setModeEconomie(d.modeEconomie ?? false);
      }
    })();
  }, []);

  async function save() {
    try {
      setSaving(true);
      // Ces paramètres sont lus par le collier au prochain cycle de synchronisation
      await setDoc(settingsDoc, {
        ownerId: auth.currentUser.uid,
        intensiteVibration: Math.round(intensite),
        dureeVibration: Math.round(duree),
        frequenceGps: Math.round(frequenceGps),
        modeEconomie,
        updatedAt: new Date().toISOString(),
      });
      Alert.alert("Enregistré", "Les paramètres seront appliqués au prochain cycle de synchronisation du collier.");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer les paramètres.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Paramètres du collier</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Intensité de la vibration : {Math.round(intensite)}%</Text>
        <Slider
          minimumValue={0}
          maximumValue={100}
          value={intensite}
          onValueChange={setIntensite}
          minimumTrackTintColor={colors.primary}
          thumbTintColor={colors.primary}
        />

        <Text style={styles.label}>Durée de la vibration : {Math.round(duree)} s</Text>
        <Slider
          minimumValue={1}
          maximumValue={10}
          value={duree}
          onValueChange={setDuree}
          minimumTrackTintColor={colors.primary}
          thumbTintColor={colors.primary}
        />

        <Text style={styles.label}>Fréquence GPS : toutes les {Math.round(frequenceGps)} s</Text>
        <Slider
          minimumValue={5}
          maximumValue={60}
          value={frequenceGps}
          onValueChange={setFrequenceGps}
          minimumTrackTintColor={colors.primary}
          thumbTintColor={colors.primary}
        />

        <TouchableOpacity
          style={styles.row}
          onPress={() => setModeEconomie((v) => !v)}
        >
          <Text style={styles.rowLabel}>Mode économie d'énergie</Text>
          <View style={[styles.toggle, { backgroundColor: modeEconomie ? colors.primary : colors.border }]}>
            <View style={[styles.toggleDot, { alignSelf: modeEconomie ? "flex-end" : "flex-start" }]} />
          </View>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Enregistrement..." : "Enregistrer les paramètres"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 18 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 18 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginTop: 14, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 20 },
  rowLabel: { fontSize: 14, color: colors.text },
  toggle: { width: 42, height: 24, borderRadius: 999, padding: 3, justifyContent: "center" },
  toggleDot: { width: 18, height: 18, borderRadius: 999, backgroundColor: "#fff" },
  button: { height: 52, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 20, marginBottom: 30 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
