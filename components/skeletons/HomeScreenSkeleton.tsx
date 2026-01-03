import { View, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { colors } from "@/theme";

/**
 * Loading skeleton for the Home screen
 * Shows animated shimmer placeholders while data loads
 */
export function HomeScreenSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Header */}
      <View style={{ 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
      }}>
        <View>
          <Animated.View style={{ 
            width: 100, 
            height: 14, 
            backgroundColor: colors.card, 
            borderRadius: 4,
            opacity,
          }} />
          <Animated.View style={{ 
            width: 140, 
            height: 28, 
            backgroundColor: colors.card, 
            borderRadius: 6,
            marginTop: 8,
            opacity,
          }} />
        </View>
        <Animated.View style={{ 
          width: 48, 
          height: 48, 
          borderRadius: 24, 
          backgroundColor: colors.card,
          opacity,
        }} />
      </View>

      <View style={{ paddingHorizontal: 20 }}>
        {/* Wallet Card Skeleton */}
        <Animated.View style={{
          backgroundColor: colors.card,
          borderRadius: 20,
          marginTop: 16,
          padding: 24,
          opacity,
        }}>
          {/* Total Balance Label */}
          <View style={{ width: 80, height: 14, backgroundColor: colors.cardElevated, borderRadius: 4 }} />
          
          {/* Large Balance */}
          <View style={{ width: 200, height: 48, backgroundColor: colors.cardElevated, borderRadius: 8, marginTop: 8 }} />
          
          {/* Currency Tabs */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            {[1, 2, 3, 4].map((i) => (
              <View 
                key={i}
                style={{ 
                  width: 60, 
                  height: 40, 
                  backgroundColor: colors.cardElevated, 
                  borderRadius: 20,
                }} 
              />
            ))}
          </View>
          
          {/* All Balances Section */}
          <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ width: 70, height: 12, backgroundColor: colors.cardElevated, borderRadius: 4, marginBottom: 12 }} />
            <View style={{ flexDirection: "row", gap: 20 }}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ minWidth: 70 }}>
                  <View style={{ width: 30, height: 10, backgroundColor: colors.cardElevated, borderRadius: 3, marginBottom: 4 }} />
                  <View style={{ width: 60, height: 16, backgroundColor: colors.cardElevated, borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
            <View style={{ width: 110, height: 36, backgroundColor: colors.cardElevated, borderRadius: 18 }} />
            <View style={{ width: 110, height: 36, backgroundColor: colors.cardElevated, borderRadius: 18 }} />
          </View>
        </Animated.View>

        {/* Stats Cards Skeleton */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
          <Animated.View style={{
            flex: 1,
            height: 120,
            backgroundColor: colors.card,
            borderRadius: 16,
            opacity,
            padding: 16,
          }}>
            <View style={{ width: 40, height: 40, backgroundColor: colors.cardElevated, borderRadius: 12, marginBottom: 8 }} />
            <View style={{ width: 40, height: 24, backgroundColor: colors.cardElevated, borderRadius: 4, marginBottom: 4 }} />
            <View style={{ width: 80, height: 12, backgroundColor: colors.cardElevated, borderRadius: 3 }} />
          </Animated.View>
          <Animated.View style={{
            flex: 1,
            height: 120,
            backgroundColor: colors.card,
            borderRadius: 16,
            opacity,
            padding: 16,
          }}>
            <View style={{ width: 40, height: 40, backgroundColor: colors.cardElevated, borderRadius: 12, marginBottom: 8 }} />
            <View style={{ width: 60, height: 24, backgroundColor: colors.cardElevated, borderRadius: 4, marginBottom: 4 }} />
            <View style={{ width: 80, height: 12, backgroundColor: colors.cardElevated, borderRadius: 3 }} />
          </Animated.View>
        </View>

        {/* Section Header Skeleton */}
        <View style={{ 
          flexDirection: "row", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginTop: 24,
          marginBottom: 12,
        }}>
          <Animated.View style={{ 
            width: 100, 
            height: 18, 
            backgroundColor: colors.card, 
            borderRadius: 4,
            opacity,
          }} />
          <Animated.View style={{ 
            width: 50, 
            height: 14, 
            backgroundColor: colors.card, 
            borderRadius: 4,
            opacity,
          }} />
        </View>

        {/* Group Cards Skeleton */}
        {[1, 2, 3].map((i) => (
          <Animated.View 
            key={i}
            style={{
              height: 80,
              backgroundColor: colors.card,
              borderRadius: 16,
              marginBottom: 12,
              opacity,
            }}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}
