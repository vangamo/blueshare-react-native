import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ImageItemCard } from '@/components/image-item-card';
import { ItemsProvider } from '@/components/items-provider';
import { MISSING_PHOTO_MESSAGE, photoBoxHeight } from '@/components/photo-preview';
import { Colors, Layout, Radius, Sizes, Spacing } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import type { ImageItem } from '@/items/domain/image-item';
import { createAppAdapters } from '@/items/infrastructure/app-adapters';
import { TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

const ITEM: ImageItem = {
  id: 'id-1',
  type: 'image',
  createdAt: 1000,
  updatedAt: 1000,
  deletedAt: null,
  photo: { file: 'abc.jpg', width: 4000, height: 3000 },
  altText: 'Cuatro personas pintando en una mesa',
  caption: 'Trabajos realizados en el taller de pintura de esta mañana.',
};

async function renderCard(item: ImageItem = ITEM, onEdit: () => void = () => {}) {
  const adapters = createAppAdapters();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ItemsProvider adapters={adapters}>{children}</ItemsProvider>
  );
  await render(<ImageItemCard item={item} onEdit={onEdit} />, { wrapper });
  return adapters;
}

describe('ImageItemCard', () => {
  describe.each(['light', 'dark'] as const)('%s palette', (scheme) => {
    beforeEach(() => setMockColorScheme(scheme));

    test('has the text card frame', async () => {
      const colors = Colors[scheme];
      await renderCard();
      expect(screen.getByTestId('image-item-card')).toHaveStyle({
        backgroundColor: colors.cardBg,
        borderColor: colors.borderColor,
        borderWidth: Layout.borderWidth,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        boxShadow: `0 2px 6px ${colors.cardShadow}`,
      });
    });

    test('the caption is italic, muted and in full', async () => {
      await renderCard();
      expect(screen.getByText(ITEM.caption!)).toHaveStyle({
        color: Colors[scheme].textMuted,
        fontStyle: 'italic',
        fontSize: Sizes.phone.captionText,
        marginTop: Layout.photoGap,
      });
      expect(screen.getByTestId('image-item-caption')).not.toHaveProp('numberOfLines');
    });

    test('the photo sits on the image backdrop', async () => {
      await renderCard();
      expect(screen.getByTestId('photo-preview')).toHaveStyle({
        backgroundColor: Colors[scheme].imageBackdrop,
      });
    });
  });

  test('loads the stored photo from the photo store', async () => {
    const adapters = await renderCard();
    expect(screen.getByTestId('photo-preview-image')).toHaveProp('source', [
      { uri: adapters.photos.uriFor('abc.jpg') },
    ]);
  });

  test('the photo is as tall as its proportions allow', async () => {
    const { result } = await renderHook(() => useShellLayout());
    const { sizes, columnWidth, imageMaxHeight } = result.current;
    const boxWidth = columnWidth - 2 * (sizes.cardPadding + Layout.borderWidth);
    await renderCard();
    expect(screen.getByTestId('photo-preview')).toHaveStyle({
      width: boxWidth,
      height: photoBoxHeight(4000, 3000, boxWidth, imageMaxHeight),
    });
  });

  test('without a caption nothing sits between the photo and the actions', async () => {
    await renderCard({ ...ITEM, caption: null });
    expect(screen.queryByTestId('image-item-caption')).toBeNull();
    const card = screen.getByTestId('image-item-card');
    expect(card.children).toHaveLength(2);
  });

  test.each([
    ['the alternative text', ITEM, 'Cuatro personas pintando en una mesa'],
    ['the caption when there is no alternative text', { ...ITEM, altText: null, caption: 'Paseo' }, 'Paseo'],
    ['"Foto" when there is neither', { ...ITEM, altText: null, caption: null }, 'Foto'],
  ])('the photo is an image named by %s', async (_, item, name) => {
    await renderCard(item);
    expect(screen.getByRole('image', { name })).toBeOnTheScreen();
  });

  test('Editar and Compartir are buttons at least 44 tall, in that order', async () => {
    await renderCard();
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.props.accessibilityLabel)).toEqual(['Editar', 'Compartir']);
    for (const button of buttons) expect(button).toHaveStyle({ minHeight: Layout.touchTarget });
  });

  test('Editar calls onEdit once and Compartir does nothing', async () => {
    const onEdit = jest.fn();
    await renderCard(ITEM, onEdit);
    await fireEvent.press(screen.getByRole('button', { name: 'Compartir' }));
    expect(onEdit).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Editar' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  test('a missing photo shows the message and keeps the caption and the actions', async () => {
    await renderCard();
    await fireEvent(screen.getByTestId('photo-preview-image'), 'error', {
      nativeEvent: { error: 'missing' },
    });
    expect(screen.getByText(MISSING_PHOTO_MESSAGE)).toBeOnTheScreen();
    expect(screen.getByText(ITEM.caption!)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Compartir' })).toBeOnTheScreen();
  });

  test.each(['tabletPortrait', 'tabletLandscape'] as const)('uses the tablet sizes in %s', async (window) => {
    setMockWindow(TEST_WINDOWS[window]);
    await renderCard();
    expect(screen.getByTestId('image-item-card')).toHaveStyle({
      padding: Sizes.tablet.cardPadding,
      borderRadius: Sizes.tablet.cardRadius,
    });
    expect(screen.getByText(ITEM.caption!)).toHaveStyle({ fontSize: Sizes.tablet.captionText });
  });
});
