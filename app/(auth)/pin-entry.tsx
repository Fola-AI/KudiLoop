import { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Pressable, InteractionManager, StyleSheet } from "react-native";
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
        
        <View style={padStyles.header}>
          <View style={padStyles.headerIcon}>
            <Ionicons name="lock-closed" size={30} color={colors.primary.DEFAULT} />
          </View>
          <Text style={padStyles.title}>Enter your PIN</Text>
          <Text style={padStyles.subtitle}>
            Your session has expired.{'\n'}Please enter your PIN to continue.
          </Text>
        </View>

        <View style={padStyles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const filled = pin.length > index;
            return (
              <View key={index} style={[padStyles.dot, filled && padStyles.dotFilled]} />
            );
          })}
        </View>

        {error ? (
          <View style={padStyles.errorBanner}>
            <Text style={padStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        {attemptsRemaining <= 2 && attemptsRemaining > 0 && !error ? (
          <View style={padStyles.warningBanner}>
            <Text style={padStyles.warningText}>
              Only {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining before lockout
            </Text>
          </View>
        ) : null}

        <View style={padStyles.padContainer}>
          <View style={padStyles.padGrid}>
            {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["biometric", "0", "delete"]].map((row, rowIndex) => (
              <View key={rowIndex} style={padStyles.padRow}>
                {row.map((item, colIndex) => {
                  if (item === "biometric") {
                    if (!biometricAvailable) {
                      return <View key={colIndex} style={padStyles.keyEmpty} />;
                    }
                    return (
                      <Pressable key={colIndex} onPress={promptBiometric}>
                        {({ pressed }) => (
                          <View style={[padStyles.key, padStyles.keyAction, pressed && padStyles.keyActionPressed]}>
                            <Ionicons name="finger-print" size={28} color={colors.primary.DEFAULT} />
                          </View>
                        )}
                      </Pressable>
                    );
                  }
                  return (
                    <NumberPadButton
                      key={colIndex}
                      value={item}
                      onPress={() => {
                        if (item === "delete") handleDelete();
                        else if (item) handleNumberPress(item);
                      }}
                    />
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <Pressable 
          onPress={() => {
            safeAlert(
              "Forgot PIN?",
              "You'll need to sign out and sign back in to reset your PIN.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: () => router.replace("/(auth)/sign-in") },
              ]
            );
          }}
          style={padStyles.footer}
        >
          <Text style={padStyles.footerLink}>Forgot your PIN?</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NumberPadButton({ value, onPress }: { value: string; onPress: () => void }) {
  if (!value) {
    return <View style={padStyles.keyEmpty} />;
  }

  const isDelete = value === "delete";

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[
          padStyles.key,
          !isDelete && padStyles.keyNumber,
          isDelete && padStyles.keyAction,
          pressed && !isDelete && padStyles.keyPressed,
          pressed && isDelete && padStyles.keyActionPressed,
        ]}>
          {isDelete ? (
            <Ionicons name="backspace-outline" size={26} color="#A1A1AA" />
          ) : (
            <Text style={[padStyles.keyText, pressed && padStyles.keyTextPressed]}>
              {value}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}

const PAD_KEY_SIZE = 78;

const padStyles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 36,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FAFAFA",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 15,
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#3F3F46",
  },
  dotFilled: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  warningBanner: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 8,
  },
  warningText: {
    color: "#F59E0B",
    fontSize: 14,
    textAlign: "center",
  },
  padContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  padGrid: {
    gap: 18,
  },
  padRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 26,
  },
  key: {
    width: PAD_KEY_SIZE,
    height: PAD_KEY_SIZE,
    borderRadius: PAD_KEY_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  keyNumber: {
    backgroundColor: "#1C1C1F",
    borderWidth: 1,
    borderColor: "#2A2A2E",
  },
  keyAction: {
    backgroundColor: "transparent",
  },
  keyPressed: {
    backgroundColor: "#FF6B35",
    borderColor: "#FF6B35",
    shadowColor: "#FF6B35",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    transform: [{ scale: 1.08 }],
  },
  keyActionPressed: {
    opacity: 0.5,
  },
  keyEmpty: {
    width: PAD_KEY_SIZE,
    height: PAD_KEY_SIZE,
  },
  keyText: {
    color: "#FAFAFA",
    fontSize: 32,
    fontWeight: "500",
  },
  keyTextPressed: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerLink: {
    color: "#71717A",
    fontSize: 14,
  },
});

