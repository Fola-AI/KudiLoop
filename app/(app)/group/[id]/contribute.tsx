import { View, Text, ScrollView, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Card, Button, Avatar, Badge } from "@/components/ui";
import { colors } from "@/theme";
import { formatCurrency } from "@/utils";
import { useGroup, useGroupContributions } from "@/hooks/api";
import { useUploadReceipt } from "@/hooks/api/useContributions";
import { useAuth } from "@/contexts/AuthContext";
import type { CurrencyCode } from "@/types";

type PaymentStep = "info" | "upload" | "success";

export default function ContributeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [step, setStep] = useState<PaymentStep>("info");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Get current user from auth context
  const { user: currentUser } = useAuth();
  
  const { data: group, isLoading: groupLoading, error: groupError } = useGroup(id || '');
  const { data: contributions, isLoading: contribLoading } = useGroupContributions(id || '', group?.currentCycle);
  
  const uploadReceipt = useUploadReceipt(id || '');
  
  const isLoading = groupLoading || contribLoading;
  
  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Contribute",
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
            headerTitle: "Contribute",
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
  
  const currency = (group.currency || 'NGN') as CurrencyCode;
  const members = group.members || [];
  
  // Ensure contributions is an array
  const contributionsList = Array.isArray(contributions) ? contributions : [];
  
  // Get current user's ID from auth context or API
  const currentUserId = currentUser?.id || group.currentUserId;
  
  // Find current user's member record, then their contribution
  const myMember = group.myMembership || members.find(m => m.userId === currentUserId);
  const myContribution = myMember 
    ? contributionsList.find(c => c.memberId === myMember.id)
    : undefined;

  // Debug log
  console.log('📋 Contribute screen debug:', {
    currentUserId,
    myMemberId: myMember?.id,
    myContributionId: myContribution?.id,
    contributionsCount: contributionsList.length,
  });
  
  // Find current beneficiary (member whose rotation order matches current cycle)
  const currentCycle = group.currentCycle || 1;
  const currentBeneficiary = members.find(m => m.userId === group.currentBeneficiaryId) 
    || members.find(m => m.rotationOrder === currentCycle);
  const beneficiaryName = currentBeneficiary 
    ? (currentBeneficiary.name || `${currentBeneficiary.user?.firstName || ''} ${currentBeneficiary.user?.lastName || ''}`.trim()) 
    : 'TBD';
  
  // Find admin (creator) for payment
  const admin = members.find(m => m.role === 'creator');
  const adminName = admin 
    ? (admin.name || `${admin.user?.firstName || ''} ${admin.user?.lastName || ''}`.trim())
    : 'Admin';
  
  // Determine who to pay based on payout method (payoutMedium field)
  const payoutMedium = group.payoutMedium || (group as any).payoutMethod || 'admin';
  const payToAdmin = payoutMedium === 'admin';
  const payTo = payToAdmin ? admin : currentBeneficiary;
  const payToName = payToAdmin ? adminName : beneficiaryName;
  const payToPhone = payTo?.phone || payTo?.user?.phone || 'N/A';
  
  // Extract bank details from the user object
  const getUserBankDetails = (user: any) => {
    if (!user) {
      return {
        bankName: 'Not provided',
        accountNumber: 'Not provided',
        accountName: payToName,
      };
    }
    
    const bankName = user.localBankName || user.internationalBankName || 'Not provided';
    const accountNumber = user.localBankAccountNumber || user.internationalBankAccountNumber || 'Not provided';
    const accountName = user.localBankAccountName || user.internationalBankAccountName || payToName;
    
    return { bankName, accountNumber, accountName };
  };
  
  const bankDetails = getUserBankDetails(payTo?.user);
  
  // Already paid check - if status is 'paid' or 'confirmed', show completed state
  if (myContribution?.status === "paid" || myContribution?.status === "confirmed") {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Contribute",
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
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(34,197,94,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success.DEFAULT} />
            </View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              Already Paid
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
              You've already contributed for Cycle {group.currentCycle}
            </Text>
            <Button variant="secondary" onPress={() => router.back()}>
              Go Back
            </Button>
          </View>
        </View>
      </>
    );
  }
  
  // Pending approval check - only show if they have uploaded a receipt and it's pending
  // If pending but no receipt, they haven't paid yet - show the upload form
  if (myContribution?.status === "pending" && myContribution?.receiptUrl) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Contribute",
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
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(245,158,11,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Ionicons name="time" size={48} color={colors.warning.DEFAULT} />
            </View>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
              Pending Approval
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginBottom: 8 }}>
              Your payment request for Cycle {group.currentCycle} has been submitted
            </Text>
            {myContribution.receiptUrl && (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: 'rgba(34,197,94,0.1)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                marginBottom: 16,
              }}>
                <Ionicons name="document-attach" size={16} color={colors.success.DEFAULT} />
                <Text style={{ color: colors.success.DEFAULT, marginLeft: 6, fontSize: 13 }}>Receipt uploaded</Text>
              </View>
            )}
            <Text style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
              The group admin will review and approve your payment soon
            </Text>
            <Button variant="secondary" onPress={() => router.back()}>
              Go Back
            </Button>
          </View>
        </View>
      </>
    );
  }
  
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to take receipt photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };
  
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Photo library access is needed to select receipt images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };
  
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  
  const pickFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  
  // Handle "I've Made the Payment" - go to upload step
  const handlePaymentMade = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Open image picker to select receipt
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setStep("upload");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };
  
  // Submit payment request WITH receipt
  const handleSubmitPaymentWithReceipt = async () => {
    if (!selectedImage) {
      Alert.alert('No Receipt', 'Please select a receipt image first.');
      return;
    }
    
    // Need contribution ID to upload receipt
    if (!myContribution?.id) {
      Alert.alert(
        'Error', 
        'Could not find your contribution record. Please pull to refresh the group page and try again.'
      );
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      console.log('📤 Uploading receipt for contribution:', myContribution.id);
      
      await uploadReceipt.mutateAsync({
        contributionId: myContribution.id,
        imageUri: selectedImage,
      });
      
      console.log('✅ Receipt uploaded successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep("success");
      
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Upload Failed', 
        error.response?.data?.message || error.message || 'Failed to upload receipt. Please try again.'
      );
    }
  };
  
  // Continue without receipt - just show confirmation and go back
  // No API call needed - contribution records are auto-created with 'pending' status
  const handleContinueWithoutReceipt = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'Continue Without Receipt?',
      'Your payment will be recorded as pending. The admin can approve it manually, or you can upload a receipt later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Just go back to group - contribution already exists with 'pending' status
            router.back();
          }
        }
      ]
    );
  };
  
  // Render info step - show payment details
  const renderInfo = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 160 }}>
        {/* Amount Card */}
        <Card variant="elevated" style={{ padding: 24, alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 4 }}>Amount Due</Text>
          <Text style={{ color: 'white', fontSize: 36, fontWeight: 'bold' }}>
            {formatCurrency(group.contributionAmount, currency)}
          </Text>
          <Badge variant="warning" style={{ marginTop: 8 }}>
            Cycle {group.currentCycle} of {group.totalCycles || members.length}
          </Badge>
        </Card>
        
        {/* Pay To Card */}
        <Card style={{ padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            {payToAdmin ? "Pay to Admin" : "Pay to Recipient"}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Avatar name={payToName} size="lg" />
            <View style={{ marginLeft: 12 }}>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{payToName}</Text>
              <Text style={{ color: '#9ca3af', fontSize: 14 }}>{payToPhone}</Text>
            </View>
          </View>
          
          {/* Bank Details */}
          <View style={{ backgroundColor: '#1f2937', borderRadius: 12, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}>Bank</Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>{bankDetails.bankName}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}>Account Number</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert("Copied!", "Account number copied to clipboard");
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ color: colors.primary.DEFAULT, fontSize: 14, fontWeight: '600', marginRight: 4 }}>
                  {bankDetails.accountNumber}
                </Text>
                <Ionicons name="copy-outline" size={16} color={colors.primary.DEFAULT} />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#9ca3af', fontSize: 13 }}>Account Name</Text>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '500' }}>{bankDetails.accountName}</Text>
            </View>
          </View>
        </Card>
        
        {/* Current Beneficiary Info (if paying to admin) */}
        {payToAdmin && currentBeneficiary && (
          <Card style={{ padding: 16, marginBottom: 16, borderColor: 'rgba(34,197,94,0.3)', borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(34,197,94,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="gift-outline" size={20} color={colors.success.DEFAULT} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>This cycle's recipient</Text>
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
                  {beneficiaryName}
                </Text>
              </View>
            </View>
          </Card>
        )}
        
        {/* Instructions */}
        <View style={{ 
          padding: 16, 
          backgroundColor: 'rgba(59,130,246,0.1)', 
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}>
          <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#3b82f6', fontSize: 14, fontWeight: '600', marginBottom: 4 }}>
              How to pay
            </Text>
            <Text style={{ color: '#93c5fd', fontSize: 13, lineHeight: 20 }}>
              1. Transfer the exact amount to the account above{'\n'}
              2. Take a screenshot of your transfer confirmation{'\n'}
              3. Come back here and tap "I've Made the Payment"{'\n'}
              4. Upload your receipt for verification
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Buttons */}
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
          onPress={handlePaymentMade}
          style={{ marginBottom: 12 }}
        >
          I've Made the Payment
        </Button>
        
        <Button
          variant="ghost"
          size="lg"
          onPress={handleContinueWithoutReceipt}
        >
          Continue without Receipt
        </Button>
      </SafeAreaView>
    </View>
  );
  
  // Render upload step - show image preview and upload button
  const renderUpload = () => (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 160 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: 'rgba(34,197,94,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="checkmark" size={36} color={colors.success.DEFAULT} />
          </View>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
            Payment Recorded!
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', marginTop: 8 }}>
            Now upload your receipt as proof
          </Text>
        </View>
        
        {/* Image Preview */}
        {selectedImage && (
          <Card style={{ padding: 16, marginBottom: 16 }}>
            <Image
              source={{ uri: selectedImage }}
              style={{ width: '100%', height: 250, borderRadius: 12, marginBottom: 16 }}
              resizeMode="cover"
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedImage(null);
                }}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(239,68,68,0.2)',
                }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error.DEFAULT} />
                <Text style={{ color: colors.error.DEFAULT, marginLeft: 8, fontWeight: '500' }}>Remove</Text>
              </Pressable>
              <Pressable
                onPress={pickFromGallery}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,107,53,0.2)',
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color={colors.primary.DEFAULT} />
                <Text style={{ color: colors.primary.DEFAULT, marginLeft: 8, fontWeight: '500' }}>Change</Text>
              </Pressable>
            </View>
          </Card>
        )}
        
        {/* If no image selected, show options */}
        {!selectedImage && (
          <Card style={{ padding: 24, marginBottom: 16 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
              Upload Receipt
            </Text>
            
            {/* Camera Option */}
            <Pressable
              onPress={takePhoto}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#1f2937',
                borderRadius: 12,
                marginBottom: 12,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(255,107,53,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="camera" size={24} color={colors.primary.DEFAULT} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>Take Photo</Text>
                <Text style={{ color: '#9ca3af', fontSize: 13 }}>Use camera to capture receipt</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>
            
            {/* Gallery Option */}
            <Pressable
              onPress={pickFromGallery}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: '#1f2937',
                borderRadius: 12,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: 'rgba(59,130,246,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="images" size={24} color="#3b82f6" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>Choose from Gallery</Text>
                <Text style={{ color: '#9ca3af', fontSize: 13 }}>Select existing screenshot</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </Pressable>
          </Card>
        )}
        
        {/* Info Note */}
        <View style={{ 
          padding: 16, 
          backgroundColor: 'rgba(245,158,11,0.1)', 
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}>
          <Ionicons name="shield-checkmark" size={20} color={colors.warning.DEFAULT} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={{ color: colors.warning.DEFAULT, fontSize: 13, flex: 1 }}>
            Receipts help verify payments and resolve disputes. Only group admins can view your receipt.
          </Text>
        </View>
      </ScrollView>
      
      {/* Bottom Button */}
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
          onPress={handleSubmitPaymentWithReceipt}
          loading={uploadReceipt.isPending}
          disabled={uploadReceipt.isPending || !selectedImage}
        >
          Upload Receipt
        </Button>
      </SafeAreaView>
    </View>
  );
  
  // Render success step
  const renderSuccess = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: 'rgba(34,197,94,0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Ionicons name="checkmark-circle" size={60} color={colors.success.DEFAULT} />
        </View>
        
        <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 }}>
          Thank You!
        </Text>
        <Text style={{ color: '#9ca3af', fontSize: 16, textAlign: 'center', marginBottom: 16, paddingHorizontal: 24 }}>
          Your payment request has been submitted for Cycle {group.currentCycle}.
        </Text>
        
        {selectedImage && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: 'rgba(34,197,94,0.1)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            marginBottom: 16,
          }}>
            <Ionicons name="document-attach" size={18} color={colors.success.DEFAULT} />
            <Text style={{ color: colors.success.DEFAULT, marginLeft: 8, fontSize: 14 }}>Receipt uploaded</Text>
          </View>
        )}
        
        <View style={{
          padding: 16,
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderRadius: 12,
          marginBottom: 32,
        }}>
          <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center' }}>
            The group admin will review and approve your payment. You'll be notified once it's confirmed.
          </Text>
        </View>
        
        <Button
          variant="primary"
          size="lg"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
          style={{ width: '100%', marginBottom: 12 }}
        >
          Back to Group
        </Button>
        
        <Button
          variant="ghost"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace("/(app)/(tabs)");
          }}
        >
          Go to Home
        </Button>
      </View>
    </View>
  );
  
  const renderContent = () => {
    switch (step) {
      case "info":
        return renderInfo();
      case "upload":
        return renderUpload();
      case "success":
        return renderSuccess();
      default:
        return null;
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: step === "success" ? "Done" : "Contribute",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: step === "success" ? () => null : () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (step === "upload") {
                  setStep("info");
                  setSelectedImage(null);
                } else {
                  router.back();
                }
              }}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {renderContent()}
      </View>
    </>
  );
}
