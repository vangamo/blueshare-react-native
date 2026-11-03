import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { AccessibilityInfo, Keyboard, Platform } from 'react-native';

import { SAVE_ERROR_MESSAGE } from '@/components/creation-box';
import { PHOTO_LIMIT_MESSAGE } from '@/components/event-fields';
import { ALT_TEXT_HINT, PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import {
  ALT_TEXT_MAX_LENGTH,
  CAPTION_MAX_LENGTH,
  EVENT_CATEGORY_MAX_LENGTH,
  EVENT_DESCRIPTION_MAX_LENGTH,
  EVENT_MAX_PHOTOS,
  EVENT_TITLE_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from '@/constants/limits';
import { Colors, Layout, Radius, Sizes, Spacing } from '@/constants/theme';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { CreationBoxHarness } from '@/test-utils/creation-box-harness';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import { readingOrder } from '@/test-utils/accessibility-order';
import { writeFixturePhoto } from '@/test-utils/node-photo-store';
import { cancelledPick, pickedResult } from '@/test-utils/picker-assets';
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

describe('CreationBox, event step', () => {
  beforeEach(() => launch.mockReset());

  const titleField = () => screen.getByLabelText('Título');
  const categoryField = () => screen.getByLabelText('Categoría');
  const descriptionField = () => screen.getByLabelText('Descripción');
  const thumbnails = () => screen.queryAllByTestId('event-thumbnail');
  const thumbnailLabels = () => thumbnails().map((node) => node.props.accessibilityLabel);
  const thumbnailFiles = () =>
    screen
      .queryAllByTestId('event-thumbnail-image')
      .map((node) => (node.props.source as { uri: string }[])[0].uri.split('/').pop());

  async function goToEventStep() {
    await open();
    await choose('📅 Evento');
    await fireEvent.press(button('Guardar'));
  }

  async function addPhotos(count: number, prefix?: string) {
    const before = thumbnails().length;
    launch.mockResolvedValueOnce(pickedResult(count, prefix));
    await fireEvent.press(screen.getByRole('button', { name: /fotos$/ }));
    await waitFor(() => expect(thumbnails()).toHaveLength(Math.min(before + count, EVENT_MAX_PHOTOS)));
  }

  async function fillRequired(title = 'Viaje', category = 'Familia') {
    await addPhotos(1);
    await fireEvent.changeText(titleField(), title);
    await fireEvent.changeText(categoryField(), category);
  }

  test('Guardar with Evento shows the event step with the keyboard closed and Crear disabled', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();

    expect(screen.getByText('Crear nuevo elemento de evento:')).toBeOnTheScreen();
    expect(button('Elegir fotos')).toBeEnabled();
    for (const field of [titleField(), categoryField(), descriptionField()]) {
      expect(field).toHaveProp('value', '');
      expect(field).not.toHaveProp('autoFocus', true);
    }
    for (const word of ['Familia', 'Amigos', 'Trabajo', 'Encuentro']) {
      expect(button(word)).toBeOnTheScreen();
    }
    expect(thumbnails()).toHaveLength(0);
    expect(button('Cancelar')).toBeEnabled();
    expect(button('Crear')).toBeDisabled();
  });

  test('picking several photos shows them in order, and the button reads "Añadir fotos"', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await addPhotos(3);

    expect(thumbnailLabels()).toEqual(['Foto 1 de 3', 'Foto 2 de 3', 'Foto 3 de 3']);
    expect(button('Añadir fotos')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Elegir fotos' })).toBeNull();
    expect(launch).toHaveBeenCalledWith(
      expect.objectContaining({ mediaTypes: 'images', allowsMultipleSelection: true, selectionLimit: EVENT_MAX_PHOTOS }),
    );
  });

  test('adding more puts them at the end, and the picker is limited to what still fits', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await addPhotos(2, 'first');
    await addPhotos(1, 'second');

    expect(launch).toHaveBeenLastCalledWith(expect.objectContaining({ selectionLimit: EVENT_MAX_PHOTOS - 2 }));
    expect(thumbnailFiles()).toEqual(['first-1.png', 'first-2.png', 'second-1.png']);
  });

  test('a cancelled pick changes nothing', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await addPhotos(2);
    await fireEvent.changeText(titleField(), 'Viaje');

    launch.mockResolvedValueOnce(cancelledPick);
    await fireEvent.press(button('Añadir fotos'));
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(2));

    expect(thumbnails()).toHaveLength(2);
    expect(titleField()).toHaveProp('value', 'Viaje');
  });

  test('eight photos plus four keeps ten, shows and announces the limit, and disables the button', async () => {
    const platform = Platform.OS;
    Platform.OS = 'ios';
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    try {
      await render(<CreationBoxHarness />);
      await goToEventStep();
      await addPhotos(8, 'first');
      expect(screen.queryByText(PHOTO_LIMIT_MESSAGE)).toBeNull();

      // A picker that ignores selectionLimit returns four.
      await addPhotos(4, 'second');

      expect(thumbnails()).toHaveLength(EVENT_MAX_PHOTOS);
      expect(thumbnailLabels().at(-1)).toBe('Foto 10 de 10');
      const message = screen.getByText(PHOTO_LIMIT_MESSAGE);
      expect(PHOTO_LIMIT_MESSAGE).toBe('Un evento puede tener hasta 10 fotos.');
      expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
      expect(announce).toHaveBeenCalledWith(PHOTO_LIMIT_MESSAGE);
      expect(button('Añadir fotos')).toBeDisabled();

      await fireEvent.press(button('Quitar foto 3'));
      expect(button('Añadir fotos')).toBeEnabled();
      expect(screen.queryByText(PHOTO_LIMIT_MESSAGE)).toBeNull();
    } finally {
      Platform.OS = platform;
    }
  });

  test('removing the middle photo keeps the others in order', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await addPhotos(3);

    await fireEvent.press(button('Quitar foto 2'));

    expect(thumbnailLabels()).toEqual(['Foto 1 de 2', 'Foto 2 de 2']);
    expect(thumbnailFiles()).toEqual(['picked-1.png', 'picked-3.png']);
  });

  test('removing the only photo brings back "Elegir fotos" and disables Crear', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await fillRequired();
    expect(button('Crear')).toBeEnabled();

    await fireEvent.press(button('Quitar foto 1'));

    expect(thumbnails()).toHaveLength(0);
    expect(button('Elegir fotos')).toBeOnTheScreen();
    expect(button('Crear')).toBeDisabled();
  });

  test('a picker error shows the message, keeps the step and a retry opens the picker', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await fireEvent.changeText(titleField(), 'Viaje');
    launch.mockRejectedValueOnce(new Error('no gallery'));
    await fireEvent.press(button('Elegir fotos'));

    const message = await screen.findByText(PICKER_ERROR_MESSAGE);
    expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(titleField()).toHaveProp('value', 'Viaje');

    await addPhotos(1);
    expect(screen.queryByText(PICKER_ERROR_MESSAGE)).toBeNull();
    expect(launch).toHaveBeenCalledTimes(2);
  });

  test.each([
    ['no category', 'Viaje', ''],
    ['a whitespace title', '   ', 'Familia'],
  ])('Crear is disabled with %s', async (_name, title, category) => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await fillRequired(title, category);
    expect(button('Crear')).toBeDisabled();
    await fireEvent.press(button('Crear'));
    expect(storedBodies()).toEqual([]);
  });

  test('Crear is disabled with a title and a category but no photo', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await fireEvent.changeText(titleField(), 'Viaje');
    await fireEvent.press(button('Familia'));
    expect(button('Crear')).toBeDisabled();
  });

  test('Crear is enabled with everything required and no description', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await fillRequired();
    expect(descriptionField()).toHaveProp('value', '');
    expect(button('Crear')).toBeEnabled();
  });

  test('a suggestion replaces the category', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await fireEvent.changeText(categoryField(), 'Amig');
    await fireEvent.press(button('Familia'));
    expect(categoryField()).toHaveProp('value', 'Familia');
  });

  test('Crear saves the trimmed event with its photos in order and closes the box', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const adapters = createAppAdapters();
    await render(<CreationBoxHarness adapters={adapters} />);
    await goToEventStep();
    await addPhotos(2);
    await fireEvent.changeText(titleField(), '  Tarde de juegos y café  ');
    await fireEvent.press(button('Encuentro'));
    await fireEvent.changeText(descriptionField(), '  En el salón  ');
    await fireEvent.press(button('Crear'));

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(storedBodies()).toEqual(['Tarde de juegos y café']);
    expect(dismiss).toHaveBeenCalled();
    const rows = await adapters.db.getAll<{ title: string; category: string; description: string }>(
      'SELECT title, category, description FROM event_items',
    );
    expect(rows).toEqual([{ title: 'Tarde de juegos y café', category: 'Encuentro', description: 'En el salón' }]);
    const photos = await adapters.db.getAll<{ photo_width: number }>(
      'SELECT photo_width FROM event_item_photos ORDER BY position',
    );
    expect(photos.map((row) => row.photo_width)).toEqual([400, 401]);
  });

  test('a double tap creates one event', async () => {
    const adapters = createAppAdapters();
    const db = new GatedSqlDatabase(adapters.db);
    await render(<CreationBoxHarness adapters={{ ...adapters, db }} />);
    await goToEventStep();
    await fillRequired();
    const before = db.transactions;

    const release = db.hold();
    await fireEvent.press(button('Crear'));
    expect(button('Crear')).toBeDisabled();
    await fireEvent.press(button('Crear'));
    release();

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(db.transactions - before).toBe(1);
    expect(storedBodies()).toEqual(['Viaje']);
  });

  test('a failing save keeps the draft, shows the message and allows a retry', async () => {
    const adapters = createAppAdapters();
    let fail = true;
    const db = new FailingSqlDatabase(adapters.db, (sql) => fail && sql.includes('INSERT INTO event_items'));
    await render(<CreationBoxHarness adapters={{ ...adapters, db }} />);
    await goToEventStep();
    await addPhotos(2);
    await fireEvent.changeText(titleField(), 'Viaje');
    await fireEvent.changeText(categoryField(), 'Familia');
    await fireEvent.changeText(descriptionField(), 'Genial');
    await fireEvent.press(button('Crear'));

    const message = await screen.findByText(SAVE_ERROR_MESSAGE);
    expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(thumbnails()).toHaveLength(2);
    expect(titleField()).toHaveProp('value', 'Viaje');
    expect(categoryField()).toHaveProp('value', 'Familia');
    expect(descriptionField()).toHaveProp('value', 'Genial');
    expect(storedBodies()).toEqual([]);
    expect(button('Crear')).toBeEnabled();

    fail = false;
    await fireEvent.press(button('Crear'));
    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(storedBodies()).toEqual(['Viaje']);
  });

  test('Cancelar discards the draft and copies nothing, and reopening starts at the choose step', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const adapters = createAppAdapters();
    const importPhoto = jest.spyOn(adapters.photos, 'importPhoto');
    await render(<CreationBoxHarness adapters={adapters} />);
    await goToEventStep();
    await addPhotos(3);
    await fireEvent.changeText(titleField(), 'Borrador');
    await fireEvent.press(button('Cancelar'));

    expect(screen.queryByTestId('creation-box')).toBeNull();
    expect(dismiss).toHaveBeenCalled();
    expect(importPhoto).not.toHaveBeenCalled();
    await open();
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
  });

  test('the fields are limited and styled like the caption field', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    expect(titleField()).toHaveProp('maxLength', EVENT_TITLE_MAX_LENGTH);
    expect(categoryField()).toHaveProp('maxLength', EVENT_CATEGORY_MAX_LENGTH);
    expect(descriptionField()).toHaveProp('maxLength', EVENT_DESCRIPTION_MAX_LENGTH);
    expect(descriptionField()).toHaveProp('multiline', true);
    for (const field of [titleField(), categoryField()]) {
      expect(field).toHaveStyle({
        minHeight: Sizes.phone.controlHeight,
        borderColor: Colors.light.primaryDark,
        backgroundColor: Colors.light.cardBg,
        fontSize: Sizes.phone.inputFont,
      });
    }
    for (const label of ['Título', 'Categoría', 'Descripción']) {
      expect(screen.getByText(label)).toHaveStyle({ fontSize: Sizes.phone.fieldLabel, color: Colors.light.textMain });
    }
  });

  test('the screen reader moves through the step in order', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await addPhotos(1);

    const order = readingOrder(screen.getByTestId('creation-box'));
    expect(order).toEqual([
      'image Foto 1 de 1',
      'button Quitar foto 1',
      'button Añadir fotos',
      'text field Título',
      'text field Categoría',
      'button Familia',
      'button Amigos',
      'button Trabajo',
      'button Encuentro',
      'text field Descripción',
      'button Cancelar',
      'button Crear',
    ]);
  });

  test('the controls are at least 44 points tall', async () => {
    await render(<CreationBoxHarness />);
    await goToEventStep();
    await addPhotos(1);
    for (const name of ['Elegir fotos', 'Añadir fotos', 'Familia', 'Cancelar', 'Crear']) {
      const control = screen.queryByRole('button', { name });
      if (control) expect(control).toHaveStyle({ minHeight: Layout.touchTarget });
    }
    expect(button('Quitar foto 1')).toHaveStyle({ width: Layout.touchTarget, height: Layout.touchTarget });
  });

  test('uses the tablet sizes on a tablet', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await render(<CreationBoxHarness />);
    await goToEventStep();
    expect(titleField()).toHaveStyle({ minHeight: Sizes.tablet.controlHeight, fontSize: Sizes.tablet.inputFont });
    expect(button('Familia')).toHaveStyle({ minHeight: Sizes.tablet.controlHeight });
    expect(screen.getByText('Categoría')).toHaveStyle({ fontSize: Sizes.tablet.fieldLabel });
  });
});
