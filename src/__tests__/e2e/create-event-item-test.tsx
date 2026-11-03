import { launchImageLibraryAsync } from 'expo-image-picker';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import * as appAdapters from '@/items/infrastructure/app-adapters';
import { spyOnBackHandler } from '@/test-utils/back-handler';
import type { NodePhotoStore } from '@/test-utils/node-photo-store';
import { pickedResult } from '@/test-utils/picker-assets';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';
import { journey } from '@/test-utils/timeline-journey';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const { button } = journey;
const titleField = () => screen.getByLabelText('Título');
const categoryField = () => screen.getByLabelText('Categoría');
const thumbnails = () => screen.queryAllByTestId('event-thumbnail');
const thumbnailFiles = () =>
  screen
    .queryAllByTestId('event-thumbnail-image')
    .map((node) => (node.props.source as { uri: string }[])[0].uri.split('/').pop());

/** Captures the adapters the next app render uses, so a test can look inside them. */
function captureAdapters() {
  const adapters = appAdapters.createAppAdapters();
  jest.spyOn(appAdapters, 'createAppAdapters').mockReturnValue(adapters);
  return adapters;
}

async function addPhotos(count: number, prefix?: string) {
  const before = thumbnails().length;
  launch.mockResolvedValueOnce(pickedResult(count, prefix));
  await fireEvent.press(screen.getByRole('button', { name: /fotos$/ }));
  await waitFor(() => expect(thumbnails()).toHaveLength(before + count));
}

beforeEach(() => launch.mockReset());

describe('creating an event item', () => {
  test('a text and then an event with three photos: the event card is first and its files exist', async () => {
    const adapters = captureAdapters();
    await renderRouter('./src/app');
    await journey.createText('Primero');
    await journey.startEvent();
    await addPhotos(3);
    await fireEvent.changeText(titleField(), '  Tarde de juegos y café  ');
    await fireEvent.press(button('Encuentro'));
    await fireEvent.press(button('Crear'));
    await screen.findByRole('button', { name: 'Create' });

    expect(journey.cardKinds()).toEqual(['event-item-card', 'text-item-card']);
    expect(journey.eventTitles()).toEqual(['Tarde de juegos y café']);
    expect(screen.getByText('Encuentro')).toBeOnTheScreen();
    expect(screen.getAllByTestId('event-photo-tile')).toHaveLength(3);
    const rows = await adapters.db.getAll<{ photo_file: string }>(
      'SELECT photo_file FROM event_item_photos ORDER BY position',
    );
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => (adapters.photos as NodePhotoStore).has(row.photo_file))).toBe(true);
  });

  test('an event draft survives a trip to Circles and back', async () => {
    await renderRouter('./src/app');
    await journey.startEvent();
    await addPhotos(2, 'trip');
    await fireEvent.changeText(titleField(), 'Viaje a Cádiz');
    await fireEvent.press(button('Familia'));

    await fireEvent.press(screen.getByRole('tab', { name: 'Circles' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Timeline' }));

    expect(screen.getByText('Crear nuevo elemento de evento:')).toBeOnTheScreen();
    expect(thumbnailFiles()).toEqual(['trip-1.png', 'trip-2.png']);
    expect(titleField()).toHaveProp('value', 'Viaje a Cádiz');
    expect(categoryField()).toHaveProp('value', 'Familia');
    expect(titleField()).not.toHaveProp('autoFocus', true);
  });

  test('rotating with an event draft keeps its photos, order and fields, and resizes the thumbnails', async () => {
    await renderRouter('./src/app');
    await journey.startEvent();
    await addPhotos(3, 'rot');
    await fireEvent.changeText(titleField(), 'Girado');
    await fireEvent.changeText(categoryField(), 'Amigos');
    const field = titleField();
    const width = () => Object.assign({}, ...[thumbnails()[0].parent!.props.style].flat()).width;
    const portrait = width();

    await act(async () => setMockWindow(TEST_WINDOWS.phoneLandscape));

    expect(titleField()).toBe(field);
    expect(thumbnailFiles()).toEqual(['rot-1.png', 'rot-2.png', 'rot-3.png']);
    expect(titleField()).toHaveProp('value', 'Girado');
    expect(categoryField()).toHaveProp('value', 'Amigos');
    expect(width()).not.toBe(portrait);

    await act(async () => setMockWindow(TEST_WINDOWS.phonePortrait));
    expect(thumbnailFiles()).toEqual(['rot-1.png', 'rot-2.png', 'rot-3.png']);
    expect(width()).toBe(portrait);
  });

  test.each(['Cancelar', 'Android back'])('%s discards the draft and copies nothing', async (how) => {
    const back = spyOnBackHandler();
    const adapters = captureAdapters();
    const importPhoto = jest.spyOn(adapters.photos, 'importPhoto');
    await renderRouter('./src/app');
    await journey.startEvent();
    await addPhotos(3);
    await fireEvent.changeText(titleField(), 'Borrador');

    if (how === 'Cancelar') await fireEvent.press(button('Cancelar'));
    else await act(async () => expect(back.press()).toBe(true));

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(journey.cardKinds()).toEqual([]);
    expect(importPhoto).not.toHaveBeenCalled();
    await journey.openBox();
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
  });
});
