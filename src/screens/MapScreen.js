import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import MapView, { Marker, Polygon } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, animalStateColors } from "../theme/colors";
import { subscribeToAnimals } from "../services/animalsService";
import { subscribeToZones, createZone } from "../services/zonesService";
import { subscribeToLocations } from "../services/alertsService";

export default function MapScreen() {
  const mapRef = useRef(null);
  const [animals, setAnimals] = useState([]);
  const [zones, setZones] = useState([]);
  const [locations, setLocations] = useState([]);
  const [region, setRegion] = useState(null);

  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    })();
    const unsubAnimals = subscribeToAnimals(setAnimals);
    const unsubZones = subscribeToZones(setZones);
    const unsubLocations = subscribeToLocations(setLocations);
    return () => {
      unsubAnimals();
      unsubZones();
      unsubLocations();
    };
  }, []);

  function handleMapPress(e) {
  if (!drawing) return;
  const { latitude, longitude } = e.nativeEvent.coordinate;
  const coordinate = { latitude, longitude };
  setPoints((prev) => [...prev, coordinate]);
}

  function startDrawing() {
    setPoints([]);
    setDrawing(true);
  }

  function cancelDrawing() {
    setDrawing(false);
    setPoints([]);
  }

  function validateDrawing() {
    if (points.length < 3) {
      Alert.alert("Zone incomplète", "Ajoute au moins 3 points pour former une zone.");
      return;
    }
    setShowSaveModal(true);
  }

  async function saveZone() {
    if (!zoneName) {
      Alert.alert("Nom requis", "Donne un nom à la zone.");
      return;
    }
    try {
      await createZone({
        nom: zoneName,
        description: zoneDescription,
        couleur: colors.secondary,
        points: points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
      });
      setShowSaveModal(false);
      setDrawing(false);
      setPoints([]);
      setZoneName("");
      setZoneDescription("");
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer la zone.");
    }
  }

  return (
    <View style={styles.container}>
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          onPress={handleMapPress}
        >
          {/* Zones existantes */}
          {zones.map((zone) => (
            <Polygon
              key={zone.id}
              coordinates={zone.points}
              fillColor={zone.couleur + "33"}
              strokeColor={zone.couleur}
              strokeWidth={2}
            />
          ))}

          {/* Zone en cours de dessin */}
          {points.length > 0 && (
            <Polygon
              coordinates={points}
              fillColor={colors.accent + "33"}
              strokeColor={colors.accent}
              strokeWidth={2}
            />
          )}
          {points.map((p, i) => (
            <Marker key={i} coordinate={p} pinColor={colors.accent} />
          ))}

          {/* Positions des animaux */}
          {locations.map((loc) => {
            const animal = animals.find((a) => a.collierId === loc.collierId);
            const etat = animal?.etat || "in";
            const meta = animalStateColors[etat];
            return (
              <Marker
                key={loc.id}
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                title={animal?.nom || loc.collierId}
                description={meta.label}
                pinColor={meta.color}
              />
            );
          })}
        </MapView>
      )}

      {/* Barre du haut */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Carte</Text>
      </View>

      {/* Bouton créer une zone / valider / annuler */}
      <View style={styles.actionsBar}>
        {!drawing ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={startDrawing}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>Créer une zone</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={cancelDrawing}>
              <Text style={styles.secondaryBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={validateDrawing}>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Valider ({points.length} pts)</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal de sauvegarde de la zone */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nouvelle zone</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de la zone (ex : Prairie Nord)"
              value={zoneName}
              onChangeText={setZoneName}
            />
            <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="Description (optionnel)"
              value={zoneDescription}
              onChangeText={setZoneDescription}
              multiline
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.secondaryBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={saveZone}>
                <Text style={styles.primaryBtnText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: "absolute",
    top: 50,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  topBarTitle: { fontWeight: "700", fontSize: 15, color: colors.text },
  actionsBar: { position: "absolute", bottom: 24, left: 16, right: 16 },
  primaryBtn: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontWeight: "700", fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 10,
  },
});
