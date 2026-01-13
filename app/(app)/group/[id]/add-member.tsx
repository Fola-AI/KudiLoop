import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback } from "react";
import { Card, Button, Avatar } from "@/components/ui";
import { colors } from "@/theme";
import { useGroup, useGroupMembers } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

export default function AddMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: group, isLoading: groupLoading, refetch: refetchGroup } = useGroup(id || '');
  const { refetch: refetchMembers } = useGroupMembers(id || '');
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = fullName.trim().length >= 2 && isValidEmail(email);
  
  // Determine user role
  const currentUserId = currentUser?.id;
  const membersList = group?.members || [];
  const currentUserMember = membersList.find(m => m.userId === currentUserId);
  const isGroupOwner = group?.userId === currentUserId || currentUserMember?.role === 'creator';
  const isGroupAdmin = Boolean(currentUserMember?.isAdmin) || currentUserMember?.role === 'creator';
  const hasAdminPrivileges = isGroupOwner || isGroupAdmin;
  
  const handleAddMember = useCallback(async () => {
    if (!isFormValid || !id) return;
    
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Call API to add member
      await api.post(`/groups/${id}/members`, {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim() || undefined,
        createAccount: true, // Signal to backend to create account if doesn't exist
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Clear form
      setFullName('');
      setEmail('');
      setPhoneNumber('');
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['groups', id] });
      queryClient.invalidateQueries({ queryKey: ['groups', id, 'members'] });
      await Promise.all([refetchGroup(), refetchMembers()]);
      
      safeAlert(
        'Member Added!',
        `${fullName.trim()} has been added to the group. They will receive an email invitation to join.`,
        [
          { text: 'Add Another', style: 'default' },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
      
    } catch (error: any) {
      if (__DEV__) console.error('Add member error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to add member. Please try again.';
      safeAlert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  }, [id, fullName, email, phoneNumber, isFormValid, refetchGroup, refetchMembers, queryClient]);
  
  // Loading state
  if (groupLoading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Add Member",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      </>
    );
  }
  
  // Check permissions
  if (!hasAdminPrivileges) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Add Member",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
            Only group admins can add members
          </Text>
          <Button variant="secondary" onPress={() => router.back()} style={{ marginTop: 20 }}>
            Go Back
          </Button>
        </View>
      </>
    );
  }
  
  // Check if group is pending
  if (group?.status !== 'pending') {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Add Member",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="information-circle-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>
            Members can only be added to pending groups
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
            This group is already active or completed.
          </Text>
          <Button variant="secondary" onPress={() => router.back()} style={{ marginTop: 20 }}>
            Go Back
          </Button>
        </View>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Add Member",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={{ flex: 1, backgroundColor: colors.background }}
          keyboardShouldPersistTaps="handled"
        >
          <SafeAreaView edges={["bottom"]} style={{ flex: 1, paddingBottom: 32 }}>
            {/* Info Banner */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <View style={{
                backgroundColor: colors.primary.DEFAULT + "15",
                padding: 16,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}>
                <Ionicons name="information-circle" size={24} color={colors.primary.DEFAULT} />
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 14, marginLeft: 12, flex: 1 }}>
                  Adding a member will create an account for them if they don't have one. They'll receive an email to set up their password and join the group.
                </Text>
              </View>
            </View>
            
            {/* Form */}
            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
                Member Details
              </Text>
              
              <Card>
                {/* Full Name */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.text, fontWeight: '500', marginBottom: 8 }}>
                    Full Name <Text style={{ color: colors.error.DEFAULT }}>*</Text>
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.cardElevated,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: fullName.length > 0 && fullName.length < 2 ? colors.error.DEFAULT : colors.border,
                    paddingHorizontal: 16,
                  }}>
                    <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Enter full name"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingLeft: 12,
                        color: colors.text,
                        fontSize: 16,
                      }}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                  {fullName.length > 0 && fullName.length < 2 && (
                    <Text style={{ color: colors.error.DEFAULT, fontSize: 12, marginTop: 4 }}>
                      Name must be at least 2 characters
                    </Text>
                  )}
                </View>
                
                {/* Email */}
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: colors.text, fontWeight: '500', marginBottom: 8 }}>
                    Email Address <Text style={{ color: colors.error.DEFAULT }}>*</Text>
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.cardElevated,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: email.length > 0 && !isValidEmail(email) ? colors.error.DEFAULT : colors.border,
                    paddingHorizontal: 16,
                  }}>
                    <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="Enter email address"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingLeft: 12,
                        color: colors.text,
                        fontSize: 16,
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                  {email.length > 0 && !isValidEmail(email) && (
                    <Text style={{ color: colors.error.DEFAULT, fontSize: 12, marginTop: 4 }}>
                      Please enter a valid email address
                    </Text>
                  )}
                </View>
                
                {/* Phone Number (Optional) */}
                <View>
                  <Text style={{ color: colors.text, fontWeight: '500', marginBottom: 8 }}>
                    Phone Number <Text style={{ color: colors.textMuted }}>(Optional)</Text>
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.cardElevated,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 16,
                  }}>
                    <Ionicons name="call-outline" size={20} color={colors.textMuted} />
                    <TextInput
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholder="Enter phone number"
                      placeholderTextColor={colors.textMuted}
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        paddingLeft: 12,
                        color: colors.text,
                        fontSize: 16,
                      }}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              </Card>
            </View>
            
            {/* Preview */}
            {fullName.trim() && (
              <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textMuted, marginBottom: 12 }}>
                  Preview
                </Text>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar name={fullName.trim()} size="lg" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: 16 }}>
                        {fullName.trim()}
                      </Text>
                      {email && (
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                          {email}
                        </Text>
                      )}
                      {phoneNumber && (
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                          {phoneNumber}
                        </Text>
                      )}
                    </View>
                  </View>
                </Card>
              </View>
            )}
            
            {/* Submit Button */}
            <View style={{ paddingHorizontal: 16, paddingTop: 32 }}>
              <Button
                variant="primary"
                size="lg"
                onPress={handleAddMember}
                disabled={!isFormValid || isSubmitting}
                style={{ opacity: !isFormValid ? 0.5 : 1 }}
              >
                {isSubmitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={{ color: colors.white, marginLeft: 8, fontWeight: '600' }}>Adding...</Text>
                  </View>
                ) : (
                  'Add Member'
                )}
              </Button>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

