import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Keyboard, Platform, StyleSheet } from 'react-native';

import { DELETE_ERROR_MESSAGE, EDIT_SAVE_ERROR_MESSAGE } from '@/components/edit-text-dialog';
import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { Colors, Frames, Layout, Radius, Sizes, Spacing } from '@/constants/theme';
import { EditDialogHarness, seededAdapters } from '@/test-utils/edit-dialog-harness';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import { TEST_INSETS, TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

const button = (name: string) => screen.getByRole('button', { name });
const textArea = () => screen.getByLabelText('Editar elemento de texto');
const stored = () => screen.queryAllByTestId('stored-item').map((node) => node.props.children);

async function openDialog(bodies = ['Hola'], target = bodies[bodies.length - 1]) {
  const onClosed = jest.fn();
  const adapters = await seededAdapters(bodies);
  await render(<EditDialogHarness adapters={adapters} onClosed={onClosed} />);
  await waitFor(() => expect(stored()).toHaveLength(bodies.length));
  await fireEvent.press(button(`Abrir ${target}`));
  return { onClosed };
}

describe('EditTextDialog, edit step', () => {
  test('shows the stored text, the buttons, and does not open the keyboard', async () => {
    await openDialog(['Hola\nabuela']);
    expect(screen.getByText('Editar elemento de texto:')).toBeOnTheScreen();
    expect(textArea()).toHaveProp('value', 'Hola\nabuela');
    expect(textArea()).toHaveProp('autoFocus', false);
    expect(textArea()).toHaveProp('maxLength', TEXT_MAX_LENGTH);
    for (const name of ['Cerrar', 'Cancelar', 'Guardar', 'Borrar este texto']) {
      expect(button(name)).toBeOnTheScreen();
    }
  });

  test.each(['light', 'dark'] as const)('box and buttons are styled in %s mode', async (scheme) => {
    setMockColorScheme(scheme);
    const colors = Colors[scheme];
    await openDialog();
    expect(screen.getByTestId('edit-text-dialog')).toBeOnTheScreen();
    expect(screen.getByText('Editar elemento de texto:')).toHaveStyle({ color: colors.textMain });
    const box = screen.getByText('Editar elemento de texto:').parent!.parent!;
    expect(box).toHaveStyle({
      backgroundColor: colors.creationBg,
      borderColor: colors.primaryBlue,
      borderWidth: Layout.borderWidth,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    });
    expect(button('Borrar este texto')).toHaveStyle({
      borderColor: colors.danger,
      minHeight: Layout.touchTarget,
    });
  });

  test('the close button is at least 44x44 and named Cerrar', async () => {
    await openDialog();
    expect(button('Cerrar')).toHaveStyle({
      width: Layout.touchTarget,
      height: Layout.touchTarget,
    });
  });

  test('the overlay is not pressable, so tapping outside does nothing', async () => {
    const { onClosed } = await openDialog();
    const overlay = screen.getByTestId('edit-text-dialog').children[0] as unknown as {
      props: { onPress?: unknown; onStartShouldSetResponder?: unknown };
    };
    expect(overlay.props.onPress).toBeUndefined();
    expect(overlay.props.onStartShouldSetResponder).toBeUndefined();
    expect(onClosed).not.toHaveBeenCalled();
    expect(textArea()).toBeOnTheScreen();
  });

  test('Guardar is disabled for unchanged, whitespace-only and blank text', async () => {
    await openDialog(['Hola']);
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.changeText(textArea(), 'Hola \n');
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.changeText(textArea(), '  \n');
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.changeText(textArea(), 'Hola, abuela');
    expect(button('Guardar')).toBeEnabled();
  });

  test('Guardar trims, saves in the same position and closes', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { onClosed } = await openDialog(['Uno', 'Dos'], 'Uno');

    await fireEvent.changeText(textArea(), '  Uno editado.  ');
    await fireEvent.press(button('Guardar'));

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId('edit-text-dialog')).toBeNull();
    expect(stored()).toEqual(['Dos', 'Uno editado.']);
    expect(dismiss).toHaveBeenCalled();
  });

  test('a double tap saves once', async () => {
    const adapters = await seededAdapters(['Hola'], (db) => new GatedSqlDatabase(db));
    const db = adapters.db as GatedSqlDatabase;
    const onClosed = jest.fn();
    await render(<EditDialogHarness adapters={adapters} onClosed={onClosed} />);
    await waitFor(() => expect(stored()).toEqual(['Hola']));
    await fireEvent.press(button('Abrir Hola'));
    await fireEvent.changeText(textArea(), 'Hola, abuela');
    const before = db.transactions;
    const release = db.hold();

    await fireEvent.press(button('Guardar'));
    await fireEvent.press(button('Guardar'));
    release();

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(db.transactions - before).toBe(1);
  });

  test('a failed save keeps the text, shows the message, and a retry works', async () => {
    let fail = true;
    const adapters = await seededAdapters(
      ['Hola'],
      (db) => new FailingSqlDatabase(db, (sql) => fail && sql.includes('UPDATE text_items')),
    );
    const onClosed = jest.fn();
    await render(<EditDialogHarness adapters={adapters} onClosed={onClosed} />);
    await waitFor(() => expect(stored()).toEqual(['Hola']));
    await fireEvent.press(button('Abrir Hola'));
    await fireEvent.changeText(textArea(), 'Hola, abuela');

    await fireEvent.press(button('Guardar'));

    expect(await screen.findByText(EDIT_SAVE_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(textArea()).toHaveProp('value', 'Hola, abuela');
    expect(stored()).toEqual(['Hola']);
    expect(button('Guardar')).toBeEnabled();
    expect(onClosed).not.toHaveBeenCalled();

    fail = false;
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()).toEqual(['Hola, abuela']);
  });

  test.each(['Cancelar', 'Cerrar'])('%s closes without changes', async (name) => {
    const { onClosed } = await openDialog(['Hola']);
    await fireEvent.changeText(textArea(), 'Otro');
    await fireEvent.press(button(name));
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(stored()).toEqual(['Hola']);
  });

  test('onRequestClose (Android back) closes without changes', async () => {
    const { onClosed } = await openDialog(['Hola']);
    await fireEvent.changeText(textArea(), 'Otro');
    await fireEvent(screen.getByTestId('edit-text-dialog'), 'requestClose');
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(stored()).toEqual(['Hola']);
  });

  test('reopening after cancelling starts from the stored text', async () => {
    await openDialog(['Hola']);
    await fireEvent.changeText(textArea(), 'Otro');
    await fireEvent.press(button('Cancelar'));
    await fireEvent.press(button('Abrir Hola'));
    expect(textArea()).toHaveProp('value', 'Hola');
  });
});

describe('EditTextDialog, confirm step', () => {
  async function toConfirm() {
    const ctx = await openDialog(['Uno', 'Dos'], 'Dos');
    await fireEvent.changeText(textArea(), 'Dos editado');
    await fireEvent.press(button('Borrar este texto'));
    return ctx;
  }

  test('Borrar este texto asks first, deleting nothing', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await toConfirm();
    expect(screen.getByText('¿Borrar este texto?')).toBeOnTheScreen();
    expect(screen.getByText('Desaparecerá de tu línea de tiempo.')).toBeOnTheScreen();
    for (const name of ['Cerrar', 'No, volver', 'Sí, borrar']) {
      expect(button(name)).toBeOnTheScreen();
    }
    expect(screen.queryByLabelText('Editar elemento de texto')).toBeNull();
    expect(stored()).toEqual(['Dos', 'Uno']);
    expect(dismiss).toHaveBeenCalled();
  });

  test('the deletion buttons use the danger colors', async () => {
    setMockColorScheme('dark');
    await toConfirm();
    expect(button('Sí, borrar')).toHaveStyle({
      backgroundColor: Colors.dark.danger,
      minHeight: Layout.touchTarget,
    });
    expect(screen.getByText('Sí, borrar')).toHaveStyle({ color: Colors.dark.onDanger });
  });

  test('No, volver returns to the edit step with the edited text', async () => {
    await toConfirm();
    await fireEvent.press(button('No, volver'));
    expect(textArea()).toHaveProp('value', 'Dos editado');
    expect(stored()).toEqual(['Dos', 'Uno']);
  });

  test('onRequestClose returns to the edit step instead of closing', async () => {
    const { onClosed } = await toConfirm();
    await fireEvent(screen.getByTestId('edit-text-dialog'), 'requestClose');
    expect(await screen.findByLabelText('Editar elemento de texto')).toBeOnTheScreen();
    expect(onClosed).not.toHaveBeenCalled();
  });

  test('the close button closes without changes', async () => {
    const { onClosed } = await toConfirm();
    await fireEvent.press(button('Cerrar'));
    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(stored()).toEqual(['Dos', 'Uno']);
  });

  test('Sí, borrar deletes the item and closes', async () => {
    const { onClosed } = await toConfirm();
    await fireEvent.press(button('Sí, borrar'));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()).toEqual(['Uno']);
  });

  test('a failed deletion stays in the step with the message, and a retry works', async () => {
    let fail = true;
    const adapters = await seededAdapters(
      ['Uno'],
      (db) => new FailingSqlDatabase(db, (sql) => fail && sql.includes('DELETE FROM items')),
    );
    const onClosed = jest.fn();
    await render(<EditDialogHarness adapters={adapters} onClosed={onClosed} />);
    await waitFor(() => expect(stored()).toEqual(['Uno']));
    await fireEvent.press(button('Abrir Uno'));
    await fireEvent.press(button('Borrar este texto'));

    await fireEvent.press(button('Sí, borrar'));

    expect(await screen.findByText(DELETE_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(screen.getByText('¿Borrar este texto?')).toBeOnTheScreen();
    expect(stored()).toEqual(['Uno']);

    fail = false;
    await fireEvent.press(button('Sí, borrar'));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()).toEqual([]);
  });
});

describe('EditTextDialog, iOS announcements', () => {
  test.each([
    ['save', EDIT_SAVE_ERROR_MESSAGE],
    ['delete', DELETE_ERROR_MESSAGE],
  ])('announces the %s error', async (kind, message) => {
    const original = Platform.OS;
    Platform.OS = 'ios';
    try {
      const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
      const adapters = await seededAdapters(
        ['Hola'],
        (db) => new FailingSqlDatabase(db, (sql) => /UPDATE text_items|DELETE FROM items/.test(sql)),
      );
      await render(<EditDialogHarness adapters={adapters} />);
      await waitFor(() => expect(stored()).toEqual(['Hola']));
      await fireEvent.press(button('Abrir Hola'));
      if (kind === 'save') {
        await fireEvent.changeText(textArea(), 'Otro');
        await fireEvent.press(button('Guardar'));
      } else {
        await fireEvent.press(button('Borrar este texto'));
        await fireEvent.press(button('Sí, borrar'));
      }
      await screen.findByText(message);
      expect(announce).toHaveBeenCalledWith(message);
    } finally {
      Platform.OS = original;
    }
  });
});

describe('EditTextDialog, other layouts', () => {
  const box = () => screen.getByText('Editar elemento de texto:').parent!.parent!;

  test('phone landscape: the box is the 550-point column, centered, padded for all insets', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await openDialog();
    expect(box()).toHaveStyle({ width: Frames['phone-landscape'].column });
    const scroll = box().parent!.parent!;
    expect(StyleSheet.flatten(scroll.props.contentContainerStyle)).toMatchObject({
      alignItems: 'center',
      paddingTop: TEST_INSETS.top + Spacing.lg,
      paddingBottom: TEST_INSETS.bottom + Spacing.lg,
      paddingLeft: TEST_INSETS.left + Spacing.lg,
      paddingRight: TEST_INSETS.right + Spacing.lg,
    });
  });

  test('tablet portrait: a 500-point box with the tablet padding, radius and button sizes', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await openDialog();
    expect(box()).toHaveStyle({
      width: Frames['tablet-portrait'].column,
      padding: Sizes.tablet.cardPadding,
      borderRadius: Sizes.tablet.cardRadius,
    });
    expect(screen.getByText('Editar elemento de texto:')).toHaveStyle({ fontSize: Sizes.tablet.boxTitle });
    expect(button('Guardar')).toHaveStyle({ minHeight: Sizes.tablet.controlHeight });
    expect(textArea()).toHaveStyle({ fontSize: Sizes.tablet.inputFont });
  });
});
