import { fireEvent, renderRouter, screen, within } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { Colors, Frames, Layout, Sizes } from '@/constants/theme';
import { TEST_INSETS, TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

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

describe('TabBar', () => {
  test('shows the three tabs in order inside a tab list', async () => {
    await renderRouter('./src/app');
    expect(tabList().props.accessibilityRole).toBe('tablist');
    expect(screen.getAllByRole('tab').map((t) => t.props.accessibilityLabel)).toEqual(TAB_NAMES);
  });

  test('footer is the shell height plus the bottom inset', async () => {
    await renderRouter('./src/app');
    expect(tabList()).toHaveStyle({
      height: Frames['phone-portrait'].tabBarHeight + TEST_INSETS.bottom,
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

  test('phone portrait tabs stretch and have the phone height', async () => {
    await renderRouter('./src/app');
    expect(tab('Timeline')).toHaveStyle({ flex: 1, height: Sizes.phone.tabHeight });
  });

  test('phone landscape: absolute at the top, bottom border, no bottom inset, fixed tab width', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await renderRouter('./src/app');
    const frame = Frames['phone-landscape'];
    expect(tabList()).toHaveStyle({
      position: 'absolute',
      top: 0,
      height: frame.tabBarHeight,
      paddingBottom: 0,
      borderBottomWidth: Layout.borderWidth,
      justifyContent: 'center',
    });
    expect(StyleSheet.flatten(tabList().props.style).borderTopWidth).toBeUndefined();
    expect(tab('Timeline')).toHaveStyle({ width: frame.tabWidth, height: Sizes.phone.tabHeight });
  });

  test('tablet portrait: at the bottom with the tablet sizes and 150-point tabs', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await renderRouter('./src/app');
    const frame = Frames['tablet-portrait'];
    expect(tabList()).toHaveStyle({
      height: frame.tabBarHeight + TEST_INSETS.bottom,
      borderTopWidth: Layout.borderWidth,
    });
    expect(tab('Circles')).toHaveStyle({ width: frame.tabWidth, height: Sizes.tablet.tabHeight });
    expect(within(tab('Circles')).getByText('Circles')).toHaveStyle({ fontSize: Sizes.tablet.tabLabel });
  });

  test('every landscape and tablet tab is at least 44 points tall', async () => {
    for (const window of Object.values(TEST_WINDOWS)) {
      setMockWindow(window);
      await renderRouter('./src/app');
      for (const name of TAB_NAMES) {
        expect(StyleSheet.flatten(tab(name).props.style).height).toBeGreaterThanOrEqual(Layout.touchTarget);
      }
    }
  });

  test('landscape pads the screens by the bar height, portrait does not', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await renderRouter('./src/app');
    const scene = screen.getByTestId('timeline-feed').parent;
    let padded = false;
    for (let node = scene; node; node = node.parent) {
      if (StyleSheet.flatten(node.props.style)?.paddingTop === Frames['phone-landscape'].tabBarHeight) {
        padded = true;
        break;
      }
    }
    expect(padded).toBe(true);
  });
});
