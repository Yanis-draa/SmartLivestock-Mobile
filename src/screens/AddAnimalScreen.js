import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../theme/colors";
import { addAnimal } from "../services/animalsService";

const ESPECES_BASE = ["Mouton", "Bovin", "Chèvre"];
const SEXES = ["Mâle", "Femelle"];

export default function AddAnimalScreen({ navigation }) {
  const [nom, setNom] = useState("");
  const [collierId, setCollierId] = useState("");
  const [espece, setEspece] = useState("Mouton");
  const [especeCustom, setEspeceCustom] = useState("");
  const [showCustomEspece, setShowCustomEspece] = useState(false);
  const [race, setRace] = useState("");
  const [age, setAge] = useState("");
  const [sexe, setSexe] = useState("Femelle");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

 async function handleSave() {
    const especeFinale = showCustomEspece ? especeCustom.trim() : espece;

    if (!nom || !collierId) {
      Alert.alert("Champs manquants", "Le nom et le numéro de collier sont obligatoires.");
      return;
    }
    if (showCustomEspece && !especeFinale) {
      Alert.alert("Type manquant", "Indique le type d'animal personnalisé.");
      return;
    }
    try {
      setSaving(true);
      // Note : l'upload de la photo vers Firebase Storage se ferait ici
      // avant d'enregistrer photoUrl dans Firestore.
      await addAnimal({
        nom,
        espece: especeFinale,
        race,
        age: age ? parseInt(age, 10) : null,
        sexe,
        collierId,
        notes,
        photoUrl: null,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Erreur", "Impossible d'enregistrer l'animal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Ajouter un animal</Text>

      <TouchableOpacity style={styles.photoPicker} onPress={pickImage}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <>
            <Ionicons name="camera-outline" size={26} color={colors.textSecondary} />
            <Text style={styles.photoText}>Ajouter une photo</Text>
          </>
        )}
      </TouchableOpacity>

      <Field label="Nom *" value={nom} onChangeText={setNom} placeholder="Ex : Mouton 12" />
      <Field label="Numéro du collier *" value={collierId} onChangeText={setCollierId} placeholder="Ex : COL-00125" />

     <Text style={styles.label}>Espèce</Text>
      <View style={styles.rowChips}>
        {ESPECES_BASE.map((e) => (
          <Chip
            key={e}
            label={e}
            selected={!showCustomEspece && espece === e}
            onPress={() => {
              setEspece(e);
              setShowCustomEspece(false);
            }}
          />
        ))}
        <Chip
          label="Autre..."
          selected={showCustomEspece}
          onPress={() => setShowCustomEspece(true)}
        />
      </View>

      {showCustomEspece && (
        <Field
          label="Précise le type d'animal"
          value={especeCustom}
          onChangeText={setEspeceCustom}
          placeholder="Ex : Chameau, Cheval, Dromadaire..."
        />
      )}

      <Text style={styles.label}>Sexe</Text>
      <View style={styles.rowChips}>
        {SEXES.map((s) => (
          <Chip key={s} label={s} selected={sexe === s} onPress={() => setSexe(s)} />
        ))}
      </View>

      <Field label="Race" value={race} onChangeText={setRace} placeholder="Ex : Ouled Djellal" />
      <Field label="Âge (mois)" value={age} onChangeText={setAge} placeholder="Ex : 14" keyboardType="numeric" />
      <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Remarques..." multiline />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? "Enregistrement..." : "Enregistrer l'animal"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} {...props} />
    </View>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? colors.primary : "#fff" }]}
    >
      <Text style={{ color: selected ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 18 },
  photoPicker: {
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  photo: { width: "100%", height: "100%" },
  photoText: { color: colors.textSecondary, marginTop: 6, fontSize: 13 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
    fontSize: 14,
    color: colors.text,
  },
  rowChips: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
