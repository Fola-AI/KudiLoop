import { useState } from "react";
import { View, Text, Image } from "react-native";
import { colors } from "@/theme";
import { getAvatarUrl, isValidAvatarChoice, getAvatarBackgroundColor } from "@/constants/avatars";
import { getAbsoluteUrl } from "@/services/api";

declare const __DEV__: boolean;

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  source?: string | null;
  avatarChoice?: string | null; // Pre-made avatar ID (e.g., "male_1", "female_2")
  name?: string;
  size?: AvatarSize;
  showBorder?: boolean;
  borderColor?: string;
}

const sizeValues = {
  xs: 28,
  sm: 36,
  md: 48,
  lg: 64,
  xl: 96,
};

const fontSizes = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 32,
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const getColorFromName = (name: string): string => {
  const colorOptions = [
    colors.primary.DEFAULT,
    colors.secondary.DEFAULT,
    colors.success.DEFAULT,
    colors.warning.DEFAULT,
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colorOptions[Math.abs(hash) % colorOptions.length];
};

// Initials fallback component
function InitialsAvatar({ 
  name, 
  size, 
  dimension, 
  showBorder, 
  borderColor 
}: { 
  name: string; 
  size: AvatarSize; 
  dimension: number;
  showBorder: boolean;
  borderColor: string;
}) {
  return (
    <View
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        overflow: "hidden",
        backgroundColor: getColorFromName(name),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: showBorder ? 2 : 0,
        borderColor: showBorder ? borderColor : "transparent",
      }}
    >
      <Text
        style={{
          color: colors.white,
          fontSize: fontSizes[size],
          fontWeight: "600",
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

export function Avatar({
  source,
  avatarChoice,
  name = "User",
  size = "md",
  showBorder = false,
  borderColor = colors.primary.DEFAULT,
}: AvatarProps) {
  const dimension = sizeValues[size];
  const [imageError, setImageError] = useState(false);

  // Debug logging (only in dev)
  if (__DEV__ && size === 'xl') {
    console.log('🖼️ Avatar Component (xl size):');
    console.log('  - source:', source);
    console.log('  - avatarChoice:', avatarChoice);
    console.log('  - isValidAvatarChoice:', avatarChoice ? isValidAvatarChoice(avatarChoice) : 'N/A');
    console.log('  - imageError:', imageError);
  }

  // Priority: 1. Custom uploaded photo, 2. Pre-made avatar, 3. Initials
  
  // Check for custom uploaded photo first (must be non-empty string)
  const absoluteSource = getAbsoluteUrl(source);
  if (absoluteSource && !imageError) {
    return (
      <View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          overflow: "hidden",
          backgroundColor: getColorFromName(name), // Fallback background while loading
          borderWidth: showBorder ? 2 : 0,
          borderColor: showBorder ? borderColor : "transparent",
        }}
      >
        <Image
          source={{ uri: absoluteSource }}
          style={{ 
            width: dimension, 
            height: dimension,
            borderRadius: dimension / 2,
          }}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      </View>
    );
  }
  
  // Check for pre-made avatar choice
  if (avatarChoice && isValidAvatarChoice(avatarChoice)) {
    const avatarUrl = getAvatarUrl(avatarChoice);
    const bgColor = getAvatarBackgroundColor(avatarChoice);
    return (
      <View
        style={{
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          overflow: "hidden",
          backgroundColor: bgColor,
          borderWidth: showBorder ? 2 : 0,
          borderColor: showBorder ? borderColor : "transparent",
        }}
      >
        <Image
          source={{ uri: avatarUrl }}
          style={{ 
            width: dimension, 
            height: dimension,
            borderRadius: dimension / 2,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Fallback to initials
  return (
    <InitialsAvatar 
      name={name} 
      size={size} 
      dimension={dimension}
      showBorder={showBorder}
      borderColor={borderColor}
    />
  );
}

interface AvatarStackProps {
  avatars?: Array<{ source?: string; name: string }>;
  names?: string[];
  size?: AvatarSize;
  max?: number;
}

export function AvatarStack({ avatars, names, size = "sm", max = 4 }: AvatarStackProps) {
  // Support both avatars array and simple names array
  const avatarList = avatars || (names ? names.map(name => ({ name })) : []);
  const displayed = avatarList.slice(0, max);
  const remaining = avatarList.length - max;
  const dimension = sizeValues[size];
  const overlap = dimension * 0.3;

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {displayed.map((avatar, index) => (
        <View
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : -overlap,
            borderWidth: 2,
            borderColor: colors.background,
            borderRadius: dimension / 2,
          }}
        >
          <Avatar source={avatar.source} name={avatar.name} size={size} />
        </View>
      ))}
      {avatarList.length > max && (
        <View
          style={{
            marginLeft: -overlap,
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
            backgroundColor: colors.card,
            borderWidth: 2,
            borderColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: fontSizes[size] - 2,
              fontWeight: "600",
            }}
          >
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

