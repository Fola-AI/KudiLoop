import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator } from "react-native";
import { safeAlert } from "@/utils/alertGate";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Card, Button, Badge } from "@/components/ui";
import { colors } from "@/theme";
import { formatCurrency } from "@/utils";
import { usePots, useCreatePot, useDeletePot, useTransferPot } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import type { SavingsPot } from "@/types/api";
import type { CurrencyCode } from "@/types";

type Currency = "NGN" | "GBP" | "USD" | "EUR";

const MAX_POTS = 5;

const CURRENCIES: { value: Currency; symbol: string }[] = [
  { value: "NGN", symbol: "₦" },
  { value: "GBP", symbol: "£" },
  { value: "USD", symbol: "$" },
  { value: "EUR", symbol: "€" },
];

// Pot Card Component
function PotCard({ 
  pot, 
  onTransfer,
  onDelete,
}: { 
  pot: SavingsPot;
  onTransfer: () => void;
  onDelete: () => void;
}) {
  // Get balances from pot
  const balances = [
    { currency: "NGN" as Currency, amount: pot.balanceNGN || 0 },
    { currency: "GBP" as Currency, amount: pot.balanceGBP || 0 },
    { currency: "USD" as Currency, amount: pot.balanceUSD || 0 },
    { currency: "EUR" as Currency, amount: pot.balanceEUR || 0 },
  ].filter(b => b.amount > 0);
  
  const totalValue = (pot.balanceNGN || 0) + ((pot.balanceGBP || 0) * 2000) + ((pot.balanceUSD || 0) * 1600) + ((pot.balanceEUR || 0) * 1700);
  const isEmpty = totalValue === 0;
  
  return (
    <Card style={{ padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>{pot.name}</Text>
          
          {balances.length > 0 ? (
            <View style={{ marginTop: 8 }}>
              {balances.map((b, index) => (
                <Text key={b.currency} style={{ color: '#9ca3af', fontSize: 14, marginTop: index > 0 ? 2 : 0 }}>
                  {formatCurrency(b.amount, b.currency as CurrencyCode)}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>No funds yet</Text>
          )}
        </View>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTransfer();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,107,53,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="swap-horizontal" size={20} color={colors.primary.DEFAULT} />
          </Pressable>
          
          {isEmpty && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onDelete();
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(239,68,68,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </Pressable>
          )}
        </View>
      </View>
    </Card>
  );
}

// Create Pot Modal
function CreatePotModal({
  visible,
  onClose,
  onCreate,
  isCreating,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
  isCreating: boolean;
}) {
  const [name, setName] = useState("");
  
  const handleCreate = () => {
    if (!name.trim()) {
      safeAlert("Error", "Please enter a pot name");
      return;
    }
    onCreate(name);
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card variant="elevated" style={{ padding: 24 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              Create Savings Pot
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
              Give your pot a name that describes what you're saving for
            </Text>
            
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Emergency Fund, Vacation"
              placeholderTextColor="#6b7280"
              maxLength={100}
              style={{
                backgroundColor: '#1f2937',
                borderRadius: 12,
                padding: 16,
                color: 'white',
                fontSize: 16,
                borderWidth: 2,
                borderColor: '#374151',
                marginBottom: 20,
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Transfer Modal
function TransferModal({
  visible,
  pot,
  userFunds,
  onClose,
  onTransfer,
  isTransferring,
}: {
  visible: boolean;
  pot: SavingsPot | null;
  userFunds: { NGN: number; GBP: number; USD: number; EUR: number };
  onClose: () => void;
  onTransfer: (type: "deposit" | "withdrawal", amount: number, currency: Currency) => void;
  isTransferring: boolean;
}) {
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  
  if (!pot) return null;
  
  const potBalance = {
    NGN: pot.balanceNGN || 0,
    GBP: pot.balanceGBP || 0,
    USD: pot.balanceUSD || 0,
    EUR: pot.balanceEUR || 0,
  };
  
  const maxAmount = type === "deposit" ? userFunds[currency] : potBalance[currency];
  
  const handleTransfer = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      safeAlert("Error", "Please enter a valid amount");
      return;
    }
    if (numAmount > maxAmount) {
      safeAlert("Error", `Insufficient ${type === "deposit" ? "wallet" : "pot"} balance`);
      return;
    }
    
    onTransfer(type, numAmount, currency);
    setAmount("");
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 24 }}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Card variant="elevated" style={{ padding: 24 }}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
              Transfer
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginBottom: 20 }}>
              {pot.name}
            </Text>
            
            {/* Type Toggle */}
            <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#1f2937', borderRadius: 12, padding: 4 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setType("deposit");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: type === "deposit" ? colors.primary.DEFAULT : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: type === "deposit" ? 'white' : '#9ca3af', fontWeight: '600' }}>
                  Deposit
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setType("withdrawal");
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: type === "withdrawal" ? colors.primary.DEFAULT : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: type === "withdrawal" ? 'white' : '#9ca3af', fontWeight: '600' }}>
                  Withdraw
                </Text>
              </Pressable>
            </View>
            
            {/* Currency Selection */}
            <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>Currency</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrency(c.value);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 8,
                    borderWidth: 2,
                    borderColor: currency === c.value ? colors.primary.DEFAULT : '#374151',
                    backgroundColor: currency === c.value ? 'rgba(255,107,53,0.1)' : '#1f2937',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ 
                    color: currency === c.value ? colors.primary.DEFAULT : '#9ca3af',
                    fontWeight: '600',
                  }}>
                    {c.symbol}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Amount Input */}
            <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>
              Amount (Max: {formatCurrency(maxAmount, currency as CurrencyCode)})
            </Text>
            <TextInput
              value={amount}
              onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              style={{
                backgroundColor: '#1f2937',
                borderRadius: 12,
                padding: 16,
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold',
                textAlign: 'center',
                borderWidth: 2,
                borderColor: '#374151',
                marginBottom: 20,
              }}
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button variant="secondary" size="lg" onPress={onClose} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                size="lg" 
                onPress={handleTransfer}
                loading={isTransferring}
                style={{ flex: 1 }}
              >
                {type === "deposit" ? "Deposit" : "Withdraw"}
              </Button>
            </View>
          </Card>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function SavingsPotsScreen() {
  const { user } = useAuth();
  const { data: pots, isLoading, error, refetch } = usePots();
  const createPot = useCreatePot();
  const deletePot = useDeletePot();
  const transferPotMutation = useTransferPot();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [transferPot, setTransferPot] = useState<SavingsPot | null>(null);
  
  // Get user wallet balance from user object (fallback to zeros if not available)
  const userFunds = {
    NGN: user?.walletBalanceNGN || 0,
    GBP: user?.walletBalanceGBP || 0,
    USD: user?.walletBalanceUSD || 0,
    EUR: user?.walletBalanceEUR || 0,
  };
  
  const handleCreatePot = async (name: string) => {
    try {
      await createPot.mutateAsync(name);
      setShowCreateModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      safeAlert("Success", `"${name}" pot created!`);
    } catch (error: any) {
      safeAlert("Error", error.message || "Failed to create pot");
    }
  };
  
  const handleDeletePot = (pot: SavingsPot) => {
    safeAlert(
      "Delete Pot",
      `Are you sure you want to delete "${pot.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePot.mutateAsync(pot.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              safeAlert("Error", error.message || "Failed to delete pot");
            }
          },
        },
      ]
    );
  };
  
  const handleTransfer = async (type: "deposit" | "withdrawal", amount: number, currency: Currency) => {
    if (!transferPot) return;
    
    try {
      await transferPotMutation.mutateAsync({
        potId: transferPot.id,
        amount: amount.toFixed(2),
        currency,
        type,
      });
      
      setTransferPot(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      safeAlert("Success", `${type === "deposit" ? "Deposited" : "Withdrew"} ${formatCurrency(amount, currency as CurrencyCode)}`);
    } catch (error: any) {
      safeAlert("Error", error.response?.data?.error || error.message || "Transfer failed");
    }
  };
  
  const potsList = pots || [];
  const canCreatePot = potsList.length < MAX_POTS;

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Savings Pots",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackTitle: "Profile",
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>Loading pots...</Text>
        </View>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: true,
            headerTitle: "Savings Pots",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerBackTitle: "Profile",
          }}
        />
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Could not load pots
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>
            {error.message || "Please check your connection"}
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
          headerTitle: "Savings Pots",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerBackTitle: "Profile",
        }}
      />
      
      <ScrollView 
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      >
        {/* Wallet Balance Summary */}
        <Card variant="elevated" style={{ padding: 16, marginBottom: 24 }}>
          <Text style={{ color: '#9ca3af', fontSize: 13, marginBottom: 8 }}>Wallet Balance</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {CURRENCIES.map((c) => (
              <View key={c.value} style={{ minWidth: '45%' }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  {formatCurrency(userFunds[c.value], c.value as CurrencyCode)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
        
        {/* Pots Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
            Your Pots ({potsList.length}/{MAX_POTS})
          </Text>
          {canCreatePot && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCreateModal(true);
              }}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary.DEFAULT} />
              <Text style={{ color: colors.primary.DEFAULT, fontWeight: '500', marginLeft: 4 }}>New Pot</Text>
            </Pressable>
          )}
        </View>
        
        {/* Pots List */}
        {potsList.length > 0 ? (
          potsList.map((pot) => (
            <PotCard
              key={pot.id}
              pot={pot}
              onTransfer={() => setTransferPot(pot)}
              onDelete={() => handleDeletePot(pot)}
            />
          ))
        ) : (
          <Card style={{ padding: 32, alignItems: 'center' }}>
            <Ionicons name="wallet-outline" size={48} color="#374151" />
            <Text style={{ color: '#9ca3af', fontSize: 16, marginTop: 12 }}>No savings pots yet</Text>
            <Text style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 4 }}>
              Create a pot to organize your savings by goal
            </Text>
            <Button 
              variant="primary" 
              onPress={() => setShowCreateModal(true)}
              style={{ marginTop: 16 }}
            >
              Create Your First Pot
            </Button>
          </Card>
        )}
        
        {/* Info */}
        <View style={{ 
          padding: 16, 
          backgroundColor: 'rgba(245,158,11,0.1)', 
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginTop: 16,
        }}>
          <Ionicons name="information-circle" size={20} color={colors.warning.DEFAULT} style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={{ color: colors.warning.DEFAULT, fontSize: 13, flex: 1 }}>
            Savings pots help you organize money for different goals. You can have up to {MAX_POTS} pots.
            Transfer funds between your wallet and pots anytime.
          </Text>
        </View>
      </ScrollView>
      
      {/* Modals */}
      <CreatePotModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreatePot}
        isCreating={createPot.isPending}
      />
      
      <TransferModal
        visible={!!transferPot}
        pot={transferPot}
        userFunds={userFunds}
        onClose={() => setTransferPot(null)}
        onTransfer={handleTransfer}
        isTransferring={transferPotMutation.isPending}
      />
    </>
  );
}
