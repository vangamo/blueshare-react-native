/**
 * Active BlueShare palette. Re-renders when the system color scheme changes.
 * https://docs.expo.dev/develop/user-interface/color-themes/
 */

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
