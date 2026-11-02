import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';

import { MISSING_PHOTO_MESSAGE, PhotoPreview, photoBoxHeight } from '@/components/photo-preview';
import { Colors, Layout, Sizes } from '@/constants/theme';
import { useShellLayout } from '@/hooks/use-shell-layout';
import { TEST_INSETS, TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

const URI = 'file:///photos/a.jpg';

async function layout() {
  const { result } = await renderHook(() => useShellLayout());
  return result.current;
}

describe('photoBoxHeight', () => {
  test('a 4000×3000 photo at 300 points is 225 tall', () => {
    expect(photoBoxHeight(4000, 3000, 300, 1000)).toBe(225);
  });

  test('a 1000×3000 photo is capped at 5/4 of the width when there is room', () => {
    expect(photoBoxHeight(1000, 3000, 300, 1000)).toBe(300 * Layout.imageMaxRatio);
  });

  test('a tall photo is capped at imageMaxHeight when that is smaller', () => {
    expect(photoBoxHeight(1000, 3000, 300, 200)).toBe(200);
  });
});

describe('PhotoPreview', () => {
  test('the box is as wide as the card content and as tall as the proportions allow', async () => {
    const { sizes, columnWidth, imageMaxHeight } = await layout();
    await render(<PhotoPreview uri={URI} width={4000} height={3000} label="Playa" />);
    const boxWidth = columnWidth - 2 * (sizes.cardPadding + Layout.borderWidth);

    expect(screen.getByTestId('photo-preview')).toHaveStyle({
      width: boxWidth,
      height: photoBoxHeight(4000, 3000, boxWidth, imageMaxHeight),
      borderRadius: Layout.photoRadius,
    });
  });

  test('a tall photo is capped by the layout', async () => {
    const { sizes, columnWidth, imageMaxHeight } = await layout();
    await render(<PhotoPreview uri={URI} width={1000} height={3000} label="Torre" />);
    const boxWidth = columnWidth - 2 * (sizes.cardPadding + Layout.borderWidth);

    expect(screen.getByTestId('photo-preview')).toHaveStyle({
      height: Math.min(boxWidth * Layout.imageMaxRatio, imageMaxHeight),
    });
  });

  test.each(['light', 'dark'] as const)('backdrop color in the %s palette', async (scheme) => {
    setMockColorScheme(scheme);
    await render(<PhotoPreview uri={URI} width={4} height={3} label="Playa" />);
    expect(screen.getByTestId('photo-preview')).toHaveStyle({
      backgroundColor: Colors[scheme].imageBackdrop,
    });
  });

  test('it is an image named by the label, with the photo contained', async () => {
    await render(<PhotoPreview uri={URI} width={4} height={3} label="Cuatro personas" />);
    expect(screen.getByRole('image', { name: 'Cuatro personas' })).toBeOnTheScreen();
    expect(screen.getByTestId('photo-preview-image')).toHaveProp('contentFit', 'contain');
    expect(screen.getByTestId('photo-preview-image')).toHaveProp('source', [{ uri: URI }]);
  });

  test.each(['light', 'dark'] as const)('shows the missing message after an error (%s)', async (scheme) => {
    setMockColorScheme(scheme);
    await render(<PhotoPreview uri={URI} width={4} height={3} label="Playa" />);

    await fireEvent(screen.getByTestId('photo-preview-image'), 'error', { nativeEvent: { error: 'no file' } });

    expect(screen.getByText(MISSING_PHOTO_MESSAGE)).toHaveStyle({
      color: Colors[scheme].textMuted,
      fontSize: Sizes.phone.captionText,
    });
    expect(screen.queryByTestId('photo-preview-image')).toBeNull();
    expect(screen.getByRole('image', { name: 'Playa' })).toBeOnTheScreen();
  });

  test('a different photo tries to load again after an error', async () => {
    const { rerender } = await render(<PhotoPreview uri={URI} width={4} height={3} label="Playa" />);
    await fireEvent(screen.getByTestId('photo-preview-image'), 'error', { nativeEvent: { error: 'no file' } });

    await rerender(<PhotoPreview uri="file:///photos/b.jpg" width={4} height={3} label="Playa" />);

    expect(screen.getByTestId('photo-preview-image')).toBeOnTheScreen();
  });

  test('the box follows the layout when the window changes', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    const { sizes, columnWidth } = await layout();
    await render(<PhotoPreview uri={URI} width={4} height={3} label="Playa" />);
    expect(screen.getByTestId('photo-preview')).toHaveStyle({
      width: columnWidth - 2 * (sizes.cardPadding + Layout.borderWidth),
    });
    expect(TEST_INSETS.top).toBeGreaterThan(0);
  });
});
