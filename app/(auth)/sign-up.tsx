import { useState, useCallback } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSignUp, useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import { Button, Input, Divider } from "@/components/ui";
import { colors } from "@/theme";

// Required for OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) return;
    
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setErrors({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingVerification(true);
    } catch (err: any) {
      if (__DEV__) console.log("Sign up error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Parse Clerk error messages
      const errorMessage = err.errors?.[0]?.longMessage 
        || err.errors?.[0]?.message 
        || "Sign up failed. Please try again.";
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!isLoaded || !signUp) return;
    
    if (!verificationCode.trim()) {
      setErrors({ verification: "Please enter the verification code" });
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(app)/(tabs)");
      } else {
        if (__DEV__) console.log("Verification status:", result.status);
        setErrors({ verification: "Verification incomplete. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) console.log("Verification error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const errorMessage = err.errors?.[0]?.longMessage 
        || err.errors?.[0]?.message 
        || "Verification failed. Please check the code and try again.";
      
      setErrors({ verification: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = useCallback(async (strategy: "oauth_google" | "oauth_apple") => {
    if (!startSSOFlow) return;
    
    const providerName = strategy === "oauth_google" ? "Google" : "Apple";
    setSocialLoading(providerName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy,
        redirectUrl: "kudiloop://oauth-callback",
        redirectUrlComplete: "kudiloop://oauth-callback",
      });

      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(app)/(tabs)");
      }
    } catch (err: any) {
      if (__DEV__) console.log(`${providerName} sign up error:`, err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Don't show error for user cancellation
      if (err.message?.includes("cancelled") || err.message?.includes("canceled")) {
        return;
      }
      
      Alert.alert(
        "Sign Up Failed",
        `Unable to sign up with ${providerName}. Please try again.`
      );
    } finally {
      setSocialLoading(null);
    }
  }, [startSSOFlow]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  // Verification Screen
  if (pendingVerification) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Back Button */}
          <Pressable
            onPress={() => setPendingVerification(false)}
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
              Verify your email
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>
              We've sent a verification code to {email}
            </Text>
          </View>

          {/* Verification Error */}
          {errors.verification && (
            <View style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
            }}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontSize: 14, marginLeft: 8, flex: 1 }}>
                {errors.verification}
              </Text>
            </View>
          )}

          <View style={{ gap: 20 }}>
            <Input
              label="Verification Code"
              placeholder="Enter 6-digit code"
              leftIcon="key-outline"
              keyboardType="number-pad"
              value={verificationCode}
              onChangeText={(text) => {
                setVerificationCode(text);
                clearError("verification");
              }}
              error={errors.verification ? "" : undefined}
            />

            <Button onPress={handleVerification} loading={loading}>
              Verify Email
            </Button>
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
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                Create account
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>
                Start your savings journey with KudiLoop
              </Text>
            </View>

            {/* General Error */}
            {errors.general && (
              <View style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
              }}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 14, marginLeft: 8, flex: 1 }}>
                  {errors.general}
                </Text>
              </View>
            )}

            {/* Form */}
            <View style={{ gap: 20 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="First Name"
                    placeholder="John"
                    leftIcon="person-outline"
                    autoCapitalize="words"
                    autoComplete="given-name"
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      clearError("firstName");
                    }}
                    error={errors.firstName}
                    editable={!loading}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    value={lastName}
                    onChangeText={(text) => {
                      setLastName(text);
                      clearError("lastName");
                    }}
                    error={errors.lastName}
                    editable={!loading}
                  />
                </View>
              </View>

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
                  clearError("email");
                }}
                error={errors.email}
                editable={!loading}
              />

              <Input
                label="Password"
                placeholder="Create a strong password"
                leftIcon="lock-closed-outline"
                secureTextEntry
                autoComplete="new-password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError("password");
                }}
                error={errors.password}
                hint={!errors.password ? "Min 8 characters" : undefined}
                editable={!loading}
              />

              <Button onPress={handleSignUp} loading={loading} disabled={!isLoaded || loading}>
                Create Account
              </Button>
            </View>

            {/* Social Sign Up */}
            <View style={{ marginTop: 32 }}>
              <Divider label="or continue with" />
              
              <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
                <SocialButton
                  icon="logo-google"
                  label="Google"
                  onPress={() => handleSocialSignUp("oauth_google")}
                  loading={socialLoading === "Google"}
                  disabled={!!socialLoading || loading}
                />
                <SocialButton
                  icon="logo-apple"
                  label="Apple"
                  onPress={() => handleSocialSignUp("oauth_apple")}
                  loading={socialLoading === "Apple"}
                  disabled={!!socialLoading || loading}
                />
              </View>
            </View>

            {/* Terms and Privacy */}
            <Text style={{ 
              fontSize: 13, 
              color: colors.textMuted, 
              textAlign: "center", 
              marginTop: 24,
              lineHeight: 20,
            }}>
              By signing up, you agree to our{" "}
              <Text 
                style={{ color: colors.primary.DEFAULT, textDecorationLine: "underline" }} 
                onPress={() => router.push("/(auth)/terms")}
              >
                Terms of Service
              </Text>
              {" "}and{" "}
              <Text 
                style={{ color: colors.primary.DEFAULT, textDecorationLine: "underline" }} 
                onPress={() => router.push("/(auth)/privacy")}
              >
                Privacy Policy
              </Text>
            </Text>

            {/* Sign In Link */}
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "center", 
              alignItems: "center",
              marginTop: "auto",
              paddingTop: 32,
              paddingBottom: 16,
              gap: 4,
            }}>
              <Text style={{ color: colors.textMuted, fontSize: 15 }}>
                Already have an account?
              </Text>
              <Pressable onPress={() => router.replace("/(auth)/sign-in")}>
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 15, fontWeight: "600" }}>
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SocialButton({ 
  icon, 
  label, 
  onPress,
  loading = false,
  disabled = false,
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
      })}
    >
      {loading ? (
        <Text style={{ color: colors.textMuted, fontSize: 15 }}>Loading...</Text>
      ) : (
        <>
          <Ionicons name={icon} size={20} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500" }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
