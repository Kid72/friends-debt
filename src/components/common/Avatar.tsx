import React, { useState } from 'react';
import { cn } from '../../utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  color?: string;
  size?: AvatarSize;
  src?: string;
  alt?: string;
}

// M3 Expressive Vibrant Tonal Palettes (bg container + on-container text)
const TONAL_PALETTES = [
  { bg: 'bg-[#CCE8E2]', text: 'text-[#05201C]' }, // Teal/Mint
  { bg: 'bg-[#D1E4FF]', text: 'text-[#001D36]' }, // Blue
  { bg: 'bg-[#FFDBCF]', text: 'text-[#380D00]' }, // Coral
  { bg: 'bg-[#E8DEF8]', text: 'text-[#1D192B]' }, // Lavender
  { bg: 'bg-[#EADDFF]', text: 'text-[#21005D]' }, // Violet
  { bg: 'bg-[#FFDAD6]', text: 'text-[#410002]' }, // Rose
  { bg: 'bg-[#FFE088]', text: 'text-[#241A00]' }, // Amber
  { bg: 'bg-[#C4EED0]', text: 'text-[#072111]' }, // Sage Green
  { bg: 'bg-[#FFD8EC]', text: 'text-[#37072E]' }, // Berry Pink
  { bg: 'bg-[#D0E8FF]', text: 'text-[#001E2E]' }, // Sky Cyan
];

/**
 * Returns consistent initials from participant name.
 * e.g., "Rauf Aliyev" -> "RA", "Ali" -> "A"
 */
function getInitials(name: string): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

/**
 * Generates a deterministic hash for picking a palette index.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      name,
      color,
      size = 'md',
      src,
      alt,
      className,
      style,
      ...rest
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const initials = getInitials(name);
    const paletteIndex = hashString(name || '?') % TONAL_PALETTES.length;
    const palette = TONAL_PALETTES[paletteIndex];

    const sizeClasses = {
      sm: 'w-8 h-8 text-xs font-medium',
      md: 'w-10 h-10 text-sm font-semibold',
      lg: 'w-12 h-12 text-base font-semibold',
      xl: 'w-16 h-16 text-xl font-bold',
    }[size];

    // Determine if custom color is hex/rgb or css class
    const isCustomColorHex = color?.startsWith('#') || color?.startsWith('rgb');
    const customBgClass = color && !isCustomColorHex ? color : undefined;

    const dynamicStyle = isCustomColorHex
      ? { backgroundColor: color, ...style }
      : style;

    return (
      <div
        ref={ref}
        style={dynamicStyle}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0 shadow-xs transition-transform duration-200',
          sizeClasses,
          !isCustomColorHex && (customBgClass || palette.bg),
          isCustomColorHex ? 'text-white font-medium' : palette.text,
          className
        )}
        {...rest}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="tracking-tight">{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
