/**
 * BlueShare design tokens, read from `design-system.json` (a corrected copy of
 * sketches/design_system.json; see openspec design D4/D5). Every color in the app
 * comes from `Colors`, so light and dark mode switch the whole UI.
 */

import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

import designSystem from './design-system.json';

const tokens = designSystem.design_tokens;

type CamelCase<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<CamelCase<Tail>>}`
  : S;

type CamelKeys<T> = { [K in keyof T as K extends string ? CamelCase<K> : never]: T[K] };

function camelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/** Maps each `snake_case` key to `camelCase` and each value through `convert`. */
function mapTokens<T extends Record<string, string>, V>(
  source: T,
  convert: (value: string) => V,
): { [K in keyof CamelKeys<T>]: V } {
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [camelCase(key), convert(value)]),
  ) as { [K in keyof CamelKeys<T>]: V };
}

const asIs = (value: string) => value;

/** "12px" → 12. "50%" (a pill radius) → 9999, so any size stays fully rounded. */
export function px(value: string): number {
  if (value === '50%') return 9999;
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) throw new Error(`Unsupported design token size: ${value}`);
  return Number(match[1]);
}

const FONT_WEIGHTS = ['400', '600', '700', '800'] as const;
type FontWeightValue = (typeof FONT_WEIGHTS)[number];

function fontWeight(value: string): FontWeightValue {
  if (!(FONT_WEIGHTS as readonly string[]).includes(value)) {
    throw new Error(`Unsupported design token font weight: ${value}`);
  }
  return value as FontWeightValue;
}

const light = mapTokens(tokens.colors, asIs);

export type ThemeColors = typeof light;
export type ThemeColor = keyof ThemeColors;

// Typed as ThemeColors so a key missing from `colors_dark` fails the typecheck.
const dark: ThemeColors = mapTokens(tokens.colors_dark, asIs);

export const Colors = { light, dark } as const;

export const Spacing = mapTokens(tokens.spacing, px);

export const Radius = mapTokens(tokens.border_radius, px);

export const FontSize = mapTokens(tokens.typography.sizes, px);

export const FontWeight = mapTokens(tokens.typography.weights, fontWeight);

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
