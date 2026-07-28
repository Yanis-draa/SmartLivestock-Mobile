import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function SignupScreen({ navigation }) {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSignup() {
    const { nom, prenom, email, telephone, password } = form;
    if (!nom || !prenom || !email || !password) {
      Alert.alert("Champs manquants", "Merci de remplir tous les champs obligatoires.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Mot de passe trop court", "6 caractères minimum.");
      return;
    }
    try {
      setLoading(true);
      await signup({ nom, prenom, email: email.trim(), telephone, password });
    } catch (e) {
      const map = {
        "auth/email-already-in-use": "Cet email est déjà utilisé.",
        "auth/invalid-email": "Adresse email invalide.",
        "auth/weak-password": "Mot de passe trop faible.",
      };
      Alert.alert("Inscription impossible", map[e.code] || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
        <Ionicons name="chevron-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={styles.title}>Créer un compte</Text>
      <Text style={styles.subtitle}>Renseigne tes informations pour commencer</Text>

      <Field icon="person-outline" placeholder="Nom" value={form.nom} onChangeText={(v) => set("nom", v)} />
      <Field icon="person-outline" placeholder="Prénom" value={form.prenom} onChangeText={(v) => set("prenom", v)} />
      <Field
        icon="mail-outline"
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={form.email}
        onChangeText={(v) => set("email", v)}
      />
      <Field
        icon="call-outline"
        placeholder="Téléphone"
        keyboardType="phone-pad"
        value={form.telephone}
        onChangeText={(v) => set("telephone", v)}
      />
      <Field
        icon="lock-closed-outline"
        placeholder="Mot de passe (6 caractères min.)"
        secureTextEntry
        value={form.password}
        onChangeText={(v) => set("password", v)}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Création..." : "Créer mon compte"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field(props) {
  return (
    <View style={styles.field}>
      <Ionicons name={props.icon} size={18} color={colors.textSecondary} />
      <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  input: { flex: 1, fontSize: 14, color: colors.text },
  button: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
