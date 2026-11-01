import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize, FontWeight, Layout, Radius, Spacing } from '@/constants/theme';
import type { ItemType } from '@/hooks/use-timeline';
import { useTheme } from '@/hooks/use-theme';

export const TYPE_SELECT_PLACEHOLDER = 'Selecciona una opción';

/** The choosable types, in display order. The placeholder is never an option. */
export const TYPE_OPTIONS: readonly { type: ItemType; label: string }[] = [
  { type: 'event', label: '📅 Evento' },
  { type: 'text', label: '📝 Texto' },
  { type: 'image', label: '📷 Imagen' },
];

type TypeSelectProps = {
  value: ItemType | null;
  onChange: (type: ItemType) => void;
};

/**
 * The creation box's type field (design D8): a 44-point field that opens a list in
 * a transparent Modal. Tapping the backdrop or pressing back closes only the list.
 */
export function TypeSelect({ value, onChange }: TypeSelectProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = TYPE_OPTIONS.find((option) => option.type === value);
  const valueText = selected?.label ?? TYPE_SELECT_PLACEHOLDER;

  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Crear nuevo elemento"
        accessibilityValue={{ text: valueText }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.cardBg, borderColor: theme.primaryDark },
          pressed && styles.pressed,
        ]}>
        <Text style={[styles.fieldText, { color: theme.textMain }]} numberOfLines={1}>
          {valueText}
        </Text>
        <Text style={[styles.chevron, { color: theme.textMain }]}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={close}
        testID="type-select-list">
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar lista"
            onPress={close}
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.overlay }]}
          />
          <View
            accessibilityRole="radiogroup"
            style={[styles.sheet, { backgroundColor: theme.cardBg, borderColor: theme.borderColor }]}>
            {TYPE_OPTIONS.map((option) => {
              const checked = option.type === value;
              return (
                <Pressable
                  key={option.type}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked }}
                  onPress={() => {
                    onChange(option.type);
                    close();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    checked && { backgroundColor: theme.creationBg },
                    pressed && styles.pressed,
                  ]}>
                  <Text style={[styles.optionText, { color: theme.textMain }]}>{option.label}</Text>
                  {checked ? (
                    <Text style={[styles.optionText, { color: theme.textMain }]}>✓</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: Layout.touchTarget,
    borderWidth: Layout.borderWidth,
    borderRadius: Layout.controlRadius,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: {
    flex: 1,
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.medium,
  },
  chevron: {
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.bold,
    marginLeft: Spacing.sm,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  sheet: {
    borderWidth: Layout.borderWidth,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    overflow: 'hidden',
  },
  option: {
    minHeight: Layout.optionRowHeight,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionText: {
    fontSize: FontSize.bodyLarge,
    fontWeight: FontWeight.medium,
  },
  pressed: {
    opacity: 0.7,
  },
});
