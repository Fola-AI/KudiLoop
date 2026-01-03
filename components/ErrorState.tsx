import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

/**
 * Reusable error state component with retry functionality
 * Shows a friendly error message and optional retry button
 */
export function ErrorState({ 
  title = 'Something went wrong',
  message = 'Please check your connection and try again',
  onRetry,
  icon = 'cloud-offline-outline',
}: ErrorStateProps) {
  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry?.();
  };

  return (
    <View style={{ 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 32,
      backgroundColor: colors.background,
    }}>
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.error.muted,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <Ionicons name={icon} size={40} color={colors.error.DEFAULT} />
      </View>
      
      <Text style={{ 
        color: colors.text, 
        fontSize: 20, 
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 8,
      }}>
        {title}
      </Text>
      
      <Text style={{ 
        color: colors.textMuted, 
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
      }}>
        {message}
      </Text>
      
      {onRetry && (
        <Pressable
          onPress={handleRetry}
          style={({ pressed }) => ({
            marginTop: 24,
            backgroundColor: colors.primary.DEFAULT,
            paddingHorizontal: 24,
            paddingVertical: 14,
            borderRadius: 28,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          })}
        >
          <Ionicons name="refresh" size={20} color={colors.white} />
          <Text style={{ 
            color: colors.white, 
            fontSize: 16, 
            fontWeight: '600' 
          }}>
            Try Again
          </Text>
        </Pressable>
      )}
    </View>
  );
}

