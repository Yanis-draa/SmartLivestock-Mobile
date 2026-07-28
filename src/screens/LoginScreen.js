import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Champs manquants", "Merci de remplir l'email et le mot de passe.");
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
      // La navigation change automatiquement grâce à onAuthStateChanged
    } catch (e) {
      Alert.alert("Connexion impossible", traduireErreur(e.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      Alert.alert("Email requis", "Saisis ton email pour recevoir le lien de réinitialisation.");
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert("Email envoyé", "Vérifie ta boîte de réception.");
    } catch (e) {
      Alert.alert("Erreur", traduireErreur(e.code));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Ionicons name="paw" size={36} color="#fff" />
        </View>
        <Text style={styles.title}>Éleveur+</Text>
        <Text style={styles.subtitle}>Suivi GPS de votre troupeau</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity onPress={handleForgotPassword} style={{ alignSelf: "flex-end" }}>
          <Text style={styles.forgot}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Connexion..." : "Se connecter"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Signup")} style={{ marginTop: 18 }}>
          <Text style={styles.link}>
            Pas encore de compte ? <Text style={styles.linkBold}>Créer un compte</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function traduireErreur(code) {
  const map = {
    "auth/invalid-email": "Adresse email invalide.",
    "auth/user-not-found": "Aucun compte ne correspond à cet email.",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/invalid-credential": "Email ou mot de passe incorrect.",
  };
  return map[code] || "Une erreur est survenue, réessaie.";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.85)", fontSize: 14, marginTop: 4 },
  form: { padding: 24 },
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
  forgot: { fontSize: 13, color: colors.info, marginBottom: 14 },
  button: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", fontSize: 13, color: colors.textSecondary },
  linkBold: { color: colors.primary, fontWeight: "700" },
});
