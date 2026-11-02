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

/** Sizes that never change with the device or its orientation. */
export const Layout = {
  tabBarPaddingHorizontal: 10,
  tabMarginHorizontal: 4,
  /** The 44-point minimum for any control (accessibility). */
  touchTarget: 44,
  controlRadius: 10,
  borderWidth: 2,
  fabBorderWidth: 3,
  /** Space between creation box controls, and between its two buttons. */
  creationGap: 10,
  /** Card divider and card action border. */
  hairlineWidth: 1,
  /** View opacity of a disabled box button (a faded primary, not gray). */
  disabledOpacity: 0.45,
  /** How long the title field waits after the keyboard hides before it blurs. */
  keyboardHideGraceMs: 400,
} as const;

export type LayoutKind = 'phone-portrait' | 'phone-landscape' | 'tablet-portrait' | 'tablet-landscape';
export type DeviceKind = 'phone' | 'tablet';

/** A window whose shorter side is at least this many points uses the tablet layouts. */
export const TABLET_MIN_SIDE = 600;

/** Component and font sizes. They depend only on the device size, never on the orientation. */
export type SizeSet = {
  contentPadding: number;
  headerPaddingHorizontal: number;
  menuButton: number;
  menuGlyph: number;
  fieldHeight: number;
  fieldFont: number;
  avatar: number;
  avatarEmoji: number;
  tabHeight: number;
  tabLabel: number;
  fab: number;
  fabFont: number;
  fabRight: number;
  cardPadding: number;
  cardRadius: number;
  itemGap: number;
  cardText: number;
  cardLineHeight: number;
  actionHeight: number;
  actionLabel: number;
  boxTitle: number;
  inputFont: number;
  controlHeight: number;
  buttonLabel: number;
  optionRow: number;
  textAreaMin: number;
  textAreaMax: number;
  placeholderTitle: number;
  placeholderBody: number;
};

/** The phone set is today's phone portrait look (sketches/mobile-portrait.html). */
export const Sizes: Record<DeviceKind, SizeSet> = {
  phone: {
    contentPadding: 16,
    headerPaddingHorizontal: 16,
    menuButton: 44,
    menuGlyph: 18,
    fieldHeight: 42,
    fieldFont: 16,
    avatar: 42,
    avatarEmoji: 20,
    tabHeight: 44,
    tabLabel: 14,
    fab: 56,
    fabFont: 28,
    fabRight: 20,
    cardPadding: 16,
    cardRadius: 16,
    itemGap: 16,
    cardText: 15,
    cardLineHeight: 22.5,
    actionHeight: 44,
    actionLabel: 14,
    boxTitle: 14,
    inputFont: 16,
    controlHeight: 44,
    buttonLabel: 15,
    optionRow: 56,
    textAreaMin: 96,
    textAreaMax: 200,
    placeholderTitle: 18,
    placeholderBody: 15,
  },
  // From sketches/tablet-portrait.html, rounded up to 44-point targets. The text area
  // and option row values are not in the mock and are tuned in the visual review.
  tablet: {
    contentPadding: 20,
    headerPaddingHorizontal: 24,
    menuButton: 48,
    menuGlyph: 20,
    fieldHeight: 46,
    fieldFont: 17,
    avatar: 46,
    avatarEmoji: 22,
    tabHeight: 48,
    tabLabel: 15,
    fab: 60,
    fabFont: 30,
    fabRight: 28,
    cardPadding: 20,
    cardRadius: 18,
    itemGap: 20,
    cardText: 16,
    cardLineHeight: 24,
    actionHeight: 48,
    actionLabel: 15,
    boxTitle: 15,
    inputFont: 17,
    controlHeight: 48,
    buttonLabel: 16,
    optionRow: 60,
    textAreaMin: 104,
    textAreaMax: 240,
    placeholderTitle: 20,
    placeholderBody: 16,
  },
};

/** What depends on the full layout: bar heights, tab bar position, widths and the FAB offset. */
export type Frame = {
  headerHeight: number;
  tabBarHeight: number;
  tabBarPosition: 'top' | 'bottom';
  /** Width of each tab, or 'stretch' to share the bar equally. */
  tabWidth: number | 'stretch';
  /** Maximum width of the title field, or null for no limit. */
  titleMaxWidth: number | null;
  /** Maximum width of the content column, or null for the full width. */
  column: number | null;
  /** Gap between the create button and the tab bar (portrait) or the bottom inset (landscape). */
  fabBottom: number;
};

export const Frames: Record<LayoutKind, Frame> = {
  'phone-portrait': {
    headerHeight: 70,
    tabBarHeight: 75,
    tabBarPosition: 'bottom',
    tabWidth: 'stretch',
    titleMaxWidth: null,
    column: null,
    fabBottom: 10,
  },
  'phone-landscape': {
    headerHeight: 56,
    tabBarHeight: 56,
    tabBarPosition: 'top',
    tabWidth: 120,
    titleMaxWidth: 300,
    column: 550,
    fabBottom: 16,
  },
  'tablet-portrait': {
    headerHeight: 75,
    tabBarHeight: 80,
    tabBarPosition: 'bottom',
    tabWidth: 150,
    titleMaxWidth: 350,
    column: 500,
    fabBottom: 16,
  },
  'tablet-landscape': {
    headerHeight: 75,
    tabBarHeight: 64,
    tabBarPosition: 'top',
    tabWidth: 150,
    titleMaxWidth: 400,
    column: 600,
    fabBottom: 16,
  },
};

/** The layout for a window: wider than tall is landscape, a short side of 600+ is a tablet. */
export function layoutFor(width: number, height: number): LayoutKind {
  const device = Math.min(width, height) >= TABLET_MIN_SIDE ? 'tablet' : 'phone';
  return `${device}-${width > height ? 'landscape' : 'portrait'}`;
}

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
