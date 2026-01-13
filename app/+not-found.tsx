import { View, Text, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Not Found",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: colors.background,
        padding: 24,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(113, 113, 122, 0.2)',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
        </View>
        
        <Text style={{ 
          color: colors.text, 
          fontSize: 24, 
          fontWeight: '700',
          marginBottom: 8,
        }}>
          Page Not Found
        </Text>
        
        <Text style={{ 
          color: colors.textMuted, 
          fontSize: 15, 
          textAlign: 'center',
          marginBottom: 32,
        }}>
          The page you're looking for doesn't exist or has been moved.
        </Text>
        
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
          style={({ pressed }) => ({
            backgroundColor: colors.primary.DEFAULT,
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Go Back</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace('/(app)/(tabs)');
          }}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: colors.primary.DEFAULT, fontWeight: '500' }}>Go to Home</Text>
        </Pressable>
      </View>
    </>
  );
}




