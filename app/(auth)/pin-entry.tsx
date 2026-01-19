import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, InteractionManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import { colors } from "@/theme";
import { secureStorage } from "@/services/secureStorage";
import { sanitize } from "@/utils/sanitize";
import { safeAlert } from "@/utils/alertGate";

const PIN_LENGTH = 4;

export default function PinEntryScreen() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const isMountedRef = useRef(true);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check lockout status on mount
  useEffect(() => {
    checkLockoutStatus();
    // Delay biometric check to ensure UI is ready
    const timer = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (isMountedRef.current) {
          checkBiometricAvailability();
        }
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!isLockedOut || lockoutRemaining <= 0) return;
    
    const interval = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(interval);
          setIsLockedOut(false);
          setAttemptsRemaining(5);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutRemaining]);

  const checkLockoutStatus = async () => {
    const status = await secureStorage.isLockedOut();
    if (status.locked) {
      setIsLockedOut(true);
      setLockoutRemaining(status.remainingMs);
    } else {
      const attempts = await secureStorage.getFailedAttempts();
      setAttemptsRemaining(5 - attempts);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const biometricEnabled = await secureStorage.isBiometricEnabled();
      if (!biometricEnabled) return;
      
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (isMountedRef.current) {
        setBiometricAvailable(hasHardware && isEnrolled);
      }
      
      // Auto-prompt biometric if available and not locked out
      // Delay biometric prompt to ensure UI is fully ready (prevents iOS crash)
      if (hasHardware && isEnrolled) {
        const lockoutStatus = await secureStorage.isLockedOut();
        if (!lockoutStatus.locked) {
          // Additional delay for biometric prompt on iOS
          setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
              if (isMountedRef.current) {
                promptBiometric();
              }
            });
          }, 300);
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.log("Biometric check error:", error);
      }
    }
  };

  const promptBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity",
        disableDeviceFallback: true,
        cancelLabel: "Use PIN",
      });
      
      if (result.success) {
        await secureStorage.updateLastAuthTime();
        await secureStorage.resetAttempts();
        await secureStorage.setAppLocked(false);
        await secureStorage.clearAppBackgroundTime();
        await secureStorage.resetBiometricFailedAttempts();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(app)/(tabs)");
      }
    } catch (error) {
      if (__DEV__) {
        console.log("Biometric error:", error);
      }
    }
  };

  const handlePinSubmit = useCallback(async (enteredPin: string) => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    setError("");
    
    try {
      const result = await secureStorage.verifyPin(enteredPin);
      
      if (result.success) {
        await secureStorage.updateLastAuthTime();
        await secureStorage.resetAttempts();
        await secureStorage.setAppLocked(false);
        await secureStorage.clearAppBackgroundTime();
        await secureStorage.resetBiometricFailedAttempts();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(app)/(tabs)");
      } else if (result.lockedOut) {
        setIsLockedOut(true);
        setLockoutRemaining(result.lockoutRemainingMs || 5 * 60 * 1000);
        setPin("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        safeAlert(
          "Too Many Attempts",
          "Your account has been locked for 5 minutes due to too many failed attempts."
        );
      } else {
        setAttemptsRemaining(result.attemptsRemaining || 0);
        setPin("");
        setError(`Incorrect PIN. ${result.attemptsRemaining} attempt${result.attemptsRemaining !== 1 ? 's' : ''} remaining.`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      if (__DEV__) {
        if (__DEV__) console.log("PIN verification error:", err);
      }
      setPin("");
      setError("Verification failed. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !isVerifying && !isLockedOut) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handlePinSubmit(pin);
    }
  }, [pin, isVerifying, isLockedOut, handlePinSubmit]);

  const handleNumberPress = (num: string) => {
    if (pin.length < PIN_LENGTH && !isVerifying && !isLockedOut) {
      const sanitizedNum = sanitize.pin(num, 1);
      if (sanitizedNum) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPin(prev => prev + sanitizedNum);
        if (error) setError("");
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0 && !isVerifying) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPin(prev => prev.slice(0, -1));
    }
  };

  // Format remaining time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Lockout Screen
  if (isLockedOut) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}>
            <Ionicons name="lock-closed" size={40} color="#EF4444" />
          </View>
          
          <Text style={{ 
            color: colors.text, 
            fontSize: 24, 
            fontWeight: "700",
            marginBottom: 8,
            textAlign: "center",
          }}>
            Account Locked
          </Text>
          
          <Text style={{ 
            color: colors.textMuted, 
            fontSize: 16, 
            textAlign: "center",
            marginBottom: 24,
          }}>
            Too many failed attempts.{'\n'}Please try again in:
          </Text>
          
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingHorizontal: 32,
            paddingVertical: 16,
            marginBottom: 24,
          }}>
            <Text style={{ 
              color: "#EF4444", 
              fontSize: 48, 
              fontWeight: "700",
              fontVariant: ["tabular-nums"],
            }}>
              {formatTime(lockoutRemaining)}
            </Text>
          </View>
          
          <Text style={{ 
            color: colors.textMuted, 
            fontSize: 14, 
            textAlign: "center",
          }}>
            This helps protect your account from unauthorized access.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16 }}>
        
        {/* Header */}
        <View style={{ alignItems: "center", marginTop: 40, marginBottom: 40 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: colors.primary.DEFAULT + "20",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}>
            <Ionicons name="lock-closed" size={32} color={colors.primary.DEFAULT} />
          </View>
          
          <Text style={{ 
            color: colors.text, 
            fontSize: 24, 
            fontWeight: "700",
            marginBottom: 8,
          }}>
            Enter your PIN
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, textAlign: "center" }}>
            Your session has expired.{'\n'}Please enter your PIN to continue.
          </Text>
        </View>

        {/* PIN Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 16 }}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => (
            <View
              key={index}
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: pin.length > index 
                  ? colors.primary.DEFAULT 
                  : colors.card,
                borderWidth: 2,
                borderColor: pin.length > index 
                  ? colors.primary.DEFAULT 
                  : colors.border,
              }}
            />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <View style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
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
        {attemptsRemaining <= 2 && attemptsRemaining > 0 && !error && (
          <View style={{ 
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            <Text style={{ 
              color: "#F59E0B", 
              fontSize: 14, 
              textAlign: "center",
            }}>
              ⚠️ Only {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
            </Text>
          </View>
        )}

        {/* Number Pad */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={{ gap: 16 }}>
            {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["biometric", "0", "delete"]].map((row, rowIndex) => (
              <View key={rowIndex} style={{ flexDirection: "row", justifyContent: "center", gap: 24 }}>
                {row.map((item, index) => {
                  if (item === "biometric") {
                    if (!biometricAvailable) {
                      return <View key={index} style={{ width: 72, height: 72 }} />;
                    }
                    return (
                      <Pressable
                        key={index}
                        onPress={promptBiometric}
                        style={({ pressed }) => ({
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: pressed ? colors.card : colors.cardElevated,
                          alignItems: "center",
                          justifyContent: "center",
                          transform: [{ scale: pressed ? 0.95 : 1 }],
                        })}
                      >
                        <Ionicons name="finger-print" size={28} color={colors.primary.DEFAULT} />
                      </Pressable>
                    );
                  }
                  
                  return (
                    <NumberPadButton
                      key={index}
                      value={item}
                      onPress={() => {
                        if (item === "delete") {
                          handleDelete();
                        } else if (item) {
                          handleNumberPress(item);
                        }
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Forgot PIN Link */}
        <Pressable 
          onPress={() => {
            safeAlert(
              "Forgot PIN?",
              "You'll need to sign out and sign back in to reset your PIN.",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Sign Out", 
                  style: "destructive",
                  onPress: () => {
                    router.replace("/(auth)/welcome");
                  }
                },
              ]
            );
          }}
          style={{ alignItems: "center", paddingVertical: 16 }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            Forgot your PIN?
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NumberPadButton({ value, onPress }: { value: string; onPress: () => void }) {
  if (!value) {
    return <View style={{ width: 72, height: 72 }} />;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: pressed ? colors.card : colors.cardElevated,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}
    >
      {value === "delete" ? (
        <Ionicons name="backspace-outline" size={28} color={colors.text} />
      ) : (
        <Text style={{ color: colors.text, fontSize: 28, fontWeight: "600" }}>
          {value}
        </Text>
      )}
    </Pressable>
  );
}

