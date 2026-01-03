import { View, Text, SectionList, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useMemo } from "react";
import { colors } from "@/theme";
import { formatCurrency } from "@/utils";
import { useRecentActivity } from "@/hooks/api";
import { Button } from "@/components/ui";
import type { CurrencyCode } from "@/types";
import type { Activity } from "@/types/api";

type FilterType = "all" | "contributions" | "payouts" | "pots";

export default function ActivityScreen() {
  const { data: activities, isLoading, error, refetch } = useRecentActivity();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refetch();
    } catch (e) {
      if (__DEV__) console.error('Failed to refresh activity:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    // Filter activities based on selected filter
    const filtered = activities.filter((activity) => {
      if (filter === "all") return true;
      if (filter === "contributions") {
        return activity.type === "contribution" || 
               activity.type === "contribution_made" || 
               activity.type === "contribution_received";
      }
      if (filter === "payouts") {
        return activity.type === "payout" || 
               activity.type === "payout_received";
      }
      if (filter === "pots") {
        return activity.type === "pot_deposit" || 
               activity.type === "pot_withdrawal";
      }
      return true;
    });

    // Group by date
    const groups: { [key: string]: Activity[] } = {};
    
    filtered.forEach((activity) => {
      const date = new Date(activity.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateKey: string;
      if (date.toDateString() === today.toDateString()) {
        dateKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "Yesterday";
      } else {
        dateKey = date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    // Convert to sections array
    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [activities, filter]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (!activities) return { totalIn: 0, totalOut: 0 };

    let totalIn = 0;
    let totalOut = 0;

    activities.forEach((activity) => {
      // Convert to a base currency (NGN) for summary
      const amount = activity.amount || 0;
      const multiplier = activity.currency === 'NGN' ? 1 : 
                         activity.currency === 'GBP' ? 2000 : 
                         activity.currency === 'USD' ? 1600 : 1;
      const convertedAmount = amount * multiplier;

      if (activity.type === "payout" || activity.type === "pot_withdrawal") {
        totalIn += convertedAmount;
      } else if (activity.type === "contribution" || activity.type === "pot_deposit") {
        totalOut += convertedAmount;
      }
    });

    return { totalIn, totalOut };
  }, [activities]);

  // Loading state
  if (isLoading && !activities) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
            Loading activity...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !activities) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 16 }}>
            Could not load activity
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
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            Activity
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Open search
            }}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="search" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Summary Cards */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <View style={{ 
            flex: 1, 
            backgroundColor: colors.success.muted, 
            padding: 16, 
            borderRadius: 16 
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Ionicons name="arrow-down" size={16} color={colors.success.DEFAULT} />
              <Text style={{ color: colors.success.DEFAULT, fontSize: 12, fontWeight: "500" }}>
                Money In
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
              {formatCurrency(summaryStats.totalIn, "NGN", { compact: true })}
            </Text>
          </View>
          
          <View style={{ 
            flex: 1, 
            backgroundColor: colors.error.muted, 
            padding: 16, 
            borderRadius: 16 
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Ionicons name="arrow-up" size={16} color={colors.error.DEFAULT} />
              <Text style={{ color: colors.error.DEFAULT, fontSize: 12, fontWeight: "500" }}>
                Money Out
              </Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
              {formatCurrency(summaryStats.totalOut, "NGN", { compact: true })}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", backgroundColor: colors.card, borderRadius: 12, padding: 4 }}>
          {(["all", "contributions", "payouts", "pots"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(tab);
              }}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: filter === tab ? colors.cardElevated : "transparent",
              }}
            >
              <Text style={{ 
                color: filter === tab ? colors.text : colors.textMuted, 
                fontSize: 13, 
                fontWeight: "600",
                textAlign: "center",
              }}>
                {tab === "all" ? "All" : tab === "contributions" ? "Out" : tab === "payouts" ? "In" : "Pots"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Transaction List */}
      <SectionList
        sections={groupedActivities}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ 
            paddingHorizontal: 20, 
            paddingVertical: 10,
            backgroundColor: colors.background,
          }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600" }}>
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <TransactionItem 
            activity={item}
            isFirst={index === 0}
            isLast={index === section.data.length - 1}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

function TransactionItem({ 
  activity, 
  isFirst,
  isLast,
}: { 
  activity: Activity;
  isFirst: boolean;
  isLast: boolean;
}) {
  const getConfig = () => {
    switch (activity.type) {
      case "contribution":
      case "contribution_made": 
        return { 
          icon: "arrow-up" as const, 
          bg: colors.error.muted, 
          color: colors.error.DEFAULT,
          label: "Contribution Made",
          prefix: "-",
        };
      case "contribution_received":
        return { 
          icon: "arrow-down" as const, 
          bg: colors.success.muted, 
          color: colors.success.DEFAULT,
          label: "Contribution Received",
          prefix: "+",
        };
      case "payout":
      case "payout_received": 
        return { 
          icon: "arrow-down" as const, 
          bg: colors.success.muted, 
          color: colors.success.DEFAULT,
          label: "Payout Received",
          prefix: "+",
        };
      case "group_joined":
        return {
          icon: "people" as const,
          bg: colors.primary.DEFAULT + "15",
          color: colors.primary.DEFAULT,
          label: "Joined Group",
          prefix: "",
        };
      case "group_created":
        return {
          icon: "add-circle" as const,
          bg: colors.primary.DEFAULT + "15",
          color: colors.primary.DEFAULT,
          label: "Created Group",
          prefix: "",
        };
      case "pot_deposit": 
        return { 
          icon: "wallet" as const, 
          bg: colors.primary.DEFAULT + "15", 
          color: colors.primary.DEFAULT,
          label: "Pot Deposit",
          prefix: "-",
        };
      case "pot_withdrawal": 
        return { 
          icon: "wallet-outline" as const, 
          bg: colors.secondary.DEFAULT + "15", 
          color: colors.secondary.DEFAULT,
          label: "Pot Withdrawal",
          prefix: "+",
        };
      default:
        return { 
          icon: "receipt" as const, 
          bg: colors.card, 
          color: colors.textMuted,
          label: activity.title || activity.type || "Activity",
          prefix: "",
        };
    }
  };

  const config = getConfig();
  const isPositive = config.prefix === "+";
  const time = new Date(activity.createdAt).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to transaction detail
      }}
      style={({ pressed }) => ({
        marginHorizontal: 20,
        backgroundColor: colors.card,
        borderTopLeftRadius: isFirst ? 16 : 0,
        borderTopRightRadius: isFirst ? 16 : 0,
        borderBottomLeftRadius: isLast ? 16 : 0,
        borderBottomRightRadius: isLast ? 16 : 0,
        marginBottom: isLast ? 12 : 1,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", padding: 16 }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: config.bg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}>
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500" }}>
              {config.label}
            </Text>
            {activity.status === "pending" && (
              <View style={{ 
                paddingHorizontal: 6, 
                paddingVertical: 2, 
                backgroundColor: colors.warning.muted,
                borderRadius: 4,
              }}>
                <Text style={{ color: colors.warning.DEFAULT, fontSize: 10, fontWeight: "600" }}>
                  PENDING
                </Text>
              </View>
            )}
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>
            {activity.groupName || activity.potName || activity.description} · {time}
          </Text>
        </View>
        
        {activity.amount !== undefined && activity.amount !== null && (
          <Text style={{ 
            color: isPositive ? colors.success.DEFAULT : colors.text, 
            fontSize: 16, 
            fontWeight: "600" 
          }}>
            {config.prefix}{formatCurrency(activity.amount, (activity.currency || 'NGN') as CurrencyCode)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={{ 
      alignItems: "center", 
      justifyContent: "center", 
      paddingVertical: 80,
      paddingHorizontal: 40,
    }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}>
        <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
      </View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginBottom: 8 }}>
        No activity yet
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: "center" }}>
        Your transaction history will appear here once you start contributing to groups or using your savings pots.
      </Text>
    </View>
  );
}
