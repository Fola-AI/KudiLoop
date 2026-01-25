import { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSignUp, useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
import { Button, Input, Divider } from "@/components/ui";
import { colors } from "@/theme";
import { secureStorage } from "@/services/secureStorage";
import { queryClient } from "@/services/queryClient";

// NOTE: WebBrowser.maybeCompleteAuthSession() is called in app/_layout.tsx
// Do NOT call it here - multiple calls can cause OAuth issues

/**
 * Hook to warm up the browser for faster OAuth flows
 * This pre-loads the browser process on Android and iOS
 */
function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === "android") {
      // Warm up Chrome Custom Tabs for faster OAuth
      void WebBrowser.warmUpAsync();
    }
    return () => {
      if (Platform.OS === "android") {
        void WebBrowser.coolDownAsync();
      }
    };
  }, []);
}

/**
 * Check if user needs biometric/PIN setup and navigate accordingly
 * For new sign-ups, always require biometric setup
 */
async function navigateAfterAuth() {
  try {
    // Clear any stale cached data from previous user sessions
    // This prevents seeing another user's data after sign up
    if (__DEV__) console.log('🔄 Clearing stale cache on sign up');
    queryClient.clear();
    
    // Check device capabilities
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      // Device supports biometrics - go to biometric setup
      router.replace("/(auth)/biometric-setup");
    } else {
      // No biometrics available - go to PIN setup
      router.replace("/(auth)/pin-setup");
    }
  } catch (error) {
    if (__DEV__) console.log("Error in navigateAfterAuth:", error);
    // Fallback to biometric setup screen which handles edge cases
    router.replace("/(auth)/biometric-setup");
  }
}

export default function SignUpScreen() {
  // Warm up browser for faster OAuth - critical for in-app browser experience
  useWarmUpBrowser();
  
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
        // New sign-up - always require biometric/PIN setup
        await navigateAfterAuth();
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

  const handleSocialSignUp = useCallback(async (provider: "google" | "apple" | "oauth_google" | "oauth_apple") => {
    if (!startSSOFlow) {
      console.log("❌ startSSOFlow not available");
      return;
    }

    const strategy: "oauth_google" | "oauth_apple" =
      provider === "oauth_google" || provider === "oauth_apple"
        ? provider
        : provider === "google"
          ? "oauth_google"
          : "oauth_apple";

    const providerName = strategy === "oauth_google" ? "Google" : "Apple";
    setSocialLoading(providerName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Create redirect URL
    const redirectUrl = Linking.createURL("/oauth-callback");
    
    console.log("🔐 === OAUTH START ===");
    console.log("🔐 Provider:", providerName);
    console.log("🔐 Platform:", Platform.OS);
    console.log("🔐 Redirect URL:", redirectUrl);
    
    try {
      // For Android, configure the browser to stay open
      if (Platform.OS === "android") {
        // Dismiss any existing browser sessions first
        await WebBrowser.dismissBrowser();
      }
      
      const { createdSessionId, setActive: ssoSetActive, signIn: ssoSignIn, signUp: ssoSignUp } = await startSSOFlow({
        strategy,
        redirectUrl,
        redirectUrlComplete: redirectUrl,
      });

      console.log("🔐 OAuth response received");
      console.log("🔐 Session ID:", createdSessionId);
      console.log("🔐 signIn:", !!ssoSignIn);
      console.log("🔐 signUp:", !!ssoSignUp);

      if (createdSessionId && ssoSetActive) {
        console.log("✅ Setting active session...");
        await ssoSetActive({ session: createdSessionId });
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Clear any stale cache
        queryClient.clear();
        
        console.log("✅ Session activated, navigating...");
        
        // Give session time to propagate
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate to biometric setup for new users
        await navigateAfterAuth();
      } else {
        console.log("⚠️ No session created - user may have cancelled");
      }
    } catch (err: any) {
      console.log("❌ OAuth ERROR:", err.message);
      console.log("❌ Error code:", err.code);
      console.log("❌ Error details:", JSON.stringify(err.errors || {}, null, 2));
      
      // Don't show error for user cancellation
      const isCancelled = 
        err.message?.toLowerCase().includes("cancel") ||
        err.message?.toLowerCase().includes("closed") ||
        err.message?.toLowerCase().includes("dismissed") ||
        err.code === "ERR_CANCELED";
      
      if (!isCancelled) {
        Alert.alert(
          "Sign Up Failed",
          `Unable to sign up with ${providerName}. Please try again.`,
          [{ text: "OK" }]
        );
      }
    } finally {
      console.log("🔐 === OAUTH END ===");
      setSocialLoading(null);
    }
  }, [startSSOFlow, navigateAfterAuth]);

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

            {/* Social Sign Up - Revolut Style */}
            <View style={{ marginTop: 32 }}>
              <Divider label="or" />
              
              <View style={{ 
                marginTop: 24,
                paddingHorizontal: 0,
              }}>
                {/* Google Button */}
                <Pressable
                  onPress={() => handleSocialSignUp("google")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ position: "absolute", left: 20 }}>
                    <Ionicons name="logo-google" size={22} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                    Continue with Google
                  </Text>
                </Pressable>

                {/* Apple Button */}
                <Pressable
                  onPress={() => handleSocialSignUp("apple")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <View style={{ position: "absolute", left: 20 }}>
                    <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
                    Continue with Apple
                  </Text>
                </Pressable>
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

