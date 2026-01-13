import { View, ViewProps, Pressable, PressableProps } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme";

interface CardProps extends ViewProps {
  variant?: "default" | "elevated" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
}

interface PressableCardProps extends PressableProps {
  variant?: "default" | "elevated" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
  haptic?: boolean;
  children: React.ReactNode;
}

const paddingValues = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
};

const variantStyles = {
  default: {
    backgroundColor: colors.card,
    borderWidth: 0,
    borderColor: "transparent",
  },
  elevated: {
    backgroundColor: colors.cardElevated,
    borderWidth: 0,
    borderColor: "transparent",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
};

export function Card({
  variant = "default",
  padding = "md",
  style,
  children,
  ...props
}: CardProps) {
  return (
    <View
      style={[
        {
          borderRadius: 16,
          padding: paddingValues[padding],
          ...variantStyles[variant],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function PressableCard({
  variant = "default",
  padding = "md",
  haptic = true,
  onPress,
  style,
  children,
  ...props
}: PressableCardProps) {
  const handlePress = (e: any) => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        {
          borderRadius: 16,
          padding: paddingValues[padding],
          ...variantStyles[variant],
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}




