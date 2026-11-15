import { StyleSheet, Text, View } from 'react-native';

import { FontWeight, Layout, Radius } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

/** An event's category as a rounded badge, never truncated, read as "Categoría: <category>". */
export function CategoryBadge({ category }: { category: string }) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <View
      testID="category-badge"
      accessible
      accessibilityLabel={`Categoría: ${category}`}
      style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
      <Text style={[styles.label, { fontSize: sizes.badgeText, color: theme.badgeText }]}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Layout.badgePaddingH,
    paddingVertical: Layout.badgePaddingV,
  },
  label: {
    fontWeight: FontWeight.bold,
  },
});
