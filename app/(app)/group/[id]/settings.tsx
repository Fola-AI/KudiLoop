import { View, Text, ScrollView, Pressable, Switch, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useEffect } from "react";
import { Card, Button, Avatar } from "@/components/ui";
import { colors } from "@/theme";
import { useGroup, useUpdateGroup, useGroupMembers } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: group, isLoading, error, refetch } = useGroup(id || '');
  const updateGroup = useUpdateGroup(id || '');
  
  // Fetch members for co-admin selection
  const { data: members, refetch: refetchMembers } = useGroupMembers(id || '');
  
  // Local state for toggles (will sync with API)
  // recipientVisibility: 0 = hidden, 1 = visible (so we invert for the toggle)
  // scheduleVisibility: 0 = hidden, 1 = visible (so we invert for the toggle)
  const [hideBeneficiary, setHideBeneficiary] = useState(false);
  const [hideSchedule, setHideSchedule] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState<string | null>(null);
  
  // Initialize state from group fields when loaded
  useEffect(() => {
    if (group) {
      // recipientVisibility: 0 means hidden, 1 means visible
      setHideBeneficiary(group.recipientVisibility === 0);
      setHideSchedule(group.scheduleVisibility === 0);
    }
  }, [group?.recipientVisibility, group?.scheduleVisibility]);
  
  // Determine user role
  const currentUserId = currentUser?.id;
  const membersList = group?.members || [];
  const currentUserMember = membersList.find(m => m.userId === currentUserId);
  const isGroupOwner = group?.userId === currentUserId || currentUserMember?.role === 'creator';
  const isGroupAdmin = Boolean(currentUserMember?.isAdmin) || currentUserMember?.role === 'creator';
  const hasAdminPrivileges = isGroupOwner || isGroupAdmin;
  
  // Exit/Delete logic
  const canExitGroup = group?.status === 'pending'; // Only can exit pending groups
  const isActiveGroup = group?.status === 'active';
  
  const handleToggleBeneficiary = useCallback(async (value: boolean) => {
    if (!hasAdminPrivileges) return;
    
    const previousValue = hideBeneficiary;
    setHideBeneficiary(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // recipientVisibility: 0 = hidden, 1 = visible
      // When toggle is ON (hide=true), we send 0; when OFF, we send 1
      await updateGroup.mutateAsync({
        recipientVisibility: value ? 0 : 1,
      });
    } catch (error: any) {
      setHideBeneficiary(previousValue);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update setting';
      Alert.alert('Error', errorMessage);
      if (__DEV__) console.error('Toggle beneficiary error:', error);
    }
  }, [updateGroup, hasAdminPrivileges, hideBeneficiary]);
  
  const handleToggleSchedule = useCallback(async (value: boolean) => {
    if (!hasAdminPrivileges) return;
    
    const previousValue = hideSchedule;
    setHideSchedule(value);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // scheduleVisibility: 0 = hidden, 1 = visible
      // When toggle is ON (hide=true), we send 0; when OFF, we send 1
      await updateGroup.mutateAsync({
        scheduleVisibility: value ? 0 : 1,
      });
    } catch (error: any) {
      setHideSchedule(previousValue);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update setting';
      Alert.alert('Error', errorMessage);
      if (__DEV__) console.error('Toggle schedule error:', error);
    }
  }, [updateGroup, hasAdminPrivileges, hideSchedule]);
  
  // Handle co-admin toggle
  const handleToggleCoAdmin = useCallback(async (memberId: string, memberName: string, isCurrentlyAdmin: boolean) => {
    if (!isGroupOwner || isUpdatingAdmin) return; // Prevent double-tap
    
    setIsUpdatingAdmin(memberId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // IMPORTANT: Send boolean, not number!
    // If currently admin (isCurrentlyAdmin=true), send false to remove admin
    // If not admin (isCurrentlyAdmin=false), send true to make admin
    const newAdminStatus = !isCurrentlyAdmin;
    
    console.log('🔧 [CO-ADMIN] Starting toggle:', { memberId, memberName, isCurrentlyAdmin, newAdminStatus });
    
    try {
      // Toggle co-admin status - API expects { isAdmin: boolean }
      const response = await api.patch(`/groups/${id}/members/${memberId}/admin`, {
        isAdmin: newAdminStatus
      });
      
      console.log('🔧 [CO-ADMIN] API Response:', response.status, JSON.stringify(response?.data));
      
      // Invalidate and refetch to get persisted data from server
      await queryClient.invalidateQueries({ queryKey: ['groups', id, 'members'] });
      await queryClient.invalidateQueries({ queryKey: ['groups', id] });
      await refetchMembers();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.log('🔧 [CO-ADMIN] Error:', error?.response?.status, error?.response?.data || error?.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update admin status';
      Alert.alert('Error', errorMessage);
      if (__DEV__) console.error('Toggle co-admin error:', error);
    } finally {
      setIsUpdatingAdmin(null);
    }
  }, [id, queryClient, isGroupOwner, refetchMembers, isUpdatingAdmin]);
  
  const handleExitGroup = useCallback(async () => {
    if (!canExitGroup || !currentUserMember?.id) return;
    
    setIsExiting(true);
    try {
      await api.delete(`/groups/${id}/members/${currentUserMember.id}`);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      
      Alert.alert('Success', 'You have left the group.', [
        { text: 'OK', onPress: () => router.replace('/(app)/(tabs)/groups') }
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to leave group. Please try again.');
    } finally {
      setIsExiting(false);
    }
  }, [canExitGroup, currentUserMember?.id, id, queryClient]);
  
  const handleDeleteGroup = useCallback(async () => {
    if (!canExitGroup || !isGroupOwner) return;
    
    setIsExiting(true);
    try {
      await api.delete(`/groups/${id}`);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      
      Alert.alert('Success', 'Group has been deleted.', [
        { text: 'OK', onPress: () => router.replace('/(app)/(tabs)/groups') }
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete group. Please try again.');
    } finally {
      setIsExiting(false);
    }
  }, [canExitGroup, isGroupOwner, id, queryClient]);
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Group Settings",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading...</Text>
        </View>
      </>
    );
  }
  
  // Error state
  if (error || !group) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Group Settings",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Could not load settings
          </Text>
          <Button onPress={() => refetch()} style={{ marginTop: 20 }}>
            Retry
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
          headerTitle: "Group Settings",
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
      
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, paddingBottom: 32 }}>
          {/* Group Info */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>
              {group.name}
            </Text>
          </View>
          
          {/* Privacy Settings - Visible to all, editable by admins only */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              Privacy Settings
            </Text>
            
            <Card>
              {/* Hide Receiving This Cycle */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingVertical: 4,
                opacity: hasAdminPrivileges ? 1 : 0.5,
              }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '500', fontSize: 15 }}>
                    Hide "Receiving This Cycle"
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                    When ON, only admins see who's receiving. Participants won't see the beneficiary.
                  </Text>
                </View>
                <Switch
                  value={hideBeneficiary}
                  onValueChange={hasAdminPrivileges ? handleToggleBeneficiary : undefined}
                  disabled={!hasAdminPrivileges}
                  trackColor={{ false: colors.border, true: colors.primary.DEFAULT + "80" }}
                  thumbColor={hideBeneficiary ? colors.primary.DEFAULT : colors.cardElevated}
                />
              </View>
              
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16 }} />
              
              {/* Hide Schedule */}
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingVertical: 4,
                opacity: hasAdminPrivileges ? 1 : 0.5,
              }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ color: colors.text, fontWeight: '500', fontSize: 15 }}>
                    Hide Schedule List
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                    When ON, participants see a blurred schedule. Only admins see the full rotation order.
                  </Text>
                </View>
                <Switch
                  value={hideSchedule}
                  onValueChange={hasAdminPrivileges ? handleToggleSchedule : undefined}
                  disabled={!hasAdminPrivileges}
                  trackColor={{ false: colors.border, true: colors.primary.DEFAULT + "80" }}
                  thumbColor={hideSchedule ? colors.primary.DEFAULT : colors.cardElevated}
                />
              </View>
              
              {/* Admin-only notice for non-admins */}
              {!hasAdminPrivileges && (
                <View style={{ 
                  marginTop: 16, 
                  paddingTop: 12, 
                  borderTopWidth: 1, 
                  borderTopColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                  <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginLeft: 6 }}>
                    Only group admins can change these settings
                  </Text>
                </View>
              )}
            </Card>
          </View>
          
          {/* Group Actions - Only for admins */}
          {hasAdminPrivileges && (
            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
                Group Actions
              </Text>
              
              {/* Horizontal layout for action buttons */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Edit Group */}
                <Card style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert('Coming Soon', 'Edit group feature will be available soon.');
                    }}
                    style={({ pressed }) => ({
                      alignItems: 'center',
                      paddingVertical: 8,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: colors.primary.DEFAULT + "20",
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}>
                      <Ionicons name="pencil-outline" size={24} color={colors.primary.DEFAULT} />
                    </View>
                    <Text style={{ color: colors.text, fontWeight: '500', fontSize: 13 }}>Edit Group</Text>
                  </Pressable>
                </Card>
              </View>
            </View>
          )}
          
          {/* Co-Admin Selection - Only for group creator */}
          {isGroupOwner && members && members.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                Co-Admin
              </Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
                Select a member to help manage this group
              </Text>
              
              <Card padding="none">
                {members
                  .filter(m => m.role !== 'creator') // Exclude the creator
                  .map((member, index, filteredMembers) => {
                    const memberName = member.name || 
                      `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim() || 
                      'Member';
                    const isAdmin = member.isAdmin === 1;
                    const isUpdating = isUpdatingAdmin === member.id;
                    
                    return (
                      <Pressable
                        key={member.id}
                        onPress={() => handleToggleCoAdmin(member.id, memberName, isAdmin)}
                        disabled={isUpdating}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          gap: 12,
                          borderBottomWidth: index < filteredMembers.length - 1 ? 1 : 0,
                          borderBottomColor: colors.border,
                        }}
                      >
                        {/* Checkbox - first item */}
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={colors.primary.DEFAULT} style={{ width: 26, height: 26 }} />
                        ) : (
                          <Ionicons 
                            name={isAdmin ? "checkbox" : "square-outline"} 
                            size={26} 
                            color={isAdmin ? colors.primary.DEFAULT : "#71717A"} 
                          />
                        )}
                        
                        {/* Avatar - second item */}
                        <Avatar name={memberName} size="md" />
                        
                        {/* Name - third item, takes remaining space */}
                        <Text style={{ color: colors.text, fontWeight: '500', fontSize: 15, flex: 1 }}>
                          {memberName}
                        </Text>
                        
                        {/* Co-Admin Badge - shows when admin */}
                        {isAdmin && (
                          <View style={{
                            backgroundColor: colors.primary.DEFAULT + '20',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}>
                            <Text style={{ color: colors.primary.DEFAULT, fontSize: 11, fontWeight: '600' }}>
                              Co-Admin
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                
                {members.filter(m => m.role !== 'creator').length === 0 && (
                  <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 16, paddingHorizontal: 16 }}>
                    No members available to assign as co-admin
                  </Text>
                )}
              </Card>
            </View>
          )}
          
          {/* Danger Zone - Different for owners vs participants */}
          <View style={{ paddingHorizontal: 16, paddingTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.error.DEFAULT, marginBottom: 12 }}>
              Danger Zone
            </Text>
            
            {/* Delete Group - Only for owners */}
            {isGroupOwner && (
              <Card style={{ 
                borderColor: canExitGroup ? colors.error.DEFAULT + "30" : colors.border, 
                borderWidth: 1,
                marginBottom: 12,
                opacity: canExitGroup ? 1 : 0.5,
              }}>
                <Pressable
                  onPress={() => {
                    if (!canExitGroup) {
                      Alert.alert(
                        'Cannot Delete',
                        'You cannot delete an active group. Wait until all cycles are completed.'
                      );
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    Alert.alert(
                      'Delete Group',
                      'Are you sure you want to delete this group? This action cannot be undone and all members will be removed.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: handleDeleteGroup,
                        },
                      ]
                    );
                  }}
                  disabled={isExiting}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.error.DEFAULT + "20",
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="trash-outline" size={20} color={colors.error.DEFAULT} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.error.DEFAULT, fontWeight: '500' }}>Delete Group</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                      {canExitGroup ? 'Permanently remove this group' : 'Not available for active groups'}
                    </Text>
                  </View>
                  {isExiting && <ActivityIndicator size="small" color={colors.error.DEFAULT} />}
                </Pressable>
              </Card>
            )}
            
            {/* Exit Group - For non-owners */}
            {!isGroupOwner && (
              <Card style={{ 
                borderColor: canExitGroup ? colors.error.DEFAULT + "30" : colors.border, 
                borderWidth: 1,
                opacity: canExitGroup ? 1 : 0.5,
              }}>
                <Pressable
                  onPress={() => {
                    if (!canExitGroup) {
                      Alert.alert(
                        'Cannot Leave',
                        'You cannot leave an active group. Wait until all cycles are completed.'
                      );
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    Alert.alert(
                      'Leave Group',
                      'Are you sure you want to leave this group? You will need a new invitation to rejoin.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Leave', 
                          style: 'destructive',
                          onPress: handleExitGroup,
                        },
                      ]
                    );
                  }}
                  disabled={isExiting}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: colors.error.DEFAULT + "20",
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons name="exit-outline" size={20} color={colors.error.DEFAULT} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: colors.error.DEFAULT, fontWeight: '500' }}>Leave Group</Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                      {canExitGroup ? 'Exit and remove yourself from this group' : 'Not available for active groups'}
                    </Text>
                  </View>
                  {isExiting && <ActivityIndicator size="small" color={colors.error.DEFAULT} />}
                </Pressable>
              </Card>
            )}
            
            {/* Info text about active groups */}
            {isActiveGroup && (
              <View style={{ 
                marginTop: 12,
                padding: 12,
                backgroundColor: colors.warning.muted,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="information-circle" size={20} color={colors.warning.DEFAULT} />
                <Text style={{ color: colors.warning.DEFAULT, fontSize: 13, marginLeft: 8, flex: 1 }}>
                  {isGroupOwner 
                    ? "You cannot delete an active group. Complete all cycles first."
                    : "You cannot leave an active group. Complete all cycles first."}
                </Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
