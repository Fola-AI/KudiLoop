/**
 * Pre-made avatar definitions for KudiLoop
 * Users can select from these instead of uploading a custom photo
 * 
 * Uses DiceBear API with different styles:
 * - Male/Female: notionists style (professional cartoon avatars)
 * - Neutral: shapes, glass, thumbs (abstract avatars)
 * 
 * API: https://api.dicebear.com/7.x/{style}/png?seed={seed}&backgroundColor={color}
 */

export type AvatarGender = 'male' | 'female' | 'neutral';
export type AvatarStyle = 'notionists' | 'shapes' | 'glass' | 'thumbs' | 'rings';

export interface AvatarOption {
  id: string;           // e.g., "male_1", "female_2", "neutral_3"
  gender: AvatarGender;
  label: string;        // Display name
  seed: string;         // DiceBear seed for consistent avatar generation
  style: AvatarStyle;   // DiceBear style to use
  backgroundColor: string; // Pastel background colors for visibility
}

// Male avatar options - using notionists style with masculine names
const maleAvatars: AvatarOption[] = [
  { id: 'male_1', gender: 'male', label: 'John', seed: 'john-male', style: 'notionists', backgroundColor: '#b6e3f4' },
  { id: 'male_2', gender: 'male', label: 'Michael', seed: 'michael-male', style: 'notionists', backgroundColor: '#c0aede' },
  { id: 'male_3', gender: 'male', label: 'David', seed: 'david-male', style: 'notionists', backgroundColor: '#d1f4d1' },
  { id: 'male_4', gender: 'male', label: 'James', seed: 'james-male', style: 'notionists', backgroundColor: '#ffdfbf' },
  { id: 'male_5', gender: 'male', label: 'Robert', seed: 'robert-male', style: 'notionists', backgroundColor: '#ffd5dc' },
  { id: 'male_6', gender: 'male', label: 'William', seed: 'william-male', style: 'notionists', backgroundColor: '#f4d1d1' },
];

// Female avatar options - using notionists style with feminine names
const femaleAvatars: AvatarOption[] = [
  { id: 'female_1', gender: 'female', label: 'Sarah', seed: 'sarah-female', style: 'notionists', backgroundColor: '#ffd5dc' },
  { id: 'female_2', gender: 'female', label: 'Emma', seed: 'emma-female', style: 'notionists', backgroundColor: '#c0aede' },
  { id: 'female_3', gender: 'female', label: 'Olivia', seed: 'olivia-female', style: 'notionists', backgroundColor: '#b6e3f4' },
  { id: 'female_4', gender: 'female', label: 'Sophia', seed: 'sophia-female', style: 'notionists', backgroundColor: '#d1f4d1' },
  { id: 'female_5', gender: 'female', label: 'Isabella', seed: 'isabella-female', style: 'notionists', backgroundColor: '#ffdfbf' },
  { id: 'female_6', gender: 'female', label: 'Mia', seed: 'mia-female', style: 'notionists', backgroundColor: '#f4d1d1' },
];

// Neutral/Abstract avatar options (for "Prefer not to say") - using abstract styles
const neutralAvatars: AvatarOption[] = [
  { id: 'neutral_1', gender: 'neutral', label: 'Abstract 1', seed: 'shape1', style: 'shapes', backgroundColor: '#b6e3f4' },
  { id: 'neutral_2', gender: 'neutral', label: 'Abstract 2', seed: 'shape2', style: 'shapes', backgroundColor: '#c0aede' },
  { id: 'neutral_3', gender: 'neutral', label: 'Glass 1', seed: 'glass1', style: 'glass', backgroundColor: '#d1f4d1' },
  { id: 'neutral_4', gender: 'neutral', label: 'Glass 2', seed: 'glass2', style: 'glass', backgroundColor: '#ffd5dc' },
  { id: 'neutral_5', gender: 'neutral', label: 'Thumbs', seed: 'thumbs1', style: 'thumbs', backgroundColor: '#ffdfbf' },
  { id: 'neutral_6', gender: 'neutral', label: 'Rings', seed: 'ring1', style: 'rings', backgroundColor: '#f4d1d1' },
];

// All avatars combined
export const ALL_AVATARS: AvatarOption[] = [
  ...maleAvatars,
  ...femaleAvatars,
  ...neutralAvatars,
];

/**
 * Get avatars filtered by gender
 * - 'male' returns male avatars
 * - 'female' returns female avatars  
 * - null/'prefer_not_to_say' returns neutral avatars
 */
export function getAvatarsByGender(gender: 'male' | 'female' | 'prefer_not_to_say' | null): AvatarOption[] {
  switch (gender) {
    case 'male':
      return maleAvatars;
    case 'female':
      return femaleAvatars;
    case 'prefer_not_to_say':
    case null:
    default:
      return neutralAvatars;
  }
}

/**
 * Get avatar option by ID
 */
export function getAvatarById(id: string | null | undefined): AvatarOption | null {
  if (!id) return null;
  return ALL_AVATARS.find(avatar => avatar.id === id) || null;
}

/**
 * Generate DiceBear URL for an avatar
 * Uses the avatar's specific style for proper gender representation
 */
export function getAvatarUrl(avatarId: string): string {
  const avatar = getAvatarById(avatarId);
  if (!avatar) return '';
  
  // DiceBear API with avatar-specific style and background
  const bgColor = avatar.backgroundColor.replace('#', '');
  // Use PNG format for React Native compatibility
  return `https://api.dicebear.com/7.x/${avatar.style}/png?seed=${avatar.seed}&backgroundColor=${bgColor}&size=256`;
}

/**
 * Get the background color for an avatar (for use as fallback)
 */
export function getAvatarBackgroundColor(avatarId: string | null | undefined): string {
  const avatar = getAvatarById(avatarId);
  return avatar?.backgroundColor || '#6366F1';
}

/**
 * Check if a string is a valid avatar choice ID
 */
export function isValidAvatarChoice(avatarChoice: string | null | undefined): boolean {
  if (!avatarChoice) return false;
  return ALL_AVATARS.some(avatar => avatar.id === avatarChoice);
}

