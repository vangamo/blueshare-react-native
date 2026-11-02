import { StyleSheet, Text, View } from 'react-native';

import { FontWeight, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

type FieldLabelProps = {
  label: string;
  /** Explains what the field is for. Screen readers get it from the field's `accessibilityHint`. */
  hint?: string;
};

/** The bold label above a form field, with an optional muted hint below it. */
export function FieldLabel({ label, hint }: FieldLabelProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { fontSize: sizes.fieldLabel, color: theme.textMain }]}>
        {label}
      </Text>
      {hint ? (
        // Hidden from screen readers: the field reads the same text as its hint.
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{ fontSize: sizes.fieldHint, color: theme.textMuted }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontWeight: FontWeight.bold,
  },
});
