import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { AccessibilityInfo, Keyboard, Platform } from 'react-native';

import { SAVE_ERROR_MESSAGE } from '@/components/creation-box';
import { ALT_TEXT_HINT, PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import { ALT_TEXT_MAX_LENGTH, CAPTION_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/limits';
import { Colors, Layout, Radius, Sizes, Spacing } from '@/constants/theme';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { CreationBoxHarness } from '@/test-utils/creation-box-harness';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import { writeFixturePhoto } from '@/test-utils/node-photo-store';
import { TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

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

  test.each(['📅 Evento'])('Guardar with %s keeps the choose step', async (label) => {
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
      minHeight: Sizes.phone.textAreaMin,
      maxHeight: Sizes.phone.textAreaMax,
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

describe('CreationBox, tablet layout', () => {
  test('uses the tablet sizes in both steps', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    const sizes = Sizes.tablet;
    await render(<CreationBoxHarness />);
    await open();
    expect(screen.getByTestId('creation-box')).toHaveStyle({
      padding: sizes.cardPadding,
      borderRadius: sizes.cardRadius,
      marginBottom: sizes.itemGap,
    });
    expect(screen.getByText('Crear nuevo elemento:')).toHaveStyle({ fontSize: sizes.boxTitle });
    expect(button('Crear nuevo elemento')).toHaveStyle({ minHeight: sizes.controlHeight });
    expect(button('Guardar')).toHaveStyle({ minHeight: sizes.controlHeight });
    expect(screen.getByText('Guardar')).toHaveStyle({ fontSize: sizes.buttonLabel });

    await choose('📝 Texto');
    await fireEvent.press(button('Guardar'));
    expect(textArea()).toHaveStyle({
      minHeight: sizes.textAreaMin,
      maxHeight: sizes.textAreaMax,
      fontSize: sizes.inputFont,
    });
  });
});

describe('CreationBox, image step', () => {
  beforeEach(() => launch.mockReset());

  const altField = () => screen.getByLabelText('Texto alternativo');
  const captionField = () => screen.getByLabelText('Pie de foto');
  const storedImages = () => screen.queryAllByTestId('stored-item').map((node) => node.props.children);

  function pickReturns(uri = writeFixturePhoto(), width = 4000, height = 3000) {
    launch.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri, width, height, mimeType: 'image/png' }],
    } as never);
    return uri;
  }

  async function goToImageStep() {
    await open();
    await choose('📷 Imagen');
    await fireEvent.press(button('Guardar'));
  }

  async function pickPhoto(uri?: string) {
    pickReturns(uri);
    await fireEvent.press(screen.getByRole('button', { name: /foto$/ }));
    await screen.findByTestId('photo-preview');
  }

  test('Guardar with Imagen shows the image step with the keyboard closed and Crear disabled', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();

    expect(screen.getByText('Crear nuevo elemento de imagen:')).toBeOnTheScreen();
    expect(button('Elegir foto')).toBeOnTheScreen();
    expect(altField()).toHaveProp('value', '');
    expect(altField()).not.toHaveProp('autoFocus', true);
    expect(captionField()).toHaveProp('value', '');
    expect(captionField()).not.toHaveProp('autoFocus', true);
    expect(screen.queryByTestId('photo-preview')).toBeNull();
    expect(button('Cancelar')).toBeEnabled();
    expect(button('Crear')).toBeDisabled();
  });

  test('picking shows the preview, and the button reads "Cambiar foto"', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();
    await pickPhoto();

    expect(screen.getByRole('image', { name: 'Foto elegida' })).toBeOnTheScreen();
    expect(button('Cambiar foto')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Elegir foto' })).toBeNull();
    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ mediaTypes: 'images' }));
  });

  test('a cancelled pick keeps the previous photo and the texts', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();
    await pickPhoto();
    await fireEvent.changeText(captionField(), 'En el parque');

    launch.mockResolvedValueOnce({ canceled: true, assets: null } as never);
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(2));

    expect(screen.getByTestId('photo-preview')).toBeOnTheScreen();
    expect(button('Cambiar foto')).toBeOnTheScreen();
    expect(captionField()).toHaveProp('value', 'En el parque');
  });

  test('replacing the photo keeps the typed texts', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();
    await pickPhoto();
    await fireEvent.changeText(altField(), 'Una playa');
    await fireEvent.changeText(captionField(), 'Verano');

    const second = pickReturns(writeFixturePhoto('second.png'), 100, 400);
    await fireEvent.press(button('Cambiar foto'));

    await waitFor(() =>
      expect(screen.getByTestId('photo-preview-image')).toHaveProp('source', [{ uri: second }]),
    );
    expect(altField()).toHaveProp('value', 'Una playa');
    expect(captionField()).toHaveProp('value', 'Verano');
  });

  test('a picker error shows the message, announces it and a retry opens the picker', async () => {
    const platform = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    try {
      await render(<CreationBoxHarness />);
      await goToImageStep();
      launch.mockRejectedValueOnce(new Error('no gallery'));
      await fireEvent.press(button('Elegir foto'));

      const message = await screen.findByText(PICKER_ERROR_MESSAGE);
      expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
      expect(announce).toHaveBeenCalledWith(PICKER_ERROR_MESSAGE);
      expect(button('Crear')).toBeDisabled();

      await pickPhoto();
      expect(screen.queryByText(PICKER_ERROR_MESSAGE)).toBeNull();
      expect(launch).toHaveBeenCalledTimes(2);
    } finally {
      Platform.OS = platform;
    }
  });

  test('Crear stays disabled with texts only, and is enabled with a photo', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();
    await fireEvent.changeText(altField(), 'Una playa');
    await fireEvent.changeText(captionField(), 'Verano');
    expect(button('Crear')).toBeDisabled();
    await fireEvent.press(button('Crear'));
    expect(storedImages()).toEqual([]);

    await pickPhoto();
    expect(button('Crear')).toBeEnabled();
  });

  test('Crear is enabled with a photo and empty fields', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();
    await pickPhoto();
    expect(button('Crear')).toBeEnabled();
  });

  test('Crear saves the trimmed texts, dismisses the keyboard and closes the box', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(<CreationBoxHarness />);
    await goToImageStep();
    await pickPhoto();
    await fireEvent.changeText(captionField(), '  Taller de pintura  ');
    await fireEvent.press(button('Crear'));

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(storedImages()).toEqual(['Taller de pintura']);
    expect(dismiss).toHaveBeenCalled();
  });

  test('a double tap creates one image item', async () => {
    const adapters = createAppAdapters();
    const db = new GatedSqlDatabase(adapters.db);
    await render(<CreationBoxHarness adapters={{ ...adapters, db }} />);
    await goToImageStep();
    await pickPhoto();
    await fireEvent.changeText(captionField(), 'Uno');
    const before = db.transactions;

    const release = db.hold();
    await fireEvent.press(button('Crear'));
    expect(button('Crear')).toBeDisabled();
    await fireEvent.press(button('Crear'));
    release();

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(db.transactions - before).toBe(1);
    expect(storedImages()).toEqual(['Uno']);
  });

  test('a failing save keeps the photo and fields, shows the message and allows a retry', async () => {
    const adapters = createAppAdapters();
    let fail = true;
    const db = new FailingSqlDatabase(adapters.db, (sql) => fail && sql.includes('INSERT INTO image_items'));
    await render(<CreationBoxHarness adapters={{ ...adapters, db }} />);
    await goToImageStep();
    await pickPhoto();
    await fireEvent.changeText(altField(), 'Una playa');
    await fireEvent.changeText(captionField(), 'Verano');
    await fireEvent.press(button('Crear'));

    const message = await screen.findByText(SAVE_ERROR_MESSAGE);
    expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(screen.getByTestId('photo-preview')).toBeOnTheScreen();
    expect(altField()).toHaveProp('value', 'Una playa');
    expect(captionField()).toHaveProp('value', 'Verano');
    expect(storedImages()).toEqual([]);
    expect(button('Crear')).toBeEnabled();

    fail = false;
    await fireEvent.press(button('Crear'));
    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(storedImages()).toEqual(['Verano']);
  });

  test('Cancelar discards the draft, and reopening starts at the choose step', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(<CreationBoxHarness />);
    await goToImageStep();
    await pickPhoto();
    await fireEvent.changeText(captionField(), 'Borrador');
    await fireEvent.press(button('Cancelar'));

    expect(screen.queryByTestId('creation-box')).toBeNull();
    expect(dismiss).toHaveBeenCalled();
    await open();
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
    expect(storedImages()).toEqual([]);
  });

  test('the fields are limited, and the hint is read with the alternative text field', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();
    expect(altField()).toHaveProp('maxLength', ALT_TEXT_MAX_LENGTH);
    expect(altField()).toHaveProp('multiline', true);
    expect(altField()).toHaveProp('accessibilityHint', ALT_TEXT_HINT);
    expect(captionField()).toHaveProp('maxLength', CAPTION_MAX_LENGTH);
    expect(captionField()).toHaveStyle({
      minHeight: Sizes.phone.controlHeight,
      borderColor: Colors.light.primaryDark,
      backgroundColor: Colors.light.cardBg,
      fontSize: Sizes.phone.inputFont,
    });
    expect(screen.getByText('Texto alternativo')).toBeOnTheScreen();
    expect(screen.getByText('Pie de foto')).toBeOnTheScreen();
  });

  test('the controls are at least 44 points tall and named by their text', async () => {
    await render(<CreationBoxHarness />);
    await goToImageStep();
    for (const name of ['Elegir foto', 'Cancelar', 'Crear']) {
      expect(button(name)).toHaveStyle({ minHeight: Layout.touchTarget });
    }
    expect(button('Crear')).toBeDisabled();
  });

  test('uses the tablet sizes on a tablet', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await render(<CreationBoxHarness />);
    await goToImageStep();
    expect(captionField()).toHaveStyle({ minHeight: Sizes.tablet.controlHeight });
    expect(screen.getByText('Texto alternativo')).toHaveStyle({ fontSize: Sizes.tablet.fieldLabel });
  });
});
