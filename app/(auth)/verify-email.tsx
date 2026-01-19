import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/ui";
import { colors } from "@/theme";

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleCodeChange = (text: string, index: number) => {
    if (error) setError("");
    
    const newCode = [...code];
    
    // Handle paste
    if (text.length > 1) {
      const pastedCode = text.slice(0, CODE_LENGTH).split("");
      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < CODE_LENGTH) {
          newCode[index + i] = pastedCode[i];
        }
      }
      setCode(newCode);
      const nextIndex = Math.min(index + text.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = text;
    setCode(newCode);

    // Move to next input
    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (newCode.every((digit) => digit) && newCode.join("").length === CODE_LENGTH) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handleVerify = async (verificationCode: string) => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (verificationCode === "123456") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.push("/(auth)/pin-setup");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError("Invalid verification code");
        setCode(new Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    }, 1500);
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResendTimer(30);
    setCode(new Array(CODE_LENGTH).fill(""));
    setError("");
    // Trigger resend API call here
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
        
        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
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
        <View style={{ marginTop: 32, marginBottom: 40 }}>
          <Text style={{ 
            color: colors.text, 
            fontSize: 28, 
            fontWeight: "700",
            marginBottom: 8,
          }}>
            Verify your email
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, lineHeight: 24 }}>
            We've sent a 6-digit code to your email.{"\n"}Enter it below to continue.
          </Text>
        </View>

        {/* Code Input */}
        <View style={{ gap: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: 14,
                  backgroundColor: colors.card,
                  borderWidth: 2,
                  borderColor: error ? colors.error.DEFAULT : digit ? colors.primary.DEFAULT : colors.border,
                  color: colors.text,
                  fontSize: 24,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              />
            ))}
          </View>

          {error && (
            <Text style={{ color: colors.error.DEFAULT, fontSize: 14, textAlign: "center" }}>
              {error}
            </Text>
          )}

          <Button 
            onPress={() => handleVerify(code.join(""))} 
            loading={loading}
            disabled={code.some((digit) => !digit)}
          >
            Verify Email
          </Button>
        </View>

        {/* Resend */}
        <View style={{ alignItems: "center", marginTop: 32 }}>
          {resendTimer > 0 ? (
            <Text style={{ color: colors.textMuted, fontSize: 14 }}>
              Resend code in <Text style={{ color: colors.text, fontWeight: "600" }}>{resendTimer}s</Text>
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text style={{ color: colors.primary.DEFAULT, fontSize: 14, fontWeight: "500" }}>
                Resend verification code
              </Text>
            </Pressable>
          )}
        </View>

        {/* Hint */}
        <View style={{ 
          marginTop: "auto",
          paddingVertical: 16,
          backgroundColor: colors.card,
          borderRadius: 12,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}>
          <Ionicons name="information-circle" size={24} color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>
            For testing, use code: <Text style={{ color: colors.text, fontWeight: "600" }}>123456</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}





