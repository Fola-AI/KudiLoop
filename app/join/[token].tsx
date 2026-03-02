import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useEffect } from "react";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { Card, Button, AvatarStack, Input } from "@/components/ui";
import { colors } from "@/theme";
import { formatCurrency } from "@/utils";
import { useInviteInfo } from "@/hooks/api/useInvite";
import { useJoinGroup } from "@/hooks/api/useGroups";
import { useAuth } from "@/contexts/AuthContext";

export default function JoinGroupScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { isSignedIn, user, clerkUser } = useAuth();
  const { data: inviteData, isLoading, error } = useInviteInfo(token || '');
  const joinGroup = useJoinGroup();
  const [isJoining, setIsJoining] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  const userFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const clerkFullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ').trim();
  const authName = (user?.preferredName || userFullName || clerkFullName || '').trim();
  const authPhone = (user?.phone || '').trim();
  
  useEffect(() => {
    if (!name && authName) {
      setName(authName);
    }
  }, [authName, name]);
  
  useEffect(() => {
    if (!phone && authPhone) {
      setPhone(authPhone);
    }
  }, [authPhone, phone]);
  
  const needsNameInput = isSignedIn && !authName;
  const needsPhoneInput = isSignedIn && !authPhone;
  const nameToSend = (authName || name).trim();
  const phoneToSend = (authPhone || phone).trim();
  const isJoinDisabled = isJoining || (isSignedIn && (!nameToSend || !phoneToSend));
  
  // Determine state from API response
  const getInviteState = () => {
    if (isLoading) return "loading";
    if (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error as Error).message || '';
      if (errorMessage.toLowerCase().includes('expired')) return "expired";
      if (errorMessage.toLowerCase().includes('used')) return "used_up";
      if (errorMessage.toLowerCase().includes('member')) return "already_member";
      return "invalid";
    }
    if (inviteData) return "valid";
    return "invalid";
  };
  
  const state = getInviteState();
  
  const handleJoin = async () => {
    if (!token || !inviteData) return;
    
    // If not signed in, redirect to auth
    if (!isSignedIn) {
      safeAlert(
        "Sign In Required",
        "You need to sign in or create an account to join this group.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Sign In", 
            onPress: () => router.push(`/(auth)/sign-in?redirect=/join/${token}`)
          },
        ]
      );
      return;
    }
    
    if (!nameToSend || !phoneToSend) {
      safeAlert("Missing Info", "Please enter your name and phone number to join this group.");
      return;
    }
    
    setIsJoining(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      await joinGroup.mutateAsync({ token, name: nameToSend, phone: phoneToSend });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to the group
      router.replace(`/group/${inviteData.group.id}`);
    } catch (err: any) {
      if (__DEV__) console.error('Failed to join group:', err);
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message;
      const status = err?.response?.status;
      
      if (status === 409 || errorMessage?.toLowerCase().includes('already a member')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        safeAlert(
          "Already a Member",
          "You're already a member of this group.",
          [
            { text: "Go to Group", onPress: () => router.replace(`/group/${inviteData.group.id}`) },
            { text: "OK", style: "cancel" },
          ]
        );
        return;
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      safeAlert("Error", errorMessage || "Failed to join group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };
  
  // Loading State
  if (state === "loading") {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: "Group Invite" }} />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View entering={ZoomIn} style={{ alignItems: 'center' }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,107,53,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="link" size={40} color={colors.primary.DEFAULT} />
            </View>
            <ActivityIndicator size="small" color={colors.primary.DEFAULT} style={{ marginBottom: 8 }} />
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>Validating invite...</Text>
            <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Please wait</Text>
          </Animated.View>
        </View>
      </>
    );
  }
  
  // Error States
  if (state === "expired" || state === "invalid" || state === "used_up") {
    const errorConfig = {
      expired: {
        icon: "time-outline" as const,
        title: "Link Expired",
        message: "This invite link has expired. Ask the group admin for a new one.",
      },
      invalid: {
        icon: "close-circle-outline" as const,
        title: "Invalid Link",
        message: "This invite link is not valid. Please check the link and try again.",
      },
      used_up: {
        icon: "people-outline" as const,
        title: "Link Used Up",
        message: "This invite link has reached its maximum uses. Ask the group admin for a new one.",
      },
    };
    
    const config = errorConfig[state];
    
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: "Group Invite" }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Animated.View entering={ZoomIn} style={{ alignItems: 'center' }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(239,68,68,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name={config.icon} size={40} color="#ef4444" />
              </View>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                {config.title}
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }}>
                {config.message}
              </Text>
              <Button
                variant="secondary"
                onPress={() => router.replace("/(app)/(tabs)")}
                style={{ marginTop: 32 }}
              >
                Go to Home
              </Button>
            </Animated.View>
          </View>
        </SafeAreaView>
      </>
    );
  }
  
  // Already Member State
  if (state === "already_member" && inviteData) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: "Group Invite" }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Animated.View entering={ZoomIn} style={{ alignItems: 'center' }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(34,197,94,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="checkmark-circle" size={40} color={colors.success.DEFAULT} />
              </View>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
                Already a Member
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 8 }}>
                You're already a member of "{inviteData.group.name}"
              </Text>
              <Button
                variant="primary"
                onPress={() => router.replace(`/group/${inviteData.group.id}`)}
                style={{ marginTop: 32 }}
              >
                Go to Group
              </Button>
            </Animated.View>
          </View>
        </SafeAreaView>
      </>
    );
  }
  
  // Valid Invite - Show group preview
  if (state === "valid" && inviteData) {
    const group = inviteData.group;
    const memberNames = group.members?.map(m => m.name || m.email || 'Member') || [];
    
    return (
      <>
        <Stack.Screen options={{ headerShown: true, headerTitle: "Group Invite" }} />
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
            {/* Header */}
            <Animated.View entering={FadeIn} style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: 'rgba(255,107,53,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="people" size={40} color={colors.primary.DEFAULT} />
              </View>
              <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', textAlign: 'center' }}>
                You're Invited!
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 4 }}>
                {inviteData.creatorName || 'Someone'} invited you to join
              </Text>
            </Animated.View>
            
            {/* Group Card */}
            <Animated.View entering={FadeInDown.delay(100)}>
              <Card variant="elevated" style={{ padding: 20, marginBottom: 16 }}>
                <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 4 }}>
                  {group.name}
                </Text>
                {group.description && (
                  <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
                    {group.description}
                  </Text>
                )}
                
                {/* Stats */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <View style={{ backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>Contribution</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {formatCurrency(group.contributionAmount, group.currency)}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>Frequency</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }}>
                      {group.frequency}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: '#1f2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                    <Text style={{ color: '#6b7280', fontSize: 11 }}>Members</Text>
                    <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                      {group.memberCount}{group.maxMembers ? `/${group.maxMembers}` : ''}
                    </Text>
                  </View>
                </View>
                
                {/* Members Preview */}
                {memberNames.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AvatarStack 
                      names={memberNames} 
                      max={4}
                      size="sm"
                    />
                    <Text style={{ color: '#6b7280', fontSize: 13, marginLeft: 8 }}>
                      {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                )}
              </Card>
            </Animated.View>
            
            {(needsNameInput || needsPhoneInput) && (
              <Animated.View entering={FadeInDown.delay(150)}>
                <Card style={{ padding: 16, marginBottom: 16 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 6 }}>
                    Your details
                  </Text>
                  <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 12 }}>
                    We need this to add you to the group.
                  </Text>
                  <View style={{ gap: 12 }}>
                    {needsNameInput && (
                      <Input
                        label="Full name"
                        placeholder="Enter your full name"
                        autoCapitalize="words"
                        value={name}
                        onChangeText={setName}
                        textContentType="name"
                      />
                    )}
                    {needsPhoneInput && (
                      <Input
                        label="Phone number"
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        textContentType="telephoneNumber"
                      />
                    )}
                  </View>
                </Card>
              </Animated.View>
            )}
            
            {/* How it works */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Card style={{ padding: 16, marginBottom: 16 }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
                  How it works
                </Text>
                
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color: colors.primary.DEFAULT, fontSize: 12, fontWeight: 'bold' }}>1</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Everyone contributes</Text>
                      <Text style={{ color: '#6b7280', fontSize: 13 }}>
                        Each member pays {formatCurrency(group.contributionAmount, group.currency)} {group.frequency}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color: colors.primary.DEFAULT, fontSize: 12, fontWeight: 'bold' }}>2</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>One person receives</Text>
                      <Text style={{ color: '#6b7280', fontSize: 13 }}>
                        Each cycle, one member receives the full pot
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,107,53,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color: colors.primary.DEFAULT, fontSize: 12, fontWeight: 'bold' }}>3</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>Everyone gets a turn</Text>
                      <Text style={{ color: '#6b7280', fontSize: 13 }}>
                        The cycle repeats until everyone has received
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </Animated.View>
            
            {/* Warning for ongoing group */}
            {group.currentCycle && group.currentCycle > 1 && (
              <Animated.View entering={FadeInDown.delay(300)}>
                <View style={{ 
                  padding: 16, 
                  backgroundColor: 'rgba(245,158,11,0.1)', 
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}>
                  <Ionicons name="warning" size={20} color={colors.warning.DEFAULT} style={{ marginRight: 8, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.warning.DEFAULT, fontSize: 14, fontWeight: '600' }}>
                      Group in Progress
                    </Text>
                    <Text style={{ color: '#fbbf24', fontSize: 13, marginTop: 2 }}>
                      This group is on cycle {group.currentCycle} of {group.totalCycles}. 
                      You'll join the rotation after current members.
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
            
            {/* Sign in notice for unauthenticated users */}
            {!isSignedIn && (
              <Animated.View entering={FadeInDown.delay(400)}>
                <View style={{ 
                  padding: 16, 
                  backgroundColor: 'rgba(59,130,246,0.1)', 
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}>
                  <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600' }}>
                      Sign In Required
                    </Text>
                    <Text style={{ color: '#60a5fa', fontSize: 13, marginTop: 2 }}>
                      You'll need to sign in or create an account to join this group.
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </ScrollView>
          
          {/* Bottom CTA */}
          <SafeAreaView edges={['bottom']} style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: '#1f2937',
            padding: 16,
          }}>
            <Button
              variant="primary"
              size="lg"
              onPress={handleJoin}
              loading={isJoining}
              disabled={isJoinDisabled}
            >
              {isSignedIn ? `Join ${group.name}` : 'Sign In to Join'}
            </Button>
            <Pressable
              onPress={() => router.back()}
              style={{ alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ color: '#6b7280', fontSize: 14 }}>Maybe later</Text>
            </Pressable>
          </SafeAreaView>
        </SafeAreaView>
      </>
    );
  }
  
  return null;
}
