import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CachedDataBadgeProps {
  dataUpdatedAt?: number;
  isStale?: boolean;
  compact?: boolean;
}

export function CachedDataBadge({ dataUpdatedAt, isStale, compact = false }: CachedDataBadgeProps) {
  if (!isStale) return null;
  
  const formatLastUpdated = () => {
    if (!dataUpdatedAt) return 'Cached';
    
    const date = new Date(dataUpdatedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just updated';
    if (diffMins < 60) return compact ? `${diffMins}m` : `Updated ${diffMins}m ago`;
    if (diffHours < 24) return compact ? `${diffHours}h` : `Updated ${diffHours}h ago`;
    return compact ? 'Cached' : 'Cached data';
  };
  
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(234,179,8,0.2)',
      paddingHorizontal: compact ? 6 : 8,
      paddingVertical: compact ? 2 : 4,
      borderRadius: 12,
    }}>
      <Ionicons name="time-outline" size={compact ? 10 : 12} color="#eab308" />
      <Text style={{ 
        color: '#eab308', 
        fontSize: compact ? 10 : 11, 
        marginLeft: 4,
        fontWeight: '500',
      }}>
        {formatLastUpdated()}
      </Text>
    </View>
  );
}





