import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { usePartner, useUpdatePartner } from "@/hooks/api/usePartners";

const CATEGORIES = ["Travel", "Finance", "Shopping", "Utility", "Food", "Entertainment", "Other"];

const COLORS = [
  { name: "Teal", value: "#14B8A6", hex: "#14B8A6" },
  { name: "Blue", value: "#3B82F6", hex: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6", hex: "#8B5CF6" },
  { name: "Orange", value: "#F97316", hex: "#F97316" },
  { name: "Green", value: "#22C55E", hex: "#22C55E" },
  { name: "Gray", value: "#6B7280", hex: "#6B7280" },
];

export default function EditPartnerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const partnerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuth();
  const { data: partner, isLoading: isLoadingPartner } = usePartner(partnerId || "");
  const updatePartner = useUpdatePartner();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [existingBannerUrl, setExistingBannerUrl] = useState<string | null>(null);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (partner) {
      setName(partner.name || "");
      setDescription(partner.description || "");
      setCategory(partner.category || "");
      setAffiliateLink(partner.affiliateLink || "");
      setCommissionRate(partner.commissionRate || "");
      setSelectedColor(partner.color || COLORS[0].value);
      setExistingLogoUrl(partner.logoUrl || null);
      setExistingBannerUrl(partner.bannerUrl || null);
      setIsActive(partner.isActive === 1);
      setLogoRemoved(false);
      setLogoUri(null);
      setBannerUri(null);
    }
  }, [partner]);

  // Security check
  if (!user || user.isAdmin !== 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="lock-closed" size={64} color={colors.error.DEFAULT} />
          <Text style={{ color: colors.text, marginTop: 16 }}>Access Denied</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!partnerId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Ionicons name="alert-circle" size={48} color={colors.error.DEFAULT} />
          <Text style={{ color: colors.text, marginTop: 12 }}>Partner not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingPartner) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogoUri(result.assets[0].uri);
      setExistingLogoUrl(null);
      setLogoRemoved(false);
    }
  };

  const pickBanner = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setBannerUri(result.assets[0].uri);
      setExistingBannerUrl(null);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Partner name is required");
      return false;
    }
    if (!description.trim()) {
      Alert.alert("Error", "Description is required");
      return false;
    }
    if (!category) {
      Alert.alert("Error", "Please select a category");
      return false;
    }
    if (!affiliateLink.trim()) {
      Alert.alert("Error", "Affiliate link is required");
      return false;
    }
    if (!affiliateLink.startsWith("http")) {
      Alert.alert("Error", "Affiliate link must start with http:// or https://");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !partnerId) return;

    setIsSubmitting(true);
    try {
      await updatePartner.mutateAsync({
        id: partnerId,
        name: name.trim(),
        description: description.trim(),
        category,
        affiliateLink: affiliateLink.trim(),
        commissionRate: commissionRate.trim() || null,
        color: selectedColor,
        isActive: isActive ? 1 : 0,
        logoUri,
        bannerUri,
        logoRemoved,
      });

      Alert.alert("Success", "Partner updated successfully", [{ text: "OK", onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayLogo = logoUri || existingLogoUrl;
  const displayBanner = bannerUri || existingBannerUrl;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 17,
              fontWeight: "600",
              color: colors.text,
            }}
          >
            Edit Partner
          </Text>
          <Pressable onPress={handleSubmit} disabled={isSubmitting} style={{ padding: 8 }}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
            ) : (
              <Text style={{ color: colors.primary.DEFAULT, fontWeight: "600" }}>Save</Text>
            )}
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {/* Logo Upload */}
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Pressable onPress={pickImage}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 20,
                  backgroundColor: colors.card,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: displayLogo ? "solid" : "dashed",
                }}
              >
                {displayLogo ? (
                  <Image source={{ uri: displayLogo }} style={{ width: 100, height: 100 }} />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="camera-outline" size={32} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                      Add Logo
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            {displayLogo && (
              <Pressable
                onPress={() => {
                  setLogoUri(null);
                  setExistingLogoUrl(null);
                  setLogoRemoved(true);
                }}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: colors.error.DEFAULT, fontSize: 13 }}>Remove</Text>
              </Pressable>
            )}
          </View>

          {/* Banner Upload */}
          <View style={{ marginBottom: 20, paddingHorizontal: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
              Banner Image (promotional image for card)
            </Text>
            <Pressable onPress={pickBanner}>
              <View
                style={{
                  height: 120,
                  borderRadius: 12,
                  backgroundColor: colors.card,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: displayBanner ? "solid" : "dashed",
                }}
              >
                {displayBanner ? (
                  <Image
                    source={{ uri: displayBanner }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                    <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                      Add Banner (16:9)
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            {bannerUri && (
              <Pressable onPress={() => setBannerUri(null)} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.error.DEFAULT, fontSize: 13 }}>Remove Banner</Text>
              </Pressable>
            )}
          </View>

          {/* Form Fields */}
          <View style={{ paddingHorizontal: 16 }}>
            {/* Name */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                Partner Name *
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Serenique Luxury Travel"
                placeholderTextColor={colors.textSubtle}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  padding: 14,
                  color: colors.text,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                Description *
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Brief description of the partner..."
                placeholderTextColor={colors.textSubtle}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  padding: 14,
                  color: colors.text,
                  fontSize: 16,
                  minHeight: 100,
                  textAlignVertical: "top",
                }}
              />
            </View>

            {/* Category */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                Category *
              </Text>
              <Pressable
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: category ? colors.text : colors.textSubtle, fontSize: 16 }}>
                  {category || "Select category"}
                </Text>
                <Ionicons
                  name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>

              {showCategoryPicker && (
                <View
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 10,
                    marginTop: 8,
                    overflow: "hidden",
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        setCategory(cat);
                        setShowCategoryPicker(false);
                      }}
                      style={({ pressed }) => ({
                        padding: 14,
                        backgroundColor: pressed
                          ? colors.cardElevated
                          : category === cat
                            ? colors.cardElevated
                            : "transparent",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      })}
                    >
                      <Text style={{ color: colors.text, fontSize: 16 }}>{cat}</Text>
                      {category === cat && (
                        <Ionicons name="checkmark" size={20} color={colors.primary.DEFAULT} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Affiliate Link */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                Affiliate Link *
              </Text>
              <TextInput
                value={affiliateLink}
                onChangeText={setAffiliateLink}
                placeholder="https://partner.com/ref=kudiloop"
                placeholderTextColor={colors.textSubtle}
                autoCapitalize="none"
                keyboardType="url"
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  padding: 14,
                  color: colors.text,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Commission Rate */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                Commission Rate (optional)
              </Text>
              <TextInput
                value={commissionRate}
                onChangeText={setCommissionRate}
                placeholder="e.g. 5% or £10 per signup"
                placeholderTextColor={colors.textSubtle}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  padding: 14,
                  color: colors.text,
                  fontSize: 16,
                }}
              />
            </View>

            {/* Color Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}>
                Card Color
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {COLORS.map((color) => (
                  <Pressable
                    key={color.value}
                    onPress={() => setSelectedColor(color.value)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: color.hex,
                      borderWidth: selectedColor === color.value ? 3 : 0,
                      borderColor: "white",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedColor === color.value && (
                      <Ionicons name="checkmark" size={20} color="white" />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Active Toggle */}
            <View style={{ marginBottom: 30 }}>
              <Pressable
                onPress={() => setIsActive(!isActive)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.card,
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <View>
                  <Text style={{ color: colors.text, fontSize: 16 }}>Active</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    Partner visible in marketplace
                  </Text>
                </View>
                <View
                  style={{
                    width: 50,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: isActive ? colors.success.DEFAULT : colors.border,
                    padding: 2,
                  }}
                >
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: "white",
                      transform: [{ translateX: isActive ? 20 : 0 }],
                    }}
                  />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


