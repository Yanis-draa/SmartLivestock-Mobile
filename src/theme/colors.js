export const colors = {
  primary: "#2E7D32",
  primaryDark: "#245F28",
  secondary: "#66BB6A",
  accent: "#FB8C00",
  danger: "#D32F2F",
  success: "#43A047",
  info: "#1E88E5",
  background: "#F8F9FA",
  card: "#FFFFFF",
  border: "#E0E0E0",
  text: "#212121",
  textSecondary: "#757575",
  batteryLow: "#FBC02D",
};

export const animalStateColors = {
  in: { label: "Dans la zone", color: colors.success, dot: "🟢" },
  near: { label: "Proche limite", color: colors.accent, dot: "🟠" },
  out: { label: "Hors zone", color: colors.danger, dot: "🔴" },
  lost: { label: "GPS perdu", color: "#616161", dot: "⚫" },
};
