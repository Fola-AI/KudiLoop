import { View, Text, ScrollView, Pressable, Share, TextInput, Modal, ActivityIndicator } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";
import { Card, Button, Badge } from "@/components/ui";
import { colors } from "@/theme";
import { useGroup, useGroupInvites, useCreateInvite, useDeleteInvite } from "@/hooks/api";
import type { InviteLink } from "@/types/api";

const BASE_URL = "https://kudiloop.com";

// Create Invite Modal
function CreateInviteModal({
  visible,
  onClose,
  onCreate,
  isCreating,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (expiresInDays: number, maxUses: number | null) => void;
  isCreating: boolean;
}) {
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [maxUses, setMaxUses] = useState("");
  
  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onCreate(expiresInDays, maxUses ? parseInt(maxUses) : null);
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={ZoomIn}>
            <Card variant="elevated" style={{ padding: 24 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                Create Invite Link
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24 }}>
                Set expiration and usage limits for this invite
              </Text>
              
              {/* Expiration */}
              <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                Link expires in
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {[1, 3, 7, 14, 30].map((days) => (
                  <Pressable
                    key={days}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setExpiresInDays(days);
                    }}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: expiresInDays === days ? colors.primary.DEFAULT : '#374151',
                      backgroundColor: expiresInDays === days ? 'rgba(255,107,53,0.1)' : '#1f2937',
                    }}
                  >
                    <Text style={{ 
                      color: expiresInDays === days ? colors.primary.DEFAULT : '#9ca3af',
                      fontWeight: '600',
                      fontSize: 13,
                    }}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              
              {/* Max Uses */}
              <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8, fontWeight: '500' }}>
                Maximum uses (optional)
              </Text>
              <TextInput
                value={maxUses}
                onChangeText={(text) => setMaxUses(text.replace(/[^0-9]/g, ''))}
                placeholder="Unlimited"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 12,
                  padding: 16,
                  color: 'white',
                  fontSize: 16,
                  borderWidth: 2,
                  borderColor: '#374151',
                  marginBottom: 24,
                }}
              />
              
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button variant="secondary" size="lg" onPress={onClose} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  size="lg" 
                  onPress={handleCreate}
                  loading={isCreating}
                  style={{ flex: 1 }}
                >
                  Create
                </Button>
              </View>
            </Card>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// QR Code Display Modal
function QRCodeModal({
  visible,
  inviteUrl,
  onClose,
  onShare,
  onCopy,
}: {
  visible: boolean;
  inviteUrl: string;
  onClose: () => void;
  onShare: () => void;
  onCopy: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={ZoomIn}>
            <Card variant="elevated" style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
                Scan to Join
              </Text>
              <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 24, textAlign: 'center' }}>
                Share this QR code with people you want to invite
              </Text>
              
              {/* QR Code */}
              <View style={{ 
                backgroundColor: 'white', 
                padding: 16, 
                borderRadius: 16,
                marginBottom: 24,
              }}>
                <QRCode
                  value={inviteUrl}
                  size={200}
                  color="#000000"
                  backgroundColor="#ffffff"
                />
              </View>
              
              {/* URL Display with Copy Button */}
              <View style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: 12, 
                padding: 12, 
                width: '100%',
                marginBottom: 24,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Text 
                  style={{ color: '#9ca3af', fontSize: 12, flex: 1 }} 
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {inviteUrl}
                </Text>
                <Pressable
                  onPress={onCopy}
                  style={({ pressed }) => ({
                    marginLeft: 8,
                    padding: 8,
                    borderRadius: 8,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.1)' : 'transparent',
                  })}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.primary.DEFAULT} />
                </Pressable>
              </View>
              
              <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                <Button variant="secondary" size="lg" onPress={onClose} style={{ flex: 1 }}>
                  Close
                </Button>
                <Button variant="primary" size="lg" onPress={onShare} style={{ flex: 1 }}>
                  Share
                </Button>
              </View>
            </Card>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Invite Card Component
function InviteCard({
  invite,
  groupName,
  onShowQR,
  onShare,
  onCopy,
  onRevoke,
}: {
  invite: InviteLink;
  groupName: string;
  onShowQR: () => void;
  onShare: () => void;
  onCopy: () => void;
  onRevoke: () => void;
}) {
  const inviteUrl = `${BASE_URL}/invite/${invite.token}`;
  const isExpired = invite.expiresAt ? new Date(invite.expiresAt) < new Date() : false;
  const isUsedUp = invite.maxUses !== undefined && invite.usedCount >= invite.maxUses;
  const isActive = !isExpired && !isUsedUp;
  
  const createdDate = new Date(invite.createdAt).toLocaleDateString();
  const expiresDate = invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'Never';
  
  return (
    <Card style={{ padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
              ...{invite.token.slice(-8)}
            </Text>
            <View style={{ marginLeft: 8 }}>
              <Badge variant={isActive ? "success" : "default"}>
                {isActive ? "Active" : isExpired ? "Expired" : "Used up"}
              </Badge>
            </View>
          </View>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>
            Created {createdDate} • Expires {expiresDate}
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
            Used {invite.usedCount || 0}{invite.maxUses ? ` of ${invite.maxUses}` : ''} times
          </Text>
        </View>
      </View>
      
      {isActive && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onShowQR();
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: '#1f2937',
            }}
          >
            <Ionicons name="qr-code-outline" size={18} color={colors.primary.DEFAULT} />
            <Text style={{ color: colors.primary.DEFAULT, fontSize: 13, fontWeight: '500', marginLeft: 6 }}>QR</Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onShare();
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: '#1f2937',
            }}
          >
            <Ionicons name="share-outline" size={18} color="#3b82f6" />
            <Text style={{ color: '#3b82f6', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Share</Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCopy();
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: '#1f2937',
            }}
          >
            <Ionicons name="copy-outline" size={18} color="#10b981" />
            <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '500', marginLeft: 6 }}>Copy</Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRevoke();
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: 'rgba(239,68,68,0.1)',
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </Pressable>
        </View>
      )}
    </Card>
  );
}

export default function InviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedInviteUrl, setSelectedInviteUrl] = useState("");
  
  const { data: group, isLoading: groupLoading, error: groupError } = useGroup(id || '');
  const { data: invites, isLoading: invitesLoading, refetch } = useGroupInvites(id || '');
  const createInvite = useCreateInvite(id || '');
  const deleteInvite = useDeleteInvite(id || '');
  
  const isLoading = groupLoading || invitesLoading;
  
  // Loading state
  if (isLoading && !group) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Invite Members",
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
  if (groupError || !group) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Invite Members",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Could not load group
          </Text>
          <Button onPress={() => router.back()} style={{ marginTop: 20 }}>
            Go Back
          </Button>
        </View>
      </>
    );
  }
  
  const invitesList = invites || [];
  const memberCount = group.memberCount || 0;
  
  const handleCreateInvite = async (expiresInDays: number, maxUses: number | null) => {
    try {
      const result = await createInvite.mutateAsync({
        expiresInDays,
        maxUses: maxUses ?? undefined,
      });
      
      setShowCreateModal(false);
      
      // Show QR code for the new invite
      if (result?.token) {
        setSelectedInviteUrl(`${BASE_URL}/invite/${result.token}`);
        setShowQRModal(true);
      }
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      refetch();
    } catch (error: any) {
      safeAlert("Error", error.message || "Failed to create invite");
    }
  };
  
  const handleShare = async (token: string) => {
    const inviteUrl = `${BASE_URL}/invite/${token}`;
    const message = `Join my savings group "${group.name}" on KudiLoop!\n\n${inviteUrl}`;
    
    try {
      await Share.share({
        message,
        url: inviteUrl,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      if (__DEV__) console.error(error);
    }
  };
  
  const handleCopy = async (token: string) => {
    const inviteUrl = `${BASE_URL}/invite/${token}`;
    await Clipboard.setStringAsync(inviteUrl);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    safeAlert("Copied!", "Invite link copied to clipboard");
  };
  
  const handleRevoke = (inviteId: string) => {
    safeAlert(
      "Revoke Invite",
      "Are you sure you want to revoke this invite link? It will no longer work.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInvite.mutateAsync(inviteId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              safeAlert("Error", error.message || "Failed to revoke invite");
            }
          },
        },
      ]
    );
  };
  
  const activeInvites = invitesList.filter(inv => {
    const isExpired = inv.expiresAt ? new Date(inv.expiresAt) < new Date() : false;
    const isUsedUp = inv.maxUses !== undefined && inv.usedCount >= inv.maxUses;
    return !isExpired && !isUsedUp;
  });
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Invite Members",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: "Back",
        }}
      />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      >
        {/* Group Info */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Card variant="elevated" style={{ padding: 16, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: 'rgba(255,107,53,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="people" size={24} color={colors.primary.DEFAULT} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{group.name}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 13, marginTop: 2 }}>
                  {memberCount} members • {group.visibility === 'closed' ? 'Closed group' : 'Open group'}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>
        
        {/* Create New Invite Button */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Button
            variant="primary"
            size="lg"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowCreateModal(true);
            }}
            style={{ marginBottom: 24 }}
            leftIcon={<Ionicons name="add-circle-outline" size={20} color="white" />}
          >
            Create New Invite
          </Button>
        </Animated.View>
        
        {/* Active Invites */}
        <Animated.View entering={FadeInDown.delay(300)}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Your Invites ({activeInvites.length} active)
            </Text>
          </View>
          
          {invitesList.length > 0 ? (
            invitesList.map((invite, index) => (
              <Animated.View key={invite.id} entering={FadeInDown.delay(350 + index * 50)}>
                <InviteCard
                  invite={invite}
                  groupName={group.name}
                  onShowQR={() => {
                    setSelectedInviteUrl(`${BASE_URL}/invite/${invite.token}`);
                    setShowQRModal(true);
                  }}
                  onShare={() => handleShare(invite.token)}
                  onCopy={() => handleCopy(invite.token)}
                  onRevoke={() => handleRevoke(invite.id)}
                />
              </Animated.View>
            ))
          ) : (
            <Card style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="link-outline" size={48} color="#374151" />
              <Text style={{ color: '#9ca3af', fontSize: 16, marginTop: 12 }}>No invites yet</Text>
              <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 4 }}>
                Create an invite link to start adding members
              </Text>
            </Card>
          )}
        </Animated.View>
        
        {/* Info Box */}
        <Animated.View entering={FadeInDown.delay(500)} style={{ marginTop: 16 }}>
          <View style={{ 
            padding: 16, 
            backgroundColor: 'rgba(59,130,246,0.1)', 
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={{ color: '#93c5fd', fontSize: 13, flex: 1 }}>
              {group.visibility === 'open' 
                ? "This is an open group. New members will need your approval before joining."
                : "This is a closed group. Only people with an invite link can join directly."}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Modals */}
      <CreateInviteModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateInvite}
        isCreating={createInvite.isPending}
      />
      
      <QRCodeModal
        visible={showQRModal}
        inviteUrl={selectedInviteUrl}
        onClose={() => setShowQRModal(false)}
        onShare={() => {
          setShowQRModal(false);
          const token = selectedInviteUrl.split('/').pop() || '';
          handleShare(token);
        }}
        onCopy={async () => {
          await Clipboard.setStringAsync(selectedInviteUrl);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          safeAlert('Copied!', 'Invite link copied to clipboard');
        }}
      />
    </>
  );
}
