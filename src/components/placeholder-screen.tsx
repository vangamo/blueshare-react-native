import { ScrollView, StyleSheet, Text } from 'react-native';

import { FontSize, FontWeight, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PlaceholderScreenProps = {
  /** Section name shown as placeholder content, e.g. "Timeline". */
  title: string;
};

/** Scrollable content area for a main section that has no real content yet. */
export function PlaceholderScreen({ title }: PlaceholderScreenProps) {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.backgroundMain }]}
      contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.textMain }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>Coming soon.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.titleCard,
    fontWeight: FontWeight.extrabold,
  },
  body: {
    fontSize: FontSize.body,
  },
});
