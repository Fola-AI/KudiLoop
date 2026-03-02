import { useState, useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus, View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Defs, Rect } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useSignIn, useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
import { Button, Input, Divider } from "@/components/ui";
import { colors } from "@/theme";
import { secureStorage } from "@/services/secureStorage";
import { queryClient } from "@/services/queryClient";
import { useAuth } from "@/contexts/AuthContext";

function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="clip">
          <Rect width={48} height={48} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip)">
        <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.8 29.4 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.5 0 19.5-8.5 19.5-19.5 0-1.2-.1-2.3-.4-3.5z" />
        <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.8 29.4 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
        <Path fill="#4CAF50" d="M24 43.5c5.3 0 10-1.9 13.6-5.1l-6.3-5.3C29.4 34.8 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39 16.3 43.5 24 43.5z" />
        <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C37 39.4 43.5 34 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
      </G>
    </Svg>
  );
}

export function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS === "android") {
      void WebBrowser.warmUpAsync();
    }
    return () => {
      if (Platform.OS === "android") {
        void WebBrowser.coolDownAsync();
      }
    };
  }, []);
}

async function navigateAfterAuth() {
  try {
    if (__DEV__) console.log('🔄 Clearing stale cache on login');
    queryClient.clear();
    
    const hasBiometric = await secureStorage.isBiometricEnabled();
    const hasPin = await secureStorage.hasPinSet();

    if (hasBiometric || hasPin) {
      const setupComplete = await secureStorage.isBiometricSetupComplete();
      if (!setupComplete) {
        await secureStorage.setBiometricSetupComplete(true);
      }
      await secureStorage.updateLastAuthTime();
      router.replace("/(app)/(tabs)");
      return;
    }
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      router.replace("/(auth)/biometric-setup");
    } else if (hasPin) {
      await secureStorage.setBiometricSetupComplete(true);
      await secureStorage.updateLastAuthTime();
      router.replace("/(app)/(tabs)");
    } else {
      router.replace("/(auth)/pin-setup");
    }
  } catch (error) {
    if (__DEV__) console.log("Error in navigateAfterAuth:", error);
    router.replace("/(auth)/biometric-setup");
  }
}

type SignInStep = "email_entry" | "otp_verification" | "2fa_verification";
type TwoFactorMethod = "email_code" | "phone_code" | "totp";

export default function SignInScreen() {
  useWarmUpBrowser();
  
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const { setIsAuthenticating } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<SignInStep>("email_entry");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; code?: string; general?: string }>({});
  const [showPasswordOption, setShowPasswordOption] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>("email_code");
  const [twoFactorHint, setTwoFactorHint] = useState("");
  const [emailAddressId, setEmailAddressId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (isOAuthInProgress && __DEV__) {
        console.log("🔐 OAuth in progress, preserving state:", nextAppState);
      }
      appState.current = nextAppState;
    });
    return () => { subscription.remove(); };
  }, [isOAuthInProgress]);

  const validateEmail = () => {
    const newErrors: { email?: string } = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
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

  // Primary flow: Email OTP sign-in
  const handleEmailOtpSignIn = async () => {
    if (!isLoaded || !signIn) return;
    if (!validateEmail()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setErrors({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (__DEV__) console.log("🔐 Starting email OTP sign-in for:", email.trim().toLowerCase());

      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
      });

      if (__DEV__) console.log("Sign in create result:", result.status);

      if (result.status === "needs_first_factor") {
        const firstFactors = result.supportedFirstFactors || [];
        if (__DEV__) console.log("First factors:", firstFactors.map(f => f.strategy));

        const emailCodeFactor = firstFactors.find(
          (f): f is typeof f & { emailAddressId: string } => f.strategy === "email_code"
        );

        if (emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailCodeFactor.emailAddressId,
          });
          setEmailAddressId(emailCodeFactor.emailAddressId);
          setStep("otp_verification");
          setResendCooldown(60);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          const hasPassword = firstFactors.some(f => f.strategy === "password");
          if (hasPassword) {
            setErrors({
              general: "Email code sign-in is not available for this account. Please use the password option below.",
            });
            setShowPasswordOption(true);
          } else {
            setErrors({
              general: "This account uses Google or Apple Sign In. Please use those options to sign in.",
            });
          }
        }
      } else if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
      } else {
        if (__DEV__) console.log("Unexpected status:", result.status);
        setErrors({ general: "Unable to sign in. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) console.log("Email OTP error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorCode = err.errors?.[0]?.code;
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "";

      if (errorCode === "form_identifier_not_found") {
        setErrors({ email: "No account found with this email." });
      } else if (errorCode === "strategy_for_user_invalid" ||
                 errorMessage.toLowerCase().includes("verification strategy is not valid")) {
        setErrors({
          general: "This account was created with Google or Apple Sign In. Please use those options below.",
        });
      } else if (errorCode === "session_exists" || errorCode === "identifier_already_signed_in") {
        await navigateAfterAuth();
      } else {
        setErrors({ general: errorMessage || "Sign in failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code (first factor)
  const handleVerifyOtp = async () => {
    if (!isLoaded || !signIn) return;
    if (!otpCode.trim() || otpCode.length < 6) {
      setErrors({ code: "Please enter the 6-digit code" });
      return;
    }

    setLoading(true);
    setErrors({});
    setResendSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "email_code",
        code: otpCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
      } else if (result.status === "needs_second_factor") {
        // 2FA required after email OTP
        const secondFactors = result.supportedSecondFactors || [];
        if (__DEV__) console.log("2FA required, factors:", secondFactors.map(f => f.strategy));

        setOtpCode("");
        await prepare2FA(secondFactors);
      } else {
        if (__DEV__) console.log("Unexpected verify status:", result.status);
        setErrors({ code: "Verification incomplete. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) console.log("OTP verification error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorCode = err.errors?.[0]?.code;
      if (errorCode === "form_code_incorrect") {
        setErrors({ code: "Incorrect code. Please check and try again." });
      } else if (errorCode === "verification_expired") {
        setErrors({ code: "Code expired. Please request a new one." });
      } else {
        const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid code. Please try again.";
        setErrors({ code: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  // Prepare 2FA after first factor success
  const prepare2FA = async (secondFactors: any[]) => {
    const totpFactor = secondFactors.find(f => f.strategy === "totp");
    if (totpFactor) {
      setTwoFactorMethod("totp");
      setTwoFactorHint("authenticator app");
      setStep("2fa_verification");
      return;
    }

    const phoneFactor = secondFactors.find(f => f.strategy === "phone_code");
    if (phoneFactor) {
      try {
        await signIn!.prepareSecondFactor({ strategy: "phone_code" });
        setTwoFactorMethod("phone_code");
        setTwoFactorHint("phone");
        setStep("2fa_verification");
        setResendCooldown(60);
        return;
      } catch (e) {
        if (__DEV__) console.log("phone_code 2FA not available:", e);
      }
    }

    const emailFactor = secondFactors.find(f => f.strategy === "email_code");
    if (emailFactor) {
      try {
        await signIn!.prepareSecondFactor({ strategy: "email_code" });
        setTwoFactorMethod("email_code");
        setTwoFactorHint((emailFactor as any)?.safeIdentifier || email);
        setStep("2fa_verification");
        setResendCooldown(60);
        return;
      } catch (e) {
        if (__DEV__) console.log("email_code 2FA not available:", e);
      }
    }

    setErrors({ general: "Two-factor authentication required but not configured. Please contact support." });
    setStep("email_entry");
  };

  // Verify 2FA code
  const handleVerify2FA = async () => {
    if (!isLoaded || !signIn) return;
    if (!otpCode.trim() || otpCode.length < 6) {
      setErrors({ code: "Please enter the verification code" });
      return;
    }

    setLoading(true);
    setErrors({});
    setResendSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: twoFactorMethod,
        code: otpCode,
      });

      if (result?.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
      } else {
        if (__DEV__) console.log("2FA verification result:", result?.status);
        setErrors({ code: "Verification incomplete. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) console.log("2FA verification error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorCode = err.errors?.[0]?.code;
      if (errorCode === "form_code_incorrect") {
        setErrors({ code: "Incorrect code. Please check and try again." });
      } else if (errorCode === "verification_expired") {
        setErrors({ code: "Code expired. Please request a new one." });
      } else {
        const msg = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || "Invalid code. Please try again.";
        setErrors({ code: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResendCode = async () => {
    if (!isLoaded || !signIn || resendCooldown > 0) return;

    setErrors({});
    setResendSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (step === "otp_verification" && emailAddressId) {
        await signIn.prepareFirstFactor({
          strategy: "email_code",
          emailAddressId,
        });
      } else if (step === "2fa_verification" && twoFactorMethod !== "totp") {
        await signIn.prepareSecondFactor({ strategy: twoFactorMethod as "email_code" | "phone_code" });
      }

      setResendCooldown(60);
      setResendSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      if (__DEV__) console.log("Resend error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ code: err.errors?.[0]?.message || "Failed to resend code. Please try again." });
    }
  };

  // Password sign-in (alternative)
  const handlePasswordSignIn = async () => {
    if (!isLoaded || !signIn) return;
    if (!validatePassword()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setErrors({});
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (__DEV__) console.log("🔐 Password sign-in for:", email.trim().toLowerCase());
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
      } else if (result.status === "needs_second_factor") {
        const secondFactors = result.supportedSecondFactors || [];
        setOtpCode("");
        await prepare2FA(secondFactors);
      } else if (result.status === "needs_first_factor") {
        const firstFactors = result.supportedFirstFactors || [];
        const hasPassword = firstFactors.some(f => f.strategy === "password");
        if (!hasPassword) {
          setErrors({
            general: "This account uses Google or Apple Sign In. Please use those options to sign in.",
          });
        } else {
          setErrors({ general: "Please check your password and try again." });
        }
      } else if (result.status === "needs_new_password") {
        setErrors({ general: "Please reset your password to continue." });
        router.push("/(auth)/forgot-password");
      } else {
        setErrors({ general: "Unable to complete sign in. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) console.log("Password sign in error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      const errorCode = err.errors?.[0]?.code;
      const errorMessage = err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || "";

      if (errorCode === "form_password_incorrect") {
        setErrors({ password: "Incorrect password. Please try again." });
      } else if (errorCode === "form_identifier_not_found") {
        setErrors({ email: "No account found with this email." });
      } else if (errorCode === "strategy_for_user_invalid" ||
                 errorMessage.toLowerCase().includes("verification strategy is not valid")) {
        setErrors({
          general: "This account was created with Google or Apple Sign In. Please use those options below.",
        });
      } else if (errorCode === "session_exists" || errorCode === "identifier_already_signed_in") {
        await navigateAfterAuth();
      } else {
        setErrors({ general: errorMessage || "Sign in failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = useCallback(async (provider: "google" | "apple" | "oauth_google" | "oauth_apple") => {
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
    
    setIsOAuthInProgress(true);
    setIsAuthenticating(true);
    
    const redirectUrl = Linking.createURL("/oauth-callback");
    
    if (__DEV__) {
      console.log("🔐 === OAUTH START ===");
      console.log("🔐 Provider:", providerName);
      console.log("🔐 Redirect URL:", redirectUrl);
    }
    
    try {
      if (Platform.OS === "android") {
        await WebBrowser.dismissBrowser();
      }
      
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy,
        redirectUrl,
        redirectUrlComplete: redirectUrl,
      });

      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        queryClient.clear();
        await new Promise(resolve => setTimeout(resolve, 500));
        await navigateAfterAuth();
      } else {
        if (__DEV__) console.log("⚠️ No session created - user may have cancelled");
      }
    } catch (err: any) {
      if (__DEV__) {
        console.log("❌ OAuth ERROR:", err.message);
        console.log("❌ Error details:", JSON.stringify(err.errors || {}, null, 2));
      }
      
      const isCancelled = 
        err.message?.toLowerCase().includes("cancel") ||
        err.message?.toLowerCase().includes("closed") ||
        err.message?.toLowerCase().includes("dismissed") ||
        err.code === "ERR_CANCELED";
      
      if (!isCancelled) {
        Alert.alert(
          "Sign In Failed",
          `Unable to sign in with ${providerName}. Please try again or use email sign in.`,
          [{ text: "OK" }]
        );
      }
    } finally {
      if (__DEV__) console.log("🔐 === OAUTH END ===");
      setIsOAuthInProgress(false);
      setIsAuthenticating(false);
      setSocialLoading(null);
    }
  }, [startSSOFlow, setIsAuthenticating]);

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/forgot-password");
  };

  const handleBackToEmail = () => {
    setStep("email_entry");
    setOtpCode("");
    setErrors({});
    setResendSuccess(false);
  };

  // ─── OTP / 2FA Verification Screen ───
  if (step === "otp_verification" || step === "2fa_verification") {
    const isOtp = step === "otp_verification";
    const canResend = isOtp || twoFactorMethod !== "totp";

    const title = isOtp
      ? "Check your email"
      : twoFactorMethod === "totp"
        ? "Enter authenticator code"
        : twoFactorMethod === "phone_code"
          ? "Enter SMS code"
          : "Check your email";

    const subtitle = isOtp
      ? `We sent a 6-digit code to ${email}`
      : twoFactorMethod === "totp"
        ? "Enter the 6-digit code from your authenticator app"
        : twoFactorMethod === "phone_code"
          ? "We sent a verification code to your phone"
          : `We sent a 6-digit code to ${twoFactorHint}`;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          <Pressable
            onPress={handleBackToEmail}
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

          <View style={{ marginTop: 32, marginBottom: 32 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700", marginBottom: 8 }}>
              {title}
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>
              {subtitle}
            </Text>
          </View>

          {resendSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.successBannerText}>New code sent successfully!</Text>
            </View>
          )}

          {errors.code && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorBannerText}>{errors.code}</Text>
            </View>
          )}

          <View style={{ gap: 20 }}>
            <Input
              label="Verification Code"
              placeholder={twoFactorMethod === "totp" && step === "2fa_verification" ? "000000" : "Enter 6-digit code"}
              leftIcon="key-outline"
              keyboardType="number-pad"
              maxLength={6}
              value={otpCode}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '');
                setOtpCode(numericText);
                if (errors.code) setErrors({ ...errors, code: undefined });
                setResendSuccess(false);
              }}
              autoFocus
            />

            <Button
              onPress={isOtp ? handleVerifyOtp : handleVerify2FA}
              loading={loading}
              disabled={loading || otpCode.length < 6}
            >
              Verify
            </Button>

            {canResend && (
              <View style={{ alignItems: "center", marginTop: 8 }}>
                <Pressable
                  onPress={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  style={({ pressed }) => ({
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    opacity: (resendCooldown > 0 || loading) ? 0.5 : pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: colors.primary.DEFAULT, fontSize: 14, fontWeight: "500" }}>
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.securityInfoCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary.DEFAULT} />
            <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>
              {isOtp
                ? "Check your spam folder if you don't see the email. Code expires in 10 minutes."
                : "This extra step helps keep your account secure."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Email Entry Screen (Default) ───
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

            <View style={{ marginTop: 32, marginBottom: 32 }}>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700", marginBottom: 8 }}>
                Welcome back
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>
                Sign in to continue to KudiLoop
              </Text>
            </View>

            {errors.general && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

            {/* Primary: Email + Continue with Email */}
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

              <View style={[styles.btnWrap, styles.btnPrimary, (!isLoaded || loading) && { opacity: 0.5 }]}>
                <Pressable
                  onPress={handleEmailOtpSignIn}
                  disabled={!isLoaded || loading}
                  style={({ pressed }) => [styles.btnPressable, pressed && { opacity: 0.85 }]}
                >
                  <View style={styles.btnLayout}>
                    <View style={styles.btnIconSlot}>
                      <Ionicons name="mail-outline" size={22} color="#FFFFFF" />
                    </View>
                    <View style={styles.btnLabelSlot}>
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.btnTextLight}>Continue with Email</Text>
                      )}
                    </View>
                    <View style={styles.btnIconSlot} />
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Social Sign In */}
            <View style={{ marginTop: 32 }}>
              <Divider label="or" />

              <View style={{ gap: 14 }}>
                {/* Google Button */}
                <View style={[styles.btnWrap, styles.btnWhite, socialLoading === "Google" && { opacity: 0.6 }]}>
                  <Pressable
                    onPress={() => handleSocialSignIn("google")}
                    disabled={!!socialLoading}
                    style={({ pressed }) => [styles.btnPressable, pressed && { opacity: 0.85 }]}
                  >
                    <View style={styles.btnLayout}>
                      <View style={styles.btnIconSlot}>
                        <GoogleLogo size={24} />
                      </View>
                      <View style={styles.btnLabelSlot}>
                        {socialLoading === "Google" ? (
                          <ActivityIndicator size="small" color="#1F1F1F" />
                        ) : (
                          <Text style={styles.btnTextDark}>Continue with Google</Text>
                        )}
                      </View>
                      <View style={styles.btnIconSlot} />
                    </View>
                  </Pressable>
                </View>

                {/* Apple Button */}
                <View style={[styles.btnWrap, styles.btnWhite, socialLoading === "Apple" && { opacity: 0.6 }]}>
                  <Pressable
                    onPress={() => handleSocialSignIn("apple")}
                    disabled={!!socialLoading}
                    style={({ pressed }) => [styles.btnPressable, pressed && { opacity: 0.85 }]}
                  >
                    <View style={styles.btnLayout}>
                      <View style={styles.btnIconSlot}>
                        <Ionicons name="logo-apple" size={24} color="#1F1F1F" />
                      </View>
                      <View style={styles.btnLabelSlot}>
                        {socialLoading === "Apple" ? (
                          <ActivityIndicator size="small" color="#1F1F1F" />
                        ) : (
                          <Text style={styles.btnTextDark}>Continue with Apple</Text>
                        )}
                      </View>
                      <View style={styles.btnIconSlot} />
                    </View>
                  </Pressable>
                </View>
              </View>

              {/* Password Alternative (collapsible) */}
              <View style={styles.passwordSection}>
                <Pressable
                  style={styles.passwordToggle}
                  onPress={() => setShowPasswordOption(!showPasswordOption)}
                >
                  <Ionicons
                    name={showPasswordOption ? "chevron-down" : "chevron-forward"}
                    size={20}
                    color={colors.textMuted}
                  />
                  <Text style={styles.passwordToggleText}>Sign in with password instead</Text>
                </Pressable>

                {showPasswordOption && (
                  <View style={styles.passwordContent}>
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
                    <Button
                      onPress={handlePasswordSignIn}
                      loading={loading}
                      disabled={!isLoaded || loading}
                      variant="outline"
                      style={{ marginTop: 16 }}
                    >
                      Sign In with Password
                    </Button>
                  </View>
                )}
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

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  errorBannerText: {
    color: "#ef4444",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  successBanner: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  successBannerText: {
    color: "#22c55e",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  securityInfoCard: {
    marginTop: "auto",
    paddingVertical: 16,
    backgroundColor: "#141416",
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  passwordSection: {
    marginTop: 24,
    width: "100%",
  },
  passwordToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  passwordToggleText: {
    color: "#A1A1AA",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  passwordContent: {
    marginTop: 8,
  },
  btnWrap: {
    height: 58,
    borderRadius: 100,
  },
  btnPrimary: {
    backgroundColor: colors.primary.DEFAULT,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnWhite: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D1D1",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  btnPressable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
  },
  btnLayout: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    paddingHorizontal: 20,
  },
  btnIconSlot: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  btnLabelSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTextLight: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  btnTextDark: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "600",
  },
});
