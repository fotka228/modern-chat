/**
 * Кольори застосунку. Вони збігаються з палітрою в tailwind.config.js,
 * тож і Tailwind-класи, і useTheme() дають однаковий вигляд.
 */

import { Platform } from 'react-native';

export const Colors = {
  white: '#ffffff',
  black: '#000000',

  // Основна палітра (iOS dark)
  surface: '#121212',
  card: '#1c1c1e',
  border: '#2a2a2c',
  primary: '#0a84ff',
  accent: '#64d2ff',
  success: '#30d158',
  warning: '#ff9f0a',
  danger: '#ff453a',
  textMuted: '#8e8e93',
  placeholder: '#636366',

  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#121212',
    backgroundElement: '#1c1c1e',
    backgroundSelected: '#2a2a2c',
    textSecondary: '#a1a1a6',
  },
} as const;

export const COLORS = Colors;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;