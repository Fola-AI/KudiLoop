import { View, Text } from "react-native";
import { colors } from "@/theme";

interface DividerProps {
  label?: string;
  spacing?: number;
}

export function Divider({ label, spacing = 16 }: DividerProps) {
  if (label) {
    return (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginVertical: spacing,
          gap: 12,
        }}
      >
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{label}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
    );
  }

  return (
    <View
      style={{
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing,
      }}
    />
  );
}






