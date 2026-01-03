import { Modal, View, Text, Pressable, Image, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme';
import { config } from '@/config/env';
import { useReceiptUrl } from '@/hooks/api/useContributions';

/**
 * Resolves a receipt URL to a full URL.
 * If the URL is relative (e.g., "uploads/receipts/xxx.jpg"), prepends the API base URL.
 * If it's already a full URL (http/https), returns as-is.
 */
function resolveReceiptUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Already a full URL (Cloudinary or external)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Relative path - prepend API base URL
  // Remove /api suffix from apiUrl since static files are served from root
  const baseUrl = config.apiUrl.replace(/\/api$/, '');
  
  // Ensure proper path joining (handle leading slash)
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  
  return `${baseUrl}${cleanPath}`;
}

interface ReceiptViewerModalProps {
  visible: boolean;
  onClose: () => void;
  /** Either provide a contributionId to fetch the receipt URL, or provide imageUrl directly */
  contributionId?: string;
  /** Direct image URL - if provided, contributionId is not used */
  imageUrl?: string | null;
  memberName?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function ReceiptViewerModal({ 
  visible, 
  onClose, 
  contributionId,
  imageUrl,
  memberName,
}: ReceiptViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Only fetch if we don't have a direct imageUrl and have a contributionId
  const shouldFetch = !imageUrl && !!contributionId;
  const { data, isLoading: queryLoading, error: queryError, refetch } = useReceiptUrl(
    shouldFetch ? contributionId! : ''
  );
  
  useEffect(() => {
    if (visible) {
      // If we have a direct URL, don't show loading
      if (imageUrl) {
        setLoading(true); // Will be set to false when image loads
      } else {
        setLoading(true);
      }
      setError(null);
    }
  }, [visible, contributionId, imageUrl]);
  
  useEffect(() => {
    if (shouldFetch && !queryLoading) {
      setLoading(false);
    }
    if (shouldFetch && queryError) {
      setError('Failed to load receipt');
    }
  }, [queryLoading, queryError, shouldFetch]);
  
  const handleImageLoad = () => {
    setLoading(false);
  };
  
  const handleImageError = () => {
    setLoading(false);
    setError('Failed to load receipt image');
  };
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };
  
  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    setLoading(true);
    if (shouldFetch) {
      refetch();
    }
  };
  
  // Use direct imageUrl if provided, otherwise use fetched data
  // Resolve relative paths to full URLs
  const rawUrl = imageUrl || data?.receiptUrl;
  const receiptUrl = resolveReceiptUrl(rawUrl);
  
  // Debug logging in development
  if (__DEV__ && visible && rawUrl) {
    console.log('📷 Receipt URL Debug:', {
      rawUrl,
      resolvedUrl: receiptUrl,
      source: imageUrl ? 'direct' : 'fetched',
    });
  }
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Header */}
        <View style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10,
        }}>
          <View>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              Payment Receipt
            </Text>
            {memberName && (
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 2 }}>
                {memberName}
              </Text>
            )}
          </View>
          
          <Pressable
            onPress={handleClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
        </View>
        
        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
          {loading && (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
              <Text style={{ color: 'white', marginTop: 16 }}>Loading receipt...</Text>
            </View>
          )}
          
          {error && !loading && (
            <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="image-outline" size={40} color={colors.error.DEFAULT} />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                {error}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                The receipt image could not be loaded
              </Text>
              <Pressable
                onPress={handleRetry}
                style={{
                  marginTop: 24,
                  backgroundColor: colors.primary.DEFAULT,
                  paddingHorizontal: 32,
                  paddingVertical: 14,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>Try Again</Text>
              </Pressable>
            </View>
          )}
          
          {!receiptUrl && !loading && !error && (
            <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(156, 163, 175, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="receipt-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={{ color: 'white', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                No Receipt Available
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                This payment was recorded without a receipt
              </Text>
            </View>
          )}
          
          {receiptUrl && !error && (
            <Image
              source={{ uri: receiptUrl }}
              style={{
                width: SCREEN_WIDTH - 32,
                height: SCREEN_HEIGHT * 0.65,
                borderRadius: 12,
              }}
              resizeMode="contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </View>
        
        {/* Footer Info */}
        {receiptUrl && !loading && !error && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 20,
            paddingBottom: 40,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success.DEFAULT} />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginLeft: 8 }}>
                Receipt verified and stored securely
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

export default ReceiptViewerModal;

