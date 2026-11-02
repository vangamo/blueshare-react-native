import { renderHook } from '@testing-library/react-native';

import { useContentStyle } from '@/hooks/use-content-style';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { setMockWindow, TEST_WINDOWS } from '@/test-utils/test-values';

// A phone in landscape with the navigation bar on its right side, as on a three-button device.
const SIDE_INSETS = { top: 24, bottom: 0, left: 12, right: 48 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => SIDE_INSETS,
}));

describe('useContentStyle with side insets', () => {
  test('the column leaves exactly columnWidth for its content, whatever the insets', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    const { result } = await renderHook(() => ({
      style: useContentStyle(),
      layout: useShellLayout(),
    }));
    const { style, layout } = result.current;
    const innerWidth =
      (style.width as number) - (style.paddingLeft as number) - (style.paddingRight as number);
    expect(innerWidth).toBe(layout.columnWidth);
  });
});
