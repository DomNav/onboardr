// Avatar utility functions for generating initials and colors

export interface AvatarConfig {
  initials: string;
  bgColor: string;
  textColor: string;
}

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F39C12', '#E74C3C', '#9B59B6', '#3498DB', '#1ABC9C'
];

/**
 * Generate avatar configuration from a name
 */
export function generateAvatarConfig(name: string): AvatarConfig {
  if (!name || !name.trim()) {
    return {
      initials: '?',
      bgColor: AVATAR_COLORS[0],
      textColor: '#FFFFFF'
    };
  }

  // Generate initials (first letter of each word, max 2 characters)
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color based on name
  const colorIndex = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % AVATAR_COLORS.length;
  
  const bgColor = AVATAR_COLORS[colorIndex];

  return {
    initials,
    bgColor,
    textColor: '#FFFFFF'
  };
}

/**
 * Generate SVG avatar from name
 */
export function generateAvatarSVG(name: string): string {
  const config = generateAvatarConfig(name);
  
  const svg = `<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="60" fill="${config.bgColor}"/>
    <text x="60" y="60" text-anchor="middle" dy=".35em" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="${config.textColor}">
      ${config.initials}
    </text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
} 