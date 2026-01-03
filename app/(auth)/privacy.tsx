import { View, Text, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Privacy Policy',
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
        
        <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
        <Text style={styles.paragraph}>
          At KudiLoop, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information that you provide directly to us, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Account Information:</Text> Name, email address, phone number, and profile photo</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Financial Information:</Text> Bank account details for receiving payouts (encrypted and stored securely)</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Group Data:</Text> Savings group memberships, contribution history, and payment records</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Communication Data:</Text> Messages sent within the app</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Device Information:</Text> Device type, operating system, and unique device identifiers</Text>
        </View>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>We use the information we collect to:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Provide, maintain, and improve our services</Text>
          <Text style={styles.bulletItem}>• Process transactions and send related notifications</Text>
          <Text style={styles.bulletItem}>• Send payment reminders and group updates</Text>
          <Text style={styles.bulletItem}>• Respond to your comments, questions, and requests</Text>
          <Text style={styles.bulletItem}>• Monitor and analyze trends, usage, and activities</Text>
          <Text style={styles.bulletItem}>• Detect, investigate, and prevent fraudulent transactions and other illegal activities</Text>
          <Text style={styles.bulletItem}>• Personalize and improve your experience</Text>
        </View>

        <Text style={styles.heading}>3. Information Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>With Group Members:</Text> Your name and contribution status are visible to other members of your savings groups</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Service Providers:</Text> We may share information with trusted third-party service providers who assist us in operating our platform</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Legal Requirements:</Text> We may disclose information if required by law or to protect our rights and safety</Text>
        </View>

        <Text style={styles.heading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate security measures to protect your personal information, including:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• Encryption of sensitive data in transit and at rest</Text>
          <Text style={styles.bulletItem}>• Secure password hashing using industry-standard algorithms</Text>
          <Text style={styles.bulletItem}>• Regular security audits and updates</Text>
          <Text style={styles.bulletItem}>• Access controls and authentication requirements</Text>
        </View>

        <Text style={styles.heading}>5. Data Retention</Text>
        <Text style={styles.paragraph}>
          We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and associated data at any time through the Settings page.
        </Text>

        <Text style={styles.heading}>6. Your Rights</Text>
        <Text style={styles.paragraph}>You have the right to:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Access:</Text> Request a copy of your personal data</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Correction:</Text> Update or correct inaccurate information</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Deletion:</Text> Request permanent deletion of your account and data</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bold}>Portability:</Text> Export your contribution history from Settings</Text>
        </View>

        <Text style={styles.heading}>7. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          KudiLoop is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
        </Text>

        <Text style={styles.heading}>8. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </Text>

        <Text style={styles.heading}>9. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about this Privacy Policy or our data practices, please contact us at:
        </Text>
        <Text style={styles.contactEmail}>privacy@kudiloop.com</Text>

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

