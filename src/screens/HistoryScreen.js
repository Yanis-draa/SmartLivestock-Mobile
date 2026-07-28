import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import MapView, { Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { colors } from "../theme/colors";

const PERIODES = ["Aujourd'hui", "Hier", "Cette semaine", "Ce mois"];

export default function HistoryScreen({ route, navigation }) {
  const { animal } = route.params;
  const [periode, setPeriode] = useState("Aujourd'hui");
  const [points, setPoints] = useState([]);
  const [stats, setStats] = useState({ distance: 0, deplacement: "0 min", arret: "0 min" });

  useEffect(() => {
    loadHistory(periode);
  }, [periode]);

  async function loadHistory(p) {
    const { start, end } = getRangeForPeriode(p);
    const q = query(
      collection(db, "history"),
      where("animalId", "==", animal.id),
      where("timestamp", ">=", Timestamp.fromDate(start)),
      where("timestamp", "<=", Timestamp.fromDate(end)),
      orderBy("timestamp", "asc")
    );
    const snap = await getDocs(q);
    const pts = snap.docs.map((d) => d.data());
    setPoints(pts);
    setStats(computeStats(pts));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Historique · {animal.nom}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.periodScroll}
        contentContainerStyle={styles.periodRow}
>
        {PERIODES.map((p) => (
          <TouchableOpacity
            key={p}
            onPress={() => setPeriode(p)}
            style={[styles.periodChip, { backgroundColor: periode === p ? colors.primary : "#fff" }]}
          >
            <Text style={{ color: periode === p ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>{p}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.mapWrap}>
        {points.length > 1 ? (
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: points[0].latitude,
              longitude: points[0].longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Polyline
              coordinates={points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeColor={colors.info}
              strokeWidth={3}
            />
          </MapView>
        ) : (
          <View style={styles.emptyMap}>
            <Text style={{ color: colors.textSecondary }}>Aucune position enregistrée sur cette période.</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <Stat label="Distance" value={`${stats.distance.toFixed(1)} km`} />
        <Stat label="Déplacement" value={stats.deplacement} />
        <Stat label="Arrêt" value={stats.arret} />
      </View>
    </View>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getRangeForPeriode(p) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (p === "Aujourd'hui") {
    start.setHours(0, 0, 0, 0);
  } else if (p === "Hier") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (p === "Cette semaine") {
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
  } else if (p === "Ce mois") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end };
}

// Calcule distance totale (formule de Haversine) + estimation temps de déplacement/arrêt
function computeStats(points) {
  let distance = 0;
  let deplacementSec = 0;
  let arretSec = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const d = haversine(a.latitude, a.longitude, b.latitude, b.longitude);
    distance += d;

    const dtSec = (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
    if (d > 0.005) deplacementSec += dtSec; // seuil de 5 m pour considérer un déplacement
    else arretSec += dtSec;
  }

  return {
    distance,
    deplacement: formatDuration(deplacementSec),
    arret: formatDuration(arretSec),
  };
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 55 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "700", color: colors.text },
  periodScroll: { flexGrow: 0, maxHeight: 50 },
  periodRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 10, alignItems: "center" },
  periodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  mapWrap: { height: 260, marginHorizontal: 16, borderRadius: 20, overflow: "hidden" },
  emptyMap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  statsRow: { flexDirection: "row", gap: 10, padding: 16 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 14, alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
