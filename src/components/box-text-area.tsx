import { StyleSheet, TextInput } from 'react-native';

import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { Layout, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

type BoxTextAreaProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Also the screen reader name. */
  accessibilityLabel: string;
  /** Read after the name, e.g. what the field is for. */
  accessibilityHint?: string;
  /** Longest text accepted. Defaults to the text item limit. */
  maxLength?: number;
  /** Opens the keyboard on mount. The creation box does, the edit dialog doesn't. */
  autoFocus?: boolean;
};

/**
 * The multi-line text area of the creation box and the edit dialog: three lines tall,
 * growing up to a maximum height and then scrolling, limited to `maxLength` (the text
 * item limit by default).
 */
export function BoxTextArea({
  value,
  onChangeText,
  accessibilityLabel,
  accessibilityHint,
  maxLength = TEXT_MAX_LENGTH,
  autoFocus = false,
}: BoxTextAreaProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      multiline
      maxLength={maxLength}
      autoFocus={autoFocus}
      textAlignVertical="top"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      selectionColor={theme.primaryBlue}
      style={[
        styles.textArea,
        {
          minHeight: sizes.textAreaMin,
          maxHeight: sizes.textAreaMax,
          fontSize: sizes.inputFont,
          color: theme.textMain, backgroundColor: theme.cardBg, borderColor: theme.primaryDark,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  textArea: {
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
});
