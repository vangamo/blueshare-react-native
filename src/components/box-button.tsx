import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { FontWeight, Layout } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

type BoxButtonProps = {
  /** Visible text, also used as the accessibility label. */
  label: string;
  /**
   * `primary` for Guardar and Crear, `secondary` for Cancelar. `danger` (solid) is
   * the deletion confirmation and `dangerOutline` the button that asks for it.
   */
  variant: 'primary' | 'secondary' | 'danger' | 'dangerOutline';
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Creation box button (design D10). Primary uses the active-tab blue, because white
 * on the mock's #0084ff fails AA for 15 pt text. Disabled is a faded primary, not
 * gray, so it never looks like Cancelar.
 */
export function BoxButton({ label, variant, disabled = false, onPress, style }: BoxButtonProps) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  const variantStyle = {
    primary: { backgroundColor: theme.primaryBlueHover },
    secondary: {
      backgroundColor: theme.surfaceMuted,
      borderColor: theme.borderDark,
      borderWidth: Layout.borderWidth,
    },
    danger: { backgroundColor: theme.danger },
    dangerOutline: {
      backgroundColor: theme.surfaceMuted,
      borderColor: theme.danger,
      borderWidth: Layout.borderWidth,
    },
  }[variant];
  const labelColor = {
    primary: theme.onPrimary,
    secondary: theme.textMain,
    danger: theme.onDanger,
    dangerOutline: theme.danger,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { minHeight: sizes.controlHeight },
        variantStyle,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, { fontSize: sizes.buttonLabel, color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Layout.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: FontWeight.bold,
  },
  disabled: {
    opacity: Layout.disabledOpacity,
  },
  pressed: {
    opacity: 0.8,
  },
});
