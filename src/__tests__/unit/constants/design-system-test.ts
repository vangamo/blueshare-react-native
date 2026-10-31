import designSystem from '@/constants/design-system.json';
import { Colors, FontSize, FontWeight, Radius, Spacing, px } from '@/constants/theme';

const tokens = designSystem.design_tokens;

function camelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function expectMapped(
  source: Record<string, string>,
  target: object,
  convert: (value: string) => unknown = (value) => value,
) {
  const expected = Object.fromEntries(
    Object.entries(source).map(([key, value]) => [camelCase(key), convert(value)]),
  );
  expect(target).toStrictEqual(expected);
}

describe('design-system.json', () => {
  test('light and dark palettes have the same keys', () => {
    expect(Object.keys(tokens.colors_dark).sort()).toEqual(Object.keys(tokens.colors).sort());
  });

  test('colors map to Colors.light and colors_dark to Colors.dark', () => {
    expectMapped(tokens.colors, Colors.light);
    expectMapped(tokens.colors_dark, Colors.dark);
  });

  test('pixel sizes map to Spacing, Radius and FontSize', () => {
    expectMapped(tokens.spacing, Spacing, px);
    expectMapped(tokens.border_radius, Radius, px);
    expectMapped(tokens.typography.sizes, FontSize, px);
    expect(Spacing.lg).toBe(16);
    expect(Radius.pill).toBe(9999);
    expect(FontSize.bodyLarge).toBe(16);
  });

  test('font weights map to FontWeight', () => {
    expectMapped(tokens.typography.weights, FontWeight);
  });

  test('px rejects sizes it cannot convert', () => {
    expect(px('12px')).toBe(12);
    expect(() => px('1rem')).toThrow('Unsupported design token size: 1rem');
  });

  test('the corrected footer values match the light palette', () => {
    const footer = designSystem.components.footer;
    expect(footer.border_top).toBe(`2px solid ${Colors.light.borderColor}`);
    expect(footer.tab_active.background).toBe(Colors.light.primaryBlueHover);
    expect(footer.tab_active.border).toBe(`2px solid ${Colors.light.primaryBlueDeep}`);
  });
});
