import { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Button, Input } from "@/components/ui";
import { colors } from "@/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    if (!email) {
      setError("Email is required");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 1500);
  };

  if (sent) {
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

          {/* Success State */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 24 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: colors.success.muted,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Ionicons name="mail-outline" size={40} color={colors.success.DEFAULT} />
            </View>
            
            <View style={{ alignItems: "center", gap: 8 }}>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
                Check your email
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16, textAlign: "center", lineHeight: 24 }}>
                We've sent a password reset link to{"\n"}
                <Text style={{ color: colors.text, fontWeight: "500" }}>{email}</Text>
              </Text>
            </View>

            <Button 
              variant="secondary" 
              onPress={() => router.replace("/(auth)/sign-in")}
              style={{ marginTop: 16 }}
            >
              Back to Sign In
            </Button>

            <Pressable onPress={() => setSent(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.primary.DEFAULT, fontSize: 14 }}>
                Didn't receive email? Try again
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
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
          <View style={{ marginTop: 32, marginBottom: 32 }}>
            <Text style={{ 
              color: colors.text, 
              fontSize: 28, 
              fontWeight: "700",
              marginBottom: 8,
            }}>
              Forgot password?
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 16, lineHeight: 24 }}>
              No worries! Enter your email and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 24 }}>
            <Input
              label="Email Address"
              placeholder="you@example.com"
              leftIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError("");
              }}
              error={error}
            />

            <Button onPress={handleReset} loading={loading}>
              Send Reset Link
            </Button>
          </View>

          {/* Back to Sign In */}
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "center", 
            alignItems: "center",
            marginTop: 32,
            gap: 4,
          }}>
            <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>
                Back to Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}





