import { launchImageLibraryAsync } from 'expo-image-picker';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import * as appAdapters from '@/items/infrastructure/app-adapters';
import type { NodePhotoStore } from '@/test-utils/node-photo-store';
import { pickedResult } from '@/test-utils/picker-assets';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';
import { journey } from '@/test-utils/timeline-journey';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const { button } = journey;
const dialog = () => screen.getByTestId('edit-event-dialog');
const dialogClosed = () => waitFor(() => expect(screen.queryByTestId('edit-event-dialog')).toBeNull());
const thumbnails = () => screen.queryAllByTestId('event-thumbnail');
const tileFiles = () =>
  screen
    .queryAllByTestId('event-photo-tile-image')
    .map((node) => (node.props.source as { uri: string }[])[0].uri.split('/').pop());
const thumbnailFiles = () =>
  screen
    .queryAllByTestId('event-thumbnail-image')
    .map((node) => (node.props.source as { uri: string }[])[0].uri.split('/').pop());

async function storedFiles(adapters: appAdapters.AppAdapters) {
  const rows = await adapters.db.getAll<{ photo_file: string }>(
    'SELECT photo_file FROM event_item_photos ORDER BY position',
  );
  return rows.map((row) => row.photo_file);
}

/** An app with one event ("Viaje", three photos) above one text. */
async function appWithEvent() {
  const adapters = appAdapters.createAppAdapters();
  jest.spyOn(appAdapters, 'createAppAdapters').mockReturnValue(adapters);
  await renderRouter('./src/app');
  await journey.createText('Texto');
  await journey.startEvent();
  launch.mockResolvedValueOnce(pickedResult(3));
  await fireEvent.press(button('Elegir fotos'));
  await waitFor(() => expect(thumbnails()).toHaveLength(3));
  await fireEvent.changeText(screen.getByLabelText('Título'), 'Viaje');
  await fireEvent.press(button('Familia'));
  await fireEvent.press(button('Crear'));
  await screen.findByRole('button', { name: 'Create' });
  return { adapters, files: await storedFiles(adapters) };
}

const openEdit = () => fireEvent.press(screen.getAllByRole('button', { name: 'Editar' })[0]);

beforeEach(() => launch.mockReset());

describe('editing and deleting an event item', () => {
  test('removing a photo, adding one and changing the category updates the card in place and archives the old list', async () => {
    const { adapters, files } = await appWithEvent();
    const [a, b, c] = files;

    await openEdit();
    await fireEvent.press(button('Quitar foto 2'));
    launch.mockResolvedValueOnce(pickedResult(1, 'added'));
    await fireEvent.press(button('Añadir fotos'));
    await waitFor(() => expect(thumbnails()).toHaveLength(3));
    expect(tileFiles()).toEqual([a, b, c]); // the card waits for Guardar
    await fireEvent.press(button('Amigos'));
    await fireEvent.press(button('Guardar'));
    await dialogClosed();

    expect(journey.cardKinds()).toEqual(['event-item-card', 'text-item-card']);
    const now = await storedFiles(adapters);
    expect(now.slice(0, 2)).toEqual([a, c]);
    expect(tileFiles()).toEqual(now);
    expect(screen.getByText('Amigos', { exact: true })).toBeOnTheScreen();
    const history = await adapters.db.getAll<{ photo_file: string }>(
      'SELECT photo_file FROM event_item_photos_history ORDER BY counter, position',
    );
    expect(history.map((row) => row.photo_file)).toEqual([a, b, c]);
    expect(await adapters.db.getAll('SELECT category FROM event_items_history')).toEqual([
      { category: 'Familia' },
    ]);
  });

  test('deleting the event removes the card and keeps every photo file', async () => {
    const { adapters, files } = await appWithEvent();
    await openEdit();
    await fireEvent.press(button('Quitar foto 1'));
    await fireEvent.press(button('Borrar este evento'));
    expect(screen.getByText('¿Borrar este evento?')).toBeOnTheScreen();
    await fireEvent.press(button('Sí, borrar'));
    await dialogClosed();

    expect(journey.cardKinds()).toEqual(['text-item-card']);
    expect(files.every((file) => (adapters.photos as NodePhotoStore).has(file))).toBe(true);
  });

  test('rotating with the event dialog open keeps its photos, order and fields, and the tiles resize', async () => {
    const { files } = await appWithEvent();
    const tileWidth = () => screen.getAllByTestId('event-photo-tile')[0].props.style;
    const portraitTile = tileWidth();
    await openEdit();
    await fireEvent.press(button('Quitar foto 1'));
    launch.mockResolvedValueOnce(pickedResult(1, 'rot'));
    await fireEvent.press(button('Añadir fotos'));
    await waitFor(() => expect(thumbnails()).toHaveLength(3));
    await fireEvent.changeText(screen.getByLabelText('Título'), 'Girado');

    await act(async () => setMockWindow(TEST_WINDOWS.phoneLandscape));

    expect(dialog()).toBeOnTheScreen();
    expect(thumbnailFiles()).toEqual([files[1], files[2], 'rot-1.png']);
    expect(screen.getByLabelText('Título')).toHaveProp('value', 'Girado');
    expect(tileWidth()).not.toEqual(portraitTile);

    await act(async () => setMockWindow(TEST_WINDOWS.phonePortrait));
    expect(thumbnailFiles()).toEqual([files[1], files[2], 'rot-1.png']);
  });
});
