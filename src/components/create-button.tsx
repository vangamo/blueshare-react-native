import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontWeight, Layout } from '@/constants/theme';
import { useCreateAction } from '@/hooks/use-create-action';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

/**
 * Floating "+" button above the tab bar. Rendered once by the root layout. What it
 * does, and whether it shows, depends on the section (`useCreateAction`).
 */
export function CreateButton() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { landscape, frame, sizes } = useShellLayout();
  const { visible, onPress } = useCreateAction();

  if (!visible) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          right: sizes.fabRight + insets.right,
          bottom: (landscape ? 0 : frame.tabBarHeight) + insets.bottom + frame.fabBottom,
          width: sizes.fab,
          height: sizes.fab,
          borderRadius: sizes.fab / 2,
          backgroundColor: theme.primaryBlue,
          borderColor: theme.cardBg,
          boxShadow: `0 4px 12px ${theme.primaryShadow}`,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.plus, { fontSize: sizes.fabFont, color: theme.onPrimary }]}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    borderWidth: Layout.fabBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontWeight: FontWeight.bold,
    // Android adds font padding that pushes the glyph off center.
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.8,
  },
});
