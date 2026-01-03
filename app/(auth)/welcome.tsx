import { View, Text, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "@/theme";

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(auth)/sign-up");
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 32 }}>
        
        {/* Top Section - Logo */}
        <View style={{ alignItems: "center", paddingTop: 20 }}>
          <Image
            source={require("@/assets/images/kudiloop_logo_nobg.png")}
            style={{ width: 220, height: 220 }}
            resizeMode="contain"
          />
        </View>

        {/* Middle Section - Value Props */}
        <View style={{ gap: 20 }}>
          <Text style={{ 
            color: colors.text, 
            fontSize: 32, 
            fontWeight: "700", 
            textAlign: "center",
            letterSpacing: -0.5,
          }}>
            Save Together,{"\n"}Succeed Together
          </Text>
          
          <Text style={{ 
            color: colors.textMuted, 
            fontSize: 16, 
            textAlign: "center",
            lineHeight: 24,
            paddingHorizontal: 20,
          }}>
            Join millions using KudiLoop to save smarter with trusted circles of friends and family.
          </Text>

          {/* Trust Indicators - 4 Key Features */}
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            marginTop: 16,
            paddingHorizontal: 4,
          }}>
            <TrustBadge icon="sync-circle" label="Rotating" />
            <TrustBadge icon="people-circle" label="Trusted" />
            <TrustBadge icon="wallet" label="Easy Payout" />
            <TrustBadge icon="shield-checkmark" label="Secure" />
          </View>
        </View>

        {/* Bottom Section - CTAs */}
        <View style={{ gap: 12 }}>
          <Pressable 
            onPress={handleGetStarted}
            style={({ pressed }) => ({
              borderRadius: 16,
              overflow: "hidden",
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <LinearGradient
              colors={[colors.primary.light, colors.primary.DEFAULT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ 
                paddingVertical: 18, 
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Text style={{ color: colors.white, fontSize: 18, fontWeight: "600" }}>
                Create Account
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleSignIn}
            style={({ pressed }) => ({
              paddingVertical: 18,
              alignItems: "center",
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.border,
              backgroundColor: pressed ? colors.card : "transparent",
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
              I already have an account
            </Text>
          </Pressable>

          {/* Terms */}
          <Text style={{ 
            color: colors.textSubtle, 
            fontSize: 12, 
            textAlign: "center",
            marginTop: 8,
            lineHeight: 18,
          }}>
            By continuing, you agree to our{" "}
            <Text 
              style={{ color: colors.primary.DEFAULT }} 
              onPress={() => router.push("/(auth)/terms")}
            >
              Terms of Service
            </Text>
            {" "}and{" "}
            <Text 
              style={{ color: colors.primary.DEFAULT }} 
              onPress={() => router.push("/(auth)/privacy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function TrustBadge({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <View style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Ionicons name={icon} size={26} color={colors.primary.DEFAULT} />
      </View>
      <Text style={{ 
        color: colors.textMuted, 
        fontSize: 10, 
        textAlign: "center",
      }}>
        {label}
      </Text>
    </View>
  );
}

