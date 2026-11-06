import { act, fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { EventItemCard } from '@/components/event-item-card';
import { ItemsProvider } from '@/components/items-provider';
import { MISSING_PHOTO_MESSAGE } from '@/components/photo-preview';
import { Colors, Layout, Radius, Sizes, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import type { EventItem } from '@/items/domain/event-item';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { readingOrder } from '@/test-utils/accessibility-order';
import { TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

const photo = (file: string, width = 400, height = 300) => ({ file, width, height });

const ITEM: EventItem = {
  id: 'id-1',
  type: 'event',
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  title: 'Tarde de juegos y café',
  category: 'Encuentro',
  description: 'Nos reunimos en el salón principal para jugar al parchís.\nY hubo tarta.',
  photos: [photo('a.jpg', 300, 900), photo('b.jpg', 1600, 900), photo('c.jpg')],
};

const wrapperFor = (adapters: ReturnType<typeof createAppAdapters>) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <ItemsProvider adapters={adapters}>{children}</ItemsProvider>;
  };

async function renderCard(item: EventItem = ITEM, onEdit: () => void = () => {}) {
  const adapters = createAppAdapters();
  await render(<EventItemCard item={item} onEdit={onEdit} />, { wrapper: wrapperFor(adapters) });
  return adapters;
}

async function tileSize() {
  const { result } = await renderHook(() => useShellLayout(), { wrapper: wrapperFor(createAppAdapters()) });
  return result.current.eventTileSize;
}

const tiles = () => screen.getAllByTestId('event-photo-tile');

describe('EventItemCard', () => {
  describe.each(['light', 'dark'] as const)('%s palette', (scheme) => {
    beforeEach(() => setMockColorScheme(scheme));

    test('has the card frame with a strong border and a deep-blue bar on the left', async () => {
      const colors = Colors[scheme];
      await renderCard();
      expect(screen.getByTestId('event-item-card')).toHaveStyle({
        backgroundColor: colors.cardBg,
        borderColor: colors.primaryDark,
        borderWidth: Layout.borderWidth,
        borderLeftWidth: Layout.accentBarWidth,
        borderLeftColor: colors.primaryBlueDeep,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        boxShadow: `0 2px 6px ${colors.cardShadow}`,
      });
    });

    test('the title is bold main text and the badge uses the badge colors', async () => {
      await renderCard();
      expect(screen.getByText(ITEM.title)).toHaveStyle({
        color: Colors[scheme].textMain,
        fontWeight: '700',
        fontSize: Sizes.phone.eventTitle,
      });
      expect(screen.getByTestId('category-badge')).toHaveStyle({
        backgroundColor: Colors[scheme].badgeBg,
        borderRadius: Radius.pill,
        paddingHorizontal: Layout.badgePaddingH,
        paddingVertical: Layout.badgePaddingV,
      });
      expect(screen.getByText(ITEM.category)).toHaveStyle({
        color: Colors[scheme].badgeText,
        fontWeight: '700',
        fontSize: Sizes.phone.badgeText,
      });
    });

    test('the description uses the card text style, and tiles sit on the backdrop', async () => {
      await renderCard();
      expect(screen.getByTestId('event-item-description')).toHaveStyle({
        color: Colors[scheme].textSecondary,
        fontSize: Sizes.phone.cardText,
        lineHeight: Sizes.phone.cardLineHeight,
        marginTop: Layout.photoGap,
      });
      expect(tiles()[0]).toHaveStyle({ backgroundColor: Colors[scheme].imageBackdrop });
    });
  });

  test('the title is a header, wraps in full, and the badge stays at its right without shrinking', async () => {
    await renderCard({ ...ITEM, title: 'Un título muy largo '.repeat(6), category: 'c'.repeat(24) });
    const title = screen.getByTestId('event-item-title');
    expect(title).toHaveProp('accessibilityRole', 'header');
    expect(title).not.toHaveProp('numberOfLines');
    expect(title).toHaveStyle({ flex: 1 });
    expect(title.parent).toHaveStyle({ flexDirection: 'row', alignItems: 'flex-start' });
    const badge = screen.getByTestId('category-badge');
    expect(badge).toHaveStyle({ flexShrink: 0, alignSelf: 'flex-start' });
    expect(badge).toHaveProp('accessibilityLabel', `Categoría: ${'c'.repeat(24)}`);
    expect(screen.getByText('c'.repeat(24))).not.toHaveProp('numberOfLines');
  });

  test('square tiles of eventTileSize, in order, labeled with the title', async () => {
    const side = await tileSize();
    const adapters = await renderCard();
    expect(tiles().map((tile) => tile.props.accessibilityLabel)).toEqual([
      'Foto 1 de 3 de Tarde de juegos y café',
      'Foto 2 de 3 de Tarde de juegos y café',
      'Foto 3 de 3 de Tarde de juegos y café',
    ]);
    for (const tile of tiles()) {
      expect(tile).toHaveProp('accessibilityRole', 'image');
      expect(tile).toHaveStyle({ width: side, height: side, borderRadius: Layout.photoRadius });
    }
    const images = screen.getAllByTestId('event-photo-tile-image');
    expect(images.map((image) => image.props.source)).toEqual(
      ['a.jpg', 'b.jpg', 'c.jpg'].map((file) => [{ uri: adapters.photos.uriFor(file) }]),
    );
    for (const image of images) expect(image).toHaveProp('contentFit', 'cover');
  });

  test('the row scrolls sideways with the tile gap and no indicator', async () => {
    await renderCard();
    const row = screen.getByTestId('event-photo-row');
    expect(row).toHaveProp('horizontal', true);
    expect(row).toHaveProp('showsHorizontalScrollIndicator', false);
    expect(row.props.contentContainerStyle).toMatchObject({ gap: Layout.eventTileGap });
  });

  test('one photo gives one tile', async () => {
    await renderCard({ ...ITEM, photos: [photo('only.jpg')] });
    expect(tiles()).toHaveLength(1);
    expect(tiles()[0]).toHaveProp('accessibilityLabel', 'Foto 1 de 1 de Tarde de juegos y café');
  });

  test('with no description the actions follow the row directly', async () => {
    await renderCard({ ...ITEM, description: null });
    expect(screen.queryByTestId('event-item-description')).toBeNull();
    const row = screen.getByTestId('event-photo-row');
    const card = screen.getByTestId('event-item-card');
    const children = card.children.filter((child) => typeof child !== 'string');
    expect(children[children.indexOf(row) + 1]).toHaveStyle({ borderTopColor: Colors.light.divider });
  });

  test('a tile that fails to load shows the message while the others still show', async () => {
    await renderCard();
    await fireEvent(screen.getAllByTestId('event-photo-tile-image')[1], 'error', {
      nativeEvent: { error: 'no file' },
    });

    expect(tiles()[1]).toHaveTextContent(MISSING_PHOTO_MESSAGE);
    expect(screen.getByText(MISSING_PHOTO_MESSAGE)).toHaveStyle({ color: Colors.light.textMuted });
    expect(screen.getAllByTestId('event-photo-tile-image')).toHaveLength(2);
    expect(tiles()).toHaveLength(3);
  });

  test('Editar calls onEdit, and Compartir does nothing', async () => {
    const onEdit = jest.fn();
    await renderCard(ITEM, onEdit);
    await fireEvent.press(screen.getByRole('button', { name: 'Compartir' }));
    expect(onEdit).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Editar' })).toHaveStyle({ minHeight: Layout.touchTarget });
  });

  test('the screen reader reads the heading, the badge, the tiles and the actions', async () => {
    await renderCard({ ...ITEM, title: 'Viaje a Cádiz', category: 'Familia', photos: ITEM.photos.slice(0, 2) });
    expect(readingOrder(screen.getByTestId('event-item-card'))).toEqual([
      'header Viaje a Cádiz',
      'element Categoría: Familia',
      'image Foto 1 de 2 de Viaje a Cádiz',
      'image Foto 2 de 2 de Viaje a Cádiz',
      'button Editar',
      'button Compartir',
    ]);
  });

  test('tablets use the tablet sizes, and tiles resize when the window changes', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    const tabletSide = await tileSize();
    setMockWindow(TEST_WINDOWS.phonePortrait);
    await renderCard();
    const phoneWidth = tiles()[0].props.style;
    await act(async () => setMockWindow(TEST_WINDOWS.tabletPortrait));
    expect(screen.getByText(ITEM.title)).toHaveStyle({ fontSize: Sizes.tablet.eventTitle });
    expect(screen.getByText(ITEM.category)).toHaveStyle({ fontSize: Sizes.tablet.badgeText });
    expect(tiles()[0].props.style).not.toEqual(phoneWidth);
    expect(tiles()[0]).toHaveStyle({ width: tabletSide, height: tabletSide });
  });
});
