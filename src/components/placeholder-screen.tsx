import { ScrollView, StyleSheet, Text } from 'react-native';

import { FontWeight, Spacing } from '@/constants/theme';
import { useContentStyle } from '@/hooks/use-content-style';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

type PlaceholderScreenProps = {
  /** Section name shown as placeholder content, e.g. "Timeline". */
  title: string;
};

/** Scrollable content area for a main section that has no real content yet. */
export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  const theme = useTheme();
  const contentStyle = useContentStyle();
  const { sizes } = useShellLayout();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.backgroundMain }]}
      contentContainerStyle={[styles.content, contentStyle]}>
      <Text style={[styles.title, { fontSize: sizes.placeholderTitle, color: theme.textMain }]}>{title}</Text>
      <Text style={[styles.body, { fontSize: sizes.placeholderBody, color: theme.textSecondary }]}>Coming soon.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    gap: Spacing.sm,
  },
  title: {
    fontWeight: FontWeight.extrabold,
  },
  body: {
  },
});
