import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, Platform, InteractionManager, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { Button } from "@/components/ui";
import { colors } from "@/theme";
import { secureStorage } from "@/services/secureStorage";
import { useAuth } from "@/contexts/AuthContext";
import { safeAlert } from "@/utils/alertGate";

const MAX_BIOMETRIC_ATTEMPTS = 5;

export default function BiometricUnlockScreen() {
  const { signOut } = useAuth();
  const params = useLocalSearchParams<{ reason?: string }>();
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check biometric type and load failed attempts
  useEffect(() => {
    const initialize = async () => {
      // Load previous failed attempts
      const attempts = await secureStorage.getBiometricFailedAttempts();
      if (isMountedRef.current) {
        setFailedAttempts(attempts);
      }

      // Check biometric type
      try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (isMountedRef.current) {
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType("face");
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType("fingerprint");
          }
        }
      } catch (err) {
        if (__DEV__) console.log("Error checking biometric type:", err);
      }
    };

    initialize();
  }, []);

  // Auto-prompt biometrics on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (isMountedRef.current && failedAttempts < MAX_BIOMETRIC_ATTEMPTS) {
          authenticate();
        }
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []); // Only on mount

  const authenticate = useCallback(async () => {
    if (isAuthenticating) return;
    if (failedAttempts >= MAX_BIOMETRIC_ATTEMPTS) {
      // Too many failed attempts - force sign out
      await handleForceSignOut();
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock KudiLoop",
        fallbackLabel: "Use PIN",
        disableDeviceFallback: true,
        cancelLabel: "Cancel",
      });

      if (!isMountedRef.current) return;

      if (result.success) {
        // Successful unlock
        await secureStorage.clearAppBackgroundTime();
        await secureStorage.setAppLocked(false);
        await secureStorage.resetBiometricFailedAttempts();
        await secureStorage.updateLastAuthTime();
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Navigate back to app
        router.replace("/(app)/(tabs)");
      } else if (result.error === "user_fallback") {
        // User wants to use PIN
        router.replace("/(auth)/pin-entry");
      } else if (result.error === "user_cancel") {
        // User cancelled - stay on screen
        setError("Authentication cancelled");
      } else {
        // Failed attempt
        const newAttempts = await secureStorage.recordBiometricFailedAttempt();
        setFailedAttempts(newAttempts);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        
        if (newAttempts >= MAX_BIOMETRIC_ATTEMPTS) {
          await handleForceSignOut();
        } else {
          setError(`Authentication failed. ${MAX_BIOMETRIC_ATTEMPTS - newAttempts} attempts remaining.`);
        }
      }
    } catch (err) {
      if (__DEV__) console.log("Biometric error:", err);
      if (isMountedRef.current) {
        setError("Biometric authentication not available");
      }
    } finally {
      if (isMountedRef.current) {
        setIsAuthenticating(false);
      }
    }
  }, [isAuthenticating, failedAttempts]);

  const handleForceSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    safeAlert(
      "Session Expired",
      "Too many failed attempts. You have been signed out for security.",
      [
        {
          text: "OK",
          onPress: async () => {
            // Clear all auth state
            await secureStorage.clearAll();
            await secureStorage.setAppLocked(false);
            await signOut();
            router.replace("/(auth)/welcome");
          },
        },
      ]
    );
  };

  const handleUsePIN = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(auth)/pin-entry");
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

  const getReasonText = () => {
    switch (params.reason) {
      case "background_timeout":
        return "You were away for a while";
      case "inactivity":
        return "Session timed out due to inactivity";
      default:
        return "Please verify your identity";
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
        
        {/* Logo/Icon */}
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.primary.DEFAULT + "15",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 32,
        }}>
          <Ionicons name="lock-closed" size={48} color={colors.primary.DEFAULT} />
        </View>

        {/* Title */}
        <Text style={{ 
          color: colors.text, 
          fontSize: 28, 
          fontWeight: "700",
          textAlign: "center",
          marginBottom: 8,
        }}>
          KudiLoop is Locked
        </Text>
        
        {/* Subtitle */}
        <Text style={{ 
          color: colors.textMuted, 
          fontSize: 16, 
          textAlign: "center",
          marginBottom: 32,
        }}>
          {getReasonText()}
        </Text>

        {/* Error Message */}
        {error && (
          <View style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            width: "100%",
          }}>
            <Text style={{ 
              color: "#EF4444", 
              fontSize: 14, 
              textAlign: "center",
            }}>
              {error}
            </Text>
          </View>
        )}

        {/* Attempts Warning */}
        {failedAttempts > 0 && failedAttempts < MAX_BIOMETRIC_ATTEMPTS && (
          <View style={{
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            width: "100%",
          }}>
            <Text style={{ 
              color: "#F59E0B", 
              fontSize: 14, 
              textAlign: "center",
            }}>
              ⚠️ {MAX_BIOMETRIC_ATTEMPTS - failedAttempts} attempt{MAX_BIOMETRIC_ATTEMPTS - failedAttempts !== 1 ? 's' : ''} remaining before sign out
            </Text>
          </View>
        )}

        {/* Biometric Button */}
        <Pressable
          onPress={authenticate}
          disabled={isAuthenticating || failedAttempts >= MAX_BIOMETRIC_ATTEMPTS}
          style={({ pressed }) => ({
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: pressed ? colors.primary.DEFAULT + "30" : colors.primary.DEFAULT + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            opacity: isAuthenticating || failedAttempts >= MAX_BIOMETRIC_ATTEMPTS ? 0.5 : 1,
          })}
        >
          <Ionicons 
            name={getBiometricIcon()} 
            size={56} 
            color={colors.primary.DEFAULT} 
          />
        </Pressable>

        <Text style={{ 
          color: colors.textMuted, 
          fontSize: 14, 
          textAlign: "center",
          marginBottom: 32,
        }}>
          Tap to unlock with {getBiometricName()}
        </Text>

        {/* Action Buttons */}
        <View style={{ width: "100%", gap: 12 }}>
          <Button 
            onPress={authenticate} 
            loading={isAuthenticating}
            disabled={failedAttempts >= MAX_BIOMETRIC_ATTEMPTS}
          >
            {isAuthenticating ? "Authenticating..." : `Unlock with ${getBiometricName()}`}
          </Button>
          
          <Button 
            variant="ghost" 
            onPress={handleUsePIN}
            disabled={isAuthenticating}
          >
            Use PIN Instead
          </Button>
        </View>

        {/* Security Footer */}
        <View style={{ 
          position: "absolute",
          bottom: 32,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}>
          <Ionicons name="shield-checkmark" size={16} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>
            Your data is securely encrypted
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}



