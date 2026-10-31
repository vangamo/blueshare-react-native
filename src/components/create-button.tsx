import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontWeight, Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Floating "+" button above the footer. Rendered once by the root layout. */
export function CreateButton() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Create"
      // The creation flow is not built yet.
      onPress={() => {}}
      style={({ pressed }) => [
        styles.button,
        {
          bottom: Layout.footerHeight + insets.bottom + Layout.fabOffsetBottom,
          backgroundColor: theme.primaryBlue,
          borderColor: theme.cardBg,
          boxShadow: `0 4px 12px ${theme.primaryShadow}`,
        },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.plus, { color: theme.onPrimary }]}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: Layout.fabOffsetRight,
    width: Layout.fabSize,
    height: Layout.fabSize,
    borderRadius: Layout.fabSize / 2,
    borderWidth: Layout.fabBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    fontSize: Layout.fabFontSize,
    fontWeight: FontWeight.bold,
    // Android adds font padding that pushes the glyph off center.
    includeFontPadding: false,
  },
  pressed: {
    opacity: 0.8,
  },
});
