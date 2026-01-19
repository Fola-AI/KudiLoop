import { View, Text } from "react-native";
import { colors } from "@/theme";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles = {
  default: {
    backgroundColor: colors.card,
    textColor: colors.textMuted,
    dotColor: colors.textMuted,
  },
  success: {
    backgroundColor: colors.success.muted,
    textColor: colors.success.DEFAULT,
    dotColor: colors.success.DEFAULT,
  },
  warning: {
    backgroundColor: colors.warning.muted,
    textColor: colors.warning.DEFAULT,
    dotColor: colors.warning.DEFAULT,
  },
  error: {
    backgroundColor: colors.error.muted,
    textColor: colors.error.DEFAULT,
    dotColor: colors.error.DEFAULT,
  },
  info: {
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    textColor: colors.primary.DEFAULT,
    dotColor: colors.primary.DEFAULT,
  },
};

const sizeStyles = {
  sm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 11,
    dotSize: 6,
  },
  md: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    dotSize: 8,
  },
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
}: BadgeProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: variantStyle.backgroundColor,
        paddingVertical: sizeStyle.paddingVertical,
        paddingHorizontal: sizeStyle.paddingHorizontal,
        borderRadius: 100,
        gap: 6,
        alignSelf: "flex-start",
      }}
    >
      {dot && (
        <View
          style={{
            width: sizeStyle.dotSize,
            height: sizeStyle.dotSize,
            borderRadius: sizeStyle.dotSize / 2,
            backgroundColor: variantStyle.dotColor,
          }}
        />
      )}
      <Text
        style={{
          color: variantStyle.textColor,
          fontSize: sizeStyle.fontSize,
          fontWeight: "600",
        }}
      >
        {children}
      </Text>
    </View>
  );
}

interface NotificationBadgeProps {
  count: number;
  max?: number;
}

export function NotificationBadge({ count, max = 99 }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <View
      style={{
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.error.DEFAULT,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 5,
      }}
    >
      <Text
        style={{
          color: colors.white,
          fontSize: 10,
          fontWeight: "700",
        }}
      >
        {displayCount}
      </Text>
    </View>
  );
}






