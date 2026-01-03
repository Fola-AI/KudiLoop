import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback } from "react";
import { Card, Avatar, Badge, Button } from "@/components/ui";
import { colors } from "@/theme";
import { useGroup, useGroupMembers } from "@/hooks/api";
import type { Member } from "@/types/api";

function MemberCard({ 
  member, 
  isCurrentUser,
  isCurrentBeneficiary,
  isAdmin,
  groupId,
  currentCycle,
}: { 
  member: Member;
  isCurrentUser: boolean;
  isCurrentBeneficiary: boolean;
  isAdmin: boolean;
  groupId: string;
  currentCycle: number;
}) {
  // Safely extract member name - prefer direct name, then user object, then email
  const firstName = String(member.user?.firstName || '');
  const lastName = String(member.user?.lastName || '');
  const directName = String(member.name || '');
  const email = String(member.user?.email || '');
  const fullNameFromUser = `${firstName} ${lastName}`.trim();
  const memberName = directName || fullNameFromUser || email || 'Member';
  
  // Get contact info - prefer phone, then email
  const contactInfo = member.phone || member.user?.phone || member.user?.email || 'No contact info';
  
  const contributionCount = (member as any).contributionCount || 0;
  const onTimePayments = (member as any).onTimePayments || 0;
  
  const reliabilityScore = contributionCount > 0 
    ? Math.round((onTimePayments / contributionCount) * 100) 
    : 0;
  
  const getReliabilityColor = () => {
    if (reliabilityScore >= 80) return colors.success.DEFAULT;
    if (reliabilityScore >= 50) return colors.warning.DEFAULT;
    return colors.error.DEFAULT;
  };
  
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/group/${groupId}/member/${member.id}`);
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Card style={{ marginHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Avatar with position badge */}
          <View style={{ position: "relative" }}>
            <Avatar 
              name={memberName} 
              size="lg"
              showBorder={isCurrentBeneficiary}
              borderColor={colors.primary.DEFAULT}
            />
            <View style={{ 
              position: "absolute", 
              bottom: -4, 
              right: -4, 
              width: 24, 
              height: 24, 
              borderRadius: 12, 
              backgroundColor: colors.cardElevated, 
              alignItems: "center", 
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.card,
            }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.text }}>{member.rotationOrder || '?'}</Text>
            </View>
          </View>
          
          {/* Member Info */}
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
              <Text style={{ color: colors.text, fontWeight: "600", fontSize: 16, marginRight: 6 }}>{memberName}</Text>
              {isCurrentUser && <Badge variant="info" style={{ marginRight: 4 }}>You</Badge>}
              {member.role === "creator" && <Badge variant="default" style={{ marginRight: 4 }}>Creator</Badge>}
              {member.isAdmin === 1 && member.role !== "creator" && <Badge variant="warning" style={{ marginRight: 4 }}>Co-Admin</Badge>}
              {isCurrentBeneficiary && <Badge variant="success">Receiving</Badge>}
            </View>
            
            <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
              {contactInfo}
            </Text>
            
            {contributionCount > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success.DEFAULT} />
                  <Text style={{ color: colors.textSubtle, fontSize: 12, marginLeft: 4 }}>
                    {onTimePayments}/{contributionCount} on time
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: 4, 
                    marginRight: 4,
                    backgroundColor: getReliabilityColor(),
                  }} />
                  <Text style={{ color: colors.textSubtle, fontSize: 12 }}>{reliabilityScore}% reliable</Text>
                </View>
              </View>
            )}
          </View>
          
          {/* Actions */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {isAdmin && !isCurrentUser && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Open member actions sheet
                }}
                style={{ padding: 8 }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
              </Pressable>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

export default function MembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: group, isLoading: groupLoading, error: groupError, refetch: refetchGroup } = useGroup(id || '');
  const { data: members, isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useGroupMembers(id || '');
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([refetchGroup(), refetchMembers()]);
    } catch (e) {
      if (__DEV__) console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetchGroup, refetchMembers]);
  
  const isLoading = groupLoading || membersLoading;
  const error = groupError || membersError;
  
  // Loading state
  if (isLoading && !members) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Members",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading members...</Text>
        </View>
      </>
    );
  }
  
  // Error state
  if (error && !members) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Members",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Could not load members
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
            {error.message || "Please check your connection"}
          </Text>
          <Button onPress={() => { refetchGroup(); refetchMembers(); }} style={{ marginTop: 20 }}>
            Retry
          </Button>
        </View>
      </>
    );
  }
  
  const membersList = members || group?.members || [];
  const sortedMembers = [...membersList].sort((a, b) => (a.rotationOrder || 0) - (b.rotationOrder || 0));
  const isGroupAdmin = group?.isAdmin || false;
  const currentCycle = group?.currentCycle || 1;
  const currentUserId = group?.currentUserId;
  
  // Calculate stats
  const adminCount = membersList.filter(m => m.isAdmin).length;
  const totalContributions = membersList.reduce((sum, m) => sum + (m.contributionCount || 0), 0);
  const totalOnTime = membersList.reduce((sum, m) => sum + (m.onTimePayments || 0), 0);
  const avgReliability = totalContributions > 0 ? Math.round((totalOnTime / totalContributions) * 100) : 0;
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Members",
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
      >
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, paddingBottom: 32 }}>
          {/* Summary Card */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.text }}>{membersList.length}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Total Members</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary.DEFAULT }}>
                    {adminCount}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Admins</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ fontSize: 24, fontWeight: "700", color: colors.success.DEFAULT }}>
                    {avgReliability}%
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>Avg. Reliability</Text>
                </View>
              </View>
            </Card>
          </View>
          
          {/* Member Legend */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary.DEFAULT, marginRight: 4 }} />
              <Text style={{ fontSize: 11, color: colors.textMuted }}>Current Receiver</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 11, color: colors.textSubtle }}>Position # = Rotation Order</Text>
            </View>
          </View>
          
          {/* Members List */}
          <View style={{ paddingTop: 8 }}>
            {sortedMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentUser={member.userId === currentUserId}
                isCurrentBeneficiary={member.userId === group?.currentBeneficiaryId}
                isAdmin={isGroupAdmin}
                groupId={id || ''}
                currentCycle={currentCycle}
              />
            ))}
          </View>
          
          {/* Add Member Button (Admin only) */}
          {isGroupAdmin && (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              <Button
                variant="secondary"
                onPress={() => router.push(`/group/${id}/invite`)}
                leftIcon={<Ionicons name="person-add-outline" size={20} color={colors.primary.DEFAULT} />}
              >
                Invite New Member
              </Button>
            </View>
          )}
        </SafeAreaView>
      </ScrollView>
    </>
  );
}
