import { View, Text, ScrollView, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useMemo } from "react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { colors } from "@/theme";
import { formatCurrency } from "@/utils";
import { useGroup, useGroupMembers, useUpdateRotationOrder } from "@/hooks/api";
import { getErrorMessage } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import type { CurrencyCode } from "@/types";
import type { Member } from "@/types/api";

type CycleStatus = "completed" | "active" | "upcoming";

interface ScheduleCycle {
  cycle: number;
  date: string;
  member: Member;
  status: CycleStatus;
  isYou: boolean;
  canDrag: boolean;
}

// Static (non-draggable) schedule item component
function StaticScheduleItem({ 
  cycle, 
  isLast,
  totalMembers,
  contributionAmount,
  currency,
  currentCycle,
}: { 
  cycle: ScheduleCycle;
  isLast: boolean;
  totalMembers: number;
  contributionAmount: number;
  currency: CurrencyCode;
  currentCycle: number;
}) {
  const statusConfig: Record<CycleStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; bgColor: string }> = {
    completed: { 
      color: colors.success.DEFAULT, 
      icon: "checkmark-circle",
      bgColor: colors.success.muted,
    },
    active: { 
      color: colors.primary.DEFAULT, 
      icon: "radio-button-on",
      bgColor: colors.primary.DEFAULT + "33",
    },
    upcoming: { 
      color: colors.textSubtle, 
      icon: "ellipse-outline",
      bgColor: colors.cardElevated,
    },
  };
  
  const config = statusConfig[cycle.status];
  const cyclesUntilTurn = cycle.cycle - currentCycle;
  
  const getMemberName = () => {
    if (!cycle.member) return 'TBD';
    const firstName = String(cycle.member.user?.firstName || '');
    const lastName = String(cycle.member.user?.lastName || '');
    const directName = String(cycle.member.name || '');
    const email = String(cycle.member.user?.email || '');
    const fullNameFromUser = `${firstName} ${lastName}`.trim();
    return directName || fullNameFromUser || email || 'Member';
  };
  const memberName = getMemberName();
  
  return (
    <View style={{ flexDirection: "row" }}>
      {/* Timeline Line */}
      <View style={{ width: 48, alignItems: "center" }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: config.bgColor,
        }}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        {!isLast && (
          <View 
            style={{ 
              width: 2, 
              flex: 1, 
              minHeight: 60,
              backgroundColor: cycle.status === "completed" ? colors.success.DEFAULT + "80" : colors.border,
            }}
          />
        )}
      </View>
      
      {/* Content */}
      <View style={{ flex: 1, paddingBottom: 16, marginLeft: 12 }}>
        <Card 
          variant={cycle.status === "active" ? "elevated" : "default"} 
          style={cycle.isYou ? { borderWidth: 1, borderColor: colors.primary.DEFAULT } : undefined}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
              <Avatar name={memberName} size="md" />
              <View style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <Text 
                    style={{ 
                      fontWeight: "600",
                      color: cycle.status === "completed" ? colors.textMuted : colors.text,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                  >
                    {memberName}
                  </Text>
                  {cycle.isYou && (
                    <Badge variant="info">You</Badge>
                  )}
                </View>
                <Text style={{ color: colors.textSubtle, fontSize: 13, marginTop: 2 }}>{cycle.date}</Text>
              </View>
            </View>
            
            <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
              <Badge 
                variant={
                  cycle.status === "completed" ? "success" : 
                  cycle.status === "active" ? "warning" : "default"
                }
              >
                {cycle.status === "completed" ? "Received" : 
                 cycle.status === "active" ? "Current" : `Cycle ${cycle.cycle}`}
              </Badge>
              <Text style={{ color: colors.textSubtle, fontSize: 11, marginTop: 4 }}>
                {formatCurrency(contributionAmount * totalMembers, currency)}
              </Text>
            </View>
          </View>
          
          {cycle.status === "active" && (
            <View style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTopWidth: 1, 
              borderTopColor: colors.border,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="time-outline" size={16} color={colors.warning.DEFAULT} />
                <Text style={{ color: colors.warning.DEFAULT, fontSize: 13, marginLeft: 8 }}>
                  Contributions in progress
                </Text>
              </View>
            </View>
          )}
          
          {cycle.isYou && cycle.status === "upcoming" && (
            <View style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTopWidth: 1, 
              borderTopColor: colors.primary.DEFAULT + "50",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={16} color={colors.primary.DEFAULT} />
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, marginLeft: 8 }}>
                  Your payout is in {cyclesUntilTurn} cycle{cyclesUntilTurn > 1 ? "s" : ""}!
                </Text>
              </View>
            </View>
          )}
        </Card>
      </View>
    </View>
  );
}

// Draggable schedule item component
function DraggableScheduleItem({ 
  cycle, 
  isLast,
  totalMembers,
  contributionAmount,
  currency,
  currentCycle,
  drag,
  isActive,
}: { 
  cycle: ScheduleCycle;
  isLast: boolean;
  totalMembers: number;
  contributionAmount: number;
  currency: CurrencyCode;
  currentCycle: number;
  drag: () => void;
  isActive: boolean;
}) {
  const statusConfig: Record<CycleStatus, { color: string; icon: keyof typeof Ionicons.glyphMap; bgColor: string }> = {
    completed: { 
      color: colors.success.DEFAULT, 
      icon: "checkmark-circle",
      bgColor: colors.success.muted,
    },
    active: { 
      color: colors.primary.DEFAULT, 
      icon: "radio-button-on",
      bgColor: colors.primary.DEFAULT + "33",
    },
    upcoming: { 
      color: colors.textSubtle, 
      icon: "ellipse-outline",
      bgColor: colors.cardElevated,
    },
  };
  
  const config = statusConfig[cycle.status];
  const cyclesUntilTurn = cycle.cycle - currentCycle;
  
  const getMemberName = () => {
    if (!cycle.member) return 'TBD';
    const firstName = String(cycle.member.user?.firstName || '');
    const lastName = String(cycle.member.user?.lastName || '');
    const directName = String(cycle.member.name || '');
    const email = String(cycle.member.user?.email || '');
    const fullNameFromUser = `${firstName} ${lastName}`.trim();
    return directName || fullNameFromUser || email || 'Member';
  };
  const memberName = getMemberName();
  
  return (
    <View style={{ flexDirection: "row", opacity: isActive ? 0.9 : 1 }}>
      {/* Timeline Line */}
      <View style={{ width: 48, alignItems: "center" }}>
        <View style={{ 
          width: 40, 
          height: 40, 
          borderRadius: 20, 
          alignItems: "center", 
          justifyContent: "center",
          backgroundColor: config.bgColor,
        }}>
          <Ionicons name={config.icon} size={24} color={config.color} />
        </View>
        {!isLast && (
          <View 
            style={{ 
              width: 2, 
              flex: 1, 
              minHeight: 60,
              backgroundColor: colors.border,
            }}
          />
        )}
      </View>
      
      {/* Content */}
      <View style={{ flex: 1, paddingBottom: 16, marginLeft: 12 }}>
        <Card 
          variant="default" 
          style={[
            cycle.isYou ? { borderWidth: 1, borderColor: colors.primary.DEFAULT } : undefined,
            isActive ? { transform: [{ scale: 1.02 }], shadowOpacity: 0.3, elevation: 8 } : undefined,
          ]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
              {/* Drag Handle */}
              <View 
                style={{ 
                  marginRight: 8,
                  padding: 4,
                }}
                onTouchStart={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  drag();
                }}
              >
                <Ionicons name="reorder-three" size={24} color={colors.textMuted} />
              </View>
              <Avatar name={memberName} size="md" />
              <View style={{ marginLeft: 12, flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                  <Text 
                    style={{ fontWeight: "600", color: colors.text, flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {memberName}
                  </Text>
                  {cycle.isYou && (
                    <Badge variant="info">You</Badge>
                  )}
                </View>
                <Text style={{ color: colors.textSubtle, fontSize: 13, marginTop: 2 }}>{cycle.date}</Text>
              </View>
            </View>
            
            <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
              <Badge variant="default">
                Cycle {cycle.cycle}
              </Badge>
              <Text style={{ color: colors.textSubtle, fontSize: 11, marginTop: 4 }}>
                {formatCurrency(contributionAmount * totalMembers, currency)}
              </Text>
            </View>
          </View>
          
          {cycle.isYou && (
            <View style={{ 
              marginTop: 12, 
              paddingTop: 12, 
              borderTopWidth: 1, 
              borderTopColor: colors.primary.DEFAULT + "50",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="star" size={16} color={colors.primary.DEFAULT} />
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, marginLeft: 8 }}>
                  Your payout is in {cyclesUntilTurn} cycle{cyclesUntilTurn > 1 ? "s" : ""}!
                </Text>
              </View>
            </View>
          )}
        </Card>
      </View>
    </View>
  );
}

export default function ScheduleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [localUpcomingCycles, setLocalUpcomingCycles] = useState<ScheduleCycle[] | null>(null);
  
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: group, isLoading: groupLoading, error: groupError, refetch: refetchGroup } = useGroup(id || '');
  const { data: members, isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useGroupMembers(id || '');
  const updateRotationOrder = useUpdateRotationOrder(id || '');
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([refetchGroup(), refetchMembers()]);
      setLocalUpcomingCycles(null);
      setHasChanges(false);
    } catch (e) {
      if (__DEV__) console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetchGroup, refetchMembers]);
  
  // Build schedule from members
  const schedule = useMemo(() => {
    if (!group || !members) return null;
    
    const currentUserId = currentUser?.id || group.currentUserId;
    const membersList = members || group.members || [];
    const sortedMembers = [...membersList].sort((a, b) => (a.rotationOrder || 0) - (b.rotationOrder || 0));
    const currentCycle = group.currentCycle || 1;
    const totalCycles = group.totalCycles || sortedMembers.length;
    const frequency = group.frequency || 'monthly';
    const startDate = group.startDate ? new Date(group.startDate) : new Date();
    const groupStatus = group.status || 'pending';
    
    const getPayoutDate = (cycleNum: number): string => {
      const date = new Date(startDate);
      const cycleIndex = cycleNum - 1;
      
      switch (frequency) {
        case 'weekly':
          date.setDate(date.getDate() + (cycleIndex * 7));
          break;
        case 'biweekly':
          date.setDate(date.getDate() + (cycleIndex * 14));
          break;
        case 'monthly':
        default:
          date.setMonth(date.getMonth() + cycleIndex);
          break;
      }
      
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // Build cycles - separate locked and draggable
    const lockedCycles: ScheduleCycle[] = [];
    const upcomingCycles: ScheduleCycle[] = [];
    
    for (let i = 0; i < totalCycles; i++) {
      const cycleNum = i + 1;
      const member = sortedMembers.find(m => m.rotationOrder === cycleNum) || sortedMembers[i];
      
      let status: CycleStatus = 'upcoming';
      if (cycleNum < currentCycle) status = 'completed';
      else if (cycleNum === currentCycle) status = 'active';
      
      const cycleData: ScheduleCycle = {
        cycle: cycleNum,
        date: getPayoutDate(cycleNum),
        member,
        status,
        isYou: member?.userId === currentUserId,
        canDrag: false,
      };
      
      // For pending groups: ALL can be rearranged
      // For active groups: Only upcoming can be rearranged
      if (groupStatus === 'pending') {
        cycleData.canDrag = true;
        upcomingCycles.push(cycleData);
      } else if (groupStatus === 'active') {
        if (status === 'completed' || status === 'active') {
          lockedCycles.push(cycleData);
        } else {
          cycleData.canDrag = true;
          upcomingCycles.push(cycleData);
        }
      } else {
        // Completed groups: all locked
        lockedCycles.push(cycleData);
      }
    }
    
    return {
      groupName: group.name,
      groupStatus,
      contributionAmount: group.contributionAmount,
      currency: (group.currency || 'NGN') as CurrencyCode,
      frequency,
      currentCycle,
      totalCycles,
      yourRotationOrder: group.yourPosition,
      lockedCycles,
      upcomingCycles,
    };
  }, [group, members, currentUser]);
  
  // Get the cycles to display
  const lockedCycles = schedule?.lockedCycles || [];
  const upcomingCycles = localUpcomingCycles || schedule?.upcomingCycles || [];
  
  // Handle drag end - only for upcoming cycles
  const handleDragEnd = useCallback(({ data }: { data: ScheduleCycle[] }) => {
    // Update cycle numbers based on new position (after locked cycles)
    const lockedCount = schedule?.lockedCycles.length || 0;
    const updatedCycles = data.map((cycle, index) => ({
      ...cycle,
      cycle: lockedCount + index + 1,
    }));
    setLocalUpcomingCycles(updatedCycles);
    setHasChanges(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [schedule?.lockedCycles.length]);
  
  // Save the new order to the API
  const handleSaveOrder = useCallback(async () => {
    if (!localUpcomingCycles || !id || !schedule) return;
    
    try {
      // Build the complete rotation order mapping (locked + reordered upcoming)
      const allCycles = [...schedule.lockedCycles, ...localUpcomingCycles];
      
      // Validate that all cycles have valid member IDs
      const rotationUpdates: { memberId: string; rotationOrder: number }[] = [];
      
      for (let i = 0; i < allCycles.length; i++) {
        const cycle = allCycles[i];
        if (!cycle.member?.id) {
          if (__DEV__) console.error(`Cycle ${i + 1} has no valid member ID:`, cycle);
          Alert.alert('Error', `Cannot save: Cycle ${i + 1} has no valid member assigned.`);
          return;
        }
        rotationUpdates.push({
          memberId: cycle.member.id,
          rotationOrder: i + 1,
        });
      }
      
      if (__DEV__) {
        console.log('📝 Saving rotation order:', JSON.stringify(rotationUpdates, null, 2));
      }
      
      // Call the mutation and wait for it to complete
      await updateRotationOrder.mutateAsync(rotationUpdates);
      
      if (__DEV__) {
        console.log('✅ API call successful');
      }
      
      // CRITICAL: Optimistically update the cache with new rotation orders
      // This ensures the UI doesn't revert while waiting for refetch
      queryClient.setQueryData(['groups', id, 'members'], (oldMembers: Member[] | undefined) => {
        if (!oldMembers) return oldMembers;
        
        const updatedMembers = oldMembers.map(member => {
          const update = rotationUpdates.find(u => u.memberId === member.id);
          if (update) {
            return { ...member, rotationOrder: update.rotationOrder };
          }
          return member;
        });
        
        if (__DEV__) {
          console.log('🔄 Cache updated with new rotation orders:', 
            updatedMembers.map(m => ({ id: m.id, order: m.rotationOrder })));
        }
        
        return updatedMembers;
      });
      
      // Clear local state AFTER updating cache
      setHasChanges(false);
      setLocalUpcomingCycles(null);
      
      // Wait a moment then refetch to ensure server data is in sync
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Refetch to get authoritative server data
      const results = await Promise.all([refetchGroup(), refetchMembers()]);
      
      if (__DEV__) {
        console.log('📥 Refetch completed:', {
          membersData: results[1].data?.map(m => ({ id: m.id, name: m.name, order: m.rotationOrder })),
        });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Rotation order has been updated!');
      
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Save rotation order error:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Use the centralized error message extractor
      const errorMessage = getErrorMessage(error);
      
      Alert.alert('Unable to Save', errorMessage);
    }
  }, [localUpcomingCycles, id, schedule, refetchGroup, refetchMembers, updateRotationOrder, queryClient]);
  
  // Cancel changes
  const handleCancelChanges = useCallback(() => {
    setLocalUpcomingCycles(null);
    setHasChanges(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  const isLoading = groupLoading || membersLoading;
  const error = groupError || membersError;
  
  // Get current user info for permission checks
  const currentUserId = currentUser?.id || group?.currentUserId;
  const membersList = members || group?.members || [];
  const currentUserMember = membersList.find(m => m.userId === currentUserId);
  
  // Check if user is admin/owner
  const isGroupOwner = Boolean(
    group?.isOwner === true || 
    currentUserMember?.role === 'creator' ||
    (group?.userId && currentUserId && group?.userId === currentUserId)
  );
  const isGroupAdmin = Boolean(
    group?.isAdmin === true || 
    currentUserMember?.isAdmin === 1
  );
  const hasAdminPrivileges = isGroupOwner || isGroupAdmin;
  
  // Check schedule visibility - admin always sees, others check visibility setting
  // scheduleVisibility: 0 = hidden, 1 = visible
  const canSeeSchedule = hasAdminPrivileges || group?.scheduleVisibility !== 0;
  
  // Check if reordering is allowed (only for admins)
  const canReorder = hasAdminPrivileges && (
    schedule?.groupStatus === 'pending' || 
    (schedule?.groupStatus === 'active' && upcomingCycles.length > 1)
  );
  
  // Render item for draggable list
  const renderDraggableItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<ScheduleCycle>) => {
    const index = getIndex() ?? 0;
    const isLast = index === upcomingCycles.length - 1;
    
    return (
      <ScaleDecorator>
        <DraggableScheduleItem
          cycle={item}
          isLast={isLast}
          totalMembers={schedule?.totalCycles || 0}
          contributionAmount={schedule?.contributionAmount || 0}
          currency={schedule?.currency || 'NGN'}
          currentCycle={schedule?.currentCycle || 1}
          drag={drag}
          isActive={isActive}
        />
      </ScaleDecorator>
    );
  }, [upcomingCycles.length, schedule]);
  
  // Loading state
  if (isLoading && !schedule) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Rotation Schedule",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading schedule...</Text>
        </View>
      </>
    );
  }
  
  // Error state
  if (error || !schedule) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Rotation Schedule",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Could not load schedule
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
            {error?.message || "Please check your connection"}
          </Text>
          <Button onPress={() => { refetchGroup(); refetchMembers(); }} style={{ marginTop: 20 }}>
            Retry
          </Button>
        </View>
      </>
    );
  }
  
  // Access restricted state - schedule hidden by admin
  if (!canSeeSchedule) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Schedule Restricted",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackTitle: "Back",
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.warning.muted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="lock-closed" size={40} color={colors.warning.DEFAULT} />
          </View>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600', marginTop: 8 }}>
            Schedule Hidden
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 12, paddingHorizontal: 32 }}>
            The group admin has restricted access to the rotation schedule. Only admins can view and manage the schedule.
          </Text>
          <Button 
            variant="secondary"
            onPress={() => router.back()} 
            style={{ marginTop: 24 }}
          >
            Go Back
          </Button>
        </View>
      </>
    );
  }
  
  const completedCycles = lockedCycles.filter(c => c.status === "completed").length;
  const allCycles = [...lockedCycles, ...upcomingCycles];
  const yourCycle = allCycles.find(c => c.isYou);
  const cyclesUntilYourTurn = yourCycle ? yourCycle.cycle - schedule.currentCycle : 0;
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Rotation Schedule",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: "Back",
        }}
      />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
        nestedScrollEnabled
      >
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, paddingBottom: 32 }}>
          {/* Summary Card */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Card variant="elevated">
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>{schedule.groupName}</Text>
                <Badge variant="success">{schedule.frequency}</Badge>
              </View>
              
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 28, fontWeight: "700", color: colors.primary.DEFAULT }}>{completedCycles}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Completed</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{schedule.totalCycles - completedCycles}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Remaining</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 28, fontWeight: "700", color: cyclesUntilYourTurn <= 0 ? colors.success.DEFAULT : colors.text }}>
                    {cyclesUntilYourTurn > 0 ? cyclesUntilYourTurn : "Now!"}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Until Your Turn</Text>
                </View>
              </View>
            </Card>
          </View>
          
          {/* Expected payout card */}
          {yourCycle && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <Card style={{ borderWidth: 1, borderColor: colors.primary.DEFAULT + "50" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    backgroundColor: colors.primary.DEFAULT + "33",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Ionicons name="gift-outline" size={24} color={colors.primary.DEFAULT} />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>Your Expected Payout</Text>
                    <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>
                      {formatCurrency(schedule.contributionAmount * schedule.totalCycles, schedule.currency)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: colors.textMuted, fontSize: 11 }}>Expected Date</Text>
                    <Text style={{ color: colors.primary.DEFAULT, fontWeight: "500" }}>{yourCycle.date}</Text>
                  </View>
                </View>
              </Card>
            </View>
          )}
          
          {/* Reorder Instructions */}
          {canReorder && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                backgroundColor: colors.primary.DEFAULT + "15",
                padding: 12,
                borderRadius: 10,
              }}>
                <Ionicons name="information-circle" size={20} color={colors.primary.DEFAULT} />
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, marginLeft: 8, flex: 1 }}>
                  {schedule.groupStatus === 'pending' 
                    ? "Drag and drop to rearrange the rotation order before the group starts."
                    : "Only members who haven't received yet can be rearranged."}
                </Text>
              </View>
            </View>
          )}
          
          {/* Save/Cancel buttons when there are changes */}
          {hasChanges && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Button 
                  variant="secondary" 
                  onPress={handleCancelChanges}
                  style={{ flex: 1 }}
                  disabled={updateRotationOrder.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onPress={handleSaveOrder}
                  style={{ flex: 1 }}
                  disabled={updateRotationOrder.isPending}
                >
                  {updateRotationOrder.isPending ? "Saving..." : "Save Order"}
                </Button>
              </View>
            </View>
          )}
          
          {/* Timeline Header */}
          <View style={{ 
            paddingHorizontal: 16, 
            paddingBottom: 12, 
            paddingTop: 8, 
            flexDirection: "row", 
            alignItems: "center", 
            justifyContent: "space-between",
          }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>Timeline</Text>
            <Text style={{ color: colors.textSubtle, fontSize: 13 }}>
              {schedule.currentCycle} of {schedule.totalCycles} cycles
            </Text>
          </View>
          
          {/* Locked Cycles (Completed + Current) - Static, non-draggable */}
          {lockedCycles.length > 0 && (
            <View style={{ paddingHorizontal: 16 }}>
              {lockedCycles.map((cycle, index) => (
                <StaticScheduleItem
                  key={`locked-${cycle.member?.id || cycle.cycle}`}
                  cycle={cycle}
                  isLast={index === lockedCycles.length - 1 && upcomingCycles.length === 0}
                  totalMembers={schedule.totalCycles}
                  contributionAmount={schedule.contributionAmount}
                  currency={schedule.currency}
                  currentCycle={schedule.currentCycle}
                />
              ))}
            </View>
          )}
          
          {/* Upcoming Cycles - Draggable (only for pending/active with upcoming members) */}
          {upcomingCycles.length > 0 && canReorder && (
            <View style={{ paddingHorizontal: 16 }}>
              <DraggableFlatList
                data={upcomingCycles}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => `drag-${item.member?.id || item.cycle}`}
                renderItem={renderDraggableItem}
                scrollEnabled={false}
              />
            </View>
          )}
          
          {/* Upcoming Cycles - Static (for completed groups or when not reorderable) */}
          {upcomingCycles.length > 0 && !canReorder && (
            <View style={{ paddingHorizontal: 16 }}>
              {upcomingCycles.map((cycle, index) => (
                <StaticScheduleItem
                  key={`upcoming-${cycle.member?.id || cycle.cycle}`}
                  cycle={cycle}
                  isLast={index === upcomingCycles.length - 1}
                  totalMembers={schedule.totalCycles}
                  contributionAmount={schedule.contributionAmount}
                  currency={schedule.currency}
                  currentCycle={schedule.currentCycle}
                />
              ))}
            </View>
          )}
        </SafeAreaView>
      </ScrollView>
    </GestureHandlerRootView>
  );
}
