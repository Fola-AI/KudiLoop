import { useState, useCallback, useEffect } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, ClipPath, Defs, Rect } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useSignUp, useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
import { Button, Input, Divider } from "@/components/ui";
import { colors } from "@/theme";
import { queryClient } from "@/services/queryClient";

function GoogleLogo({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Defs>
        <ClipPath id="clipSignUp">
          <Rect width={48} height={48} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#clipSignUp)">
        <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.8 29.4 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.5 0 19.5-8.5 19.5-19.5 0-1.2-.1-2.3-.4-3.5z" />
        <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.2 6.8 29.4 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
        <Path fill="#4CAF50" d="M24 43.5c5.3 0 10-1.9 13.6-5.1l-6.3-5.3C29.4 34.8 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39 16.3 43.5 24 43.5z" />
        <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C37 39.4 43.5 34 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
      </G>
    </Svg>
  );
}

function useWarmUpBrowser() {
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
    if (__DEV__) console.log('🔄 Clearing stale cache on sign up');
    queryClient.clear();
    
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (hasHardware && isEnrolled) {
      router.replace("/(auth)/biometric-setup");
    } else {
      router.replace("/(auth)/pin-setup");
    }
  } catch (error) {
    if (__DEV__) console.log("Error in navigateAfterAuth:", error);
    router.replace("/(auth)/biometric-setup");
  }
}

export default function SignUpScreen() {
  useWarmUpBrowser();
  
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPendingVerification(true);
      setResendCooldown(60);
    } catch (err: any) {
      if (__DEV__) console.log("Sign up error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
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
    
    if (!verificationCode.trim() || verificationCode.length < 6) {
      setErrors({ verification: "Please enter the 6-digit verification code" });
      return;
    }

    setLoading(true);
    setResendSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await navigateAfterAuth();
      } else {
        if (__DEV__) console.log("Verification status:", result.status);
        setErrors({ verification: "Verification incomplete. Please try again." });
      }
    } catch (err: any) {
      if (__DEV__) console.log("Verification error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const errorCode = err.errors?.[0]?.code;
      if (errorCode === "form_code_incorrect") {
        setErrors({ verification: "Incorrect code. Please check and try again." });
      } else if (errorCode === "verification_expired") {
        setErrors({ verification: "Code expired. Please request a new one." });
      } else {
        const errorMessage = err.errors?.[0]?.longMessage 
          || err.errors?.[0]?.message 
          || "Verification failed. Please check the code and try again.";
        setErrors({ verification: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp || resendCooldown > 0) return;

    setErrors({});
    setResendSuccess(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(60);
      setResendSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      if (__DEV__) console.log("Resend error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ verification: err.errors?.[0]?.message || "Failed to resend code. Please try again." });
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
          "Sign Up Failed",
          `Unable to sign up with ${providerName}. Please try again.`,
          [{ text: "OK" }]
        );
      }
    } finally {
      if (__DEV__) console.log("🔐 === OAUTH END ===");
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

          <View style={{ marginTop: 32, marginBottom: 32 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700", marginBottom: 8 }}>
              Verify your email
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>
              We've sent a 6-digit code to {email}
            </Text>
          </View>

          {resendSuccess && (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <Text style={styles.successBannerText}>New code sent successfully!</Text>
            </View>
          )}

          {errors.verification && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorBannerText}>{errors.verification}</Text>
            </View>
          )}

          <View style={{ gap: 20 }}>
            <Input
              label="Verification Code"
              placeholder="Enter 6-digit code"
              leftIcon="key-outline"
              keyboardType="number-pad"
              maxLength={6}
              value={verificationCode}
              onChangeText={(text) => {
                const numericText = text.replace(/[^0-9]/g, '');
                setVerificationCode(numericText);
                clearError("verification");
                setResendSuccess(false);
              }}
              autoFocus
            />

            <Button
              onPress={handleVerification}
              loading={loading}
              disabled={loading || verificationCode.length < 6}
            >
              Verify Email
            </Button>

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
          </View>

          <View style={styles.securityInfoCard}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary.DEFAULT} />
            <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>
              Check your spam folder if you don't see the email. Code expires in 10 minutes.
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
                Create account
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 16 }}>
                Start your savings journey with KudiLoop
              </Text>
            </View>

            {errors.general && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color="#ef4444" />
                <Text style={styles.errorBannerText}>{errors.general}</Text>
              </View>
            )}

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

              <View style={[styles.btnWrap, styles.btnPrimary, (!isLoaded || loading) && { opacity: 0.5 }]}>
                <Pressable
                  onPress={handleSignUp}
                  disabled={!isLoaded || loading}
                  style={({ pressed }) => [styles.btnPressable, pressed && { opacity: 0.85 }]}
                >
                  <View style={styles.btnLayout}>
                    <View style={styles.btnIconSlot} />
                    <View style={styles.btnLabelSlot}>
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.btnTextLight}>Continue</Text>
                      )}
                    </View>
                    <View style={styles.btnIconSlot} />
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: 32 }}>
              <Divider label="or" />
              
              <View style={{ marginTop: 24, gap: 14 }}>
                <View style={[styles.btnWrap, styles.btnWhite, socialLoading === "Google" && { opacity: 0.6 }]}>
                  <Pressable
                    onPress={() => handleSocialSignUp("google")}
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

                <View style={[styles.btnWrap, styles.btnWhite, socialLoading === "Apple" && { opacity: 0.6 }]}>
                  <Pressable
                    onPress={() => handleSocialSignUp("apple")}
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
            </View>

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
  btnWrap: {
    height: 58,
    borderRadius: 100,
  },
  btnPrimary: {
    backgroundColor: "#FF6B35",
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
