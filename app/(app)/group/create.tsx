import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { colors } from "@/theme";
import { useCreateGroup } from "@/hooks/api";
import { getErrorMessage } from "@/services/api";

// Types
type Currency = "NGN" | "GBP" | "EUR" | "USD" | "CAD";
type Frequency = "weekly" | "monthly";
type Visibility = "open" | "closed";
type PayoutMedium = "admin" | "cycle_receiver";

interface GroupFormData {
  // Step 1: Basic Info
  name: string;
  description: string;
  
  // Step 2: Financial
  contributionAmount: string;
  currency: Currency;
  frequency: Frequency;
  totalCycles: string; // Number of cycles (minimum 3)
  
  // Step 3: Settings
  visibility: Visibility;
  maxMembers: string;
  payoutMedium: PayoutMedium;
  
  // Step 4: Schedule
  goLiveDays: number; // 1-7 days from now
}

const TOTAL_STEPS = 5;

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "NGN", label: "Nigerian Naira", symbol: "₦" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
];

const FREQUENCIES: { value: Frequency; label: string; description: string }[] = [
  { value: "monthly", label: "Monthly", description: "Contributions due once per month" },
  { value: "weekly", label: "Weekly", description: "Contributions due every week" },
];

// Progress Bar Component
function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: index < currentStep ? colors.primary.DEFAULT : "#374151",
          }}
        />
      ))}
    </View>
  );
}

// Selection Card Component
function SelectionCard({ 
  selected, 
  onPress, 
  icon,
  title, 
  description,
  badge,
}: { 
  selected: boolean;
  onPress: () => void;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: selected ? colors.primary.DEFAULT : "#374151",
        backgroundColor: selected ? "rgba(255,107,53,0.1)" : "#1f2937",
        marginBottom: 12,
      }}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: selected ? "rgba(255,107,53,0.2)" : "#374151",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={selected ? colors.primary.DEFAULT : "#9ca3af"} 
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>{title}</Text>
          {badge && (
            <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "rgba(34,197,94,0.2)", borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: colors.success.DEFAULT, fontWeight: "600" }}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }}>{description}</Text>
      </View>
      {selected && (
        <Ionicons name="checkmark-circle" size={24} color={colors.primary.DEFAULT} />
      )}
    </Pressable>
  );
}

// Currency Selection Card
function CurrencyCard({ 
  currency, 
  selected, 
  onPress 
}: { 
  currency: typeof CURRENCIES[0];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        width: "18%",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: selected ? colors.primary.DEFAULT : "#374151",
        backgroundColor: selected ? "rgba(255,107,53,0.1)" : "#1f2937",
        margin: 4,
      }}
    >
      <Text style={{ fontSize: 20, fontWeight: "bold", color: selected ? colors.primary.DEFAULT : "white" }}>
        {currency.symbol}
      </Text>
      <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>{currency.value}</Text>
    </Pressable>
  );
}

// Input Field Component
function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  error,
  prefix,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "email-address";
  multiline?: boolean;
  error?: string;
  prefix?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: "#9ca3af", fontSize: 14, marginBottom: 8, fontWeight: "500" }}>{label}</Text>
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: error ? colors.error.DEFAULT : isFocused ? colors.primary.DEFAULT : "#374151",
        borderRadius: 12,
        backgroundColor: "#1f2937",
        paddingHorizontal: 16,
      }}>
        {prefix && (
          <Text style={{ color: colors.primary.DEFAULT, fontSize: 18, fontWeight: "600", marginRight: 8 }}>
            {prefix}
          </Text>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#6b7280"
          keyboardType={keyboardType}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            flex: 1,
            color: "white",
            fontSize: 16,
            paddingVertical: multiline ? 16 : 14,
            minHeight: multiline ? 100 : undefined,
            textAlignVertical: multiline ? "top" : "center",
          }}
        />
      </View>
      {error && (
        <Text style={{ color: colors.error.DEFAULT, fontSize: 12, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
}

// Day Selector for Go-Live
function DaySelector({ 
  selectedDays, 
  onSelect 
}: { 
  selectedDays: number;
  onSelect: (days: number) => void;
}) {
  const options = [1, 2, 3, 5, 7];
  
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((days) => (
        <Pressable
          key={days}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(days);
          }}
          style={{
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selectedDays === days ? colors.primary.DEFAULT : "#374151",
            backgroundColor: selectedDays === days ? "rgba(255,107,53,0.1)" : "#1f2937",
          }}
        >
          <Text style={{ 
            color: selectedDays === days ? colors.primary.DEFAULT : "white",
            fontWeight: "600",
          }}>
            {days} {days === 1 ? "Day" : "Days"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function CreateGroupScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    description: "",
    contributionAmount: "",
    currency: "NGN",
    frequency: "monthly",
    totalCycles: "",
    visibility: "closed",
    maxMembers: "",
    payoutMedium: "admin",
    goLiveDays: 3,
  });
  
  const createGroup = useCreateGroup();
  
  const updateForm = (field: keyof GroupFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };
  
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = "Group name is required";
        } else if (formData.name.length < 3) {
          newErrors.name = "Name must be at least 3 characters";
        }
        break;
        
      case 2:
        if (!formData.contributionAmount) {
          newErrors.contributionAmount = "Contribution amount is required";
        } else if (parseInt(formData.contributionAmount) < 100) {
          newErrors.contributionAmount = "Minimum amount is 100";
        }
        if (formData.totalCycles && parseInt(formData.totalCycles) < 3) {
          newErrors.totalCycles = "Minimum 3 cycles required";
        }
        break;
        
      case 3:
        // Optional fields, no validation needed
        break;
        
      case 4:
        // Go-live days already has a default
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const goNext = () => {
    if (validateStep(currentStep)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  const handleCreate = async () => {
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      // Calculate dates
      const goLiveDate = new Date();
      goLiveDate.setDate(goLiveDate.getDate() + formData.goLiveDays);
      
      const startDate = new Date().toISOString().split('T')[0];
      
      // Calculate next collection date (first collection after go-live)
      const nextCollectionDate = new Date(goLiveDate);
      if (formData.frequency === 'weekly') {
        nextCollectionDate.setDate(nextCollectionDate.getDate() + 7);
      } else {
        nextCollectionDate.setMonth(nextCollectionDate.getMonth() + 1);
      }
      
      // Determine total cycles - if not specified, default to maxMembers or 3
      const totalCycles = formData.totalCycles 
        ? parseInt(formData.totalCycles) 
        : (formData.maxMembers ? parseInt(formData.maxMembers) : 3);
      
      const newGroup = await createGroup.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        contributionAmount: parseInt(formData.contributionAmount),
        currency: formData.currency,
        frequency: formData.frequency,
        visibility: formData.visibility,
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : undefined,
        payoutMedium: formData.payoutMedium,
        totalCycles: Math.max(3, totalCycles), // Minimum 3 cycles
        goLiveDate: goLiveDate.toISOString(),
        nextCollectionDate: nextCollectionDate.toISOString().split('T')[0],
        startDate: startDate,
      });
      
      // Success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to the new group
      if (newGroup?.id) {
        router.replace(`/group/${newGroup.id}`);
      } else {
        router.replace("/(app)/(tabs)/groups");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        getErrorMessage(error) || "Failed to create group. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Basic Info";
      case 2: return "Financial Setup";
      case 3: return "Group Settings";
      case 4: return "Schedule";
      case 5: return "Review";
      default: return "";
    }
  };
  
  const selectedCurrency = CURRENCIES.find(c => c.value === formData.currency);
  
  // Calculate go-live date
  const goLiveDate = new Date();
  goLiveDate.setDate(goLiveDate.getDate() + formData.goLiveDays);
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View key="step1" style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
              Name your savings circle
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 15, marginBottom: 32 }}>
              Choose a name that your members will recognize
            </Text>
            
            <FormInput
              label="Group Name"
              value={formData.name}
              onChangeText={(text) => updateForm("name", text)}
              placeholder="e.g., Family Savings, Office Squad"
              error={errors.name}
            />
            
            <FormInput
              label="Description (Optional)"
              value={formData.description}
              onChangeText={(text) => updateForm("description", text)}
              placeholder="What's this group for?"
              multiline
            />
          </View>
        );
        
      case 2:
        return (
          <View key="step2" style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
              Set contribution details
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 15, marginBottom: 32 }}>
              How much will each member contribute?
            </Text>
            
            {/* Currency Selection */}
            <Text style={{ color: "#9ca3af", fontSize: 14, marginBottom: 12, fontWeight: "500" }}>
              Currency
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 24, justifyContent: "center" }}>
              {CURRENCIES.map((currency) => (
                <CurrencyCard
                  key={currency.value}
                  currency={currency}
                  selected={formData.currency === currency.value}
                  onPress={() => updateForm("currency", currency.value)}
                />
              ))}
            </View>
            
            {/* Amount */}
            <FormInput
              label="Contribution Amount"
              value={formData.contributionAmount}
              onChangeText={(text) => updateForm("contributionAmount", text.replace(/[^0-9]/g, ""))}
              placeholder="0"
              keyboardType="numeric"
              prefix={selectedCurrency?.symbol}
              error={errors.contributionAmount}
            />
            
            {/* Frequency */}
            <Text style={{ color: "#9ca3af", fontSize: 14, marginBottom: 12, fontWeight: "500" }}>
              Payment Frequency
            </Text>
            {FREQUENCIES.map((freq) => (
              <SelectionCard
                key={freq.value}
                selected={formData.frequency === freq.value}
                onPress={() => updateForm("frequency", freq.value)}
                icon={freq.value === "monthly" ? "calendar-outline" : "calendar-number-outline"}
                title={freq.label}
                description={freq.description}
                badge={freq.value === "monthly" ? "Popular" : undefined}
              />
            ))}
            
            {/* Total Cycles */}
            <FormInput
              label="Number of Cycles (Min 3)"
              value={formData.totalCycles}
              onChangeText={(text) => updateForm("totalCycles", text.replace(/[^0-9]/g, ""))}
              placeholder="e.g., 6 (equals to 6 members)"
              keyboardType="numeric"
              error={errors.totalCycles}
            />
            <View style={{ 
              marginTop: -12,
              marginBottom: 8,
              padding: 12, 
              backgroundColor: "rgba(59,130,246,0.1)", 
              borderRadius: 8,
              flexDirection: "row",
              alignItems: "flex-start",
            }}>
              <Ionicons name="information-circle" size={16} color="#3b82f6" style={{ marginRight: 6, marginTop: 1 }} />
              <Text style={{ color: "#93c5fd", fontSize: 12, flex: 1 }}>
                Each cycle, one member receives the pot. Number of cycles = number of members.
              </Text>
            </View>
          </View>
        );
        
      case 3:
        return (
          <View key="step3" style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
              Group settings
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 15, marginBottom: 32 }}>
              Configure how your group works
            </Text>
            
            {/* Visibility */}
            <Text style={{ color: "#9ca3af", fontSize: 14, marginBottom: 12, fontWeight: "500" }}>
              Group Visibility
            </Text>
            <SelectionCard
              selected={formData.visibility === "closed"}
              onPress={() => updateForm("visibility", "closed")}
              icon="lock-closed-outline"
              title="Closed Group"
              description="Only people you invite can join"
              badge="Recommended"
            />
            <SelectionCard
              selected={formData.visibility === "open"}
              onPress={() => updateForm("visibility", "open")}
              icon="globe-outline"
              title="Open Group"
              description="Anyone with link can request to join"
            />
            
            {/* Payout Method */}
            <Text style={{ color: "#9ca3af", fontSize: 14, marginBottom: 12, marginTop: 8, fontWeight: "500" }}>
              Payout Method
            </Text>
            <SelectionCard
              selected={formData.payoutMedium === "admin"}
              onPress={() => updateForm("payoutMedium", "admin")}
              icon="person-circle-outline"
              title="Via Admin"
              description="Admin collects and distributes to recipient"
              badge="Traditional"
            />
            <SelectionCard
              selected={formData.payoutMedium === "cycle_receiver"}
              onPress={() => updateForm("payoutMedium", "cycle_receiver")}
              icon="swap-horizontal-outline"
              title="Direct to Recipient"
              description="Members pay directly to cycle recipient"
            />
            
            {/* Max Members (Optional) */}
            <FormInput
              label="Maximum Members (Optional)"
              value={formData.maxMembers}
              onChangeText={(text) => updateForm("maxMembers", text.replace(/[^0-9]/g, ""))}
              placeholder="No limit"
              keyboardType="numeric"
            />
          </View>
        );
        
      case 4:
        return (
          <View key="step4" style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
              When should we start?
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 15, marginBottom: 32 }}>
              Choose when your group goes live. Members need time to join!
            </Text>
            
            <Text style={{ color: "#9ca3af", fontSize: 14, marginBottom: 12, fontWeight: "500" }}>
              Go Live In
            </Text>
            <DaySelector
              selectedDays={formData.goLiveDays}
              onSelect={(days) => updateForm("goLiveDays", days)}
            />
            
            {/* Preview */}
            <Card style={{ marginTop: 24, padding: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(255,107,53,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Ionicons name="rocket-outline" size={24} color={colors.primary.DEFAULT} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: "#9ca3af", fontSize: 13 }}>Group goes live on</Text>
                  <Text style={{ color: "white", fontSize: 18, fontWeight: "600" }}>
                    {goLiveDate.toLocaleDateString("en-GB", { 
                      weekday: "long",
                      day: "numeric", 
                      month: "long",
                      year: "numeric"
                    })}
                  </Text>
                </View>
              </View>
            </Card>
            
            <View style={{ 
              marginTop: 16, 
              padding: 16, 
              backgroundColor: "rgba(245,158,11,0.1)", 
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "flex-start",
            }}>
              <Ionicons name="information-circle" size={20} color={colors.warning.DEFAULT} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={{ color: colors.warning.DEFAULT, fontSize: 13, flex: 1 }}>
                Your group needs at least 3 members before it can go live. Invite members after creating!
              </Text>
            </View>
          </View>
        );
        
      case 5:
        // Review Step
        const cycleCount = formData.totalCycles ? parseInt(formData.totalCycles) : (formData.maxMembers ? parseInt(formData.maxMembers) : 6);
        const totalPotExample = parseInt(formData.contributionAmount || "0") * cycleCount;
        
        return (
          <View key="step5" style={{ flex: 1 }}>
            <Text style={{ color: "white", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
              Review your group
            </Text>
            <Text style={{ color: "#9ca3af", fontSize: 15, marginBottom: 24 }}>
              Make sure everything looks right
            </Text>
            
            {/* Group Preview Card */}
            <Card variant="elevated" style={{ padding: 20, marginBottom: 16 }}>
              <Text style={{ color: "white", fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
                {formData.name || "Untitled Group"}
              </Text>
              {formData.description ? (
                <Text style={{ color: "#9ca3af", fontSize: 14, marginBottom: 16 }}>
                  {formData.description}
                </Text>
              ) : null}
              
              {/* Divider */}
              <View style={{ height: 1, backgroundColor: "#374151", marginVertical: 16 }} />
              
              {/* Details Grid */}
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#9ca3af" }}>Contribution</Text>
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {selectedCurrency?.symbol}{parseInt(formData.contributionAmount || "0").toLocaleString()}
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#9ca3af" }}>Frequency</Text>
                  <Text style={{ color: "white", fontWeight: "600", textTransform: "capitalize" }}>
                    {formData.frequency}
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#9ca3af" }}>Visibility</Text>
                  <Text style={{ color: "white", fontWeight: "600", textTransform: "capitalize" }}>
                    {formData.visibility}
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#9ca3af" }}>Payout Method</Text>
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {formData.payoutMedium === "admin" ? "Via Admin" : "Direct"}
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#9ca3af" }}>Total Cycles</Text>
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {cycleCount} cycles
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ color: "#9ca3af" }}>Go Live Date</Text>
                  <Text style={{ color: colors.primary.DEFAULT, fontWeight: "600" }}>
                    {goLiveDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
                
                {formData.maxMembers ? (
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ color: "#9ca3af" }}>Max Members</Text>
                    <Text style={{ color: "white", fontWeight: "600" }}>{formData.maxMembers}</Text>
                  </View>
                ) : null}
              </View>
            </Card>
            
            {/* Example Pot */}
            <Card style={{ padding: 16, backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", borderWidth: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="calculator-outline" size={20} color={colors.success.DEFAULT} />
                <Text style={{ color: colors.success.DEFAULT, fontSize: 13, marginLeft: 8, flex: 1 }}>
                  With {cycleCount} members, each person receives{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    {selectedCurrency?.symbol}{totalPotExample.toLocaleString()}
                  </Text>
                  {" "}on their turn
                </Text>
              </View>
            </Card>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: getStepTitle(),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            currentStep === 1 ? (
              <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            ) : (
              <Pressable onPress={goBack} style={{ padding: 8 }}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
            )
          ),
        }}
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        
        {/* Content */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
        
        {/* Bottom Button */}
        <SafeAreaView edges={["bottom"]} style={{ 
          position: "absolute", 
          bottom: 0, 
          left: 0, 
          right: 0,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: "#1f2937",
          padding: 16,
        }}>
          <Button
            variant="primary"
            size="lg"
            onPress={currentStep === TOTAL_STEPS ? handleCreate : goNext}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {currentStep === TOTAL_STEPS ? "Create Group" : "Continue"}
          </Button>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

