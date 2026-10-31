import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { Colors, Layout } from '@/constants/theme';
import { TEST_INSETS, setMockColorScheme } from '@/test-utils/test-values';

function createButton() {
  return screen.getByRole('button', { name: 'Create' });
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
      bottom: Layout.footerHeight + TEST_INSETS.bottom + 10,
    });
    expect(screen.getByText('+')).toHaveStyle({ fontSize: 28, fontWeight: '700' });
  });

  test('pressing it does nothing', async () => {
    await renderRouter('./src/app', { initialUrl: '/circles' });
    await fireEvent.press(createButton());
    expect(screen).toHavePathname('/circles');
    expect(createButton()).toBeOnTheScreen();
  });

  test('stays on screen on every section', async () => {
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
});
