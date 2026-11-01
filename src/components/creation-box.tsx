import { useRef } from 'react';
import { AccessibilityInfo, Keyboard, Platform, StyleSheet, Text, View } from 'react-native';

import { BoxButton } from '@/components/box-button';
import { BoxTextArea } from '@/components/box-text-area';
import { TypeSelect } from '@/components/type-select';
import { FontSize, FontWeight, Layout, Radius, Spacing } from '@/constants/theme';
import { useCreationBox } from '@/hooks/use-creation-box';
import { useTheme } from '@/hooks/use-theme';
import { useTimeline } from '@/hooks/use-timeline';

export const SAVE_ERROR_MESSAGE = '⚠️ No se pudo guardar. Inténtalo de nuevo.';

/**
 * Inline box at the top of the Timeline for creating an item. Choose step: type
 * select, Cancelar and Guardar. Write step (Texto only): text area, Cancelar and
 * Crear. Renders nothing while closed. Its state lives in `CreationBoxProvider`.
 */
export function CreationBox() {
  const theme = useTheme();
  const { box, dispatch } = useCreationBox();
  const { createText } = useTimeline();
  // Guards against a second tap landing before the "saving" render.
  const savingRef = useRef(false);

  if (box.step === 'closed') return null;

  const cancel = () => {
    Keyboard.dismiss();
    dispatch({ type: 'close' });
  };

  const save = async (text: string) => {
    if (savingRef.current) return;
    savingRef.current = true;
    dispatch({ type: 'saveStarted' });
    try {
      await createText(text);
      Keyboard.dismiss();
      dispatch({ type: 'close' });
    } catch {
      dispatch({ type: 'saveFailed' });
      // Android reads the live region; iOS needs an explicit announcement.
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(SAVE_ERROR_MESSAGE);
    } finally {
      savingRef.current = false;
    }
  };

  const boxStyle = [styles.box, { backgroundColor: theme.creationBg, borderColor: theme.primaryBlue }];
  const titleStyle = [styles.title, { color: theme.textMain }];

  if (box.step === 'choose') {
    return (
      <View style={boxStyle} testID="creation-box">
        <Text style={titleStyle}>Crear nuevo elemento:</Text>
        <TypeSelect
          value={box.type}
          onChange={(itemType) => dispatch({ type: 'chooseType', itemType })}
        />
        <View style={styles.buttons}>
          <BoxButton label="Cancelar" variant="secondary" onPress={cancel} style={styles.button} />
          <BoxButton
            label="Guardar"
            variant="primary"
            disabled={box.type === null}
            // Only Texto moves on; Evento and Imagen do nothing yet.
            onPress={() => dispatch({ type: 'confirmType' })}
            style={styles.button}
          />
        </View>
      </View>
    );
  }

  const canCreate = box.text.trim().length > 0 && !box.saving;

  return (
    <View style={boxStyle} testID="creation-box">
      <Text style={titleStyle}>Crear nuevo elemento de texto:</Text>
      <BoxTextArea
        value={box.text}
        onChangeText={(text) => dispatch({ type: 'setText', text })}
        // Mounts only when entering this step, so returning from another tab
        // (the screen stays mounted) doesn't refocus it.
        autoFocus
        accessibilityLabel="Crear nuevo elemento de texto"
      />
      {box.failed ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.error, { color: theme.textMain }]}>
          {SAVE_ERROR_MESSAGE}
        </Text>
      ) : null}
      <View style={styles.buttons}>
        <BoxButton label="Cancelar" variant="secondary" onPress={cancel} style={styles.button} />
        <BoxButton
          label="Crear"
          variant="primary"
          disabled={!canCreate}
          onPress={() => {
            void save(box.text);
          }}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: Layout.borderWidth,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Layout.creationGap,
  },
  title: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.bold,
  },
  error: {
    fontSize: FontSize.small,
    fontWeight: FontWeight.bold,
  },
  buttons: {
    flexDirection: 'row',
    gap: Layout.creationGap,
  },
  button: {
    flex: 1,
  },
});
