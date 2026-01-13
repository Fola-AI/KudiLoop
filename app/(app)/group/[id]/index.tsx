import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState, useCallback, useMemo } from "react";
import Svg, { Circle } from "react-native-svg";
import { Card, Badge, Avatar, Button } from "@/components/ui";
import { ReceiptViewerModal } from "@/components/ReceiptViewerModal";
import { colors } from "@/theme";
import { formatCurrency } from "@/utils";
import { useGroup, useGroupMembers, useGroupContributions } from "@/hooks/api";
import { useApproveContribution, useDeclineContribution, useMarkContributionPaid } from "@/hooks/api/useContributions";
import { useAuth } from "@/contexts/AuthContext";
import type { CurrencyCode } from "@/types";
import type { Member, Contribution } from "@/types/api";

// Circular progress component for cycle visualization
function CycleProgressRing({ 
  current, 
  total, 
  size = 120,
  strokeWidth = 10,
}: { 
  current: number; 
  total: number; 
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = total > 0 ? current / total : 0;
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary.DEFAULT}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center text */}
      <View style={{ position: "absolute", alignItems: "center" }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text }}>{current}/{total}</Text>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>Cycles</Text>
      </View>
    </View>
  );
}

// Contribution status item with inline actions
function ContributionItem({ 
  member, 
  contribution,
  isCurrentUser,
  isCurrentBeneficiary,
  groupId,
  hasAdminPrivileges,
  isProcessing,
  onViewReceipt,
  onApprove,
  onDecline,
  onMarkAsPaid,
}: { 
  member: Member;
  contribution?: Contribution;
  isCurrentUser: boolean;
  isCurrentBeneficiary: boolean;
  groupId: string;
  hasAdminPrivileges: boolean;
  isProcessing: boolean;
  onViewReceipt?: (receiptUrl: string | null, memberName: string) => void;
  onApprove?: (contribution: Contribution) => void;
  onDecline?: (contribution: Contribution) => void;
  onMarkAsPaid?: (member: Member, contribution?: Contribution) => void;
}) {
  const status = contribution?.status || 'pending';
  const hasReceipt = Boolean(contribution?.receiptUrl);
  const isPaid = status === 'paid' || status === 'confirmed';
  const isDeclined = status === 'declined';
  
  // Safely extract member name - prefer direct name, then user object, then email
  const firstName = String(member.user?.firstName || '');
  const lastName = String(member.user?.lastName || '');
  const directName = String(member.name || '');
  const email = String(member.user?.email || '');
  const fullNameFromUser = `${firstName} ${lastName}`.trim();
  const memberName = directName || fullNameFromUser || email || 'Member';
  
  // Safely get rotation order (ensure it's a string or number, not an object)
  const rotationOrder = typeof member.rotationOrder === 'number' ? member.rotationOrder : '?';
  
  // Safely check role (ensure strings)
  const memberRole = String(member.role || '');
  // isAdmin is a number in the type (0 or 1) - check explicitly for 1
  const isAdmin = member.isAdmin === 1;
  
  // Get status icon and color
  const getStatusDisplay = () => {
    if (isPaid) return { icon: "checkmark-circle" as const, color: colors.success.DEFAULT };
    if (isDeclined) return { icon: "close-circle" as const, color: colors.error.DEFAULT };
    if (hasReceipt) return { icon: "document-attach" as const, color: colors.primary.DEFAULT };
    return { icon: "time-outline" as const, color: colors.textMuted };
  };
  
  const statusDisplay = getStatusDisplay();
  
  // Format date paid
  const datePaidText = contribution?.datePaid 
    ? new Date(contribution.datePaid).toLocaleDateString()
    : null;
  
  const handleViewReceipt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewReceipt?.(contribution?.receiptUrl || null, memberName);
  };
  
  const handleApprove = () => {
    if (contribution && onApprove) {
      onApprove(contribution);
    }
  };
  
  const handleDecline = () => {
    if (contribution && onDecline) {
      onDecline(contribution);
    }
  };
  
  const handleMarkAsPaid = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMarkAsPaid?.(member, contribution);
  };
  
  // Determine if we should show action buttons
  // Show buttons if admin AND not paid AND has receipt
  const showActions = hasAdminPrivileges && !isPaid && hasReceipt;
  
  // Show "Mark as Paid" button for admins when pending with NO receipt
  const showMarkAsPaid = hasAdminPrivileges && !isPaid && !isDeclined && !hasReceipt;
  
  return (
    <View
      style={{
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#1f2937",
      }}
    >
      {/* Member Info Row */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Avatar 
          name={memberName} 
          size="md"
          showBorder={isCurrentBeneficiary}
          borderColor={colors.primary.DEFAULT}
        />
        <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
            <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }} numberOfLines={1}>
              {memberName}{isCurrentUser ? " (You)" : ""}
            </Text>
            {memberRole === "creator" && (
              <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: "rgba(255,107,53,0.2)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: colors.primary.DEFAULT, fontWeight: "600" }}>Creator</Text>
              </View>
            )}
            {isAdmin && memberRole !== "creator" && (
              <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: "rgba(20,184,166,0.2)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: "#14B8A6", fontWeight: "600" }}>Co-Admin</Text>
              </View>
            )}
            {isCurrentBeneficiary && (
              <View style={{ marginLeft: 6, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: "rgba(34,197,94,0.2)", borderRadius: 4 }}>
                <Text style={{ fontSize: 10, color: colors.success.DEFAULT, fontWeight: "600" }}>Receiving</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }} numberOfLines={1}>
            #{rotationOrder}
          </Text>
        </View>
        
        {/* Status Icon */}
        <Ionicons name={statusDisplay.icon} size={28} color={statusDisplay.color} />
      </View>
      
      {/* Status Message */}
      {isPaid && (
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success.DEFAULT} />
          <Text style={{ color: colors.success.DEFAULT, fontSize: 13, marginLeft: 6 }}>
            Paid{datePaidText ? ` on ${datePaidText}` : ''}
          </Text>
        </View>
      )}
      
      {isDeclined && (
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="close-circle" size={16} color={colors.error.DEFAULT} />
          <Text style={{ color: colors.error.DEFAULT, fontSize: 13, marginLeft: 6 }}>
            Declined - can resubmit
          </Text>
        </View>
      )}
      
      {!isPaid && !isDeclined && hasReceipt && (
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center" }}>
          <Ionicons name="document-attach" size={16} color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, marginLeft: 6 }}>
            Receipt uploaded - awaiting approval
          </Text>
        </View>
      )}
      
      {!isPaid && !isDeclined && !hasReceipt && (
        <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, fontSize: 13, marginLeft: 6 }}>
              Pending payment
            </Text>
          </View>
          
          {/* Mark as Paid button for admins - for pending contributions without receipt */}
          {showMarkAsPaid && (
            <Pressable 
              onPress={handleMarkAsPaid}
              disabled={isProcessing}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.success.DEFAULT + "60",
                backgroundColor: "rgba(34,197,94,0.1)",
                opacity: (pressed || isProcessing) ? 0.6 : 1,
              })}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.success.DEFAULT} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={16} color={colors.success.DEFAULT} />
                  <Text style={{ 
                    marginLeft: 6, 
                    fontWeight: "600", 
                    fontSize: 12,
                    color: colors.success.DEFAULT,
                  }}>
                    Mark Paid
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      )}
      
      {/* Action Buttons - Only for Creator/Co-Admin and not paid */}
      {showActions && (
        <View style={{ 
          flexDirection: "row", 
          justifyContent: "space-around",
          gap: 12, 
          marginTop: 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.1)",
        }}>
          {/* View Receipt - Secondary/Outline Style */}
          <Pressable 
            onPress={handleViewReceipt}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44, // Accessibility: minimum touch target
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: hasReceipt ? colors.primary.DEFAULT : "#4b5563",
              backgroundColor: hasReceipt ? "rgba(255,107,53,0.08)" : "transparent",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons 
              name="eye" 
              size={18} 
              color={hasReceipt ? colors.primary.DEFAULT : "#9ca3af"} 
            />
            <Text style={{ 
              marginLeft: 8, 
              fontWeight: "600", 
              fontSize: 14,
              color: hasReceipt ? colors.primary.DEFAULT : "#9ca3af",
            }}>
              View
            </Text>
          </Pressable>
          
          {/* Approve - Success Style with Green Background */}
          <Pressable 
            onPress={handleApprove}
            disabled={isProcessing || !contribution}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44, // Accessibility: minimum touch target
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              backgroundColor: colors.success.DEFAULT,
              opacity: (pressed || isProcessing || !contribution) ? 0.5 : 1,
            })}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="white" />
                <Text style={{ 
                  marginLeft: 8, 
                  fontWeight: "700", 
                  fontSize: 14,
                  color: "white",
                }}>
                  Approve
                </Text>
              </>
            )}
          </Pressable>
          
          {/* Decline - Danger Style with Red Outline */}
          <Pressable 
            onPress={handleDecline}
            disabled={isProcessing || !contribution}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44, // Accessibility: minimum touch target
              paddingVertical: 12,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: colors.error.DEFAULT,
              backgroundColor: "rgba(239,68,68,0.1)",
              opacity: (pressed || isProcessing || !contribution) ? 0.5 : 1,
            })}
          >
            <Ionicons name="close-circle" size={18} color={colors.error.DEFAULT} />
            <Text style={{ 
              marginLeft: 8, 
              fontWeight: "600", 
              fontSize: 14,
              color: colors.error.DEFAULT,
            }}>
              Decline
            </Text>
          </Pressable>
        </View>
      )}
      
      {/* For paid contributions with receipts, show view receipt button */}
      {isPaid && hasReceipt && hasAdminPrivileges && (
        <View style={{ marginTop: 14 }}>
          <Pressable 
            onPress={handleViewReceipt}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 44,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.primary.DEFAULT + "40",
              backgroundColor: "rgba(255,107,53,0.08)",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="receipt" size={18} color={colors.primary.DEFAULT} />
            <Text style={{ 
              marginLeft: 8, 
              fontWeight: "600", 
              fontSize: 14,
              color: colors.primary.DEFAULT,
            }}>
              View Receipt
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Get current user from auth context
  const { user: currentUser } = useAuth();
  
  const { data: group, isLoading, error, refetch } = useGroup(id || '');
  const { data: members } = useGroupMembers(id || '');
  const { data: contributions, refetch: refetchContributions } = useGroupContributions(id || '', group?.currentCycle);
  
  // Mutations for approve/decline/mark as paid
  const approveContribution = useApproveContribution(id || '');
  const declineContribution = useDeclineContribution(id || '');
  const markContributionPaid = useMarkContributionPaid(id || '');
  
  // Handle View Receipt
  const handleViewReceipt = useCallback((receiptUrl: string | null, memberName: string) => {
    if (!receiptUrl) {
      safeAlert('No Receipt', 'This member has not uploaded a receipt yet.');
      return;
    }
    setSelectedReceiptUrl(receiptUrl);
    setSelectedMemberName(memberName);
    setReceiptModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);
  
  const handleCloseReceiptModal = useCallback(() => {
    setReceiptModalVisible(false);
    setSelectedReceiptUrl(null);
    setSelectedMemberName('');
  }, []);
  
  // Handle Approve
  const handleApprove = useCallback(async (contribution: Contribution) => {
    const memberName = contribution.member?.name || 
      `${contribution.member?.user?.firstName || ''} ${contribution.member?.user?.lastName || ''}`.trim() || 
      'Member';
    
    setProcessingId(contribution.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      await approveContribution.mutateAsync(contribution.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      safeAlert('Approved', `${memberName}'s payment has been approved.`);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      safeAlert('Error', error.response?.data?.message || error.message || 'Failed to approve payment');
    } finally {
      setProcessingId(null);
    }
  }, [approveContribution]);
  
  // Handle Decline
  const handleDecline = useCallback((contribution: Contribution) => {
    const memberName = contribution.member?.name || 
      `${contribution.member?.user?.firstName || ''} ${contribution.member?.user?.lastName || ''}`.trim() || 
      'Member';
    
    safeAlert(
      'Decline Payment',
      `This will reject ${memberName}'s payment and delete any uploaded receipt. They will need to resubmit.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(contribution.id);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            try {
              await declineContribution.mutateAsync(contribution.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              safeAlert('Declined', 'Payment has been declined. Member can resubmit.');
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              safeAlert('Error', error.response?.data?.message || error.message || 'Failed to decline payment');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  }, [declineContribution]);
  
  // Handle Mark as Paid (manual payment confirmation by admin)
  const handleMarkAsPaid = useCallback((member: Member, contribution?: Contribution) => {
    const memberName = member.name || 
      `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim() || 
      'Member';
    
    const cycleNumber = group?.currentCycle || 1;
    
    safeAlert(
      'Confirm Payment',
      `Mark ${memberName}'s payment as paid for Cycle ${cycleNumber}?\n\nUse this for cash payments or bank transfers verified outside the app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'default',
          onPress: async () => {
            // Use contribution ID if it exists, otherwise we need to handle differently
            if (contribution?.id) {
              setProcessingId(contribution.id);
            } else {
              // Track by member ID if no contribution exists yet
              setProcessingId(member.id);
            }
            
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            try {
              if (contribution?.id) {
                // Contribution record exists - just update status
                await markContributionPaid.mutateAsync({
                  contributionId: contribution.id,
                  datePaid: new Date().toISOString().split('T')[0],
                });
              } else {
                // No contribution record - this case needs the API to handle creation
                // For now, show a message. The backend PATCH endpoint handles this
                safeAlert('Note', 'No pending contribution record found. The member may need to submit a payment first, or try refreshing the page.');
                setProcessingId(null);
                return;
              }
              
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              safeAlert('Payment Recorded', `${memberName}'s payment has been marked as paid.`);
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              safeAlert('Error', error.response?.data?.message || error.message || 'Failed to mark payment as paid');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  }, [group?.currentCycle, markContributionPaid]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([refetch(), refetchContributions()]);
    } catch (e) {
      if (__DEV__) console.error('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchContributions]);

  // ============================================
  // ALL COMPUTED VALUES - MUST BE BEFORE EARLY RETURNS
  // ============================================
  
  const membersList = members || group?.members || [];
  // Ensure contributions is always an array (API might return object or nested data)
  const contributionsList = Array.isArray(contributions) ? contributions : [];
  
  // Check if current user is Creator or Co-Admin with multiple fallback methods
  // IMPORTANT: This useMemo MUST be before any early returns to satisfy React's Rules of Hooks
  const hasAdminPrivileges = useMemo(() => {
    if (!currentUser || !group) return false;
    
    const userId = String(currentUser.id);
    
    // Method 1: Check if user is group owner
    if (group?.userId && String(group.userId) === userId) {
      return true;
    }
    
    // Method 2: Check myMembership from group data
    if (group?.myMembership) {
      if (group.myMembership.role === 'creator') return true;
      if (group.myMembership.isAdmin === 1) return true;
    }
    
    // Method 3: Check group.isOwner flag
    if (group?.isOwner === true) return true;
    
    // Method 4: Check group.isAdmin flag  
    if (group?.isAdmin === true) return true;
    
    // Method 5: Search through contributions for current user's membership
    if (contributionsList && contributionsList.length > 0) {
      const myContribution = contributionsList.find(c => {
        const memberUserId = String(c.member?.userId || '');
        return memberUserId === userId;
      });
      
      if (myContribution?.member?.role === 'creator') return true;
      if (myContribution?.member?.isAdmin === 1) return true;
    }
    
    // Method 6: Search through group.members
    if (group?.members && group.members.length > 0) {
      const myMember = group.members.find(m => String(m.userId) === userId);
      if (myMember?.role === 'creator') return true;
      if (myMember?.isAdmin === 1) return true;
    }
    
    // Method 7: Check membersList (fetched separately)
    if (membersList && membersList.length > 0) {
      const myMember = membersList.find(m => String(m.userId) === userId);
      if (myMember?.role === 'creator') return true;
      if (myMember?.isAdmin === 1) return true;
    }
    
    return false;
  }, [currentUser, group, contributionsList, membersList]);
  
  // ============================================
  // EARLY RETURNS - AFTER ALL HOOKS
  // ============================================
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Loading...",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading group...</Text>
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
            headerTitle: "Error",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Could not load group
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
            {error?.message || "Group not found"}
          </Text>
          <Button onPress={() => refetch()} style={{ marginTop: 20 }}>
            Retry
          </Button>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary.DEFAULT }}>Go Back</Text>
          </Pressable>
        </View>
      </>
    );
  }
  
  // Data already computed above early returns
  const paidCount = contributionsList.filter(c => c.status === "paid" || c.status === "confirmed").length;
  const totalPot = group.contributionAmount * membersList.length;
  const currency = (group.currency || 'NGN') as CurrencyCode;
  
  // Find current beneficiary - prefer currentBeneficiaryId, fallback to rotation order
  const findCurrentBeneficiary = () => {
    // First try to find by currentBeneficiaryId
    if (group.currentBeneficiaryId) {
      const byId = membersList.find(m => m.userId === group.currentBeneficiaryId);
      if (byId) return byId;
    }
    // Fallback: find member whose rotation order matches current cycle
    const currentCycle = group.currentCycle || 1;
    const byRotation = membersList.find(m => m.rotationOrder === currentCycle);
    if (byRotation) return byRotation;
    // Last resort: use currentBeneficiary from group data if available
    if (group.currentBeneficiary) return group.currentBeneficiary;
    return null;
  };
  const currentBeneficiary = findCurrentBeneficiary();
  
  // Get beneficiary name with better fallback logic
  const getBeneficiaryName = () => {
    if (!currentBeneficiary) {
      // If group is pending, show "Not assigned yet"
      if (group.status === 'pending') return 'Not assigned yet';
      return 'TBD';
    }
    const firstName = currentBeneficiary.user?.firstName || '';
    const lastName = currentBeneficiary.user?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return currentBeneficiary.name || fullName || 'Member';
  };
  const currentBeneficiaryName = getBeneficiaryName();
  
  // Get current user's ID from auth context or API
  const currentUserId = currentUser?.id || group.currentUserId;
  
  // hasAdminPrivileges is computed above (before early returns)
  
  // Visibility settings - admins always see everything
  // recipientVisibility: 0 = hidden, 1 = visible
  // scheduleVisibility: 0 = hidden, 1 = visible
  const canSeeRecipient = hasAdminPrivileges || group.recipientVisibility !== 0;
  const canSeeSchedule = hasAdminPrivileges || group.scheduleVisibility !== 0;
  
  // Calculate days until next collection (try both field names for compatibility)
  const nextDate = (group.nextCollectionDate || (group as any).nextPayoutDate) 
    ? new Date(group.nextCollectionDate || (group as any).nextPayoutDate) 
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = nextDate 
    ? Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: group.name,
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
          headerRight: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/group/${id}/settings` as any);
              }}
              style={{ padding: 8 }}
            >
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
            </Pressable>
          ),
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
        <SafeAreaView edges={["bottom"]} style={{ flex: 1, paddingBottom: 96 }}>
          {/* Status Banner for pending/completed groups */}
          {group.status !== "active" && (
            <View style={{ 
              marginHorizontal: 16, 
              marginTop: 16, 
              padding: 16, 
              borderRadius: 12,
              backgroundColor: group.status === "pending" ? colors.warning.muted : colors.success.muted,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons 
                  name={group.status === "pending" ? "time-outline" : "checkmark-circle"} 
                  size={24} 
                  color={group.status === "pending" ? colors.warning.DEFAULT : colors.success.DEFAULT} 
                />
                <Text style={{ 
                  marginLeft: 8, 
                  fontWeight: "500",
                  color: group.status === "pending" ? colors.warning.DEFAULT : colors.success.DEFAULT,
                }}>
                  {group.status === "pending" ? "Awaiting Go-Live" : "All Cycles Completed"}
                </Text>
              </View>
            </View>
          )}
          
          {/* Hero Section: Cycle Progress + Beneficiary */}
          <View style={{ alignItems: "center", paddingVertical: 32 }}>
            <CycleProgressRing 
              current={group.currentCycle || 0} 
              total={group.totalCycles || membersList.length} 
            />
            
            <View style={{ marginTop: 24, alignItems: "center" }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Total Pot This Cycle</Text>
              <Text style={{ fontSize: 28, fontWeight: "700", color: colors.text, marginTop: 4 }}>
                {formatCurrency(totalPot, currency)}
              </Text>
            </View>
          </View>
          
          {/* Current Beneficiary Card - conditionally hidden based on visibility settings */}
          {canSeeRecipient ? (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Card variant="elevated" style={{ overflow: 'hidden' }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 }}>
                    <View style={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: 28, 
                      backgroundColor: colors.primary.DEFAULT + "33",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Ionicons name="gift" size={28} color={colors.primary.DEFAULT} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>Receiving This Cycle</Text>
                      <Text style={{ color: colors.text, fontWeight: "600", fontSize: 18 }} numberOfLines={1}>
                        {currentBeneficiaryName || 'TBD'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexShrink: 0 }}>
                    <Badge variant="success">Cycle {group.currentCycle || 1}</Badge>
                  </View>
                </View>
              </Card>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Card style={{ overflow: 'hidden', opacity: 0.7 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View style={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: 28, 
                      backgroundColor: colors.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Ionicons name="eye-off" size={28} color={colors.textMuted} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>Receiving This Cycle</Text>
                      <Text style={{ color: colors.textMuted, fontWeight: "500", fontSize: 16 }}>
                        Hidden by admin
                      </Text>
                    </View>
                  </View>
                  <Badge variant="default">Cycle {group.currentCycle || 1}</Badge>
                </View>
              </Card>
            </View>
          )}
          
          {/* Next Collection Date */}
          {nextDate && (
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Card>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={{ 
                      width: 48, 
                      height: 48, 
                      borderRadius: 24, 
                      backgroundColor: colors.cardElevated,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Ionicons name="calendar-outline" size={24} color={colors.primary.DEFAULT} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>Next Collection</Text>
                      <Text style={{ color: colors.text, fontWeight: "500" }}>
                        {nextDate.toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    {daysUntil !== null && daysUntil > 0 ? (
                      <>
                        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.primary.DEFAULT }}>{daysUntil}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>days left</Text>
                      </>
                    ) : daysUntil === 0 ? (
                      <>
                        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.success.DEFAULT }}>Today</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>due now</Text>
                      </>
                    ) : daysUntil !== null ? (
                      <>
                        <Text style={{ fontSize: 24, fontWeight: "700", color: colors.error.DEFAULT }}>{Math.abs(daysUntil)}</Text>
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>days overdue</Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </Card>
            </View>
          )}
          
          {/* Quick Actions - Button row with icons on top */}
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              {/* Contribute Button - only for active groups */}
              {group.status === 'active' && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/group/${id}/contribute` as any);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.cardElevated,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}>
                    <Ionicons name="wallet-outline" size={22} color={colors.primary.DEFAULT} />
                  </View>
                  <Text style={{ color: colors.text, fontWeight: "500", fontSize: 12 }}>Contribute</Text>
                </Pressable>
              )}
              
              {/* Schedule - shows lock icon if hidden for non-admins */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (canSeeSchedule) {
                    router.push(`/group/${id}/schedule` as any);
                  } else {
                    safeAlert('Schedule Hidden', 'The schedule has been hidden by the group admin.');
                  }
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                  opacity: canSeeSchedule ? (pressed ? 0.7 : 1) : 0.5,
                })}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.cardElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}>
                  <Ionicons 
                    name={canSeeSchedule ? "calendar-outline" : "lock-closed"} 
                    size={22} 
                    color={canSeeSchedule ? colors.primary.DEFAULT : colors.textMuted} 
                  />
                </View>
                <Text style={{ color: canSeeSchedule ? colors.text : colors.textMuted, fontWeight: "500", fontSize: 12 }}>
                  Schedule
                </Text>
              </Pressable>
              
              {/* Members */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/group/${id}/members` as any);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 12,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.cardElevated,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 6,
                }}>
                  <Ionicons name="people-outline" size={22} color={colors.primary.DEFAULT} />
                </View>
                <Text style={{ color: colors.text, fontWeight: "500", fontSize: 12 }}>Members</Text>
              </Pressable>
              
              {/* Add Members button - only for pending groups with admin privileges */}
              {hasAdminPrivileges && group.status === 'pending' && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/group/${id}/add-member` as any);
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.cardElevated,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}>
                    <Ionicons name="person-add" size={22} color={colors.primary.DEFAULT} />
                  </View>
                  <Text style={{ color: colors.text, fontWeight: "500", fontSize: 12 }}>Add</Text>
                </Pressable>
              )}
              
              {/* Invite button - disabled for active/completed groups, only for admins */}
              {hasAdminPrivileges && (
                <Pressable
                  onPress={() => {
                    if (group.status === 'pending') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/group/${id}/invite` as any);
                    }
                  }}
                  disabled={group.status !== 'pending'}
                  style={({ pressed }) => ({
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    opacity: group.status !== 'pending' ? 0.4 : (pressed ? 0.7 : 1),
                  })}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: colors.cardElevated,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}>
                    <Ionicons 
                      name="link-outline" 
                      size={22} 
                      color={group.status !== 'pending' ? colors.textMuted : colors.primary.DEFAULT} 
                    />
                  </View>
                  <Text style={{ 
                    color: group.status !== 'pending' ? colors.textMuted : colors.text, 
                    fontWeight: "500", 
                    fontSize: 12,
                  }}>
                    Invite
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
          
          {/* Contribution Status Header */}
          <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.text }}>
              Contributions ({paidCount}/{membersList.length})
            </Text>
          </View>
          
          {/* Contribution Status List */}
          <View>
            <Card style={{ marginHorizontal: 16, overflow: "hidden" }} padding="none">
              {membersList.length > 0 ? (
                membersList.map((member) => {
                  const contribution = contributionsList.find(c => c.memberId === member.id);
                  // Use rotation order to determine current beneficiary (more reliable)
                  const isMemberBeneficiary = currentBeneficiary?.id === member.id;
                  // Check processing by contribution ID or member ID (for mark as paid without contribution)
                  const isProcessing = processingId === contribution?.id || processingId === member.id;
                  return (
                    <ContributionItem
                      key={member.id}
                      member={member}
                      contribution={contribution}
                      isCurrentUser={member.userId === currentUserId}
                      isCurrentBeneficiary={isMemberBeneficiary}
                      groupId={id || ''}
                      hasAdminPrivileges={hasAdminPrivileges}
                      isProcessing={isProcessing}
                      onViewReceipt={handleViewReceipt}
                      onApprove={handleApprove}
                      onDecline={handleDecline}
                      onMarkAsPaid={handleMarkAsPaid}
                    />
                  );
                })
              ) : (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, marginTop: 12, textAlign: "center" }}>
                    No members in this group yet
                  </Text>
                </View>
              )}
            </Card>
          </View>
          
          {/* Group Info Footer */}
          <View style={{ paddingHorizontal: 16, marginTop: 24, marginBottom: 32 }}>
            <Card>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>Group Details</Text>
              
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: colors.textSubtle }}>Contribution</Text>
                <Text style={{ color: colors.text }}>{formatCurrency(group.contributionAmount, currency)}</Text>
              </View>
              
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: colors.textSubtle }}>Frequency</Text>
                <Text style={{ color: colors.text, textTransform: "capitalize" }}>{group.frequency}</Text>
              </View>
              
              {group.payoutMethod && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: colors.textSubtle }}>Payout Method</Text>
                  <Text style={{ color: colors.text }}>{group.payoutMethod === "admin" ? "Via Admin" : "Direct"}</Text>
                </View>
              )}
              
              {group.yourPosition && (
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: colors.textSubtle }}>Your Position</Text>
                  <Text style={{ color: colors.text }}>#{group.yourPosition} of {group.totalCycles || membersList.length}</Text>
                </View>
              )}
              
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: colors.textSubtle }}>Created</Text>
                <Text style={{ color: colors.text }}>{new Date(group.createdAt).toLocaleDateString()}</Text>
              </View>
            </Card>
          </View>
          
        </SafeAreaView>
      </ScrollView>
      
      {/* Receipt Viewer Modal */}
      <ReceiptViewerModal
        visible={receiptModalVisible}
        onClose={handleCloseReceiptModal}
        imageUrl={selectedReceiptUrl}
        memberName={selectedMemberName}
      />
      
      {/* Bottom Navigation Bar */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingBottom: 34, // Safe area for iOS
        paddingTop: 12,
        paddingHorizontal: 16,
      }}>
        <SafeAreaView edges={["bottom"]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Back Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: colors.cardElevated,
                borderRadius: 20,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
              <Text style={{ color: colors.text, fontWeight: '500', marginLeft: 4 }}>Back</Text>
            </Pressable>
            
            {/* Quick Actions */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {group.status === 'active' && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/group/${id}/contribute` as any);
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary.DEFAULT,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: colors.white, fontWeight: '600' }}>Contribute</Text>
                </Pressable>
              )}
              
              {group.status === 'pending' && hasAdminPrivileges && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/group/${id}/invite` as any);
                  }}
                  style={({ pressed }) => ({
                    backgroundColor: colors.primary.DEFAULT,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 20,
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text style={{ color: colors.white, fontWeight: '600' }}>Invite</Text>
                </Pressable>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
