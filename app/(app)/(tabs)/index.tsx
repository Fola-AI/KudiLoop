import { View, Text, ScrollView, Pressable, RefreshControl, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useRef, useEffect } from "react";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Button, Avatar } from "@/components/ui";
import { HomeScreenSkeleton } from "@/components/skeletons/HomeScreenSkeleton";
import { ErrorState } from "@/components/ErrorState";
import { colors } from "@/theme";
import { formatCurrency, formatCurrencyAbbreviated, abbreviateAmount, getCurrencySymbol } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/api";
import type { CurrencyCode } from "@/types";

// Currency configuration
const CURRENCIES = [
  { code: 'NGN' as const, symbol: '₦', name: 'Naira' },
  { code: 'GBP' as const, symbol: '£', name: 'Pounds' },
  { code: 'USD' as const, symbol: '$', name: 'Dollars' },
  { code: 'EUR' as const, symbol: '€', name: 'Euros' },
];

type WalletCurrency = 'NGN' | 'GBP' | 'USD' | 'EUR';

// Format with currency symbol (abbreviated) - uses truncation, not rounding
function formatAbbreviatedBalance(amount: number, symbol: string): string {
  return `${symbol}${abbreviateAmount(amount)}`;
}

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const { user, clerkUser, refreshUser, isLoadingUser, userError } = useAuth();
  const { data: groups, isLoading: groupsLoading, error: groupsError, refetch: refetchGroups } = useGroups();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<WalletCurrency>('NGN');
  
  // Animation for balance change
  const balanceOpacity = useRef(new Animated.Value(1)).current;

  // Use real user data
  const firstName = user?.firstName || clerkUser?.firstName || 'User';
  const fullName = `${firstName} ${user?.lastName || clerkUser?.lastName || ''}`.trim();
  
  // Parse balances from user data
  const balances: Record<WalletCurrency, number> = {
    NGN: parseFloat(user?.totalFundsNGN || '0'),
    GBP: parseFloat(user?.totalFundsGBP || '0'),
    USD: parseFloat(user?.totalFundsUSD || '0'),
    EUR: parseFloat(user?.totalFundsEUR || '0'),
  };
  
  // Calculate stats from groups data
  const activeGroups = groups?.filter(g => g.status === 'active').length || 0;

  // Get current currency config
  const currentCurrency = CURRENCIES.find(c => c.code === selectedCurrency)!;
  const currentBalance = balances[selectedCurrency];

  // Animate balance when currency changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(balanceOpacity, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(balanceOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedCurrency]);

  // Format balance with proper currency symbol (full amount)
  const formatWalletBalance = (amount: number, currency: typeof CURRENCIES[number]) => {
    return `${currency.symbol}${amount.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Get next payment info from active groups
  const getNextPayment = () => {
    if (!groups || groups.length === 0) return null;
    
    const activeGroupsList = groups.filter(g => g.status === 'active');
    if (activeGroupsList.length === 0) return null;
    
    // Sort by next collection date and get the soonest
    const sortedGroups = [...activeGroupsList].sort((a, b) => {
      const dateA = new Date(a.nextCollectionDate || '9999-12-31');
      const dateB = new Date(b.nextCollectionDate || '9999-12-31');
      return dateA.getTime() - dateB.getTime();
    });
    
    const nextGroup = sortedGroups[0];
    if (!nextGroup) return null;
    
    return {
      amount: nextGroup.contributionAmount,
      currency: nextGroup.currency as CurrencyCode,
      groupName: nextGroup.name,
      date: nextGroup.nextCollectionDate,
    };
  };

  const nextPayment = getNextPayment();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ['groups'] }),
      ]);
    } catch (error) {
      if (__DEV__) console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, queryClient]);

  const handleCurrencySelect = (code: WalletCurrency) => {
    if (code !== selectedCurrency) {
      Haptics.selectionAsync();
      setSelectedCurrency(code);
    }
  };

  // Loading state - show skeleton while initial data loads
  if ((isLoadingUser || groupsLoading) && !user && !groups) {
    return <HomeScreenSkeleton />;
  }

  // Error state - show error if both user and groups failed
  if ((userError || groupsError) && !user && !groups) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <ErrorState
          title="Could not load your data"
          message={userError || groupsError?.message || "Please check your connection and try again"}
          onRetry={async () => {
            await Promise.all([refreshUser(), refetchGroups()]);
          }}
        />
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
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            Welcome back,
          </Text>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: "700" }}>
            {firstName} 👋
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/profile");
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Avatar 
            source={user?.profileImageUrl}
            avatarChoice={user?.avatarChoice}
            name={fullName} 
            size="md" 
          />
        </Pressable>
      </View>

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
        {/* Main Wallet Card */}
        <Card variant="elevated" style={{ marginTop: 16, padding: 24 }}>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginBottom: 4 }}>
            Total Balance
          </Text>
          
          {/* Large Balance Display */}
          {isLoadingUser ? (
            <View style={{ 
              height: 48, 
              width: 200, 
              backgroundColor: colors.cardElevated, 
              borderRadius: 8,
              marginBottom: 4,
            }} />
          ) : (
            <Animated.Text style={{ 
              color: colors.text, 
              fontSize: 40, 
              fontWeight: "700",
              opacity: balanceOpacity,
            }}>
              {formatWalletBalance(currentBalance, currentCurrency)}
            </Animated.Text>
          )}
          
          {/* Currency Selector Tabs */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 4 }}>
            {CURRENCIES.map((currency) => (
              <Pressable
                key={currency.code}
                onPress={() => handleCurrencySelect(currency.code)}
                style={({ pressed }) => ({
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: selectedCurrency === currency.code
                    ? colors.primary.DEFAULT
                    : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{ 
                  color: selectedCurrency === currency.code ? colors.white : colors.textMuted,
                  fontSize: 14,
                  fontWeight: "600",
                }}>
                  {currency.code}
                </Text>
              </Pressable>
            ))}
          </View>
          
          {/* All Balances - Single Horizontal Row */}
          <View style={{ 
            marginTop: 20, 
            paddingTop: 16, 
            borderTopWidth: 1, 
            borderTopColor: colors.border,
          }}>
            <Text style={{ color: colors.textSubtle, fontSize: 12, marginBottom: 12 }}>
              All Balances
            </Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {CURRENCIES.map((currency) => (
                <Pressable
                  key={currency.code}
                  onPress={() => handleCurrencySelect(currency.code)}
                  style={{ alignItems: "center", flex: 1 }}
                >
                  <Text style={{ 
                    color: selectedCurrency === currency.code 
                      ? colors.primary.DEFAULT 
                      : colors.textSubtle,
                    fontSize: 11,
                    fontWeight: selectedCurrency === currency.code ? "600" : "400",
                    marginBottom: 2,
                  }}>
                    {currency.code}
                  </Text>
                  <Text style={{ 
                    color: selectedCurrency === currency.code 
                      ? colors.text 
                      : colors.textMuted,
                    fontSize: 14,
                    fontWeight: "600",
                  }}>
                    {formatAbbreviatedBalance(balances[currency.code], currency.symbol)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* Quick Actions - Outside wallet card */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/group/create");
            }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.primary.DEFAULT,
              paddingVertical: 14,
              borderRadius: 14,
              gap: 8,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Ionicons name="add" size={20} color={colors.white} />
            <Text style={{ color: colors.white, fontSize: 15, fontWeight: "600" }}>
              New Group
            </Text>
          </Pressable>
          
          <Pressable 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.card,
              paddingVertical: 14,
              borderRadius: 14,
              gap: 8,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <Ionicons name="link" size={20} color={colors.primary.DEFAULT} />
            <Text style={{ color: colors.primary.DEFAULT, fontSize: 15, fontWeight: "600" }}>
              Join Group
            </Text>
          </Pressable>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          <StatCard 
            icon="people" 
            label="Active Groups" 
            value={activeGroups.toString()} 
            color={colors.primary.DEFAULT}
          />
          <StatCard 
            icon="calendar" 
            label="Next Payment" 
            value={nextPayment ? formatCurrencyAbbreviated(nextPayment.amount, nextPayment.currency) : '—'}
            subtitle={nextPayment?.groupName}
            color={colors.success.DEFAULT}
          />
        </View>

        {/* Groups Preview */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
              Your Groups
            </Text>
            <Pressable 
              onPress={() => {
                Haptics.selectionAsync();
                router.push("/(app)/(tabs)/groups");
              }}
            >
              <Text style={{ color: colors.primary.DEFAULT, fontSize: 14, fontWeight: "500" }}>
                See all
              </Text>
            </Pressable>
          </View>
          
          {groups && groups.length > 0 ? (
            <View style={{ gap: 12 }}>
              {groups.slice(0, 3).map((group) => (
                <Pressable
                  key={group.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/group/${group.id}`);
                  }}
                >
                  <Card style={{ padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: colors.primary.DEFAULT + "20",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Ionicons name="people" size={22} color={colors.primary.DEFAULT} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>
                          {group.name}
                        </Text>
                        <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
                          {formatCurrency(group.contributionAmount, group.currency as CurrencyCode)} • {group.frequency}
                        </Text>
                      </View>
                      <Badge variant={group.status === 'active' ? 'success' : 'default'}>
                        {group.status}
                      </Badge>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : (
            <Card style={{ alignItems: "center", padding: 24 }}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: "500", marginTop: 8 }}>
                No groups yet
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
                Create a new group or join an existing one to start saving
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ 
  icon, 
  label, 
  value,
  subtitle, 
  color 
}: { 
  icon: keyof typeof Ionicons.glyphMap; 
  label: string; 
  value: string;
  subtitle?: string; 
  color: string;
}) {
  return (
    <Card style={{ flex: 1, padding: 16 }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: color + "20",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
      }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
        {label}
      </Text>
      {subtitle && (
        <Text style={{ color: colors.textSubtle, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
}
