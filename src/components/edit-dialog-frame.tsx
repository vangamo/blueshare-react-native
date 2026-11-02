import { useReducer, useRef, type ReactNode } from 'react';
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
import { FontSize, FontWeight, Layout, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { useTheme } from '@/hooks/use-theme';

export const EDIT_SAVE_ERROR_MESSAGE = '⚠️ No se pudo guardar. Inténtalo de nuevo.';
export const DELETE_ERROR_MESSAGE = '⚠️ No se pudo borrar. Inténtalo de nuevo.';

type FrameState = {
  step: 'edit' | 'confirm';
  busy: boolean;
  error: 'save' | 'delete' | null;
};

type FrameAction =
  | { type: 'clearError' }
  | { type: 'askDelete' }
  | { type: 'backToEdit' }
  | { type: 'started' }
  | { type: 'failed'; error: 'save' | 'delete' };

function reducer(state: FrameState, action: FrameAction): FrameState {
  switch (action.type) {
    case 'clearError':
      return state.error ? { ...state, error: null } : state;
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

type EditDialogFrameProps = {
  /** Test id of the modal. */
  testID: string;
  /** Title of the edit step, e.g. "Editar elemento de texto:". */
  title: string;
  /** Label of the button that asks for the deletion, e.g. "Borrar este texto". */
  deleteLabel: string;
  /** Title of the confirmation step, e.g. "¿Borrar este texto?". */
  confirmTitle: string;
  /** Whether the body holds a real change. The frame also disables Guardar while busy. */
  canSave: boolean;
  /** Saves the body's state. A rejection shows the save error and keeps the dialog open. */
  onSave: () => Promise<unknown>;
  /** Deletes the item. A rejection shows the deletion error and keeps the dialog open. */
  onDelete: () => Promise<unknown>;
  /** Closes the dialog. The parent stops rendering it, so each open starts from the stored item. */
  onClose: () => void;
  /**
   * The edit step's fields. They receive `clearError`, to hide a failure message when the
   * user edits. The body's state stays in the parent, so it survives the confirmation step.
   */
  children: (controls: { clearError: () => void }) => ReactNode;
};

/**
 * Everything a dialog to edit or delete an item shares: the modal, the scrolling column,
 * the title and close button, the edit step (the body, Cancelar and Guardar, a divider and
 * the deletion button), the confirmation step (No, volver and Sí, borrar), busy and error
 * state, the double-tap guard and back button handling. It closes only through the close
 * button, Cancelar or the Android back button (back in the confirm step returns to the
 * edit step); tapping outside does nothing. Render it with `key={item.id}`.
 */
export function EditDialogFrame({
  testID,
  title,
  deleteLabel,
  confirmTitle,
  canSave,
  onSave,
  onDelete,
  onClose,
  children,
}: EditDialogFrameProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { sizes, columnWidth } = useShellLayout();
  const [state, dispatch] = useReducer(reducer, { step: 'edit', busy: false, error: null });
  // Guards against a second tap landing before the "busy" render.
  const busyRef = useRef(false);

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
      testID={testID}>
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
                backgroundColor: theme.creationBg,
                borderColor: theme.primaryBlue,
              },
            ]}>
            <View style={styles.header}>
              <Text
                accessibilityRole="header"
                style={[styles.title, { fontSize: sizes.boxTitle, color: theme.textMain }]}>
                {confirming ? confirmTitle : title}
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
                      void run(onDelete, 'delete');
                    }}
                    style={styles.button}
                  />
                </View>
              </>
            ) : (
              <>
                {children({ clearError: () => dispatch({ type: 'clearError' }) })}
                {state.error ? <ErrorMessage message={errorMessage} /> : null}
                <View style={styles.buttons}>
                  <BoxButton label="Cancelar" variant="secondary" onPress={close} style={styles.button} />
                  <BoxButton
                    label="Guardar"
                    variant="primary"
                    disabled={!canSave || state.busy}
                    onPress={() => {
                      void run(onSave, 'save');
                    }}
                    style={styles.button}
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                <BoxButton
                  label={deleteLabel}
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
