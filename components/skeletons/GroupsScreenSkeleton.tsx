import { View, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef } from "react";
import { colors } from "@/theme";

/**
 * Loading skeleton for the Groups screen
 * Shows animated shimmer placeholders while data loads
 */
export function GroupsScreenSkeleton() {
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
            height: 28, 
            backgroundColor: colors.card, 
            borderRadius: 6,
            opacity,
          }} />
          <Animated.View style={{ 
            width: 150, 
            height: 14, 
            backgroundColor: colors.card, 
            borderRadius: 4,
            marginTop: 8,
            opacity,
          }} />
        </View>
        <Animated.View style={{ 
          width: 48, 
          height: 48, 
          borderRadius: 16, 
          backgroundColor: colors.card,
          opacity,
        }} />
      </View>

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 16 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <Animated.View 
              key={i}
              style={{ 
                width: 70, 
                height: 40, 
                backgroundColor: colors.card, 
                borderRadius: 20,
                opacity,
              }} 
            />
          ))}
        </View>
      </View>

      {/* Groups List */}
      <View style={{ paddingHorizontal: 20 }}>
        {[1, 2, 3].map((i) => (
          <Animated.View 
            key={i}
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              marginBottom: 16,
              padding: 16,
              opacity,
            }}
          >
            {/* Header Row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <View style={{ 
                    width: 140, 
                    height: 18, 
                    backgroundColor: colors.cardElevated, 
                    borderRadius: 4,
                  }} />
                  <View style={{ 
                    width: 50, 
                    height: 16, 
                    backgroundColor: colors.cardElevated, 
                    borderRadius: 4,
                  }} />
                </View>
                <View style={{ 
                  width: 100, 
                  height: 13, 
                  backgroundColor: colors.cardElevated, 
                  borderRadius: 4,
                  marginTop: 4,
                }} />
              </View>
              <View style={{ 
                width: 60, 
                height: 24, 
                backgroundColor: colors.cardElevated, 
                borderRadius: 12,
              }} />
            </View>
            
            {/* Member Avatars */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <View style={{ flexDirection: "row", marginLeft: 8 }}>
                {[1, 2, 3, 4].map((j) => (
                  <View 
                    key={j}
                    style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: 16, 
                      backgroundColor: colors.cardElevated,
                      marginLeft: -8,
                      borderWidth: 2,
                      borderColor: colors.card,
                    }} 
                  />
                ))}
              </View>
              <View style={{ 
                width: 80, 
                height: 13, 
                backgroundColor: colors.cardElevated, 
                borderRadius: 4,
              }} />
            </View>
            
            {/* Progress Bar */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ width: 80, height: 12, backgroundColor: colors.cardElevated, borderRadius: 4 }} />
                <View style={{ width: 40, height: 12, backgroundColor: colors.cardElevated, borderRadius: 4 }} />
              </View>
              <View style={{ height: 6, backgroundColor: colors.cardElevated, borderRadius: 3 }} />
            </View>
            
            {/* Info Grid */}
            <View style={{ 
              flexDirection: "row", 
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <View style={{ flex: 1 }}>
                <View style={{ width: 70, height: 11, backgroundColor: colors.cardElevated, borderRadius: 3, marginBottom: 4 }} />
                <View style={{ width: 60, height: 15, backgroundColor: colors.cardElevated, borderRadius: 4, marginBottom: 2 }} />
                <View style={{ width: 50, height: 11, backgroundColor: colors.cardElevated, borderRadius: 3 }} />
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <View style={{ width: 70, height: 11, backgroundColor: colors.cardElevated, borderRadius: 3, marginBottom: 4 }} />
                <View style={{ width: 30, height: 15, backgroundColor: colors.cardElevated, borderRadius: 4, marginBottom: 2 }} />
                <View style={{ width: 40, height: 11, backgroundColor: colors.cardElevated, borderRadius: 3 }} />
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <View style={{ width: 70, height: 11, backgroundColor: colors.cardElevated, borderRadius: 3, marginBottom: 4 }} />
                <View style={{ width: 50, height: 15, backgroundColor: colors.cardElevated, borderRadius: 4, marginBottom: 2 }} />
                <View style={{ width: 30, height: 11, backgroundColor: colors.cardElevated, borderRadius: 3 }} />
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </SafeAreaView>
  );
}

/**
 * Loading skeleton for Group Detail screen
 */
export function GroupDetailSkeleton() {
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
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      {/* Cycle Progress Ring */}
      <View style={{ alignItems: "center", paddingVertical: 32 }}>
        <Animated.View style={{ 
          width: 120, 
          height: 120, 
          borderRadius: 60, 
          backgroundColor: colors.card,
          opacity,
        }} />
        <View style={{ marginTop: 24, alignItems: "center" }}>
          <Animated.View style={{ 
            width: 120, 
            height: 13, 
            backgroundColor: colors.card, 
            borderRadius: 4,
            opacity,
          }} />
          <Animated.View style={{ 
            width: 160, 
            height: 28, 
            backgroundColor: colors.card, 
            borderRadius: 6,
            marginTop: 8,
            opacity,
          }} />
        </View>
      </View>
      
      {/* Beneficiary Card */}
      <Animated.View style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        opacity,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.cardElevated }} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <View style={{ width: 100, height: 13, backgroundColor: colors.cardElevated, borderRadius: 4, marginBottom: 4 }} />
            <View style={{ width: 80, height: 18, backgroundColor: colors.cardElevated, borderRadius: 4 }} />
          </View>
          <View style={{ width: 70, height: 24, backgroundColor: colors.cardElevated, borderRadius: 12 }} />
        </View>
      </Animated.View>
      
      {/* Quick Actions */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <Animated.View 
            key={i}
            style={{
              flex: 1,
              height: 70,
              backgroundColor: colors.card,
              borderRadius: 12,
              opacity,
            }}
          />
        ))}
      </View>
      
      {/* Contributions Section */}
      <Animated.View style={{ 
        width: 150, 
        height: 18, 
        backgroundColor: colors.card, 
        borderRadius: 4,
        marginBottom: 12,
        opacity,
      }} />
      
      {/* Member Cards */}
      {[1, 2, 3, 4].map((i) => (
        <Animated.View 
          key={i}
          style={{
            height: 60,
            backgroundColor: colors.card,
            borderRadius: 8,
            marginBottom: 8,
            opacity,
          }}
        />
      ))}
    </View>
  );
}

