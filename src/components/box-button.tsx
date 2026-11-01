import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { FontSize, FontWeight, Layout } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BoxButtonProps = {
  /** Visible text, also used as the accessibility label. */
  label: string;
  /** `primary` for Guardar and Crear, `secondary` for Cancelar. */
  variant: 'primary' | 'secondary';
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
  const primary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        primary
          ? { backgroundColor: theme.primaryBlueHover }
          : {
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.borderDark,
              borderWidth: Layout.borderWidth,
            },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, { color: primary ? theme.onPrimary : theme.textMain }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: Layout.touchTarget,
    borderRadius: Layout.controlRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  disabled: {
    opacity: Layout.disabledOpacity,
  },
  pressed: {
    opacity: 0.8,
  },
});
