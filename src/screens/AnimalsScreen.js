import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";
import { subscribeToAnimals } from "../services/animalsService";
import AnimalCard from "../components/AnimalCard";

export default function AnimalsScreen({ navigation }) {
  const [animals, setAnimals] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Tous");

  useEffect(() => subscribeToAnimals(setAnimals), []);

  // Les filtres sont générés dynamiquement à partir des espèces réellement
  // présentes dans le troupeau de l'éleveur (plus besoin de liste figée).
  const filters = useMemo(() => {
    const especes = Array.from(new Set(animals.map((a) => a.espece).filter(Boolean)));
    return ["Tous", ...especes];
  }, [animals]);

  const filtered = animals.filter((a) => {
    const matchFilter = filter === "Tous" || a.espece === filter;
    const matchSearch = a.nom?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes animaux</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AddAnimal")}>
          <Ionicons name="add-circle" size={30} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un animal..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        data={filters}
        keyExtractor={(f) => f}
        showsHorizontalScrollIndicator={false}
        style={styles.filterList}
        contentContainerStyle={styles.filterListContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setFilter(item)}
            style={[
              styles.filterChip,
              { backgroundColor: filter === item ? colors.primary : "#fff" },
            ]}
          >
            <Text style={{ color: filter === item ? "#fff" : colors.text, fontWeight: "600", fontSize: 13 }}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <AnimalCard animal={item} onPress={() => navigation.navigate("AnimalDetail", { animal: item })} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Aucun animal trouvé.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16, paddingTop: 60 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.text },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  filterList: { flexGrow: 0, maxHeight: 44, marginBottom: 12 },
  filterListContent: { alignItems: "center", gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: { textAlign: "center", color: colors.textSecondary, marginTop: 30 },
});