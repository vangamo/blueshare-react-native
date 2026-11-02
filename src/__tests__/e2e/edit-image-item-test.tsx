import { launchImageLibraryAsync } from 'expo-image-picker';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import * as appAdapters from '@/items/infrastructure/app-adapters';
import type { NodePhotoStore } from '@/test-utils/node-photo-store';
import { writeFixturePhoto } from '@/test-utils/node-photo-store';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';
import { journey } from '@/test-utils/timeline-journey';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const { button } = journey;
const caption = () => screen.getByLabelText('Pie de foto');
const dialogClosed = () => waitFor(() => expect(screen.queryByTestId('edit-image-dialog')).toBeNull());

function pickReturns(uri = writeFixturePhoto('other.png'), width = 100, height = 300) {
  launch.mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri, width, height, mimeType: 'image/png' }],
  } as never);
}

/** An app with one text and one image ("Original") on top, photo file kept in `adapters`. */
async function appWithImage() {
  const adapters = appAdapters.createAppAdapters();
  jest.spyOn(appAdapters, 'createAppAdapters').mockReturnValue(adapters);
  await renderRouter('./src/app');
  await journey.createText('Texto');
  await journey.startImage();
  pickReturns(writeFixturePhoto(), 4000, 3000);
  await fireEvent.press(button('Elegir foto'));
  await screen.findByTestId('photo-preview');
  await fireEvent.changeText(caption(), 'Original');
  await fireEvent.press(button('Crear'));
  await screen.findByRole('button', { name: 'Create' });
  return adapters;
}

const openEdit = () => fireEvent.press(screen.getAllByRole('button', { name: 'Editar' })[0]);

beforeEach(() => launch.mockReset());

describe('editing and deleting an image item', () => {
  test('editing the caption and the photo changes the card in place and archives the old version', async () => {
    const adapters = await appWithImage();
    const before = await adapters.db.getFirst<{ photo_file: string }>('SELECT photo_file FROM image_items');

    await openEdit();
    pickReturns();
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());
    await fireEvent.changeText(caption(), 'Editado');
    await fireEvent.press(button('Guardar'));
    await dialogClosed();

    expect(journey.cardKinds()).toEqual(['image-item-card', 'text-item-card']);
    expect(journey.imageCaptions()).toEqual(['Editado']);
    const history = await adapters.db.getAll<{ photo_file: string; caption: string }>(
      'SELECT photo_file, caption FROM image_items_history',
    );
    expect(history).toEqual([{ photo_file: before!.photo_file, caption: 'Original' }]);
    const after = await adapters.db.getFirst<{ photo_file: string }>('SELECT photo_file FROM image_items');
    expect(after!.photo_file).not.toBe(before!.photo_file);
    expect((adapters.photos as NodePhotoStore).has(before!.photo_file)).toBe(true);
  });

  test('Cancelar after picking a photo leaves the card unchanged', async () => {
    await appWithImage();
    await openEdit();
    pickReturns();
    await fireEvent.press(button('Cambiar foto'));
    await waitFor(() => expect(button('Guardar')).toBeEnabled());
    await fireEvent.press(button('Cancelar'));
    await dialogClosed();

    expect(journey.imageCaptions()).toEqual(['Original']);
  });

  test('deleting the image removes the card and keeps its photo files', async () => {
    const adapters = await appWithImage();
    const row = await adapters.db.getFirst<{ photo_file: string }>('SELECT photo_file FROM image_items');

    await openEdit();
    await fireEvent.press(button('Borrar esta imagen'));
    expect(screen.getByText('¿Borrar esta imagen?')).toBeOnTheScreen();
    await fireEvent.press(button('Sí, borrar'));
    await dialogClosed();

    expect(journey.cardKinds()).toEqual(['text-item-card']);
    expect((adapters.photos as NodePhotoStore).has(row!.photo_file)).toBe(true);
    expect(await adapters.db.getAll('SELECT item_id FROM image_items')).toEqual([]);
    const history = await adapters.db.getAll<{ deleted_at: number | null }>(
      'SELECT deleted_at FROM items_history WHERE type = ?',
      ['image'],
    );
    expect(history).toHaveLength(1);
    expect(history[0].deleted_at).not.toBeNull();
  });

  test('rotating with the image dialog open keeps its content', async () => {
    await appWithImage();
    await openEdit();
    await fireEvent.changeText(caption(), 'Girando');
    const field = caption();

    await act(async () => setMockWindow(TEST_WINDOWS.phoneLandscape));

    expect(caption()).toBe(field);
    expect(caption()).toHaveProp('value', 'Girando');
    expect(screen.getByText('Editar elemento de imagen:')).toBeOnTheScreen();
    expect(button('Guardar')).toBeEnabled();
  });
});
