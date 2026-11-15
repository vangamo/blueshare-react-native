import { useReducer, useRef, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Keyboard,
  KeyboardAvoidingView,
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

export const DISCARD_TITLE = '¿Descartar los cambios?';
export const DISCARD_TEXT = 'Los cambios que no has guardado se perderán.';

type FrameState = {
  step: 'edit' | 'confirmDelete' | 'confirmDiscard';
  busy: boolean;
  /** The message of the last failure, or `null`. */
  error: string | null;
};

type FrameAction =
  | { type: 'clearError' }
  | { type: 'askDelete' }
  | { type: 'askDiscard' }
  | { type: 'backToEdit' }
  | { type: 'started' }
  | { type: 'failed'; message: string };

function reducer(state: FrameState, action: FrameAction): FrameState {
  switch (action.type) {
    case 'clearError':
      return state.error ? { ...state, error: null } : state;
    case 'askDelete':
      return { ...state, step: 'confirmDelete', error: null };
    case 'askDiscard':
      return { ...state, step: 'confirmDiscard', error: null };
    case 'backToEdit':
      return { ...state, step: 'edit', error: null };
    case 'started':
      return { ...state, busy: true, error: null };
    case 'failed':
      return { ...state, busy: false, error: action.message };
  }
}

type EditDialogFrameProps = {
  /** Test id of the modal. */
  testID: string;
  /** Title of the edit step, e.g. "Editar elemento de texto:". */
  title: string;
  /**
   * The deletion: the label of the button that asks for it (e.g. "Borrar este texto"), the
   * title of its confirmation step and what it does. A rejection shows the deletion error
   * and keeps the dialog open. Without it the dialog has no deletion button.
   */
  deletion?: {
    label: string;
    confirmTitle: string;
    onDelete: () => Promise<unknown>;
  };
  /**
   * Ask "¿Descartar los cambios?" before Cancelar, the close button or back close the dialog
   * while `canSave` is true. Off by default: the edit dialogs close at once.
   */
  confirmDiscard?: boolean;
  /** The message shown when `onSave` rejects. Defaults to `EDIT_SAVE_ERROR_MESSAGE`. */
  saveErrorMessage?: (error: unknown) => string;
  /** Drawn under a divider after Cancelar and Guardar, e.g. the profile's Bluetooth button. */
  footer?: ReactNode;
  /** `false` shows only the body and Cancelar: no Guardar, footer or deletion. Default `true`. */
  editable?: boolean;
  /** Whether the body holds a real change. The frame also disables Guardar while busy. */
  canSave: boolean;
  /** Saves the body's state. A rejection shows the save error and keeps the dialog open. */
  onSave: () => Promise<unknown>;
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
  deletion,
  confirmDiscard = false,
  saveErrorMessage,
  footer,
  editable = true,
  canSave,
  onSave,
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

  /** Cancelar, the close button and back: close, or ask first when there are changes to lose. */
  const tryClose = () => {
    if (confirmDiscard && canSave) {
      Keyboard.dismiss();
      dispatch({ type: 'askDiscard' });
    } else {
      close();
    }
  };

  const run = async (action: () => Promise<unknown>, failure: (error: unknown) => string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    dispatch({ type: 'started' });
    try {
      await action();
      close();
    } catch (error) {
      const message = failure(error);
      dispatch({ type: 'failed', message });
      // Android reads the live region; iOS needs an explicit announcement.
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
    } finally {
      busyRef.current = false;
    }
  };

  const onRequestClose = () => {
    if (state.busy) return;
    if (state.step !== 'edit') dispatch({ type: 'backToEdit' });
    else tryClose();
  };

  const saveFailure = (error: unknown) =>
    saveErrorMessage ? saveErrorMessage(error) : EDIT_SAVE_ERROR_MESSAGE;
  const deleteFailure = () => DELETE_ERROR_MESSAGE;
  const dialogTitle =
    state.step === 'confirmDelete'
      ? (deletion?.confirmTitle ?? title)
      : state.step === 'confirmDiscard'
        ? DISCARD_TITLE
        : title;

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
        {/* Android draws edge to edge, so the modal does not shrink for the keyboard. The
            scroll area ends above it instead, so every field and button stays reachable. */}
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.overlay}
          testID="edit-dialog-keyboard-area">
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
                  {dialogTitle}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar"
                  onPress={state.step === 'confirmDiscard' ? () => dispatch({ type: 'backToEdit' }) : tryClose}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                  <Text style={[styles.closeGlyph, { color: theme.textMain }]}>✕</Text>
                </Pressable>
              </View>

              {state.step === 'confirmDiscard' ? (
                <>
                  <Text style={{ fontSize: sizes.cardText, color: theme.textMain }}>
                    {DISCARD_TEXT}
                  </Text>
                  <View style={styles.buttons}>
                    <BoxButton
                      label="No, volver"
                      variant="secondary"
                      onPress={() => dispatch({ type: 'backToEdit' })}
                      style={styles.button}
                    />
                    <BoxButton label="Sí, descartar" variant="danger" onPress={close} style={styles.button} />
                  </View>
                </>
              ) : state.step === 'confirmDelete' && deletion ? (
                <>
                  <Text style={{ fontSize: sizes.cardText, color: theme.textMain }}>
                    Desaparecerá de tu línea de tiempo.
                  </Text>
                  {state.error ? <ErrorMessage message={state.error} /> : null}
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
                        void run(deletion.onDelete, deleteFailure);
                      }}
                      style={styles.button}
                    />
                  </View>
                </>
              ) : (
                <>
                  {children({ clearError: () => dispatch({ type: 'clearError' }) })}
                  {state.error ? <ErrorMessage message={state.error} /> : null}
                  <View style={styles.buttons}>
                    <BoxButton label="Cancelar" variant="secondary" onPress={tryClose} style={styles.button} />
                    {editable ? (
                      <BoxButton
                        label="Guardar"
                        variant="primary"
                        disabled={!canSave || state.busy}
                        onPress={() => {
                          void run(onSave, saveFailure);
                        }}
                        style={styles.button}
                      />
                    ) : null}
                  </View>
                  {editable && (footer || deletion) ? (
                    <View style={[styles.divider, { backgroundColor: theme.divider }]} />
                  ) : null}
                  {editable ? footer : null}
                  {editable && deletion ? (
                    <BoxButton
                      label={deletion.label}
                      variant="dangerOutline"
                      onPress={() => {
                        Keyboard.dismiss();
                        dispatch({ type: 'askDelete' });
                      }}
                    />
                  ) : null}
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
