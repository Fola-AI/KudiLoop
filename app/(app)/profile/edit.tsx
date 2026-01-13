import { View, Text, ScrollView, Pressable, TextInput, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Button, Avatar } from "@/components/ui";
import { colors } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile, useUploadProfilePhoto } from "@/hooks/api";
import { getAvatarsByGender, getAvatarUrl, getAvatarBackgroundColor, AvatarOption } from "@/constants/avatars";
import { queryKeys } from "@/services/queryClient";
import { getAbsoluteUrl } from "@/services/api";

type Gender = "male" | "female" | "prefer_not_to_say" | null;

interface FormData {
  firstName: string;
  lastName: string;
  preferredName: string;
  phone: string;
  aboutMe: string;
  gender: Gender;
  profileImage: string | null;
  avatarChoice: string | null;
}

// Form Input Component
function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  multiline?: boolean;
  editable?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>{label}</Text>
      <View style={{
        borderWidth: 2,
        borderColor: !editable ? '#1f2937' : isFocused ? colors.primary.DEFAULT : '#374151',
        borderRadius: 12,
        backgroundColor: editable ? '#1f2937' : '#111827',
        paddingHorizontal: 16,
      }}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            color: editable ? 'white' : '#6b7280',
            fontSize: 16,
            paddingVertical: multiline ? 16 : 14,
            minHeight: multiline ? 100 : undefined,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
      </View>
    </View>
  );
}

// Gender Selection Component
function GenderSelector({ 
  selected, 
  onSelect 
}: { 
  selected: Gender;
  onSelect: (gender: Gender) => void;
}) {
  const options: { value: Gender; label: string; icon: string }[] = [
    { value: "male", label: "Male", icon: "male" },
    { value: "female", label: "Female", icon: "female" },
    { value: "prefer_not_to_say", label: "Prefer not to say", icon: "person" },
  ];
  
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Gender</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.value);
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 12,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: selected === option.value ? colors.primary.DEFAULT : '#374151',
              backgroundColor: selected === option.value ? 'rgba(255,107,53,0.1)' : '#1f2937',
            }}
          >
            <Ionicons 
              name={option.icon as any} 
              size={18} 
              color={selected === option.value ? colors.primary.DEFAULT : '#9ca3af'} 
            />
            <Text style={{ 
              color: selected === option.value ? colors.primary.DEFAULT : '#9ca3af',
              fontSize: 12,
              fontWeight: '500',
              marginLeft: 4,
            }}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// Avatar Selection Component
function AvatarSelector({
  gender,
  selectedAvatar,
  onSelect,
}: {
  gender: Gender;
  selectedAvatar: string | null;
  onSelect: (avatarId: string | null) => void;
}) {
  const avatars = getAvatarsByGender(gender);
  
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
        <Text style={{ color: '#9ca3af', fontSize: 13, marginHorizontal: 12 }}>
          Or choose an avatar
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: '#374151' }} />
      </View>
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
        {avatars.map((avatar) => {
          const isSelected = selectedAvatar === avatar.id;
          return (
            <Pressable
              key={avatar.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(isSelected ? null : avatar.id);
              }}
              style={{
                padding: 4,
                borderRadius: 40,
                borderWidth: 3,
                borderColor: isSelected ? colors.primary.DEFAULT : 'transparent',
                backgroundColor: isSelected ? 'rgba(255,107,53,0.15)' : 'transparent',
              }}
            >
              <Image
                source={{ uri: getAvatarUrl(avatar.id) }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: avatar.backgroundColor,
                }}
              />
              {isSelected && (
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: colors.primary.DEFAULT,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                >
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      
      <Text style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', marginTop: 8 }}>
        {gender === 'male' ? 'Male avatars' : gender === 'female' ? 'Female avatars' : 'Abstract avatars'}
      </Text>
    </View>
  );
}

export default function EditProfileScreen() {
  const { user, clerkUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();
  
  // Initialize form with real user data
  const [formData, setFormData] = useState<FormData>({
    firstName: user?.firstName || clerkUser?.firstName || '',
    lastName: user?.lastName || clerkUser?.lastName || '',
    preferredName: user?.preferredName || user?.firstName || '',
    phone: user?.phone || '',
    aboutMe: user?.aboutMe || '',
    gender: (user?.gender as Gender) || null,
    profileImage: user?.profileImageUrl || clerkUser?.imageUrl || null,
    avatarChoice: user?.avatarChoice || null,
  });
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sync form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        preferredName: user.preferredName || user.firstName || '',
        phone: user.phone || '',
        aboutMe: user.aboutMe || '',
        gender: (user.gender as Gender) || null,
        profileImage: user.profileImageUrl || clerkUser?.imageUrl || null,
        avatarChoice: user.avatarChoice || null,
      });
    }
  }, [user]);
  
  const updateForm = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };
  
  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    safeAlert(
      "Change Photo",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              safeAlert("Permission Required", "Camera access is needed to take photos.");
              return;
            }
            
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            
            if (!result.canceled && result.assets[0]) {
              // Clear avatar choice when uploading custom photo
              setFormData(prev => ({
                ...prev,
                profileImage: result.assets[0].uri,
                avatarChoice: null,
              }));
              setHasChanges(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
        {
          text: "Choose from Gallery",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              safeAlert("Permission Required", "Photo library access is needed.");
              return;
            }
            
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            
            if (!result.canceled && result.assets[0]) {
              // Clear avatar choice when uploading custom photo
              setFormData(prev => ({
                ...prev,
                profileImage: result.assets[0].uri,
                avatarChoice: null,
              }));
              setHasChanges(true);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };
  
  // Handle avatar selection - clears custom photo when selecting a pre-made avatar
  const handleAvatarSelect = (avatarId: string | null) => {
    setFormData(prev => ({
      ...prev,
      avatarChoice: avatarId,
      // Clear custom profile image if selecting an avatar
      profileImage: avatarId ? null : prev.profileImage,
    }));
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Build the payload
    // IMPORTANT: When user selects an avatar, we need to clear profileImageUrl
    // When user uploads a photo, we need to clear avatarChoice
    // This ensures only one type of avatar is active at a time
    const payload: {
      firstName: string;
      lastName: string;
      preferredName: string;
      phone: string;
      aboutMe: string;
      gender: typeof formData.gender;
      avatarChoice: string | null;
      profileImageUrl?: string | null;
    } = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      preferredName: formData.preferredName,
      phone: formData.phone,
      aboutMe: formData.aboutMe,
      gender: formData.gender,
      avatarChoice: formData.avatarChoice,
    };
    
    // If user selected a pre-made avatar, clear profileImageUrl in the database
    // This ensures the Avatar component will show the avatarChoice, not an old photo
    if (formData.avatarChoice && !formData.profileImage?.startsWith('file://')) {
      payload.profileImageUrl = null;
    }
    
    if (__DEV__) {
      console.log('🔄 ========== SAVE PROFILE ==========');
      console.log('🔄 formData.profileImage:', formData.profileImage);
      console.log('🔄 formData.avatarChoice:', formData.avatarChoice);
      console.log('🔄 Payload to send:', JSON.stringify(payload, null, 2));
    }
    
    try {
      // If profile image changed (local URI), upload first
      if (formData.profileImage && formData.profileImage.startsWith('file://')) {
        if (__DEV__) console.log('🔄 Uploading photo...');
        const uploadResult = await uploadPhoto.mutateAsync(formData.profileImage);
        if (__DEV__) console.log('🔄 Photo upload result:', uploadResult);
      }
      
      if (__DEV__) console.log('🔄 Updating profile with payload...');
      
      // Update profile data (including avatarChoice)
      const result = await updateProfile.mutateAsync(payload);
      
      if (__DEV__) {
        console.log('🔄 Profile update result:', JSON.stringify(result, null, 2));
        console.log('🔄 Result avatarChoice:', result?.avatarChoice);
      }
      
      // Invalidate user query to ensure fresh data is fetched everywhere
      await queryClient.invalidateQueries({ queryKey: queryKeys.user });
      
      // Refresh user data in AuthContext
      if (__DEV__) console.log('🔄 Refreshing user in AuthContext...');
      await refreshUser();
      
      if (__DEV__) {
        console.log('🔄 User after refresh:', JSON.stringify(user, null, 2));
        console.log('🔄 ========== SAVE COMPLETE ==========');
      }
      
      setHasChanges(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to Profile tab (NOT home)
      router.replace('/(app)/(tabs)/profile');
    } catch (error: any) {
      if (__DEV__) {
        console.error('Profile update error:', error);
        console.error('Error message:', error.message);
        console.error('Error response:', error.response?.data);
      }
      safeAlert("Error", error.message || "Failed to update profile. Please try again.");
    }
  };
  
  const fullName = `${formData.firstName} ${formData.lastName}`.trim();
  const isSaving = updateProfile.isPending || uploadPhoto.isPending;
  const email = user?.email || clerkUser?.email || '';
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Edit Profile",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: "Back",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ 
                padding: 8, 
                marginLeft: Platform.OS === 'ios' ? -8 : 0,
              }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Photo Upload Section */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Pressable
            onPress={pickImage}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: (formData.profileImage || formData.avatarChoice) ? 0 : 2,
              borderColor: colors.border,
              borderStyle: 'dashed',
              overflow: 'hidden',
            }}
          >
            {formData.profileImage ? (
              <Image
                source={{ uri: getAbsoluteUrl(formData.profileImage) || formData.profileImage }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
                resizeMode="cover"
              />
            ) : formData.avatarChoice ? (
              <Image
                source={{ uri: getAvatarUrl(formData.avatarChoice) }}
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: 60,
                  backgroundColor: getAvatarBackgroundColor(formData.avatarChoice),
                }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="camera" size={40} color={colors.primary.DEFAULT} />
              </View>
            )}
            
            {/* Camera overlay badge */}
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: colors.primary.DEFAULT,
              borderRadius: 15,
              width: 30,
              height: 30,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.background,
            }}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </Pressable>
          
          <Text style={{ 
            color: colors.textMuted, 
            marginTop: 12,
            fontSize: 14 
          }}>
            Tap to {(formData.profileImage || formData.avatarChoice) ? 'change' : 'upload'} photo
          </Text>
        </View>
        
        {/* Avatar Selection */}
        <AvatarSelector
          gender={formData.gender}
          selectedAvatar={formData.avatarChoice}
          onSelect={handleAvatarSelect}
        />
        
        {/* Form Fields */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <FormInput
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => updateForm('firstName', text)}
              placeholder="First name"
            />
          </View>
          <View style={{ flex: 1 }}>
            <FormInput
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => updateForm('lastName', text)}
              placeholder="Last name"
            />
          </View>
        </View>
        
        <FormInput
          label="Preferred Name"
          value={formData.preferredName}
          onChangeText={(text) => updateForm('preferredName', text)}
          placeholder="What should we call you?"
        />
        
        <FormInput
          label="Email"
          value={email}
          onChangeText={() => {}}
          placeholder=""
          editable={false}
        />
        
        <FormInput
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => updateForm('phone', text)}
          placeholder="+234 xxx xxx xxxx"
          keyboardType="phone-pad"
        />
        
        <GenderSelector
          selected={formData.gender}
          onSelect={(gender) => updateForm('gender', gender)}
        />
        
        <FormInput
          label="About Me"
          value={formData.aboutMe}
          onChangeText={(text) => updateForm('aboutMe', text)}
          placeholder="Tell us a bit about yourself..."
          multiline
        />
        
        {/* Save Button - Inside ScrollView for keyboard avoidance */}
        <View style={{ marginTop: 16, marginBottom: 32 }}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving || !hasChanges}
          >
            Save Changes
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
