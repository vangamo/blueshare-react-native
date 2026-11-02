import { act, renderHook } from '@testing-library/react-native';

import { Frames, Sizes } from '@/constants/theme';
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
});
