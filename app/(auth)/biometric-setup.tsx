import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, Platform, InteractionManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { Button } from "@/components/ui";
import { colors } from "@/theme";
import { secureStorage } from "@/services/secureStorage";
import { safeAlert } from "@/utils/alertGate";

export default function BiometricSetupScreen() {
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | null>(null);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Delay biometric check to ensure UI is ready (prevents iOS crash)
  useEffect(() => {
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (isMountedRef.current) {
          checkBiometrics();
        }
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (isMountedRef.current) {
        setHasBiometricHardware(hasHardware);
        setIsEnrolled(enrolled);
        
        if (hasHardware && enrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType("face");
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType("fingerprint");
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.log("Error checking biometrics:", error);
      }
      if (isMountedRef.current) {
        setHasBiometricHardware(false);
      }
    }
  };

  const handleEnableBiometrics = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Wrap biometric authentication in InteractionManager for iOS safety
    InteractionManager.runAfterInteractions(async () => {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: `Enable ${biometricType === "face" ? "Face ID" : "Fingerprint"}`,
          disableDeviceFallback: true,
          cancelLabel: "Cancel",
        });

        if (!isMountedRef.current) return;

        if (result.success) {
          // Save biometric preference securely
          await secureStorage.setBiometricEnabled(true);
          await secureStorage.setBiometricSetupComplete(true);
          await secureStorage.updateLastAuthTime();
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          handleComplete();
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          if (result.error === "user_cancel") {
            // User cancelled - prompt them that it's required
            safeAlert(
              "Security Required",
              "Biometric authentication is required to secure your savings. Please try again.",
              [{ text: "OK" }]
            );
          } else if (result.error) {
            safeAlert("Authentication Failed", "Please try again to enable biometric security.");
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log("Biometric error:", error);
        }
        if (isMountedRef.current) {
          safeAlert("Error", "Failed to enable biometric authentication. Please try again.");
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    });
  };

  const handleSetupPIN = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(auth)/pin-setup");
  };

  const handleComplete = () => {
    // Update last auth time
    secureStorage.updateLastAuthTime();
    
    // Navigate to main app
    if (__DEV__) {
      console.log("Auth flow complete!");
    }
    router.replace("/(app)/(tabs)" as any);
  };

  // Handle devices without biometric support - must set up PIN
  const handleNoBiometricDevice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    safeAlert(
      "PIN Required",
      "Your device doesn't support biometric authentication. You'll need to set up a PIN to secure your account.",
      [
        {
          text: "Set Up PIN",
          onPress: () => {
            router.replace("/(auth)/pin-setup");
          },
        },
      ]
    );
  };

  const getBiometricIcon = (): keyof typeof Ionicons.glyphMap => {
    if (biometricType === "face") {
      return Platform.OS === "ios" ? "scan" : "happy-outline";
    }
    return "finger-print";
  };

  const getBiometricName = () => {
    if (biometricType === "face") {
      return Platform.OS === "ios" ? "Face ID" : "Face Recognition";
    }
    return Platform.OS === "ios" ? "Touch ID" : "Fingerprint";
  };

  // Device doesn't support biometrics
  if (!hasBiometricHardware || !isEnrolled) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
          
          {/* Content */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 32 }}>
            
            {/* Icon */}
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.warning.muted,
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Ionicons 
                name="lock-closed" 
                size={60} 
                color={colors.warning.DEFAULT} 
              />
            </View>

            {/* Text */}
            <View style={{ alignItems: "center", gap: 12 }}>
              <Text style={{ 
                color: colors.text, 
                fontSize: 28, 
                fontWeight: "700",
                textAlign: "center",
              }}>
                Secure Your Account
              </Text>
              <Text style={{ 
                color: colors.textMuted, 
                fontSize: 16, 
                textAlign: "center",
                lineHeight: 24,
                paddingHorizontal: 20,
              }}>
                {!hasBiometricHardware 
                  ? "Your device doesn't support biometric authentication. You'll need to set up a PIN to protect your savings."
                  : "Biometrics are not set up on your device. Please enable them in Settings, or set up a PIN."
                }
              </Text>
            </View>

            {/* Security Info */}
            <View style={{ 
              backgroundColor: colors.card,
              padding: 16,
              borderRadius: 14,
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary.DEFAULT} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
                  Security Required
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  KudiLoop handles real money. Account security is mandatory.
                </Text>
              </View>
            </View>
          </View>

          {/* Button */}
          <View style={{ gap: 12 }}>
            <Button onPress={handleSetupPIN}>
              Set Up PIN
            </Button>
            
            {!isEnrolled && hasBiometricHardware && (
              <Button 
                variant="ghost" 
                onPress={() => {
                  safeAlert(
                    "Enable Biometrics",
                    "Go to your device Settings > Security to enable Face ID or Fingerprint, then return to KudiLoop.",
                    [{ text: "OK" }]
                  );
                }}
              >
                I'll Enable Biometrics in Settings
              </Button>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Device supports biometrics - show setup screen
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
        
        {/* Security Badge - No skip option */}
        <View style={{ 
          alignItems: "center",
          backgroundColor: colors.primary.DEFAULT + "15",
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 20,
          alignSelf: "center",
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary.DEFAULT} />
            <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, fontWeight: "600" }}>
              Required for Security
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 32 }}>
          
          {/* Icon */}
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: colors.primary.DEFAULT + "15",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Ionicons 
              name={getBiometricIcon()} 
              size={60} 
              color={colors.primary.DEFAULT} 
            />
          </View>

          {/* Text */}
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ 
              color: colors.text, 
              fontSize: 28, 
              fontWeight: "700",
              textAlign: "center",
            }}>
              Secure Your Savings
            </Text>
            <Text style={{ 
              color: colors.textMuted, 
              fontSize: 16, 
              textAlign: "center",
              lineHeight: 24,
              paddingHorizontal: 20,
            }}>
              KudiLoop requires {getBiometricName()} to protect your account. This keeps your savings secure even if someone has your phone.
            </Text>
          </View>

          {/* Features */}
          <View style={{ gap: 16, width: "100%" }}>
            <FeatureItem 
              icon="flash" 
              title="Instant Access" 
              description="Sign in with a glance or touch"
            />
            <FeatureItem 
              icon="shield-checkmark" 
              title="Bank-Level Security" 
              description="Your biometrics never leave your device"
            />
            <FeatureItem 
              icon="time" 
              title="Auto-Lock Protection" 
              description="App locks after 2 minutes of inactivity"
            />
          </View>
        </View>

        {/* Buttons - No skip option */}
        <View style={{ gap: 12 }}>
          <Button onPress={handleEnableBiometrics} loading={loading}>
            {`Enable ${getBiometricName()}`}
          </Button>
          <Button variant="ghost" onPress={handleSetupPIN}>
            Use PIN Instead
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ 
  icon, 
  title, 
  description 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  title: string; 
  description: string;
}) {
  return (
    <View style={{ 
      flexDirection: "row", 
      alignItems: "center", 
      gap: 16,
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 14,
    }}>
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.cardElevated,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Ionicons name={icon} size={22} color={colors.primary.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
          {title}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 13 }}>
          {description}
        </Text>
      </View>
    </View>
  );
}
