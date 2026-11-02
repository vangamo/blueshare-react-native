import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import { SAVE_ERROR_MESSAGE } from '@/components/creation-box';
import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { Colors, Layout, Radius, Spacing } from '@/constants/theme';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { CreationBoxHarness } from '@/test-utils/creation-box-harness';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import { setMockColorScheme } from '@/test-utils/test-values';

const button = (name: string) => screen.getByRole('button', { name });
const textArea = () => screen.getByLabelText('Crear nuevo elemento de texto');
const storedBodies = () => screen.queryAllByTestId('stored-item').map((node) => node.props.children);

async function open() {
  await fireEvent.press(screen.getByText('Abrir'));
}

async function choose(label: string) {
  await fireEvent.press(button('Crear nuevo elemento'));
  await fireEvent.press(screen.getByRole('radio', { name: label }));
}

async function goToWriteStep() {
  await open();
  await choose('📝 Texto');
  await fireEvent.press(button('Guardar'));
}

describe('CreationBox, choose step', () => {
  test('renders nothing while closed', async () => {
    await render(<CreationBoxHarness />);
    expect(screen.queryByTestId('creation-box')).toBeNull();
  });

  test('opens with the title, the placeholder, Cancelar and a disabled Guardar', async () => {
    await render(<CreationBoxHarness />);
    await open();
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
    expect(button('Crear nuevo elemento')).toHaveAccessibilityValue({
      text: 'Selecciona una opción',
    });
    expect(button('Cancelar')).toBeEnabled();
    expect(button('Guardar')).toBeDisabled();
    expect(button('Guardar')).toHaveStyle({ opacity: Layout.disabledOpacity });
  });

  test.each(['📅 Evento', '📝 Texto', '📷 Imagen'])('choosing %s enables Guardar', async (label) => {
    await render(<CreationBoxHarness />);
    await open();
    await choose(label);
    expect(button('Guardar')).toBeEnabled();
  });

  test.each(['📅 Evento', '📷 Imagen'])('Guardar with %s keeps the choose step', async (label) => {
    await render(<CreationBoxHarness />);
    await open();
    await choose(label);
    await fireEvent.press(button('Guardar'));
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
    expect(button('Crear nuevo elemento')).toHaveAccessibilityValue({ text: label });
  });

  test('Guardar with Texto moves to the write step', async () => {
    await render(<CreationBoxHarness />);
    await goToWriteStep();
    expect(screen.getByText('Crear nuevo elemento de texto:')).toBeOnTheScreen();
    expect(textArea()).toHaveProp('value', '');
    expect(textArea()).toHaveProp('autoFocus', true);
    expect(button('Cancelar')).toBeOnTheScreen();
    expect(button('Crear')).toBeDisabled();
  });

  test('Cancelar closes the box', async () => {
    await render(<CreationBoxHarness />);
    await open();
    await choose('📝 Texto');
    await fireEvent.press(button('Cancelar'));
    expect(screen.queryByTestId('creation-box')).toBeNull();
  });

  test('Cancelar and Guardar share a row with the creation gap', async () => {
    await render(<CreationBoxHarness />);
    await open();
    const row = button('Cancelar').parent;
    expect(row).toHaveStyle({ flexDirection: 'row', gap: Layout.creationGap });
    expect(button('Cancelar')).toHaveStyle({ flex: 1 });
    expect(button('Guardar')).toHaveStyle({ flex: 1 });
  });

  test.each(['light', 'dark'] as const)('box style in the %s palette', async (scheme) => {
    setMockColorScheme(scheme);
    const colors = Colors[scheme];
    await render(<CreationBoxHarness />);
    await open();
    expect(screen.getByTestId('creation-box')).toHaveStyle({
      borderWidth: Layout.borderWidth,
      borderStyle: 'dashed',
      borderColor: colors.primaryBlue,
      backgroundColor: colors.creationBg,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    });
    expect(screen.getByText('Crear nuevo elemento:')).toHaveStyle({
      fontSize: 14,
      fontWeight: '700',
      color: colors.textMain,
    });
  });
});

describe('CreationBox, write step', () => {
  test.each(['', '   ', ' \n\n \t'])('Crear is disabled for %j', async (text) => {
    await render(<CreationBoxHarness />);
    await goToWriteStep();
    await fireEvent.changeText(textArea(), text);
    expect(button('Crear')).toBeDisabled();
    await fireEvent.press(button('Crear'));
    expect(storedBodies()).toEqual([]);
  });

  test('the text area is limited to TEXT_MAX_LENGTH and sized by Layout', async () => {
    await render(<CreationBoxHarness />);
    await goToWriteStep();
    expect(textArea()).toHaveProp('maxLength', TEXT_MAX_LENGTH);
    expect(textArea()).toHaveProp('multiline', true);
    expect(textArea()).toHaveStyle({
      minHeight: Layout.textAreaMinHeight,
      maxHeight: Layout.textAreaMaxHeight,
      borderColor: Colors.light.primaryDark,
      backgroundColor: Colors.light.cardBg,
      color: Colors.light.textMain,
      fontSize: 16,
    });
  });

  test('Crear saves the trimmed text, dismisses the keyboard and closes the box', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(<CreationBoxHarness />);
    await goToWriteStep();
    await fireEvent.changeText(textArea(), '  Hoy hemos jugado al parchís.  ');
    expect(button('Crear')).toBeEnabled();
    await fireEvent.press(button('Crear'));

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(storedBodies()).toEqual(['Hoy hemos jugado al parchís.']);
    expect(dismiss).toHaveBeenCalled();
  });

  test('a double tap creates one item', async () => {
    const adapters = createAppAdapters();
    const db = new GatedSqlDatabase(adapters.db);
    await render(<CreationBoxHarness adapters={{ ...adapters, db }} />);
    await goToWriteStep();
    await fireEvent.changeText(textArea(), 'Hola');
    const before = db.transactions; // the migrations' transactions

    // Hold the save so the second tap lands while it is in progress.
    const release = db.hold();
    await fireEvent.press(button('Crear'));
    expect(button('Crear')).toBeDisabled();
    await fireEvent.press(button('Crear'));
    release();

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(db.transactions - before).toBe(1);
    expect(storedBodies()).toEqual(['Hola']);
  });

  test('a failing save keeps the text, shows the message and allows a retry', async () => {
    const adapters = createAppAdapters();
    let fail = true;
    const db = new FailingSqlDatabase(adapters.db, (sql) => fail && sql.includes('INSERT INTO text_items'));
    await render(<CreationBoxHarness adapters={{ ...adapters, db }} />);
    await goToWriteStep();
    await fireEvent.changeText(textArea(), 'Mañana hay bingo');
    await fireEvent.press(button('Crear'));

    const message = await screen.findByText(SAVE_ERROR_MESSAGE);
    expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(message).toHaveStyle({ color: Colors.light.textMain });
    expect(textArea()).toHaveProp('value', 'Mañana hay bingo');
    expect(storedBodies()).toEqual([]);
    expect(button('Crear')).toBeEnabled();

    fail = false;
    await fireEvent.press(button('Crear'));
    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(storedBodies()).toEqual(['Mañana hay bingo']);
  });

  test('typing after a failure hides the message', async () => {
    const adapters = createAppAdapters();
    const db = new FailingSqlDatabase(adapters.db, (sql) => sql.includes('INSERT INTO text_items'));
    await render(<CreationBoxHarness adapters={{ ...adapters, db }} />);
    await goToWriteStep();
    await fireEvent.changeText(textArea(), 'Hola');
    await fireEvent.press(button('Crear'));
    await screen.findByText(SAVE_ERROR_MESSAGE);
    await fireEvent.changeText(textArea(), 'Hola!');
    expect(screen.queryByText(SAVE_ERROR_MESSAGE)).toBeNull();
  });

  test('Cancelar discards the text, and reopening starts empty', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(<CreationBoxHarness />);
    await goToWriteStep();
    await fireEvent.changeText(textArea(), 'Borrador');
    await fireEvent.press(button('Cancelar'));

    expect(screen.queryByTestId('creation-box')).toBeNull();
    expect(dismiss).toHaveBeenCalled();
    expect(storedBodies()).toEqual([]);

    await open();
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
    expect(button('Crear nuevo elemento')).toHaveAccessibilityValue({
      text: 'Selecciona una opción',
    });
  });
});
