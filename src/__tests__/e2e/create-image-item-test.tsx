import { launchImageLibraryAsync } from 'expo-image-picker';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import type { NodePhotoStore } from '@/test-utils/node-photo-store';
import { writeFixturePhoto } from '@/test-utils/node-photo-store';
import * as appAdapters from '@/items/infrastructure/app-adapters';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';
import { journey } from '@/test-utils/timeline-journey';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
const launch = jest.mocked(launchImageLibraryAsync);

const { button } = journey;
const caption = () => screen.getByLabelText('Pie de foto');

function pickReturns(uri = writeFixturePhoto(), width = 4000, height = 3000) {
  launch.mockResolvedValueOnce({
    canceled: false,
    assets: [{ uri, width, height, mimeType: 'image/png' }],
  } as never);
}

/** Captures the adapters the next app render uses, so a test can look inside them. */
function captureAdapters() {
  const adapters = appAdapters.createAppAdapters();
  jest.spyOn(appAdapters, 'createAppAdapters').mockReturnValue(adapters);
  return adapters;
}

beforeEach(() => launch.mockReset());

describe('creating an image item', () => {
  test('a text and then an image: the image card is first, and the photo file exists', async () => {
    const adapters = captureAdapters();
    await renderRouter('./src/app');
    await journey.createText('Primero');

    await journey.startImage();
    pickReturns();
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('photo-preview');
    await fireEvent.changeText(caption(), '  Taller de pintura  ');
    await fireEvent.press(button('Crear'));
    await screen.findByRole('button', { name: 'Create' });

    expect(journey.cardKinds()).toEqual(['image-item-card', 'text-item-card']);
    expect(journey.imageCaptions()).toEqual(['Taller de pintura']);
    const row = await adapters.db.getFirst<{ photo_file: string }>('SELECT photo_file FROM image_items');
    expect((adapters.photos as NodePhotoStore).has(row!.photo_file)).toBe(true);
    expect(row!.photo_file).toMatch(/\.png$/);
  });

  test('an image draft survives a trip to Circles and back', async () => {
    await renderRouter('./src/app');
    await journey.startImage();
    pickReturns();
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('photo-preview');
    await fireEvent.changeText(caption(), 'En el parque');
    await fireEvent.changeText(screen.getByLabelText('Texto alternativo'), 'Un parque');

    await fireEvent.press(screen.getByRole('tab', { name: 'Circles' }));
    await fireEvent.press(screen.getByRole('tab', { name: 'Timeline' }));

    expect(screen.getByText('Crear nuevo elemento de imagen:')).toBeOnTheScreen();
    expect(screen.getByTestId('photo-preview')).toBeOnTheScreen();
    expect(button('Cambiar foto')).toBeOnTheScreen();
    expect(caption()).toHaveProp('value', 'En el parque');
    expect(screen.getByLabelText('Texto alternativo')).toHaveProp('value', 'Un parque');
    expect(button('Crear')).toBeEnabled();
  });

  test('rotating with an image draft keeps its content', async () => {
    await renderRouter('./src/app');
    await journey.startImage();
    pickReturns();
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('photo-preview');
    await fireEvent.changeText(caption(), 'Girado');
    const field = caption();

    await act(async () => setMockWindow(TEST_WINDOWS.phoneLandscape));

    expect(caption()).toBe(field);
    expect(caption()).toHaveProp('value', 'Girado');
    expect(screen.getByTestId('photo-preview')).toBeOnTheScreen();

    await act(async () => setMockWindow(TEST_WINDOWS.phonePortrait));
    expect(caption()).toHaveProp('value', 'Girado');
  });

  test('Cancelar discards the draft and creates nothing', async () => {
    await renderRouter('./src/app');
    await journey.startImage();
    pickReturns();
    await fireEvent.press(button('Elegir foto'));
    await screen.findByTestId('photo-preview');
    await fireEvent.press(button('Cancelar'));

    await waitFor(() => expect(screen.queryByTestId('creation-box')).toBeNull());
    expect(journey.cardKinds()).toEqual([]);
  });
});
