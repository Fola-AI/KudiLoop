import type { ReactNode } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: ReactNode;
}

export function ScreenHeader({ title, showBack = true, rightElement }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.leftSection}>
        {showBack && (
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightSection}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  leftSection: {
    width: 44,
    alignItems: "flex-start",
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  rightSection: {
    width: 44,
    alignItems: "flex-end",
  },
});
