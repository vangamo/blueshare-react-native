import { Colors, Frames, Layout, NavigationThemes, Sizes, layoutFor, type ThemeColor } from '@/constants/theme';
import { contrastRatio } from '@/test-utils/contrast';
import { TEST_WINDOWS } from '@/test-utils/test-values';

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
  // Creation box and timeline (add-text-items design D10).
  { fg: 'textMain', bg: 'creationBg', min: TEXT, use: 'creation box title and save error' },
  { fg: 'onPrimary', bg: 'primaryBlueHover', min: TEXT, use: 'Guardar and Crear labels' },
  { fg: 'textMain', bg: 'surfaceMuted', min: TEXT, use: 'Cancelar and card action labels' },
  { fg: 'textSecondary', bg: 'cardBg', min: TEXT, use: 'text card body' },
  { fg: 'textSecondary', bg: 'backgroundMain', min: TEXT, use: 'empty and error messages' },
  { fg: 'textMain', bg: 'cardBg', min: TEXT, use: 'type select, options and text area text' },
  { fg: 'primaryDark', bg: 'cardBg', min: LARGE_OR_UI, use: 'type select and text area border' },
  { fg: 'textMain', bg: 'cardBg', min: LARGE_OR_UI, use: 'type select chevron' },
  // Edit dialog and danger buttons (edit-text-items design D7).
  { fg: 'onDanger', bg: 'danger', min: TEXT, use: 'Sí, borrar label' },
  { fg: 'danger', bg: 'surfaceMuted', min: TEXT, use: 'Borrar este texto label' },
  { fg: 'danger', bg: 'creationBg', min: LARGE_OR_UI, use: 'Borrar este texto border' },
  { fg: 'textMain', bg: 'creationBg', min: LARGE_OR_UI, use: 'edit dialog close glyph' },
  // Image items (add-image-items design Context).
  { fg: 'textMuted', bg: 'cardBg', min: TEXT, use: 'image card caption' },
  { fg: 'textMuted', bg: 'creationBg', min: TEXT, use: 'alternative text hint' },
  { fg: 'textMuted', bg: 'imageBackdrop', min: TEXT, use: 'missing photo message' },
  // Event items (event-items design D12).
  { fg: 'badgeText', bg: 'badgeBg', min: TEXT, use: 'category badge' },
  { fg: 'textMain', bg: 'cardBg', min: TEXT, use: 'event title' },
  { fg: 'textMain', bg: 'surfaceMuted', min: TEXT, use: 'category suggestion labels and photo remove glyph' },
  { fg: 'primaryDark', bg: 'creationBg', min: LARGE_OR_UI, use: 'category suggestion border' },
  { fg: 'primaryDark', bg: 'surfaceMuted', min: LARGE_OR_UI, use: 'photo remove button border' },
  { fg: 'primaryBlueDeep', bg: 'cardBg', min: LARGE_OR_UI, use: 'event card accent bar' },
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

describe('layoutFor', () => {
  test.each([
    [TEST_WINDOWS.phonePortrait, 'phone-portrait'],
    [TEST_WINDOWS.phoneLandscape, 'phone-landscape'],
    [TEST_WINDOWS.tabletPortrait, 'tablet-portrait'],
    [TEST_WINDOWS.tabletLandscape, 'tablet-landscape'],
  ] as const)('%j is %s', ({ width, height }, kind) => {
    expect(layoutFor(width, height)).toBe(kind);
  });

  test('a short side of 599 is a phone and 600 a tablet', () => {
    expect(layoutFor(599, 1000)).toBe('phone-portrait');
    expect(layoutFor(600, 1000)).toBe('tablet-portrait');
    expect(layoutFor(1000, 599)).toBe('phone-landscape');
    expect(layoutFor(1000, 600)).toBe('tablet-landscape');
  });

  test('a square window is portrait, and a split-screen tablet window is a phone', () => {
    expect(layoutFor(700, 700)).toBe('tablet-portrait');
    expect(layoutFor(500, 744)).toBe('phone-portrait');
  });
});

describe('Sizes', () => {
  test('the phone set holds the phone portrait values (regression guard)', () => {
    expect(Sizes.phone).toMatchObject({
      fieldHeight: 42,
      fab: 56,
      cardText: 15,
      cardLineHeight: 22.5,
      menuButton: 44,
      avatar: 42,
      optionRow: 56,
      textAreaMin: 96,
      textAreaMax: 200,
      captionText: 14,
      fieldLabel: 14,
      fieldHint: 14,
      eventTitle: 17,
      badgeText: 14,
      thumbColumns: 3,
    });
    expect(Layout).toMatchObject({
      photoRadius: 12,
      photoGap: 8,
      imageMinHeight: 120,
      imageMaxRatio: 1.25,
      accentBarWidth: 6,
      eventTileGap: 10,
      eventTilePeek: 2.4,
      badgePaddingH: 10,
      badgePaddingV: 4,
      thumbRemoveInset: 4,
    });
    expect(Frames['phone-portrait']).toMatchObject({
      headerHeight: 70,
      tabBarHeight: 75,
      tabBarPosition: 'bottom',
      tabWidth: 'stretch',
      fabBottom: 10,
    });
  });

  test('tablets get larger event titles and badges and four thumbnails per row', () => {
    expect(Sizes.tablet).toMatchObject({ eventTitle: 19, badgeText: 15, thumbColumns: 4 });
  });

  test('every tablet size is at least its phone size', () => {
    for (const key of Object.keys(Sizes.phone) as (keyof typeof Sizes.phone)[]) {
      expect(Sizes.tablet[key]).toBeGreaterThanOrEqual(Sizes.phone[key]);
    }
  });

  test.each(['phone', 'tablet'] as const)('%s controls are at least the touch target', (device) => {
    const sizes = Sizes[device];
    for (const height of [
      sizes.menuButton,
      sizes.tabHeight,
      sizes.actionHeight,
      sizes.controlHeight,
      sizes.optionRow,
    ]) {
      expect(height).toBeGreaterThanOrEqual(Layout.touchTarget);
    }
  });
});
