import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PixelRatio } from 'react-native';

import {
  EventPhotoGrid,
  appendPhotos,
  pickedDrafts,
  storedDrafts,
  type EventPhotoDraft,
} from '@/components/event-photo-grid';
import { ItemsProvider } from '@/components/items-provider';
import { EVENT_MAX_PHOTOS } from '@/constants/limits';
import { Colors, Frames, Layout, Sizes } from '@/constants/theme';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

const picked = (name: string) => ({ uri: `file:///cache/${name}.jpg`, width: 400, height: 300, mimeType: 'image/jpeg' });

async function renderGrid(photos: EventPhotoDraft[], onRemove = jest.fn()) {
  const adapters = createAppAdapters();
  await render(
    <ItemsProvider adapters={adapters}>
      <EventPhotoGrid photos={photos} onRemove={onRemove} />
    </ItemsProvider>,
  );
  return { adapters, onRemove };
}

const thumbnails = () => screen.queryAllByTestId('event-thumbnail');
const sources = () =>
  screen.getAllByTestId('event-thumbnail-image').map((node) => (node.props.source as { uri: string }[])[0].uri);

describe('photo drafts', () => {
  test('picked drafts get unique keys, even for the same photo', () => {
    const [a, b] = pickedDrafts([picked('a'), picked('a')]);
    expect(a.key).not.toBe(b.key);
    expect(a).toMatchObject({ kind: 'picked', photo: picked('a') });
  });

  test('stored drafts are keyed by file name', () => {
    expect(storedDrafts([{ file: 'x.jpg', width: 1, height: 2 }])).toEqual([
      { key: 'x.jpg', kind: 'stored', photo: { file: 'x.jpg', width: 1, height: 2 } },
    ]);
  });

  test('appendPhotos adds at the end and keeps the first photos up to the limit', () => {
    const eight = pickedDrafts(Array.from({ length: 8 }, (_, i) => picked(`a${i}`)));
    const four = pickedDrafts(Array.from({ length: 4 }, (_, i) => picked(`b${i}`)));
    const all = appendPhotos(eight, four);
    expect(all).toHaveLength(EVENT_MAX_PHOTOS);
    expect(all).toEqual([...eight, four[0], four[1]]);
  });
});

describe('EventPhotoGrid', () => {
  test('renders nothing with no photos', async () => {
    await renderGrid([]);
    expect(screen.queryByTestId('event-photo-grid')).toBeNull();
  });

  test('shows square cropped thumbnails, labeled "Foto N de M", from picked and stored photos', async () => {
    const photos = [...pickedDrafts([picked('a')]), ...storedDrafts([{ file: 'b.png', width: 10, height: 90 }])];
    const { adapters } = await renderGrid(photos);

    expect(thumbnails().map((node) => node.props.accessibilityLabel)).toEqual(['Foto 1 de 2', 'Foto 2 de 2']);
    expect(thumbnails()[0]).toHaveProp('accessibilityRole', 'image');
    expect(sources()).toEqual(['file:///cache/a.jpg', adapters.photos.uriFor('b.png')]);
    for (const image of screen.getAllByTestId('event-thumbnail-image')) {
      expect(image).toHaveProp('contentFit', 'cover');
    }
  });

  test.each([
    ['phone', 3, TEST_WINDOWS.phonePortrait, Sizes.phone, Infinity],
    ['tablet', 4, TEST_WINDOWS.tabletPortrait, Sizes.tablet, Frames['tablet-portrait'].column ?? Infinity],
  ] as const)('a %s fits %i square thumbnails per row', async (_device, columns, window, sizes, column) => {
    setMockWindow(window);
    await renderGrid(pickedDrafts([picked('a'), picked('b')]));
    const grid = screen.getByTestId('event-photo-grid');
    const cell = thumbnails()[0].parent!;
    const style = Object.assign({}, ...[cell.props.style].flat());
    expect(style.width).toBe(style.height);
    expect(sizes.thumbColumns).toBe(columns);
    // The side is whole device pixels. Columns and gaps fill the row but always leave at
    // least one device pixel free (a row of exactly the box's width wraps on Android), and
    // at most one pixel per column more.
    const scale = PixelRatio.get();
    expect(Number.isInteger(style.width * scale)).toBe(true);
    const total = sizes.thumbColumns * style.width + (sizes.thumbColumns - 1) * Layout.creationGap;
    const inner =
      Math.min(window.width - 2 * sizes.contentPadding, column) - 2 * (sizes.cardPadding + Layout.borderWidth);
    expect(grid).toHaveStyle({ flexWrap: 'wrap' });
    expect(inner - total).toBeGreaterThanOrEqual(1 / scale);
    expect(inner - total).toBeLessThan((sizes.thumbColumns + 1) / scale);
  });

  test('"Quitar foto N" removes the right photo', async () => {
    const photos = pickedDrafts([picked('a'), picked('b'), picked('c')]);
    const { onRemove } = await renderGrid(photos);
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar foto 2' }));
    expect(onRemove).toHaveBeenCalledWith(photos[1].key);
  });

  test.each(['light', 'dark'] as const)('remove buttons are 44-point squares in %s colors', async (scheme) => {
    setMockColorScheme(scheme);
    await renderGrid(pickedDrafts([picked('a')]));
    const remove = screen.getByRole('button', { name: 'Quitar foto 1' });
    expect(remove).toHaveStyle({
      width: Layout.touchTarget,
      height: Layout.touchTarget,
      top: Layout.thumbRemoveInset,
      right: Layout.thumbRemoveInset,
      backgroundColor: Colors[scheme].surfaceMuted,
      borderColor: Colors[scheme].primaryDark,
      borderWidth: Layout.borderWidth,
    });
    expect(screen.getByText('✕')).toHaveStyle({ color: Colors[scheme].textMain });
    expect(thumbnails()[0]).toHaveStyle({ backgroundColor: Colors[scheme].imageBackdrop });
  });

  test('thumbnails resize when the window changes', async () => {
    await renderGrid(pickedDrafts([picked('a')]));
    const width = () => Object.assign({}, ...[thumbnails()[0].parent!.props.style].flat()).width;
    const portrait = width();
    await act(async () => setMockWindow(TEST_WINDOWS.phoneLandscape));
    expect(width()).not.toBe(portrait);
  });
});
