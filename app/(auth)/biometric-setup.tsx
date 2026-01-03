import { useState, useEffect } from "react";
import { View, Text, Pressable, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { Button } from "@/components/ui";
import { colors } from "@/theme";
import { secureStorage } from "@/services/secureStorage";

export default function BiometricSetupScreen() {
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("face");
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("fingerprint");
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.log("Error checking biometrics:", error);
      }
    }
  };

  const handleEnableBiometrics = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType === "face" ? "Face ID" : "Fingerprint"}`,
        disableDeviceFallback: true,
        cancelLabel: "Cancel",
      });

      if (result.success) {
        // Save biometric preference securely
        await secureStorage.setBiometricEnabled(true);
        await secureStorage.updateLastAuthTime();
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleComplete();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (result.error === "user_cancel") {
          // User cancelled, don't show error
        } else if (result.error) {
          Alert.alert("Authentication Failed", "Please try again.");
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.log("Biometric error:", error);
      }
      Alert.alert("Error", "Failed to enable biometric authentication.");
    } finally {
      setLoading(false);
    }
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

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Explicitly disable biometrics when skipped
    await secureStorage.setBiometricEnabled(false);
    handleComplete();
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
        
        {/* Skip Button */}
        <View style={{ alignItems: "flex-end" }}>
          <Pressable
            onPress={handleSkip}
            style={({ pressed }) => ({
              paddingVertical: 8,
              paddingHorizontal: 16,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>Skip</Text>
          </Pressable>
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
              {biometricType 
                ? `Enable ${getBiometricName()}`
                : "Quick Access"
              }
            </Text>
            <Text style={{ 
              color: colors.textMuted, 
              fontSize: 16, 
              textAlign: "center",
              lineHeight: 24,
              paddingHorizontal: 20,
            }}>
              {biometricType 
                ? `Use ${getBiometricName()} for quick and secure access to your account`
                : "Your device doesn't support biometric authentication"
              }
            </Text>
          </View>

          {/* Features */}
          {biometricType && (
            <View style={{ gap: 16, width: "100%" }}>
              <FeatureItem 
                icon="flash" 
                title="Instant Access" 
                description="Sign in with a glance or touch"
              />
              <FeatureItem 
                icon="shield-checkmark" 
                title="Secure" 
                description="Your biometrics never leave your device"
              />
              <FeatureItem 
                icon="lock-closed" 
                title="PIN Backup" 
                description="Use your PIN if biometrics fail"
              />
            </View>
          )}
        </View>

        {/* Buttons */}
        <View style={{ gap: 12 }}>
          {biometricType ? (
            <>
              <Button onPress={handleEnableBiometrics} loading={loading}>
                {`Enable ${getBiometricName()}`}
              </Button>
              <Button variant="ghost" onPress={handleSkip}>
                Maybe Later
              </Button>
            </>
          ) : (
            <Button onPress={handleComplete}>
              Continue
            </Button>
          )}
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

