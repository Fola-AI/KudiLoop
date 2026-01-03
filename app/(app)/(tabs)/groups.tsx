import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useEffect } from "react";
import { router } from "expo-router";
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Card, Badge, AvatarStack, Button } from "@/components/ui";
import { colors } from "@/theme";
import { formatCurrency } from "@/utils";
import { useGroups } from "@/hooks/api";
import type { CurrencyCode } from "@/types";
import type { GroupWithDetails } from "@/types/api";

type GroupStatus = "all" | "active" | "pending" | "completed";

export default function GroupsScreen() {
  const { data: groups, isLoading, error, refetch } = useGroups();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<GroupStatus>("all");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refetch();
    } catch (e) {
      if (__DEV__) console.error('Failed to refresh groups:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Filter groups based on status
  const filteredGroups = (groups || []).filter((group) => {
    if (filter === "all") return true;
    return group.status === filter;
  });

  // Calculate counts for each filter
  const groupCounts = {
    all: groups?.length || 0,
    active: groups?.filter((g) => g.status === "active").length || 0,
    pending: groups?.filter((g) => g.status === "pending").length || 0,
    completed: groups?.filter((g) => g.status === "completed").length || 0,
  };

  // Loading state
  if (isLoading && !groups) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
            Loading your groups...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !groups) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 16 }}>
            Could not load groups
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
            {error.message || "Please check your connection and try again"}
          </Text>
          <Button onPress={() => refetch()} style={{ marginTop: 20 }}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            Groups
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 2 }}>
            {groupCounts.active} active · {groupCounts.pending} pending
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/group/create");
          }}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            borderRadius: 16,
            backgroundColor: colors.primary.DEFAULT,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          })}
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={{ paddingVertical: 16 }}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        >
          {(["all", "active", "pending", "completed"] as const).map((tab) => (
            <FilterChip
              key={tab}
              label={tab.charAt(0).toUpperCase() + tab.slice(1)}
              count={groupCounts[tab]}
              active={filter === tab}
              onPress={() => setFilter(tab)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Groups List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {filteredGroups.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <View style={{ gap: 16 }}>
            {filteredGroups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterChip({ 
  label, 
  count,
  active, 
  onPress 
}: { 
  label: string; 
  count: number;
  active: boolean; 
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  
  useEffect(() => {
    scale.value = withSpring(active ? 1.08 : 1, {
      damping: 12,
      stiffness: 180,
    });
  }, [active]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          minHeight: 48,
          minWidth: 80,
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 24,
          backgroundColor: active ? colors.primary.DEFAULT : colors.card,
          borderWidth: active ? 0 : 1.5,
          borderColor: active ? "transparent" : colors.border,
          opacity: pressed ? 0.85 : 1,
          shadowColor: active ? colors.primary.DEFAULT : "transparent",
          shadowOffset: { width: 0, height: active ? 4 : 0 },
          shadowOpacity: active ? 0.3 : 0,
          shadowRadius: active ? 8 : 0,
          elevation: active ? 4 : 0,
        })}
      >
        <Text style={{ 
          color: active ? colors.white : colors.textMuted, 
          fontSize: 16, 
          fontWeight: "700",
          letterSpacing: 0.3,
        }}>
          {label}
        </Text>
        <View style={{
          minWidth: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: active ? "rgba(255,255,255,0.3)" : colors.cardElevated,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 8,
        }}>
          <Text style={{ 
            color: active ? colors.white : colors.textSubtle, 
            fontSize: 13, 
            fontWeight: "800" 
          }}>
            {count}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function GroupCard({ group }: { group: GroupWithDetails }) {
  const isYourTurn = group.currentBeneficiaryId === group.currentUserId;
  const progress = group.totalCycles > 0 ? (group.currentCycle / group.totalCycles) * 100 : 0;
  const memberCount = group.members?.length || group.memberCount || 0;
  
  // Get member avatars for display - prioritize direct name over user object
  const memberAvatars = (group.members || []).slice(0, 5).map(m => {
    const firstName = String(m.user?.firstName || '');
    const lastName = String(m.user?.lastName || '');
    const directName = String(m.name || '');
    const fullNameFromUser = `${firstName} ${lastName}`.trim();
    const memberName = directName || fullNameFromUser || m.user?.email || 'Member';
    
    return {
      name: memberName,
      imageUrl: m.avatar || m.user?.profileImageUrl,
    };
  });

  // Get current beneficiary name - prioritize direct name
  const beneficiaryMember = group.currentBeneficiaryId
    ? group.members?.find(m => m.userId === group.currentBeneficiaryId)
    : null;
  const currentBeneficiary = beneficiaryMember
    ? (beneficiaryMember.name || beneficiaryMember.user?.firstName || 'Member')
    : group.status === 'pending' ? 'Pending' : 'N/A';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/group/${group.id}`);
      }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      <Card>
        {/* Header Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }} numberOfLines={1}>
                {group.name}
              </Text>
              {group.isAdmin && (
                <View style={{ 
                  paddingHorizontal: 6, 
                  paddingVertical: 2, 
                  backgroundColor: colors.primary.DEFAULT + "20",
                  borderRadius: 4,
                }}>
                  <Text style={{ color: colors.primary.DEFAULT, fontSize: 10, fontWeight: "600" }}>
                    ADMIN
                  </Text>
                </View>
              )}
            </View>
            {group.description && (
              <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
                {group.description}
              </Text>
            )}
          </View>
          
          <Badge 
            variant={group.status === "active" ? "success" : group.status === "pending" ? "warning" : "default"}
            dot={group.status !== "completed"}
          >
            {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
          </Badge>
        </View>

        {/* Members Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          {memberAvatars.length > 0 ? (
            <AvatarStack avatars={memberAvatars} size="sm" max={5} />
          ) : (
            <View />
          )}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="people" size={14} color={colors.textSubtle} />
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>
              {memberCount} member{memberCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Progress Section */}
        {group.status !== "pending" && group.totalCycles > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ color: colors.textSubtle, fontSize: 12 }}>
                Cycle Progress
              </Text>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
                {group.currentCycle}/{group.totalCycles}
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.cardElevated, borderRadius: 3, overflow: "hidden" }}>
              <View 
                style={{ 
                  width: `${Math.min(progress, 100)}%` as any, 
                  height: "100%", 
                  backgroundColor: group.status === "completed" ? colors.textMuted : colors.primary.DEFAULT,
                  borderRadius: 3,
                }} 
              />
            </View>
          </View>
        )}

        {/* Info Grid */}
        <View style={{ 
          flexDirection: "row", 
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textSubtle, fontSize: 11, marginBottom: 2 }}>
              Contribution
            </Text>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
              {formatCurrency(group.contributionAmount, (group.currency || 'NGN') as CurrencyCode)}
            </Text>
            <Text style={{ color: colors.textSubtle, fontSize: 11 }}>
              {group.frequency}
            </Text>
          </View>
          
          {group.yourPosition && (
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: colors.textSubtle, fontSize: 11, marginBottom: 2 }}>
                Your Position
              </Text>
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600" }}>
                #{group.yourPosition}
              </Text>
              <Text style={{ color: colors.textSubtle, fontSize: 11 }}>
                of {group.totalCycles}
              </Text>
            </View>
          )}
          
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={{ color: colors.textSubtle, fontSize: 11, marginBottom: 2 }}>
              {group.status === "completed" ? "Status" : "Beneficiary"}
            </Text>
            <Text style={{ 
              color: isYourTurn ? colors.success.DEFAULT : colors.text, 
              fontSize: 15, 
              fontWeight: "600" 
            }}>
              {isYourTurn ? "You" : currentBeneficiary}
            </Text>
            {isYourTurn && group.status === "active" && (
              <Text style={{ color: colors.success.DEFAULT, fontSize: 11 }}>
                Your turn! 🎉
              </Text>
            )}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

function EmptyState({ filter }: { filter: GroupStatus }) {
  const getMessage = () => {
    switch (filter) {
      case "active": return "No active groups. Create or join one to start saving!";
      case "pending": return "No pending groups waiting to start.";
      case "completed": return "No completed groups yet. Keep saving!";
      default: return "You haven't joined any groups yet. Create one or join with an invite link.";
    }
  };

  return (
    <View style={{ 
      alignItems: "center", 
      justifyContent: "center", 
      paddingVertical: 60,
      gap: 16,
    }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Ionicons name="people-outline" size={40} color={colors.textMuted} />
      </View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
        No {filter === "all" ? "" : filter + " "}groups
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center", paddingHorizontal: 40 }}>
        {getMessage()}
      </Text>
      {filter === "all" && (
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          <Button 
            size="sm" 
            fullWidth={false}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/group/create");
            }}
          >
            Create Group
          </Button>
          <Button 
            variant="outline"
            size="sm" 
            fullWidth={false}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            Join Group
          </Button>
        </View>
      )}
    </View>
  );
}
