import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  Image, 
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { usePartners, useTrackPartnerClick } from '@/hooks/api/usePartners';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface Partner {
  id: string;
  name: string;
  description: string;
  category: string;
  affiliateLink: string;
  commissionRate: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  color: string | null;
  isActive: number;
}

export default function MarketplaceScreen() {
  const { data: partners, isLoading, error, refetch } = usePartners();
  const trackClick = useTrackPartnerClick();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter partners based on search query
  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    const activePartners = partners.filter((p: Partner) => p.isActive === 1);
    
    if (!searchQuery.trim()) return activePartners;
    
    const query = searchQuery.toLowerCase();
    return activePartners.filter((p: Partner) => 
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }, [partners, searchQuery]);

  // Group filtered partners by category
  const groupedPartners = useMemo(() => {
    return filteredPartners.reduce((acc: Record<string, Partner[]>, partner: Partner) => {
      const category = partner.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(partner);
      return acc;
    }, {});
  }, [filteredPartners]);

  const handlePartnerPress = (partner: Partner) => {
    setSelectedPartner(partner);
    setModalVisible(true);
  };

  const handleVisitPartner = async () => {
    if (!selectedPartner) return;
    
    try {
      await trackClick.mutateAsync(selectedPartner.id);
    } catch (error) {
      console.log('Click tracking failed:', error);
    }
    
    if (selectedPartner.affiliateLink) {
      await Linking.openURL(selectedPartner.affiliateLink);
    }
    
    setModalVisible(false);
  };

  // Get gradient colors based on partner color or default
  const getCardGradient = (color: string | null) => {
    const gradients: Record<string, { start: string; end: string }> = {
      'from-green-500 to-teal-500': { start: '#22C55E', end: '#14B8A6' },
      'from-blue-500 to-cyan-500': { start: '#3B82F6', end: '#06B6D4' },
      'from-purple-500 to-pink-500': { start: '#8B5CF6', end: '#EC4899' },
      'from-orange-500 to-red-500': { start: '#F97316', end: '#EF4444' },
      'from-green-500 to-emerald-500': { start: '#22C55E', end: '#10B981' },
      'from-gray-500 to-gray-600': { start: '#6B7280', end: '#4B5563' },
    };
    return gradients[color || ''] || { start: '#3B82F6', end: '#06B6D4' };
  };

  // Loading state
  if (isLoading && !partners) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text style={{ color: colors.textMuted, marginTop: 12 }}>
            Loading offers...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error.DEFAULT} />
          <Text style={{ color: colors.text, marginTop: 12, fontSize: 16 }}>
            Failed to load partners
          </Text>
          <Pressable 
            onPress={() => refetch()}
            style={{ 
              marginTop: 16, 
              paddingHorizontal: 24, 
              paddingVertical: 12,
              backgroundColor: colors.primary.DEFAULT,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Try Again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const categories = Object.keys(groupedPartners);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Search */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        {/* Search Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 12,
          paddingHorizontal: 14,
          height: 46,
        }}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search partners, categories..."
            placeholderTextColor={colors.textSubtle}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 16,
              color: colors.text,
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {/* Page Title */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: colors.text,
            marginBottom: 4
          }}>
            Marketplace
          </Text>
          <Text style={{ fontSize: 15, color: colors.textMuted }}>
            Exclusive deals from our partners
          </Text>
        </View>

        {/* Empty state */}
        {categories.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="search-outline" size={64} color={colors.textMuted} />
            <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: 16 }}>
              {searchQuery ? 'No partners found' : 'No partners available yet'}
            </Text>
          </View>
        )}

        {/* Partner Cards by Category */}
        {categories.map((category, categoryIndex) => (
          <Animated.View 
            key={category}
            entering={FadeInDown.delay(categoryIndex * 100)}
            style={{ marginBottom: 28 }}
          >
            {/* Category Header */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              paddingHorizontal: 16,
              marginBottom: 14,
            }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: colors.text 
              }}>
                {category}
              </Text>
              <View style={{
                marginLeft: 8,
                backgroundColor: colors.card,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>
                  {groupedPartners[category].length}
                </Text>
              </View>
            </View>

            {/* Large Partner Cards */}
            <View style={{ paddingHorizontal: 16, gap: 16 }}>
              {groupedPartners[category].map((partner: Partner, index: number) => {
                const gradient = getCardGradient(partner.color);
                const CardContent = () => (
                  <View
                    style={{
                      flex: 1,
                      padding: 16,
                      justifyContent: 'space-between',
                      backgroundColor: partner.bannerUrl ? 'rgba(0,0,0,0.35)' : 'transparent',
                      borderRadius: 16,
                    }}
                  >
                    {/* Top Row: Logo + Name */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: 'white',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        {partner.logoUrl ? (
                          <Image source={{ uri: partner.logoUrl }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                        ) : (
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: gradient.start }}>
                            {partner.name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <Text
                        style={{
                          marginLeft: 10,
                          fontSize: 16,
                          fontWeight: '600',
                          color: 'white',
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {partner.name}
                      </Text>
                    </View>

                    {/* Bottom: Promotional Text */}
                    <View>
                      <Text
                        style={{
                          fontSize: 24,
                          fontWeight: 'bold',
                          color: 'white',
                          marginBottom: 4,
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 3,
                        }}
                      >
                        {partner.description.length > 40
                          ? partner.description.substring(0, 40) + '...'
                          : partner.description}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: 'rgba(255,255,255,0.8)',
                          textShadowColor: 'rgba(0,0,0,0.5)',
                          textShadowOffset: { width: 0, height: 1 },
                          textShadowRadius: 2,
                        }}
                      >
                        {partner.category}
                      </Text>
                    </View>
                  </View>
                );

                return (
                  <Pressable
                    key={partner.id}
                    onPress={() => handlePartnerPress(partner)}
                    style={({ pressed }) => ({
                      borderRadius: 16,
                      overflow: 'hidden',
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                      marginBottom: 16,
                    })}
                  >
                    {partner.bannerUrl ? (
                      <ImageBackground
                        source={{ uri: partner.bannerUrl }}
                        style={{
                          width: CARD_WIDTH,
                          minHeight: 220,
                        }}
                        imageStyle={{ borderRadius: 16 }}
                      >
                        <CardContent />
                      </ImageBackground>
                    ) : (
                      <View
                        style={{
                          width: CARD_WIDTH,
                          minHeight: 220,
                          backgroundColor: gradient.start,
                          borderRadius: 16,
                        }}
                      >
                        <CardContent />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Partner Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Modal Header */}
          <SafeAreaView edges={['top']}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </Pressable>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>
                Partner Details
              </Text>
              <View style={{ width: 28 }} />
            </View>
          </SafeAreaView>

          {selectedPartner && (
            <ScrollView style={{ flex: 1 }}>
              {/* Hero Section with Gradient */}
              <View style={{
                height: 200,
                backgroundColor: getCardGradient(selectedPartner.color).start,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {selectedPartner.logoUrl ? (
                    <Image 
                      source={{ uri: selectedPartner.logoUrl }}
                      style={{ width: 80, height: 80 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={{ 
                      fontSize: 32, 
                      fontWeight: 'bold', 
                      color: getCardGradient(selectedPartner.color).start 
                    }}>
                      {selectedPartner.name.charAt(0)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Partner Info */}
              <View style={{ padding: 20 }}>
                <Text style={{ 
                  fontSize: 24, 
                  fontWeight: 'bold', 
                  color: colors.text,
                  marginBottom: 4,
                  textAlign: 'center',
                }}>
                  {selectedPartner.name}
                </Text>
                <View style={{
                  alignSelf: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  marginBottom: 20,
                }}>
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>
                    {selectedPartner.category}
                  </Text>
                </View>

                {/* About Section */}
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600', 
                  color: colors.text,
                  marginBottom: 8,
                }}>
                  About
                </Text>
                <Text style={{ 
                  fontSize: 15, 
                  color: colors.textMuted,
                  lineHeight: 22,
                  marginBottom: 24,
                }}>
                  {selectedPartner.description}
                </Text>

                {/* Commission Rate if available */}
                {selectedPartner.commissionRate && (
                  <View style={{
                    backgroundColor: colors.card,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                  }}>
                    <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 4 }}>
                      Special Offer
                    </Text>
                    <Text style={{ fontSize: 16, color: colors.text, fontWeight: '600' }}>
                      {selectedPartner.commissionRate}
                    </Text>
                  </View>
                )}

                {/* Visit Partner Button */}
                <Pressable
                  onPress={handleVisitPartner}
                  style={({ pressed }) => ({
                    backgroundColor: pressed 
                      ? getCardGradient(selectedPartner.color).end 
                      : getCardGradient(selectedPartner.color).start,
                    paddingVertical: 16,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  })}
                >
                  <Text style={{ 
                    color: 'white', 
                    fontSize: 16, 
                    fontWeight: '600',
                    marginRight: 8,
                  }}>
                    Visit {selectedPartner.name}
                  </Text>
                  <Ionicons name="open-outline" size={18} color="white" />
                </Pressable>
                <Text style={{ 
                  textAlign: 'center', 
                  fontSize: 12, 
                  color: colors.textSubtle,
                  marginTop: 8,
                }}>
                  Opens in your browser
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
