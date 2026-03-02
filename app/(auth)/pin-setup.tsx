import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme";
import { secureStorage } from "@/services/secureStorage";
import { sanitize } from "@/utils/sanitize";
import { safeAlert } from "@/utils/alertGate";

const PIN_LENGTH = 4;

export default function PinSetupScreen() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const currentPin = step === "create" ? pin : confirmPin;
  const setCurrentPin = step === "create" ? setPin : setConfirmPin;

  // Save PIN securely
  const savePinSecurely = async (pinToSave: string) => {
    setIsSaving(true);
    try {
      await secureStorage.setPin(pinToSave);
      await secureStorage.setBiometricSetupComplete(true); // Mark security setup as complete
      await secureStorage.updateLastAuthTime();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Go directly to app - security is now set up
      router.replace("/(app)/(tabs)");
    } catch (err) {
      if (__DEV__) {
        if (__DEV__) console.log("Failed to save PIN:", err);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      safeAlert("Error", "Failed to save PIN. Please try again.");
      setConfirmPin("");
      setPin("");
      setStep("create");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (currentPin.length === PIN_LENGTH && !isSaving) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      if (step === "create") {
        setTimeout(() => {
          setStep("confirm");
        }, 300);
      } else {
        // Confirm step
        if (confirmPin === pin) {
          // Save PIN securely (hashed with device-specific salt)
          savePinSecurely(confirmPin);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setError("PINs don't match. Try again.");
          setConfirmPin("");
          setPin("");
          setStep("create");
        }
      }
    }
  }, [currentPin]);

  const handleNumberPress = (num: string) => {
    if (currentPin.length < PIN_LENGTH && !isSaving) {
      // Sanitize input to ensure only digits
      const sanitizedNum = sanitize.pin(num, 1);
      if (sanitizedNum) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentPin(currentPin + sanitizedNum);
        if (error) setError("");
      }
    }
  };

  const handleDelete = () => {
    if (currentPin.length > 0 && !isSaving) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentPin(currentPin.slice(0, -1));
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setConfirmPin("");
      setStep("create");
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
        
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <View style={padStyles.header}>
          <View style={padStyles.headerIcon}>
            <Ionicons name="keypad" size={30} color={colors.primary.DEFAULT} />
          </View>
          <Text style={padStyles.title}>
            {step === "create" ? "Create your PIN" : "Confirm your PIN"}
          </Text>
          <Text style={padStyles.subtitle}>
            {step === "create" 
              ? "Set a 4-digit PIN to secure your account"
              : "Enter your PIN again to confirm"
            }
          </Text>
        </View>

        <View style={padStyles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const filled = currentPin.length > index;
            return (
              <View key={index} style={[padStyles.dot, filled && padStyles.dotFilled]} />
            );
          })}
        </View>

        {error ? (
          <Text style={padStyles.errorText}>{error}</Text>
        ) : null}

        <View style={padStyles.padContainer}>
          <View style={padStyles.padGrid}>
            {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "delete"]].map((row, rowIndex) => (
              <View key={rowIndex} style={padStyles.padRow}>
                {row.map((item, colIndex) => (
                  <NumberPadButton
                    key={colIndex}
                    value={item}
                    onPress={() => {
                      if (item === "delete") handleDelete();
                      else if (item) handleNumberPress(item);
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={padStyles.footer}>
          <Ionicons name="shield-checkmark" size={16} color={colors.textMuted} />
          <Text style={padStyles.footerText}>PIN is required to secure your account</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function NumberPadButton({ value, onPress }: { value: string; onPress: () => void }) {
  if (!value) {
    return <View style={padStyles.keyEmpty} />;
  }

  const isDelete = value === "delete";

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[
          padStyles.key,
          !isDelete && padStyles.keyNumber,
          isDelete && padStyles.keyAction,
          pressed && !isDelete && padStyles.keyPressed,
          pressed && isDelete && padStyles.keyActionPressed,
        ]}>
          {isDelete ? (
            <Ionicons name="backspace-outline" size={26} color={colors.textMuted} />
          ) : (
            <Text style={[padStyles.keyText, pressed && padStyles.keyTextPressed]}>
              {value}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const PAD_KEY_SIZE = 78;

const padStyles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 36,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FAFAFA",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 15,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#3F3F46",
  },
  dotFilled: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  padContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  padGrid: {
    gap: 18,
  },
  padRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 26,
  },
  key: {
    width: PAD_KEY_SIZE,
    height: PAD_KEY_SIZE,
    borderRadius: PAD_KEY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  keyNumber: {
    backgroundColor: "#1C1C1F",
    borderWidth: 1,
    borderColor: "#2A2A2E",
  },
  keyAction: {
    backgroundColor: "transparent",
  },
  keyPressed: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    transform: [{ scale: 1.08 }],
  },
  keyActionPressed: {
    opacity: 0.5,
  },
  keyEmpty: {
    width: PAD_KEY_SIZE,
    height: PAD_KEY_SIZE,
  },
  keyText: {
    color: "#FAFAFA",
    fontSize: 32,
    fontWeight: "500",
  },
  keyTextPressed: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  footerText: {
    color: "#71717A",
    fontSize: 13,
  },
});
