import { renderHook } from '@testing-library/react-native';

import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { setMockColorScheme } from '@/test-utils/test-values';

describe('useTheme', () => {
  test('returns the light palette in light mode', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
  });

  test('returns the dark palette in dark mode', async () => {
    setMockColorScheme('dark');
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.dark);
  });

  test('falls back to light when the scheme is unknown', async () => {
    setMockColorScheme(null);
    const { result } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
  });

  test('switches palette when the system scheme changes', async () => {
    const { result, rerender } = await renderHook(() => useTheme());
    expect(result.current).toBe(Colors.light);
    setMockColorScheme('dark');
    await rerender({});
    expect(result.current).toBe(Colors.dark);
  });
});
