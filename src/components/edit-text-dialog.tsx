import { useReducer, useRef } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BoxButton } from '@/components/box-button';
import { BoxTextArea } from '@/components/box-text-area';
import { FontSize, FontWeight, Layout, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';
import { useTimeline } from '@/hooks/use-timeline';
import type { TextItem } from '@/items/domain/text-item';

export const EDIT_SAVE_ERROR_MESSAGE = '⚠️ No se pudo guardar. Inténtalo de nuevo.';
export const DELETE_ERROR_MESSAGE = '⚠️ No se pudo borrar. Inténtalo de nuevo.';

type DialogState = {
  step: 'edit' | 'confirm';
  text: string;
  busy: boolean;
  error: 'save' | 'delete' | null;
};

type DialogAction =
  | { type: 'setText'; text: string }
  | { type: 'askDelete' }
  | { type: 'backToEdit' }
  | { type: 'started' }
  | { type: 'failed'; error: 'save' | 'delete' };

function reducer(state: DialogState, action: DialogAction): DialogState {
  switch (action.type) {
    case 'setText':
      return { ...state, text: action.text, error: null };
    case 'askDelete':
      return { ...state, step: 'confirm', error: null };
    case 'backToEdit':
      return { ...state, step: 'edit', error: null };
    case 'started':
      return { ...state, busy: true, error: null };
    case 'failed':
      return { ...state, busy: false, error: action.error };
  }
}

type EditTextDialogProps = {
  item: TextItem;
  /** Closes the dialog. The parent stops rendering it, so each open starts from the stored text. */
  onClose: () => void;
};

/**
 * Dialog over the Timeline to edit or delete a text item. Edit step: text area,
 * Cancelar, Guardar and Borrar este texto. Confirm step: "¿Borrar este texto?" with
 * No, volver and Sí, borrar. It closes only through the close button, Cancelar or
 * the Android back button (back in the confirm step returns to the edit step);
 * tapping outside does nothing. Render it with `key={item.id}`.
 */
export function EditTextDialog({ item, onClose }: EditTextDialogProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { sizes, columnWidth } = useShellLayout();
  const { updateText, deleteItem } = useTimeline();
  const [state, dispatch] = useReducer(reducer, {
    step: 'edit',
    text: item.body,
    busy: false,
    error: null,
  });
  // Guards against a second tap landing before the "busy" render.
  const busyRef = useRef(false);

  const trimmed = state.text.trim();
  const canSave = !state.busy && trimmed.length > 0 && trimmed !== item.body;

  const close = () => {
    Keyboard.dismiss();
    onClose();
  };

  const run = async (action: () => Promise<unknown>, error: 'save' | 'delete') => {
    if (busyRef.current) return;
    busyRef.current = true;
    dispatch({ type: 'started' });
    try {
      await action();
      close();
    } catch {
      dispatch({ type: 'failed', error });
      // Android reads the live region; iOS needs an explicit announcement.
      if (Platform.OS === 'ios') {
        AccessibilityInfo.announceForAccessibility(
          error === 'save' ? EDIT_SAVE_ERROR_MESSAGE : DELETE_ERROR_MESSAGE,
        );
      }
    } finally {
      busyRef.current = false;
    }
  };

  const onRequestClose = () => {
    if (state.busy) return;
    if (state.step === 'confirm') dispatch({ type: 'backToEdit' });
    else close();
  };

  const confirming = state.step === 'confirm';
  const errorMessage = state.error === 'save' ? EDIT_SAVE_ERROR_MESSAGE : DELETE_ERROR_MESSAGE;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}
      testID="edit-text-dialog">
      {/* Not pressable: tapping the overlay does nothing. */}
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + Spacing.lg,
              paddingBottom: insets.bottom + Spacing.lg,
              paddingLeft: insets.left + Spacing.lg,
              paddingRight: insets.right + Spacing.lg,
            },
          ]}>
          <View
            accessibilityViewIsModal
            style={[
              styles.box,
              {
                width: columnWidth,
                borderRadius: sizes.cardRadius,
                padding: sizes.cardPadding,
                backgroundColor: theme.creationBg, borderColor: theme.primaryBlue,
              },
            ]}>
            <View style={styles.header}>
              <Text
                accessibilityRole="header"
                style={[styles.title, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
                {confirming ? '¿Borrar este texto?' : 'Editar elemento de texto:'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={close}
                style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <Text style={[styles.closeGlyph, { color: theme.textMain }]}>✕</Text>
              </Pressable>
            </View>

            {confirming ? (
              <>
                <Text style={{ fontSize: sizes.cardText, color: theme.textMain }}>
                  Desaparecerá de tu línea de tiempo.
                </Text>
                {state.error ? <ErrorMessage message={errorMessage} /> : null}
                <View style={styles.buttons}>
                  <BoxButton
                    label="No, volver"
                    variant="secondary"
                    onPress={() => dispatch({ type: 'backToEdit' })}
                    style={styles.button}
                  />
                  <BoxButton
                    label="Sí, borrar"
                    variant="danger"
                    disabled={state.busy}
                    onPress={() => {
                      void run(() => deleteItem(item.id), 'delete');
                    }}
                    style={styles.button}
                  />
                </View>
              </>
            ) : (
              <>
                <BoxTextArea
                  value={state.text}
                  onChangeText={(text) => dispatch({ type: 'setText', text })}
                  accessibilityLabel="Editar elemento de texto"
                />
                {state.error ? <ErrorMessage message={errorMessage} /> : null}
                <View style={styles.buttons}>
                  <BoxButton label="Cancelar" variant="secondary" onPress={close} style={styles.button} />
                  <BoxButton
                    label="Guardar"
                    variant="primary"
                    disabled={!canSave}
                    onPress={() => {
                      void run(() => updateText(item.id, state.text), 'save');
                    }}
                    style={styles.button}
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                <BoxButton
                  label="Borrar este texto"
                  variant="dangerOutline"
                  onPress={() => {
                    Keyboard.dismiss();
                    dispatch({ type: 'askDelete' });
                  }}
                />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ErrorMessage({ message }: { message: string }) {
  const theme = useTheme();
  const { sizes } = useShellLayout();
  return (
    <Text
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.error, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  content: {
    // Centers the column box; the padding for the insets is set inline.
    alignItems: 'center',
  },
  box: {
    borderWidth: Layout.borderWidth,
    gap: Layout.creationGap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Layout.creationGap,
  },
  title: {
    flex: 1,
    fontWeight: FontWeight.bold,
  },
  closeButton: {
    width: Layout.touchTarget,
    height: Layout.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontSize: FontSize.titleCard,
    fontWeight: FontWeight.bold,
  },
  error: {
    fontWeight: FontWeight.bold,
  },
  buttons: {
    flexDirection: 'row',
    gap: Layout.creationGap,
  },
  button: {
    flex: 1,
  },
  divider: {
    height: Layout.hairlineWidth,
  },
  pressed: {
    opacity: 0.8,
  },
});
