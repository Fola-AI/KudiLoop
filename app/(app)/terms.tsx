import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Terms of Service',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ 
                padding: 8, 
                marginLeft: Platform.OS === 'ios' ? -8 : 0,
              }}
            >
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </Pressable>
          ),
        }}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Last updated: November 2024</Text>
        
        <Text style={styles.sectionTitle}>Terms and Conditions</Text>
        <Text style={styles.paragraph}>
          Welcome to KudiLoop. By accessing or using our mobile application, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By creating an account or using KudiLoop, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our services.
        </Text>

        <Text style={styles.heading}>2. Description of Service</Text>
        <Text style={styles.paragraph}>
          KudiLoop is a rotational savings platform inspired by the traditional West African Ajo/ROSCA (Rotating Savings and Credit Association) system. The platform enables users to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Create and manage savings groups</Text>
          <Text style={styles.bulletItem}>• Track contributions and rotation schedules</Text>
          <Text style={styles.bulletItem}>• Communicate with group members</Text>
          <Text style={styles.bulletItem}>• Manage multiple savings pots</Text>
        </View>

        <Text style={styles.heading}>3. Eligibility</Text>
        <Text style={styles.paragraph}>To use KudiLoop, you must:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Be at least 18 years of age</Text>
          <Text style={styles.bulletItem}>• Have the legal capacity to enter into binding contracts</Text>
          <Text style={styles.bulletItem}>• Provide accurate and complete registration information</Text>
          <Text style={styles.bulletItem}>• Maintain the security of your account credentials</Text>
        </View>

        <Text style={styles.heading}>4. User Responsibilities</Text>
        <Text style={styles.paragraph}>As a user, you agree to:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Provide accurate information and keep it updated</Text>
          <Text style={styles.bulletItem}>• Honor your contribution commitments to your savings groups</Text>
          <Text style={styles.bulletItem}>• Not use the platform for illegal activities or fraud</Text>
          <Text style={styles.bulletItem}>• Respect other users and maintain appropriate conduct</Text>
          <Text style={styles.bulletItem}>• Not share your account credentials with others</Text>
          <Text style={styles.bulletItem}>• Report any suspicious activity or security concerns</Text>
        </View>

        <Text style={styles.heading}>5. Group Participation</Text>
        <Text style={styles.paragraph}>When participating in savings groups:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Commitment:</Text> Joining a group constitutes a commitment to make regular contributions as scheduled</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Payout Order:</Text> The rotation order is determined at group creation and may be adjusted by the group admin</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Disputes:</Text> Group-related disputes should be resolved among group members; KudiLoop facilitates but does not arbitrate</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Leaving Groups:</Text> You may leave pending groups before they go live; leaving active groups may affect other members</Text>
        </View>

        <Text style={styles.heading}>6. Financial Transactions</Text>
        <Text style={styles.paragraph}>
          KudiLoop is a platform for organizing and tracking rotational savings. Please note:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• KudiLoop does not hold or transfer funds directly</Text>
          <Text style={styles.bulletItem}>• Payments between members are made outside the platform</Text>
          <Text style={styles.bulletItem}>• Users are responsible for verifying payments and receipts</Text>
          <Text style={styles.bulletItem}>• KudiLoop is not liable for non-payment or disputes between members</Text>
        </View>

        <Text style={styles.heading}>7. Intellectual Property</Text>
        <Text style={styles.paragraph}>
          All content, features, and functionality of KudiLoop, including but not limited to text, graphics, logos, and software, are the exclusive property of KudiLoop and are protected by copyright, trademark, and other intellectual property laws.
        </Text>

        <Text style={styles.heading}>8. Limitation of Liability</Text>
        <Text style={styles.paragraph}>
          To the maximum extent permitted by law, KudiLoop and its affiliates shall not be liable for:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Any indirect, incidental, special, consequential, or punitive damages</Text>
          <Text style={styles.bulletItem}>• Loss of profits, data, or other intangible losses</Text>
          <Text style={styles.bulletItem}>• Damages resulting from unauthorized access to your account</Text>
          <Text style={styles.bulletItem}>• Actions or omissions of other users</Text>
        </View>

        <Text style={styles.heading}>9. Termination</Text>
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate your account at any time for violations of these Terms of Service or for any other reason at our sole discretion. You may also delete your account at any time through the Settings page.
        </Text>

        <Text style={styles.heading}>10. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We may modify these Terms of Service at any time. We will notify you of significant changes through the app or via email. Your continued use of KudiLoop after changes constitutes acceptance of the modified terms.
        </Text>

        <Text style={styles.heading}>11. Governing Law</Text>
        <Text style={styles.paragraph}>
          These Terms of Service shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
        </Text>

        <Text style={styles.heading}>12. Contact Information</Text>
        <Text style={styles.paragraph}>
          For questions about these Terms of Service, please contact us at:
        </Text>
        <Text style={styles.contactEmail}>legal@kudiloop.com</Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 26,
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contactEmail: {
    fontSize: 15,
    color: colors.primary.DEFAULT,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

