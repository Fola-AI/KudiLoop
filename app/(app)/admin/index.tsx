import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { usePartners, useDeletePartner, usePartnersAnalytics } from "@/hooks/api/usePartners";

export default function AdminPanelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: partners, isLoading, refetch } = usePartners();
  const { data: analytics } = usePartnersAnalytics();
  const deletePartner = useDeletePartner();
  const [refreshing, setRefreshing] = useState(false);

  // Security check - only admins can access
  if (!user || user.isAdmin !== 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="lock-closed" size={64} color={colors.error.DEFAULT} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 16 }}>
            Access Denied
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 8, textAlign: "center" }}>
            You don't have permission to access this page.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 24,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: colors.primary.DEFAULT,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDeletePartner = (partnerId: string, partnerName: string) => {
    Alert.alert(
      "Delete Partner",
      `Are you sure you want to delete "${partnerName}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePartner.mutateAsync(partnerId);
              Alert.alert("Success", "Partner deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete partner");
            }
          },
        },
      ],
    );
  };

  const totalClicks =
    analytics?.totalClicks ||
    partners?.reduce((sum: number, p: any) => sum + (p.clickCount || 0), 0) ||
    0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 18,
              fontWeight: "600",
              color: colors.text,
              marginRight: 40,
            }}
          >
            Admin Panel
          </Text>
        </View>

        {/* Analytics Overview */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: 16,
              marginBottom: 24,
              gap: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Ionicons name="finger-print-outline" size={24} color={colors.primary.DEFAULT} />
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: colors.text,
                  marginTop: 8,
                }}
              >
                {totalClicks}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Total Clicks</Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <Ionicons name="storefront-outline" size={24} color={colors.secondary.DEFAULT} />
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: colors.text,
                  marginTop: 8,
                }}
              >
                {partners?.length || 0}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted }}>Partners</Text>
            </View>
          </View>
        </Animated.View>

        {/* Add Partner Button */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Pressable
              onPress={() => router.push("/admin/partner/new")}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? colors.primary.dark : colors.primary.DEFAULT,
                paddingVertical: 14,
                borderRadius: 12,
                gap: 8,
              })}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                Add New Partner
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Partners List */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Manage Partners
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          ) : (
            partners?.map((partner: any, index: number) => (
              <Animated.View key={partner.id} entering={FadeInDown.delay(300 + index * 50)}>
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  {/* Partner Info Row */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    {/* Logo */}
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: partner.color || colors.cardElevated,
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        marginRight: 12,
                      }}
                    >
                      {partner.logoUrl ? (
                        <Image
                          source={{ uri: partner.logoUrl }}
                          style={{ width: 44, height: 44 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text }}>
                          {partner.name.charAt(0)}
                        </Text>
                      )}
                    </View>

                    {/* Name & Category */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text }}>
                        {partner.name}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textMuted }}>
                        {partner.category}
                      </Text>
                    </View>

                    {/* Click Count */}
                    <View style={{ alignItems: "flex-end" }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="finger-print" size={14} color={colors.textMuted} />
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: colors.text,
                            marginLeft: 4,
                          }}
                        >
                          {partner.clickCount || 0}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>clicks</Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: partner.isActive ? colors.success.muted : colors.error.muted,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: partner.isActive ? colors.success.DEFAULT : colors.error.DEFAULT,
                          fontWeight: "500",
                        }}
                      >
                        {partner.isActive ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      onPress={() => router.push(`/admin/partner/${partner.id}`)}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: pressed ? colors.cardElevated : colors.background,
                        paddingVertical: 10,
                        borderRadius: 8,
                        gap: 6,
                      })}
                    >
                      <Ionicons name="pencil-outline" size={16} color={colors.primary.DEFAULT} />
                      <Text style={{ color: colors.primary.DEFAULT, fontWeight: "500" }}>Edit</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeletePartner(partner.id, partner.name)}
                      style={({ pressed }) => ({
                        flex: 1,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: pressed ? colors.error.muted : "rgba(239, 68, 68, 0.1)",
                        paddingVertical: 10,
                        borderRadius: 8,
                        gap: 6,
                      })}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.error.DEFAULT} />
                      <Text style={{ color: colors.error.DEFAULT, fontWeight: "500" }}>
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}



