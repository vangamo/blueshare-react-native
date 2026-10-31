/**
 * BlueShare design tokens (from sketches/design_system.json; the HTML sketch wins
 * where they disagree). Every color in the app comes from `Colors`, so light and
 * dark mode switch the whole UI. See openspec design D4/D5 for the dark choices.
 */

import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

const light = {
  /** Strong ink: title-field and avatar borders. */
  primaryDark: '#0f172a',
  primaryBlue: '#0084ff',
  /** Active tab background (darker than primaryBlue for 4.5:1 with white text). */
  primaryBlueHover: '#006fe6',
  /** Active tab border. */
  primaryBlueDeep: '#0058b8',
  primaryShadow: 'rgba(0, 132, 255, 0.3)',
  /** Text and icons drawn on primary-blue fills. */
  onPrimary: '#ffffff',
  backgroundMain: '#faf9f6',
  backgroundBody: '#f1f5f9',
  cardBg: '#ffffff',
  /** Title field at rest, inactive tabs. */
  surfaceMuted: '#f8fafc',
  avatarBg: '#fdf6f0',
  creationBg: '#f0f7ff',
  borderColor: '#e2e8f0',
  borderDark: '#cbd5e1',
  textMain: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#475569',
  badgeBg: '#e0f2fe',
  badgeText: '#0369a1',
};

const dark = {
  primaryDark: '#e2e8f0',
  primaryBlue: '#4da3ff',
  primaryBlueHover: '#80bdff',
  primaryBlueDeep: '#b3d7ff',
  primaryShadow: 'rgba(77, 163, 255, 0.3)',
  onPrimary: '#0f172a',
  backgroundMain: '#0b1120',
  backgroundBody: '#020617',
  cardBg: '#0f172a',
  surfaceMuted: '#1e293b',
  avatarBg: '#3a2e25',
  creationBg: '#0c2340',
  borderColor: '#334155',
  borderDark: '#64748b',
  textMain: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  badgeBg: '#0c2a4a',
  badgeText: '#7dd3fc',
} satisfies Record<keyof typeof light, string>;

export const Colors = { light, dark } as const;

export type ThemeColors = typeof light;
export type ThemeColor = keyof ThemeColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  pill: 9999,
} as const;

export const FontSize = {
  caption: 12,
  small: 14,
  body: 15,
  bodyLarge: 16,
  titleCard: 18,
  titleTablet: 20,
} as const;

export const FontWeight = {
  regular: '400',
  medium: '600',
  bold: '700',
  extrabold: '800',
} as const;

/** Fixed shell sizes from sketches/mobile-portrait.html. */
export const Layout = {
  headerHeight: 70,
  footerHeight: 75,
  footerPaddingHorizontal: 10,
  tabMarginHorizontal: 4,
  touchTarget: 44,
  fieldHeight: 42,
  avatarSize: 42,
  avatarEmojiSize: 20,
  fabSize: 56,
  fabFontSize: 28,
  fabOffsetRight: 20,
  fabOffsetBottom: 10,
  controlRadius: 10,
  borderWidth: 2,
  fabBorderWidth: 3,
} as const;

function navigationTheme(base: Theme, colors: ThemeColors): Theme {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primaryBlue,
      background: colors.backgroundMain,
      card: colors.cardBg,
      text: colors.textMain,
      border: colors.borderColor,
      notification: colors.primaryBlue,
    },
  };
}

/** React Navigation themes, so screen and container backgrounds match the palette. */
export const NavigationThemes = {
  light: navigationTheme(DefaultTheme, light),
  dark: navigationTheme(DarkTheme, dark),
} as const;
