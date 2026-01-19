import { forwardRef } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  PressableProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  haptic?: boolean;
}

const sizeStyles = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
  md: { paddingVertical: 14, paddingHorizontal: 20, fontSize: 16 },
  lg: { paddingVertical: 18, paddingHorizontal: 24, fontSize: 18 },
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = true,
      leftIcon,
      rightIcon,
      haptic = true,
      onPress,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const handlePress = (e: any) => {
      if (haptic && !isDisabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress?.(e);
    };

    const getTextColor = () => {
      if (isDisabled) return colors.textSubtle;
      switch (variant) {
        case "primary":
        case "danger":
          return colors.white;
        case "secondary":
          return colors.text;
        case "outline":
        case "ghost":
          return colors.primary.DEFAULT;
        default:
          return colors.text;
      }
    };

    const renderContent = () => (
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={getTextColor()} />
        ) : (
          <>
            {leftIcon}
            <Text
              style={{
                color: getTextColor(),
                fontSize: sizeStyles[size].fontSize,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {children}
            </Text>
            {rightIcon}
          </>
        )}
      </View>
    );

    const baseStyle = {
      borderRadius: 16,
      overflow: "hidden" as const,
      opacity: isDisabled ? 0.5 : 1,
      width: fullWidth ? "100%" : undefined,
    };

    if (variant === "primary") {
      return (
        <Pressable
          ref={ref}
          onPress={handlePress}
          disabled={isDisabled}
          style={({ pressed }) => [
            baseStyle,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
            style,
          ]}
          {...props}
        >
          <LinearGradient
            colors={
              isDisabled
                ? [colors.border, colors.border]
                : [colors.primary.light, colors.primary.DEFAULT]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {renderContent()}
          </LinearGradient>
        </Pressable>
      );
    }

    const variantStyles = {
      secondary: {
        backgroundColor: colors.card,
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: colors.primary.DEFAULT,
      },
      ghost: {
        backgroundColor: "transparent",
      },
      danger: {
        backgroundColor: colors.error.DEFAULT,
      },
    };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          baseStyle,
          variantStyles[variant],
          {
            transform: [{ scale: pressed ? 0.98 : 1 }],
            backgroundColor: pressed
              ? variant === "ghost"
                ? colors.card
                : variantStyles[variant].backgroundColor
              : variantStyles[variant].backgroundColor,
          },
          style,
        ]}
        {...props}
      >
        {renderContent()}
      </Pressable>
    );
  }
);

Button.displayName = "Button";





