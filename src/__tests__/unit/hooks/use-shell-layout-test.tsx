import { act, renderHook } from '@testing-library/react-native';

import { Frames, Layout, Sizes, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { setMockWindow, TEST_INSETS, TEST_WINDOWS } from '@/test-utils/test-values';

describe('useShellLayout', () => {
  test('defaults to phone portrait, with the column spanning the screen minus padding', async () => {
    const { result } = await renderHook(() => useShellLayout());
    expect(result.current).toMatchObject({
      kind: 'phone-portrait',
      device: 'phone',
      landscape: false,
      frame: Frames['phone-portrait'],
      sizes: Sizes.phone,
    });
    expect(result.current.columnWidth).toBe(
      TEST_WINDOWS.phonePortrait.width -
        TEST_INSETS.left -
        TEST_INSETS.right -
        2 * Sizes.phone.contentPadding,
    );
  });

  test.each([
    ['phoneLandscape', 'phone-landscape', 'phone'],
    ['tabletPortrait', 'tablet-portrait', 'tablet'],
    ['tabletLandscape', 'tablet-landscape', 'tablet'],
  ] as const)('%s gives %s with the %s sizes', async (window, kind, device) => {
    setMockWindow(TEST_WINDOWS[window]);
    const { result } = await renderHook(() => useShellLayout());
    expect(result.current.kind).toBe(kind);
    expect(result.current.frame).toBe(Frames[kind]);
    expect(result.current.sizes).toBe(Sizes[device]);
    expect(result.current.landscape).toBe(kind.endsWith('landscape'));
  });

  test('the column is capped at the frame column', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    const { result } = await renderHook(() => useShellLayout());
    expect(result.current.columnWidth).toBe(Frames['tablet-portrait'].column);
  });

  test('the column shrinks below the cap on a narrow window', async () => {
    setMockWindow({ width: 560, height: 1000 });
    const { result } = await renderHook(() => useShellLayout());
    expect(result.current.kind).toBe('phone-portrait');
    expect(result.current.columnWidth).toBe(560 - 2 * Sizes.phone.contentPadding);
  });

  test('a window change re-renders the consumer', async () => {
    const { result } = await renderHook(() => useShellLayout());
    expect(result.current.kind).toBe('phone-portrait');
    await act(async () => setMockWindow(TEST_WINDOWS.phoneLandscape));
    expect(result.current.kind).toBe('phone-landscape');
  });

  describe('imageMaxHeight', () => {
    const WINDOWS = [
      ['phonePortrait', 'phone-portrait', 'phone'],
      ['phoneLandscape', 'phone-landscape', 'phone'],
      ['tabletPortrait', 'tablet-portrait', 'tablet'],
      ['tabletLandscape', 'tablet-landscape', 'tablet'],
    ] as const;

    test.each(WINDOWS)('%s follows the formula and keeps the floor', async (window, kind, device) => {
      setMockWindow(TEST_WINDOWS[window]);
      const { result } = await renderHook(() => useShellLayout());
      const sizes = Sizes[device];
      const frame = Frames[kind];
      const chrome =
        2 * (sizes.cardPadding + Layout.borderWidth) +
        Layout.photoGap +
        sizes.captionText * 1.5 +
        2 * Spacing.md +
        Layout.hairlineWidth +
        sizes.actionHeight;
      const formula =
        TEST_WINDOWS[window].height -
        TEST_INSETS.top -
        TEST_INSETS.bottom -
        frame.headerHeight -
        frame.tabBarHeight -
        2 * sizes.contentPadding -
        chrome;
      expect(result.current.imageMaxHeight).toBe(Math.max(Layout.imageMinHeight, formula));
      expect(result.current.imageMaxHeight).toBeGreaterThanOrEqual(Layout.imageMinHeight);
    });

    test('phone landscape is short enough to hit the floor', async () => {
      setMockWindow(TEST_WINDOWS.phoneLandscape);
      const { result } = await renderHook(() => useShellLayout());
      expect(result.current.imageMaxHeight).toBe(Layout.imageMinHeight);
    });

    test('phone portrait leaves room above the floor', async () => {
      const { result } = await renderHook(() => useShellLayout());
      expect(result.current.imageMaxHeight).toBeGreaterThan(Layout.imageMinHeight);
    });

    test('changes when the window changes', async () => {
      const { result } = await renderHook(() => useShellLayout());
      const portrait = result.current.imageMaxHeight;
      await act(async () => setMockWindow(TEST_WINDOWS.tabletPortrait));
      expect(result.current.imageMaxHeight).not.toBe(portrait);
    });
  });
});
