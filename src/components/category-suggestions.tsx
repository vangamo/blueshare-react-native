import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontWeight, Layout, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

/** The categories offered below the "Categoría" field, in order. */
export const CATEGORY_SUGGESTIONS = ['Familia', 'Amigos', 'Trabajo', 'Encuentro'] as const;

type CategorySuggestionsProps = {
  /** Called with the word pressed. It replaces the field's content; the field is not focused. */
  onSelect: (category: string) => void;
};

/** One-tap categories for an event, as buttons that wrap onto more lines when needed. */
export function CategorySuggestions({ onSelect }: CategorySuggestionsProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <View style={styles.row}>
      {CATEGORY_SUGGESTIONS.map((word) => (
        <Pressable
          key={word}
          accessibilityRole="button"
          accessibilityLabel={word}
          onPress={() => onSelect(word)}
          style={({ pressed }) => [
            styles.chip,
            {
              minHeight: sizes.controlHeight,
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.primaryDark,
            },
            pressed && styles.pressed,
          ]}>
          <Text style={[styles.label, { fontSize: sizes.buttonLabel, color: theme.textMain }]}>{word}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontWeight: FontWeight.medium,
  },
});
