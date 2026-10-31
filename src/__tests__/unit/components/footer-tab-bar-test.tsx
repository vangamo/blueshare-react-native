import { fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { Colors, Layout } from '@/constants/theme';
import { TEST_INSETS, setMockColorScheme } from '@/test-utils/test-values';

const TAB_NAMES = ['Timeline', 'Circles', 'Events'];

function tab(name: string) {
  return screen.getByRole('tab', { name });
}

/**
 * The footer container. It has the "tablist" role but is not an accessible
 * element itself (so screen readers still reach each tab), which role queries skip.
 */
function tabList() {
  const parent = tab('Timeline').parent;
  if (!parent) throw new Error('Tab has no parent');
  return parent;
}

describe('FooterTabBar', () => {
  test('shows the three tabs in order inside a tab list', async () => {
    await renderRouter('./src/app');
    expect(tabList().props.accessibilityRole).toBe('tablist');
    expect(screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual(TAB_NAMES);
  });

  test('footer is the shell height plus the bottom inset', async () => {
    await renderRouter('./src/app');
    expect(tabList()).toHaveStyle({
      height: Layout.footerHeight + TEST_INSETS.bottom,
      paddingBottom: TEST_INSETS.bottom,
      borderTopWidth: 2,
    });
  });

  test('Timeline is selected at start', async () => {
    await renderRouter('./src/app');
    expect(tab('Timeline')).toBeSelected();
    expect(tab('Circles')).not.toBeSelected();
    expect(tab('Events')).not.toBeSelected();
  });

  test('pressing Events shows Events and selects its tab', async () => {
    await renderRouter('./src/app');
    await fireEvent.press(tab('Events'));
    expect(screen).toHavePathname('/events');
    expect(tab('Events')).toBeSelected();
    expect(tab('Timeline')).not.toBeSelected();
  });

  test('pressing the active tab keeps the section', async () => {
    await renderRouter('./src/app', { initialUrl: '/events' });
    await fireEvent.press(tab('Events'));
    expect(screen).toHavePathname('/events');
    expect(tab('Events')).toBeSelected();
  });

  test('every tab is at least 44 points tall', async () => {
    await renderRouter('./src/app');
    for (const name of TAB_NAMES) {
      const { height } = StyleSheet.flatten(tab(name).props.style);
      expect(height).toBeGreaterThanOrEqual(44);
    }
  });

  test.each(['light', 'dark'] as const)('uses the %s palette for active and inactive tabs', async (scheme) => {
    setMockColorScheme(scheme);
    const colors = Colors[scheme];
    await renderRouter('./src/app', { initialUrl: '/circles' });

    expect(tabList()).toHaveStyle({
      backgroundColor: colors.cardBg,
      borderTopColor: colors.borderColor,
    });
    expect(tab('Circles')).toHaveStyle({
      backgroundColor: colors.primaryBlueHover,
      borderColor: colors.primaryBlueDeep,
    });
    expect(within(tab('Circles')).getByText('Circles')).toHaveStyle({ color: colors.onPrimary });
    for (const name of ['Timeline', 'Events']) {
      expect(tab(name)).toHaveStyle({
        backgroundColor: colors.surfaceMuted,
        borderColor: colors.borderDark,
      });
      expect(within(tab(name)).getByText(name)).toHaveStyle({ color: colors.textSecondary });
    }
  });
});
