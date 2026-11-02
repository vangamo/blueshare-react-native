import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { Colors, Frames, Sizes } from '@/constants/theme';
import { TEST_INSETS, TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

function createButton() {
  return screen.getByRole('button', { name: 'Create' });
}

function queryCreateButton() {
  return screen.queryByRole('button', { name: 'Create' });
}

describe('CreateButton', () => {
  test('is a 56×56 round button 20 from the right and 10 above the footer', async () => {
    await renderRouter('./src/app');
    expect(createButton()).toHaveStyle({
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
      right: 20,
      bottom: Frames['phone-portrait'].tabBarHeight + TEST_INSETS.bottom + 10,
    });
    expect(screen.getByText('+')).toHaveStyle({ fontSize: 28, fontWeight: '700' });
  });

  test('pressing it on Timeline hides the button', async () => {
    await renderRouter('./src/app');
    await fireEvent.press(createButton());
    expect(screen).toHavePathname('/');
    expect(queryCreateButton()).toBeNull();
  });

  test.each(['/circles', '/events'])('pressing it on %s changes nothing', async (url) => {
    await renderRouter('./src/app', { initialUrl: url });
    await fireEvent.press(createButton());
    expect(screen).toHavePathname(url);
    expect(createButton()).toBeOnTheScreen();
  });

  test('with the box open on Timeline, it shows on Events and hides again on Timeline', async () => {
    await renderRouter('./src/app');
    await fireEvent.press(createButton());
    expect(queryCreateButton()).toBeNull();

    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));
    expect(createButton()).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Timeline' }));
    expect(queryCreateButton()).toBeNull();
  });

  test('stays on screen on every section while the box is closed', async () => {
    await renderRouter('./src/app');
    for (const name of ['Circles', 'Events', 'Timeline']) {
      await fireEvent.press(screen.getByRole('tab', { name }));
      expect(createButton()).toBeOnTheScreen();
    }
  });

  test.each(['light', 'dark'] as const)('uses the %s palette', async (scheme) => {
    setMockColorScheme(scheme);
    const colors = Colors[scheme];
    await renderRouter('./src/app');
    expect(createButton()).toHaveStyle({
      backgroundColor: colors.primaryBlue,
      borderColor: colors.cardBg,
    });
    expect(screen.getByText('+')).toHaveStyle({ color: colors.onPrimary });
  });

  test('phone landscape: 16 above the bottom inset, with no tab bar below', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await renderRouter('./src/app');
    expect(createButton()).toHaveStyle({
      width: Sizes.phone.fab,
      height: Sizes.phone.fab,
      right: Sizes.phone.fabRight + TEST_INSETS.right,
      bottom: TEST_INSETS.bottom + Frames['phone-landscape'].fabBottom,
    });
  });

  test('tablet portrait: tablet size, 28 from the right and 16 above the tab bar', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await renderRouter('./src/app');
    expect(createButton()).toHaveStyle({
      width: Sizes.tablet.fab,
      height: Sizes.tablet.fab,
      borderRadius: Sizes.tablet.fab / 2,
      right: Sizes.tablet.fabRight + TEST_INSETS.right,
      bottom:
        Frames['tablet-portrait'].tabBarHeight + TEST_INSETS.bottom + Frames['tablet-portrait'].fabBottom,
    });
    expect(screen.getByText('+')).toHaveStyle({ fontSize: Sizes.tablet.fabFont });
  });

  test('tablet landscape keeps the tablet size, above the bottom inset', async () => {
    setMockWindow(TEST_WINDOWS.tabletLandscape);
    await renderRouter('./src/app');
    expect(createButton()).toHaveStyle({
      width: Sizes.tablet.fab,
      bottom: TEST_INSETS.bottom + Frames['tablet-landscape'].fabBottom,
    });
  });
});
