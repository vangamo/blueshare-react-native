import { StyleSheet, TextInput } from 'react-native';

import { Layout, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

type BoxTextFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** The screen reader name. */
  accessibilityLabel: string;
  /** Read after the name, e.g. what the field is for. */
  accessibilityHint?: string;
  maxLength: number;
  /** Capitalization the keyboard suggests. Defaults to the system's (sentences). */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

/** A single-line field for the creation box and the edit dialog, styled like `BoxTextArea`. */
export function BoxTextField({
  value,
  onChangeText,
  accessibilityLabel,
  accessibilityHint,
  maxLength,
  autoCapitalize,
}: BoxTextFieldProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      maxLength={maxLength}
      autoCapitalize={autoCapitalize}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      selectionColor={theme.primaryBlue}
      style={[
        styles.field,
        {
          minHeight: sizes.controlHeight,
          fontSize: sizes.inputFont,
          color: theme.textMain,
          backgroundColor: theme.cardBg,
          borderColor: theme.primaryDark,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
