import { forwardRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  disabled?: boolean;
  /** Maximum length of input. Defaults to 500 for security. */
  maxLength?: number;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      disabled = false,
      secureTextEntry,
      style,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isSecure, setIsSecure] = useState(secureTextEntry);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const toggleSecure = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsSecure(!isSecure);
    };

    const getBorderColor = () => {
      if (error) return colors.error.DEFAULT;
      if (isFocused) return colors.primary.DEFAULT;
      return colors.border;
    };

    return (
      <View style={{ width: "100%", gap: 6 }}>
        {label && (
          <Text
            style={{
              color: colors.text,
              fontSize: 14,
              fontWeight: "500",
              marginLeft: 4,
            }}
          >
            {label}
          </Text>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: getBorderColor(),
            paddingHorizontal: 16,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? colors.primary.DEFAULT : colors.textMuted}
              style={{ marginRight: 12 }}
            />
          )}

          <TextInput
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            secureTextEntry={isSecure}
            placeholderTextColor={colors.textSubtle}
            maxLength={props.maxLength ?? 500}
            style={[
              {
                flex: 1,
                color: colors.text,
                fontSize: 16,
                paddingVertical: 16,
              },
              style,
            ]}
            {...props}
          />

          {secureTextEntry && (
            <Pressable onPress={toggleSecure} hitSlop={8}>
              <Ionicons
                name={isSecure ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}

          {rightIcon && !secureTextEntry && (
            <Pressable
              onPress={onRightIconPress}
              disabled={!onRightIconPress}
              hitSlop={8}
            >
              <Ionicons name={rightIcon} size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {(error || hint) && (
          <Text
            style={{
              color: error ? colors.error.DEFAULT : colors.textSubtle,
              fontSize: 12,
              marginLeft: 4,
            }}
          >
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";

