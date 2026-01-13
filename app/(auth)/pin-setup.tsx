import { useState, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
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
      await secureStorage.updateLastAuthTime();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/(auth)/biometric-setup");
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
        
        {/* Back Button */}
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

        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 40, marginBottom: 40 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.primary.DEFAULT + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}>
            <Ionicons name="keypad" size={32} color={colors.primary.DEFAULT} />
          </View>
          
          <Text style={{ 
            color: colors.text, 
            fontSize: 24, 
            fontWeight: "700",
            marginBottom: 8,
          }}>
            {step === "create" ? "Create your PIN" : "Confirm your PIN"}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, textAlign: "center" }}>
            {step === "create" 
              ? "Set a 4-digit PIN to secure your account"
              : "Enter your PIN again to confirm"
            }
          </Text>
        </View>

        {/* PIN Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 16 }}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: currentPin.length > index 
                  ? colors.primary.DEFAULT 
                  : colors.card,
                borderWidth: 2,
                borderColor: currentPin.length > index 
                  ? colors.primary.DEFAULT 
                  : colors.border,
              }}
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <Text style={{ 
            color: colors.error.DEFAULT, 
            fontSize: 14, 
            textAlign: "center",
            marginBottom: 16,
          }}>
            {error}
          </Text>
        )}

        {/* Number Pad */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={{ gap: 16 }}>
            {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "delete"]].map((row, rowIndex) => (
              <View key={rowIndex} style={{ flexDirection: "row", justifyContent: "center", gap: 24 }}>
                {row.map((item, index) => (
                  <NumberPadButton
                    key={index}
                    value={item}
                    onPress={() => {
                      if (item === "delete") {
                        handleDelete();
                      } else if (item) {
                        handleNumberPress(item);
                      }
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Skip Option */}
        <Pressable 
          onPress={() => router.push("/(auth)/biometric-setup")}
          style={{ alignItems: "center", paddingVertical: 16 }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            Skip for now
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NumberPadButton({ value, onPress }: { value: string; onPress: () => void }) {
  if (!value) {
    return <View style={{ width: 72, height: 72 }} />;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: pressed ? colors.card : colors.cardElevated,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      {value === "delete" ? (
        <Ionicons name="backspace-outline" size={28} color={colors.text} />
      ) : (
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "600" }}>
          {value}
        </Text>
      )}
    </Pressable>
  );
}
