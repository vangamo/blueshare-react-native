import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { Keyboard } from 'react-native';

import { EDIT_SAVE_ERROR_MESSAGE } from '@/components/edit-dialog-frame';
import { PHOTO_LIMIT_MESSAGE } from '@/components/event-fields';
import { PICKER_ERROR_MESSAGE } from '@/components/image-fields';
import { EVENT_MAX_PHOTOS } from '@/constants/limits';
import { Sizes } from '@/constants/theme';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';
import { readingOrder } from '@/test-utils/accessibility-order';
import {
  EditEventDialogHarness,
  SEEDED_EVENT,
  seededEventAdapters,
} from '@/test-utils/edit-event-dialog-harness';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import type { NodePhotoStore } from '@/test-utils/node-photo-store';
import { cancelledPick, pickedResult } from '@/test-utils/picker-assets';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const button = (name: string) => screen.getByRole('button', { name });
const titleField = () => screen.getByLabelText('Título');
const categoryField = () => screen.getByLabelText('Categoría');
const descriptionField = () => screen.getByLabelText('Descripción');
const thumbnails = () => screen.queryAllByTestId('event-thumbnail');
const thumbnailFiles = () =>
  screen
    .queryAllByTestId('event-thumbnail-image')
    .map((node) => (node.props.source as { uri: string }[])[0].uri.split('/').pop());
const stored = () => screen.queryAllByTestId('stored-event').map((node) => node.props.children);
const STORED = `${SEEDED_EVENT.files.join(',')}|${SEEDED_EVENT.title}|${SEEDED_EVENT.category}|${SEEDED_EVENT.description}`;

beforeEach(() => launch.mockReset());

async function openDialog(adapters?: AppAdapters, onClosed = jest.fn()) {
  const used = adapters ?? (await seededEventAdapters());
  await render(<EditEventDialogHarness adapters={used} onClosed={onClosed} />);
  await waitFor(() => expect(stored()).toHaveLength(1));
  await fireEvent.press(button('Abrir evento'));
  return { onClosed, adapters: used };
}

async function addPhotos(count: number, prefix = 'new') {
  const before = thumbnails().length;
  launch.mockResolvedValueOnce(pickedResult(count, prefix));
  await fireEvent.press(button('Añadir fotos'));
  await waitFor(() => expect(thumbnails()).toHaveLength(Math.min(before + count, EVENT_MAX_PHOTOS)));
}

describe('EditEventDialog, edit step', () => {
  test('starts from the stored photos in order and the stored fields, with the keyboard closed', async () => {
    await openDialog();
    expect(screen.getByText('Editar elemento de evento:')).toBeOnTheScreen();
    expect(screen.getByTestId('edit-event-dialog')).toBeOnTheScreen();
    expect(thumbnailFiles()).toEqual(SEEDED_EVENT.files);
    expect(thumbnails().map((node) => node.props.accessibilityLabel)).toEqual([
      'Foto 1 de 3',
      'Foto 2 de 3',
      'Foto 3 de 3',
    ]);
    expect(button('Añadir fotos')).toBeEnabled();
    expect(titleField()).toHaveProp('value', SEEDED_EVENT.title);
    expect(categoryField()).toHaveProp('value', SEEDED_EVENT.category);
    expect(descriptionField()).toHaveProp('value', SEEDED_EVENT.description);
    for (const field of [titleField(), categoryField(), descriptionField()]) {
      expect(field).not.toHaveProp('autoFocus', true);
    }
  });

  test('an event with no description starts with an empty field', async () => {
    await openDialog(await seededEventAdapters({ description: null }));
    expect(descriptionField()).toHaveProp('value', '');
  });

  test('Guardar is disabled when unchanged or only whitespace was added', async () => {
    await openDialog();
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.changeText(titleField(), `${SEEDED_EVENT.title}   `);
    await fireEvent.changeText(descriptionField(), ` ${SEEDED_EVENT.description}`);
    expect(button('Guardar')).toBeDisabled();
  });

  test('Guardar is enabled after removing a photo or clearing the description', async () => {
    await openDialog();
    await fireEvent.press(button('Quitar foto 2'));
    expect(button('Guardar')).toBeEnabled();

    await fireEvent.press(button('Cancelar'));
    await fireEvent.press(button('Abrir evento'));
    await fireEvent.changeText(descriptionField(), '');
    expect(button('Guardar')).toBeEnabled();
  });

  test('Guardar is disabled with the title cleared or every photo removed', async () => {
    await openDialog();
    await fireEvent.changeText(titleField(), '');
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.changeText(titleField(), 'Otro');
    expect(button('Guardar')).toBeEnabled();

    for (let left = SEEDED_EVENT.files.length; left > 0; left--) await fireEvent.press(button('Quitar foto 1'));
    expect(thumbnails()).toHaveLength(0);
    expect(button('Elegir fotos')).toBeOnTheScreen();
    expect(button('Guardar')).toBeDisabled();
  });

  test('removing B and adding D shows A, C, D, and the stored item is unchanged until Guardar', async () => {
    await openDialog();
    await fireEvent.press(button('Quitar foto 2'));
    await addPhotos(1);

    expect(thumbnailFiles()).toEqual([SEEDED_EVENT.files[0], SEEDED_EVENT.files[2], 'new-1.png']);
    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ selectionLimit: EVENT_MAX_PHOTOS - 2 }));
    expect(stored()).toEqual([STORED]);
  });

  test('adding photos stops at the limit with the message', async () => {
    await openDialog();
    await addPhotos(9);
    expect(thumbnails()).toHaveLength(EVENT_MAX_PHOTOS);
    expect(screen.getByText(PHOTO_LIMIT_MESSAGE)).toBeOnTheScreen();
    expect(button('Añadir fotos')).toBeDisabled();
  });

  test('a cancelled pick changes nothing', async () => {
    await openDialog();
    launch.mockResolvedValueOnce(cancelledPick);
    await fireEvent.press(button('Añadir fotos'));
    await waitFor(() => expect(launch).toHaveBeenCalledTimes(1));
    expect(thumbnailFiles()).toEqual(SEEDED_EVENT.files);
    expect(button('Guardar')).toBeDisabled();
  });

  test('a picker error shows the message and keeps the dialog as it was', async () => {
    await openDialog();
    launch.mockRejectedValueOnce(new Error('no gallery'));
    await fireEvent.press(button('Añadir fotos'));
    expect(await screen.findByText(PICKER_ERROR_MESSAGE)).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(thumbnailFiles()).toEqual(SEEDED_EVENT.files);
  });

  test('Guardar saves the photos in order and the trimmed fields, and the stored item changes', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    const { onClosed, adapters } = await openDialog();
    await fireEvent.press(button('Quitar foto 1'));
    await addPhotos(1);
    await fireEvent.changeText(titleField(), '  Viaje a Cádiz y Jerez  ');
    await fireEvent.press(button('Amigos'));

    await fireEvent.press(button('Guardar'));

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()).toEqual([`id-3.png,id-4.png,id-5.png|Viaje a Cádiz y Jerez|Amigos|${SEEDED_EVENT.description}`]);
    const photos = adapters.photos as NodePhotoStore;
    expect(photos.has('id-5.png')).toBe(true);
    expect(photos.has('id-2.png')).toBe(true);
    expect(dismiss).toHaveBeenCalled();
  });

  test('a double tap saves once', async () => {
    const seeded = await seededEventAdapters();
    const db = new GatedSqlDatabase(seeded.db);
    await openDialog({ ...seeded, db });
    await fireEvent.changeText(categoryField(), 'Trabajo');
    const before = db.transactions;

    const release = db.hold();
    await fireEvent.press(button('Guardar'));
    expect(button('Guardar')).toBeDisabled();
    await fireEvent.press(button('Guardar'));
    release();

    await waitFor(() => expect(screen.queryByTestId('edit-event-dialog')).toBeNull());
    expect(db.transactions - before).toBe(1);
  });

  test('a failed save keeps the edit and shows the message, and a retry works', async () => {
    let fail = true;
    const adapters = await seededEventAdapters({
      wrap: (db) => new FailingSqlDatabase(db, (sql) => fail && sql.includes('UPDATE event_items')),
    });
    const { onClosed } = await openDialog(adapters);
    await fireEvent.press(button('Quitar foto 3'));
    await fireEvent.changeText(categoryField(), 'Trabajo');

    await fireEvent.press(button('Guardar'));

    expect(await screen.findByText(EDIT_SAVE_ERROR_MESSAGE)).toBeOnTheScreen();
    expect(thumbnailFiles()).toEqual(SEEDED_EVENT.files.slice(0, 2));
    expect(categoryField()).toHaveProp('value', 'Trabajo');
    expect(stored()).toEqual([STORED]);
    expect(button('Guardar')).toBeEnabled();

    fail = false;
    await fireEvent.press(button('Guardar'));
    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()[0]).toContain('|Trabajo|');
  });

  test.each(['Cancelar', 'Cerrar'])('%s after photo changes keeps the stored photos', async (name) => {
    const { onClosed } = await openDialog();
    await fireEvent.press(button('Quitar foto 1'));
    await addPhotos(2);

    await fireEvent.press(button(name));

    expect(onClosed).toHaveBeenCalledTimes(1);
    expect(stored()).toEqual([STORED]);
    await fireEvent.press(button('Abrir evento'));
    expect(thumbnailFiles()).toEqual(SEEDED_EVENT.files);
  });

  test('the screen reader names every control in order', async () => {
    await openDialog(await seededEventAdapters());
    await fireEvent.press(button('Quitar foto 3'));
    const order = readingOrder(screen.getByTestId('edit-event-dialog'));
    expect(order).toEqual([
      'header Editar elemento de evento:',
      'button Cerrar',
      'image Foto 1 de 2',
      'button Quitar foto 1',
      'image Foto 2 de 2',
      'button Quitar foto 2',
      'button Añadir fotos',
      'text field Título',
      'text field Categoría',
      'button Familia',
      'button Amigos',
      'button Trabajo',
      'button Encuentro',
      'text field Descripción',
      'button Cancelar',
      'button Guardar',
      'button Borrar este evento',
    ]);
  });

  test('the scroll area shrinks above the keyboard, so Guardar and Borrar este evento stay reachable', async () => {
    // Captures the keyboard listeners so the test can show and hide the keyboard.
    const handlers: Record<string, (event: unknown) => void> = {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, handler: (e: unknown) => void) => {
      handlers[event] = handler;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
    const window = TEST_WINDOWS.phonePortrait;
    const keyboardHeight = window.height / 2;
    const keyboard = {
      duration: 0,
      easing: 'keyboard',
      endCoordinates: { screenX: 0, screenY: window.height - keyboardHeight, width: window.width, height: keyboardHeight },
    };
    const fire = (names: string[], event: unknown) =>
      act(() => {
        for (const name of names) handlers[name]?.(event);
      });

    await openDialog();
    const area = screen.getByTestId('edit-dialog-keyboard-area');
    expect(area).toContainElement(button('Guardar'));
    expect(area).toContainElement(button('Borrar este evento'));
    await fireEvent(area, 'layout', { persist: jest.fn(), nativeEvent: { layout: { x: 0, y: 0, ...window } } });

    await fire(['keyboardDidShow', 'keyboardWillShow'], keyboard);
    await waitFor(() => expect(area).toHaveStyle({ paddingBottom: keyboardHeight }));

    await fire(['keyboardDidHide', 'keyboardWillHide'], null);
    await waitFor(() => expect(area).toHaveStyle({ paddingBottom: 0 }));
  });
});

describe('EditEventDialog, confirm step', () => {
  test('Borrar este evento asks first, deleting nothing', async () => {
    await openDialog();
    await fireEvent.press(button('Borrar este evento'));

    expect(screen.getByText('¿Borrar este evento?')).toBeOnTheScreen();
    expect(screen.getByText('Desaparecerá de tu línea de tiempo.')).toBeOnTheScreen();
    expect(button('No, volver')).toBeOnTheScreen();
    expect(button('Sí, borrar')).toBeOnTheScreen();
    expect(stored()).toEqual([STORED]);
  });

  test('No, volver keeps the photo changes and the edits', async () => {
    await openDialog();
    await fireEvent.press(button('Quitar foto 2'));
    await fireEvent.changeText(titleField(), 'Editado');

    await fireEvent.press(button('Borrar este evento'));
    await fireEvent.press(button('No, volver'));

    expect(thumbnailFiles()).toEqual([SEEDED_EVENT.files[0], SEEDED_EVENT.files[2]]);
    expect(titleField()).toHaveProp('value', 'Editado');
    expect(stored()).toEqual([STORED]);
  });

  test('Sí, borrar removes the item and keeps its photo files', async () => {
    const { onClosed, adapters } = await openDialog();
    await fireEvent.press(button('Borrar este evento'));
    await fireEvent.press(button('Sí, borrar'));

    await waitFor(() => expect(onClosed).toHaveBeenCalledTimes(1));
    expect(stored()).toEqual([]);
    const photos = adapters.photos as NodePhotoStore;
    expect(SEEDED_EVENT.files.every((file) => photos.has(file))).toBe(true);
  });
});

describe('EditEventDialog, tablet layout', () => {
  test('uses the tablet sizes and four thumbnails per row', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await openDialog();
    expect(titleField()).toHaveStyle({ minHeight: Sizes.tablet.controlHeight });
    expect(button('Familia')).toHaveStyle({ minHeight: Sizes.tablet.controlHeight });
    expect(button('Quitar foto 1')).toHaveStyle({ width: Sizes.tablet.controlHeight });
    expect(Sizes.tablet.thumbColumns).toBe(4);
  });
});
