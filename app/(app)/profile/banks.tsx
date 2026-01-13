import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { useState, useEffect } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { colors } from "@/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/api/useUser";

type BankType = "local" | "international";
type EditMode = null | "local" | "international";

interface LocalBankData {
  bankName: string;
  accountNumber: string;
  accountName: string;
  sortCode: string;
}

interface InternationalBankData {
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode: string;
  iban: string;
}

interface BankData {
  local: LocalBankData;
  international: InternationalBankData;
}

// Bank Detail Row Component - Fixed for long text
function BankDetailRow({ 
  label, 
  value, 
  copyable = false 
}: { 
  label: string; 
  value: string;
  copyable?: boolean;
}) {
  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(value);
    safeAlert("Copied!", `${label} copied to clipboard`);
  };
  
  // Truncate long values manually for cleaner display
  const truncateValue = (val: string, maxLength: number = 16) => {
    if (!val || val.length <= maxLength) return val;
    const start = val.slice(0, 6);
    const end = val.slice(-6);
    return `${start}...${end}`;
  };
  
  const displayValue = copyable && value && value.length > 16 
    ? truncateValue(value) 
    : (value || "Not set");
  
  return (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#1f2937',
    }}>
      <Text style={{ color: '#9ca3af', fontSize: 14 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
        <Text 
          style={{ 
            color: copyable ? colors.primary.DEFAULT : 'white', 
            fontSize: 14, 
            fontWeight: '500',
          }}
        >
          {displayValue}
        </Text>
        {copyable && value && (
          <Pressable onPress={handleCopy} style={{ marginLeft: 8, padding: 4 }}>
            <Ionicons name="copy-outline" size={18} color={colors.primary.DEFAULT} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

// Bank Card Component
function BankCard({ 
  type, 
  data, 
  onEdit 
}: { 
  type: BankType;
  data: LocalBankData | InternationalBankData;
  onEdit: () => void;
}) {
  const isLocal = type === "local";
  const hasData = data.bankName && data.accountNumber;
  
  return (
    <Card style={{ padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isLocal ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Ionicons 
              name={isLocal ? "business-outline" : "globe-outline"} 
              size={22} 
              color={isLocal ? colors.success.DEFAULT : "#3b82f6"} 
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {isLocal ? "Local Bank" : "International Bank"}
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 12 }}>
              {isLocal ? "For NGN payouts" : "For foreign currency payouts"}
            </Text>
          </View>
        </View>
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onEdit();
          }}
          style={{ padding: 8 }}
        >
          <Ionicons name="pencil" size={20} color={colors.primary.DEFAULT} />
        </Pressable>
      </View>
      
      {hasData ? (
        <View>
          <BankDetailRow label="Bank" value={data.bankName} />
          <BankDetailRow label="Account Number" value={data.accountNumber} copyable />
          <BankDetailRow label="Account Name" value={data.accountName} />
          {isLocal ? (
            <BankDetailRow label="Sort Code" value={(data as LocalBankData).sortCode} />
          ) : (
            <>
              <BankDetailRow label="SWIFT/BIC" value={(data as InternationalBankData).swiftCode} copyable />
              <BankDetailRow label="IBAN" value={(data as InternationalBankData).iban} copyable />
            </>
          )}
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Ionicons name="card-outline" size={40} color="#374151" />
          <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>No bank details added</Text>
          <Button 
            variant="secondary" 
            size="sm" 
            onPress={onEdit}
            style={{ marginTop: 12 }}
          >
            Add Bank Details
          </Button>
        </View>
      )}
    </Card>
  );
}

// Edit Bank Modal/Form
function EditBankForm({
  type,
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  type: BankType;
  initialData: LocalBankData | InternationalBankData;
  onSave: (data: LocalBankData | InternationalBankData) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const isLocal = type === "local";
  const [formData, setFormData] = useState(initialData);
  
  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSave(formData);
  };
  
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
      <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
        {isLocal ? "Local Bank Details" : "International Bank Details"}
      </Text>
      <Text style={{ color: '#9ca3af', fontSize: 15, marginBottom: 24 }}>
        {isLocal 
          ? "Add your Nigerian bank account for NGN payouts" 
          : "Add your international bank for foreign currency payouts"}
      </Text>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Bank Name</Text>
        <TextInput
          value={formData.bankName}
          onChangeText={(text) => setFormData({...formData, bankName: text})}
          placeholder={isLocal ? "e.g., First Bank, GTBank" : "e.g., Wise, Revolut"}
          placeholderTextColor="#6b7280"
          style={{
            backgroundColor: '#1f2937',
            borderRadius: 12,
            padding: 16,
            color: 'white',
            fontSize: 16,
            borderWidth: 2,
            borderColor: '#374151',
          }}
        />
      </View>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Account Number</Text>
        <TextInput
          value={formData.accountNumber}
          onChangeText={(text) => setFormData({...formData, accountNumber: text})}
          placeholder={isLocal ? "10-digit account number" : "Account number or IBAN"}
          placeholderTextColor="#6b7280"
          keyboardType="default"
          style={{
            backgroundColor: '#1f2937',
            borderRadius: 12,
            padding: 16,
            color: 'white',
            fontSize: 16,
            borderWidth: 2,
            borderColor: '#374151',
          }}
        />
      </View>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Account Name</Text>
        <TextInput
          value={formData.accountName}
          onChangeText={(text) => setFormData({...formData, accountName: text})}
          placeholder="Name on the account"
          placeholderTextColor="#6b7280"
          style={{
            backgroundColor: '#1f2937',
            borderRadius: 12,
            padding: 16,
            color: 'white',
            fontSize: 16,
            borderWidth: 2,
            borderColor: '#374151',
          }}
        />
      </View>
      
      {isLocal ? (
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>Sort Code (Optional)</Text>
          <TextInput
            value={(formData as LocalBankData).sortCode}
            onChangeText={(text) => setFormData({...formData, sortCode: text})}
            placeholder="Bank sort code"
            placeholderTextColor="#6b7280"
            style={{
              backgroundColor: '#1f2937',
              borderRadius: 12,
              padding: 16,
              color: 'white',
              fontSize: 16,
              borderWidth: 2,
              borderColor: '#374151',
            }}
          />
        </View>
      ) : (
        <>
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>SWIFT/BIC Code</Text>
            <TextInput
              value={(formData as InternationalBankData).swiftCode}
              onChangeText={(text) => setFormData({...formData, swiftCode: text})}
              placeholder="e.g., TRWIGB2L"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              style={{
                backgroundColor: '#1f2937',
                borderRadius: 12,
                padding: 16,
                color: 'white',
                fontSize: 16,
                borderWidth: 2,
                borderColor: '#374151',
              }}
            />
          </View>
          
          <View style={{ marginBottom: 20 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 8, fontWeight: '500' }}>IBAN (Optional)</Text>
            <TextInput
              value={(formData as InternationalBankData).iban}
              onChangeText={(text) => setFormData({...formData, iban: text})}
              placeholder="International Bank Account Number"
              placeholderTextColor="#6b7280"
              autoCapitalize="characters"
              style={{
                backgroundColor: '#1f2937',
                borderRadius: 12,
                padding: 16,
                color: 'white',
                fontSize: 16,
                borderWidth: 2,
                borderColor: '#374151',
              }}
            />
          </View>
        </>
      )}
      
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Button variant="secondary" size="lg" onPress={onCancel} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          size="lg" 
          onPress={handleSave} 
          loading={isSaving}
          style={{ flex: 1 }}
        >
          Save
        </Button>
      </View>
    </ScrollView>
  );
}

export default function BankAccountsScreen() {
  const { user, refreshUser } = useAuth();
  const updateProfile = useUpdateProfile();
  const [editMode, setEditMode] = useState<EditMode>(null);
  
  // Get bank data from user object
  const bankData: BankData = {
    local: {
      bankName: user?.localBankName || '',
      accountNumber: user?.localBankAccountNumber || '',
      accountName: user?.localBankAccountName || '',
      sortCode: user?.localBankSortCode || '',
    },
    international: {
      bankName: user?.internationalBankAccountName ? 'International Bank' : '', // Backend may not have bank name field for international
      accountNumber: user?.internationalBankAccountNumber || '',
      accountName: user?.internationalBankAccountName || '',
      swiftCode: user?.internationalBankSwiftCode || '',
      iban: user?.internationalBankIBAN || '',
    },
  };

  const handleSaveBank = async (type: BankType, data: LocalBankData | InternationalBankData) => {
    try {
      let updatePayload = {};
      
      if (type === 'local') {
        const localData = data as LocalBankData;
        updatePayload = {
          localBankName: localData.bankName,
          localBankAccountNumber: localData.accountNumber,
          localBankAccountName: localData.accountName,
          localBankSortCode: localData.sortCode,
        };
      } else {
        const intlData = data as InternationalBankData;
        updatePayload = {
          internationalBankAccountNumber: intlData.accountNumber,
          internationalBankAccountName: intlData.accountName,
          internationalBankSwiftCode: intlData.swiftCode,
          internationalBankIBAN: intlData.iban,
        };
      }
      
      await updateProfile.mutateAsync(updatePayload);
      await refreshUser();
      
      setEditMode(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      safeAlert("Success", "Bank details saved successfully!");
    } catch (error: any) {
      if (__DEV__) console.error('Failed to save bank details:', error);
      safeAlert("Error", error.message || "Failed to save bank details. Please try again.");
    }
  };
  
  if (editMode) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: editMode === "local" ? "Local Bank" : "International Bank",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <EditBankForm
            type={editMode}
            initialData={bankData[editMode]}
            onSave={(data) => handleSaveBank(editMode, data)}
            onCancel={() => setEditMode(null)}
            isSaving={updateProfile.isPending}
          />
        </View>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Bank Accounts",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: "Profile",
        }}
      />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 24 }}
      >
        <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
          Add your bank details to receive payouts from your savings groups.
        </Text>
        
        <BankCard 
          type="local" 
          data={bankData.local} 
          onEdit={() => setEditMode("local")} 
        />
        
        <BankCard 
          type="international" 
          data={bankData.international} 
          onEdit={() => setEditMode("international")} 
        />
        
        <View style={{ 
          padding: 16, 
          backgroundColor: 'rgba(59,130,246,0.1)', 
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginTop: 8,
        }}>
          <Ionicons name="shield-checkmark" size={20} color="#3b82f6" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={{ color: '#93c5fd', fontSize: 13, flex: 1 }}>
            Your bank details are encrypted and only shared with group admins when you're the designated recipient.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}
