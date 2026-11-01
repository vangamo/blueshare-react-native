import { StyleSheet, TextInput } from 'react-native';

import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { FontSize, Layout, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BoxTextAreaProps = {
  value: string;
  onChangeText: (text: string) => void;
  /** Also the screen reader name. */
  accessibilityLabel: string;
  /** Opens the keyboard on mount. The creation box does, the edit dialog doesn't. */
  autoFocus?: boolean;
};

/**
 * The multi-line text area of the creation box and the edit dialog: three lines tall,
 * growing up to a maximum height and then scrolling, limited to `TEXT_MAX_LENGTH`.
 */
export function BoxTextArea({
  value,
  onChangeText,
  accessibilityLabel,
  autoFocus = false,
}: BoxTextAreaProps) {
  const theme = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      multiline
      maxLength={TEXT_MAX_LENGTH}
      autoFocus={autoFocus}
      textAlignVertical="top"
      accessibilityLabel={accessibilityLabel}
      selectionColor={theme.primaryBlue}
      style={[
        styles.textArea,
        { color: theme.textMain, backgroundColor: theme.cardBg, borderColor: theme.primaryDark },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  textArea: {
    minHeight: Layout.textAreaMinHeight,
    maxHeight: Layout.textAreaMaxHeight,
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.bodyLarge,
  },
});
