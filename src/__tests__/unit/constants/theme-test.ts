import { Colors, NavigationThemes, type ThemeColor } from '@/constants/theme';
import { contrastRatio } from '@/test-utils/contrast';

type Pair = { fg: ThemeColor; bg: ThemeColor; min: number; use: string };

const TEXT = 4.5; // normal text (WCAG AA)
const LARGE_OR_UI = 3; // large text, icons and control boundaries

// Every color pair the shell draws (design D5).
const PAIRS: Pair[] = [
  { fg: 'textMain', bg: 'backgroundMain', min: TEXT, use: 'placeholder screen text' },
  { fg: 'textMain', bg: 'surfaceMuted', min: TEXT, use: 'title field text at rest' },
  { fg: 'textMain', bg: 'cardBg', min: TEXT, use: 'title field text when focused' },
  { fg: 'textMuted', bg: 'cardBg', min: TEXT, use: 'search placeholder' },
  { fg: 'textSecondary', bg: 'surfaceMuted', min: TEXT, use: 'inactive tab label' },
  { fg: 'onPrimary', bg: 'primaryBlueHover', min: TEXT, use: 'active tab label' },
  { fg: 'onPrimary', bg: 'primaryBlue', min: LARGE_OR_UI, use: 'create button + (28pt bold)' },
  { fg: 'primaryBlue', bg: 'creationBg', min: LARGE_OR_UI, use: 'menu glyph' },
  { fg: 'primaryBlue', bg: 'cardBg', min: LARGE_OR_UI, use: 'menu border / focused field border' },
  { fg: 'primaryDark', bg: 'surfaceMuted', min: LARGE_OR_UI, use: 'title field border at rest' },
  { fg: 'primaryDark', bg: 'cardBg', min: LARGE_OR_UI, use: 'avatar border' },
];

describe('palettes', () => {
  test('light and dark have the same color roles', () => {
    expect(Object.keys(Colors.dark).sort()).toEqual(Object.keys(Colors.light).sort());
  });

  test('light palette keeps the design-token values', () => {
    expect(Colors.light).toMatchObject({
      primaryBlue: '#0084ff',
      backgroundMain: '#faf9f6',
      cardBg: '#ffffff',
      borderColor: '#e2e8f0',
      textMain: '#0f172a',
    });
  });

  describe.each(['light', 'dark'] as const)('%s contrast', (scheme) => {
    test.each(PAIRS)('$use: $fg on $bg >= $min', ({ fg, bg, min }) => {
      const palette = Colors[scheme];
      expect(contrastRatio(palette[fg], palette[bg])).toBeGreaterThanOrEqual(min);
    });
  });
});

describe('navigation themes', () => {
  test.each(['light', 'dark'] as const)('%s uses the BlueShare palette', (scheme) => {
    const palette = Colors[scheme];
    expect(NavigationThemes[scheme].dark).toBe(scheme === 'dark');
    expect(NavigationThemes[scheme].colors).toMatchObject({
      primary: palette.primaryBlue,
      background: palette.backgroundMain,
      card: palette.cardBg,
      text: palette.textMain,
      border: palette.borderColor,
    });
  });
});
