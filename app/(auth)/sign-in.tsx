import { useState, useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus, View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSignIn, useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as LocalAuthentication from "expo-local-authentication";
import { Button, Input, Divider } from "@/components/ui";
import { colors } from "@/theme";
import { safeAlert } from "@/utils/alertGate";
import { secureStorage } from "@/services/secureStorage";
import { useAuth } from "@/contexts/AuthContext";

// Required for OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

/**
 * Check if user needs biometric/PIN setup and navigate accordingly
 * This is called after successful sign-in
 */
async function navigateAfterAuth() {
  try {
    // Check if biometric setup is already complete
    const setupComplete = await secureStorage.isBiometricSetupComplete();
    const hasBiometric = await secureStorage.isBiometricEnabled();
    const hasPin = await secureStorage.hasPinSet();
    
    if (setupComplete && (hasBiometric || hasPin)) {
      // Security already set up - go to app
      await secureStorage.updateLastAuthTime();
      router.replace("/(app)/(tabs)");
      return;
    }
    
    // Check device capabilities
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      // Device supports biometrics - go to biometric setup
      router.replace("/(auth)/biometric-setup");
    } else if (hasPin) {
      // Has PIN but no biometrics available - go to app
      await secureStorage.setBiometricSetupComplete(true);
      await secureStorage.updateLastAuthTime();
      router.replace("/(app)/(tabs)");
    } else {
      // No biometrics available, no PIN - go to PIN setup
      router.replace("/(auth)/pin-setup");
    }
  } catch (error) {
    if (__DEV__) console.log("Error in navigateAfterAuth:", error);
    // Fallback to biometric setup screen which handles edge cases
    router.replace("/(auth)/biometric-setup");
  }
}

type VerificationStep = "credentials" | "email_code" | "phone_code" | "totp";
type VerificationFactorType = "first_factor" | "second_factor";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { setIsAuthenticating } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; code?: string; general?: string }>({});
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("credentials");
  const [verificationMethod, setVerificationMethod] = useState<string>("");
  const [verificationFactorType, setVerificationFactorType] = useState<VerificationFactorType>("second_factor");
  const [resendSuccess, setResendSuccess] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (isOAuthInProgress && __DEV__) {
        console.log("🔐 OAuth in progress, preserving state:", nextAppState);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isOAuthInProgress]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
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

  const handleSignIn = async () => {
    if (!isLoaded || !signIn) return;
    
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setErrors({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Debug: Log current sign-in state before creating new one
    if (__DEV__) {
      console.log("📋 Current signIn state before create:", {
        status: signIn.status,
        identifier: signIn.identifier,
        supportedFirstFactors: signIn.supportedFirstFactors?.map(f => f.strategy),
        supportedSecondFactors: signIn.supportedSecondFactors?.map(f => f.strategy),
      });
    }
    
    try {
      // Simple password-based sign in
      if (__DEV__) console.log("🔐 Attempting sign-in with email:", email.trim().toLowerCase());
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password: password,
      });

      if (__DEV__) console.log("Sign in result:", result.status);

      if (result.status === "complete") {
        // Sign in successful - check biometric setup
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
        
      } else if (result.status === "needs_second_factor") {
        // 2FA required (only if Client Trust or 2FA is explicitly enabled)
        const secondFactors = result.supportedSecondFactors || [];
        if (__DEV__) console.log("Second factors available:", secondFactors.map(f => f.strategy));
        setVerificationFactorType("second_factor");
        
        // Find TOTP first (no preparation needed)
        const totpFactor = secondFactors.find(f => f.strategy === "totp");
        if (totpFactor) {
          setVerificationStep("totp");
          setVerificationMethod("authenticator app");
          return;
        }
        
        // Try phone_code
        const phoneFactor = secondFactors.find(f => f.strategy === "phone_code");
        if (phoneFactor) {
          try {
            await signIn.prepareSecondFactor({ strategy: "phone_code" });
            setVerificationStep("phone_code");
            setVerificationMethod("phone");
            return;
          } catch (e) {
            if (__DEV__) console.log("phone_code not available:", e);
          }
        }
        
        // Try email_code (Client Trust)
        const emailFactor = secondFactors.find(f => f.strategy === "email_code");
        if (emailFactor) {
          try {
            await signIn.prepareSecondFactor({ strategy: "email_code" });
            setVerificationStep("email_code");
            setVerificationMethod((emailFactor as any)?.safeIdentifier || email);
            return;
          } catch (e) {
            if (__DEV__) console.log("email_code not available:", e);
          }
        }
        
        // No supported 2FA method found
        setErrors({ general: "Two-factor authentication required but not configured. Please contact support." });
        
      } else if (result.status === "needs_first_factor") {
        // Check what first factors are available
        const firstFactors = result.supportedFirstFactors || [];
        if (__DEV__) console.log("First factors available:", firstFactors.map(f => f.strategy));
        
        // Check if password is in the list (it should be for password accounts)
        const hasPassword = firstFactors.some(f => f.strategy === "password");
        
        if (hasPassword) {
          // Password is supported but somehow wasn't verified - this is unusual
          setErrors({ general: "Please check your password and try again." });
        } else {
          // This account doesn't support password sign-in (OAuth only)
          setErrors({ 
            general: "This account uses Google or Apple Sign In. Please use those options to sign in." 
          });
        }
        
      } else if (result.status === "needs_identifier") {
        setErrors({ email: "Please enter your email address" });
        
      } else if (result.status === "needs_new_password") {
        setErrors({ general: "Please reset your password to continue." });
        router.push("/(auth)/forgot-password");
        
      } else {
        if (__DEV__) console.log("Unexpected sign in status:", result.status);
        setErrors({ general: "Unable to complete sign in. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) {
        console.log("Sign in error:", err);
        console.log("Error code:", err.errors?.[0]?.code);
        console.log("Error message:", err.errors?.[0]?.message);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Handle specific Clerk error codes
      const errorCode = err.errors?.[0]?.code;
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "";
      
      if (errorCode === "form_password_incorrect") {
        setErrors({ password: "Incorrect password. Please try again." });
      } else if (errorCode === "form_identifier_not_found") {
        setErrors({ email: "No account found with this email." });
      } else if (errorCode === "strategy_for_user_invalid" || 
                 errorMessage.toLowerCase().includes("verification strategy is not valid")) {
        // This typically means the account was created with OAuth (Google/Apple) 
        // and doesn't have password authentication enabled
        setErrors({ 
          general: "This account was created with Google or Apple Sign In. Please use those options below to sign in." 
        });
      } else if (errorCode === "session_exists") {
        // Already signed in, check biometric setup
        await navigateAfterAuth();
      } else if (errorCode === "form_identifier_exists") {
        setErrors({ email: "This email is already registered. Please sign in." });
      } else if (errorCode === "identifier_already_signed_in") {
        // User is already signed in, check biometric setup
        await navigateAfterAuth();
      } else {
        setErrors({ general: errorMessage || "Sign in failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isLoaded || !signIn) return;
    
    if (!verificationCode.trim()) {
      setErrors({ code: "Please enter the verification code" });
      return;
    }

    setLoading(true);
    setErrors({});
    setResendSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      let result;
      
      // All verification at this point should be second factor (2FA)
      // since we don't use first factor verification for password sign-in
      if (verificationStep === "totp") {
        result = await signIn.attemptSecondFactor({
          strategy: "totp",
          code: verificationCode,
        });
      } else if (verificationStep === "phone_code") {
        result = await signIn.attemptSecondFactor({
          strategy: "phone_code",
          code: verificationCode,
        });
      } else if (verificationStep === "email_code") {
        result = await signIn.attemptSecondFactor({
          strategy: "email_code",
          code: verificationCode,
        });
      }

      if (result?.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
      } else {
        if (__DEV__) console.log("Verification result:", result?.status);
        setErrors({ code: "Verification incomplete. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) console.log("Verification error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Handle specific error codes
      const errorCode = err.errors?.[0]?.code;
      let errorMessage = "Invalid code. Please try again.";
      
      if (errorCode === "form_code_incorrect") {
        errorMessage = "Incorrect code. Please check and try again.";
      } else if (errorCode === "verification_expired") {
        errorMessage = "Code expired. Please request a new one.";
      } else if (err.errors?.[0]?.longMessage) {
        errorMessage = err.errors[0].longMessage;
      } else if (err.errors?.[0]?.message) {
        errorMessage = err.errors[0].message;
      }
      
      setErrors({ code: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn) return;
    
    // Can't resend TOTP codes
    if (verificationStep === "totp") return;
    
    setResending(true);
    setErrors({});
    setResendSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // All resend at this point should be second factor
      if (verificationStep === "email_code") {
        await signIn.prepareSecondFactor({ strategy: "email_code" });
      } else if (verificationStep === "phone_code") {
        await signIn.prepareSecondFactor({ strategy: "phone_code" });
      }
      
      setResendSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Clear success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      if (__DEV__) console.log("Resend error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err.errors?.[0]?.message || "Failed to resend code. Please try again.";
      setErrors({ code: errorMessage });
    } finally {
      setResending(false);
    }
  };

  const handleSocialSignIn = useCallback(async (provider: "google" | "apple" | "oauth_google" | "oauth_apple") => {
    if (!startSSOFlow) return;

    const strategy: "oauth_google" | "oauth_apple" =
      provider === "oauth_google" || provider === "oauth_apple"
        ? provider
        : provider === "google"
          ? "oauth_google"
          : "oauth_apple";

    const providerName = strategy === "oauth_google" ? "Google" : "Apple";
    setSocialLoading(providerName);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setIsOAuthInProgress(true);
    setIsAuthenticating(true);
    try {
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy,
        redirectUrl: "kudiloop://oauth-callback",
        redirectUrlComplete: "kudiloop://oauth-callback",
      });

      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
      }
    } catch (err: any) {
      if (__DEV__) console.log(`${providerName} sign in error:`, err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Don't show error for user cancellation
      if (err.message?.includes("cancelled") || err.message?.includes("canceled")) {
        return;
      }
      
      safeAlert(
        "Sign In Failed",
        `Unable to sign in with ${providerName}. Please try again.`
      );
    } finally {
      setIsOAuthInProgress(false);
      setIsAuthenticating(false);
      setSocialLoading(null);
    }
  }, [startSSOFlow, setIsAuthenticating]);

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/forgot-password");
  };

  const handleBackToCredentials = () => {
    setVerificationStep("credentials");
    setVerificationCode("");
    setErrors({});
  };

  // Verification Code Screen
  if (verificationStep !== "credentials") {
    const getVerificationTitle = () => {
      switch (verificationStep) {
        case "totp": return "Enter authenticator code";
        case "phone_code": return "Enter SMS code";
        case "email_code": return "Check your email";
        default: return "Verify your identity";
      }
    };

    const getVerificationSubtitle = () => {
      switch (verificationStep) {
        case "totp": return "Enter the 6-digit code from your authenticator app";
        case "phone_code": return `We sent a verification code to your phone`;
        case "email_code": return `We sent a 6-digit code to ${verificationMethod}`;
        default: return "Enter the verification code to continue";
      }
    };

    const canResend = verificationStep === "email_code" || verificationStep === "phone_code";

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Back Button */}
          <Pressable
            onPress={handleBackToCredentials}
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
              {getVerificationTitle()}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>
              {getVerificationSubtitle()}
            </Text>
          </View>

          {/* Success Message */}
          {resendSuccess && (
            <View style={{
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              alignItems: "center",
            }}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={{ color: "#22c55e", fontSize: 14, marginLeft: 8, flex: 1 }}>
                New code sent successfully!
              </Text>
            </View>
          )}

          {/* Error */}
          {errors.code && (
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
                {errors.code}
              </Text>
            </View>
          )}

          <View style={{ gap: 20 }}>
            <Input
              label="Verification Code"
              placeholder={verificationStep === "totp" ? "000000" : "Enter 6-digit code"}
              leftIcon="key-outline"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={(text) => {
                // Only allow numbers
                const numericText = text.replace(/[^0-9]/g, '');
                setVerificationCode(numericText);
                if (errors.code) setErrors({ ...errors, code: undefined });
                setResendSuccess(false);
              }}
              autoFocus
            />

            <Button onPress={handleVerifyCode} loading={loading} disabled={loading || verificationCode.length < 6}>
              Verify
            </Button>

            {/* Resend Code */}
            {canResend && (
              <View style={{ alignItems: "center", marginTop: 8 }}>
                <Pressable 
                  onPress={handleResendCode}
                  disabled={resending || loading}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    opacity: (resending || loading) ? 0.5 : pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: colors.primary.DEFAULT, fontSize: 14, fontWeight: "500" }}>
                    {resending ? "Sending..." : "Resend code"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Security Info */}
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
            <Ionicons name="shield-checkmark" size={24} color={colors.primary.DEFAULT} />
            <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>
              {verificationFactorType === "second_factor" 
                ? "This extra step helps keep your account secure."
                : "We need to verify it's really you signing in."}
            </Text>
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
                Welcome back
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>
                Sign in to continue to KudiLoop
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
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                error={errors.email}
                editable={!loading}
              />

              <View>
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  leftIcon="lock-closed-outline"
                  secureTextEntry
                  autoComplete="password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  error={errors.password}
                  editable={!loading}
                />
                <Pressable onPress={handleForgotPassword} style={{ alignSelf: "flex-end", marginTop: 8 }}>
                  <Text style={{ color: colors.primary.DEFAULT, fontSize: 14, fontWeight: "500" }}>
                    Forgot password?
                  </Text>
                </Pressable>
              </View>

              <Button onPress={handleSignIn} loading={loading} disabled={!isLoaded || loading}>
                Sign In
              </Button>
            </View>

            {/* Social Sign In - Revolut Style */}
            <View style={{ marginTop: 32 }}>
              <Divider label="or" />
              
              <View style={{ 
                marginTop: 24,
                paddingHorizontal: 0,
              }}>
                {/* Google Button */}
                <Pressable
                  onPress={() => handleSocialSignIn("google")}
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
                  onPress={() => handleSocialSignIn("apple")}
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

            {/* Sign Up Link */}
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
                Don't have an account?
              </Text>
              <Pressable onPress={() => router.replace("/(auth)/sign-up")}>
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 15, fontWeight: "600" }}>
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

