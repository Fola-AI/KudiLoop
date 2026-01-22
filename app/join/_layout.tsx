import { Stack, router } from "expo-router";
import { Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

export default function JoinLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: "Group Invite",
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerBackTitle: "",
        headerShadowVisible: false,
        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ padding: 8, marginLeft: Platform.OS === "ios" ? -8 : 0 }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
        ),
        contentStyle: { backgroundColor: colors.background },
        animation: "fade",
      }}
    />
  );
}







