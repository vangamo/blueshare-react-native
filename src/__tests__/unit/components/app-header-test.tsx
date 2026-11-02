import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { Colors, Frames, Layout, Sizes } from '@/constants/theme';
import { TEST_INSETS, TEST_WINDOWS, setMockColorScheme, setMockWindow } from '@/test-utils/test-values';

/** The header row: the menu button's parent. */
function header() {
  const parent = screen.getByRole('button', { name: 'Menu' }).parent;
  if (!parent) throw new Error('Menu button has no parent');
  return parent;
}

describe('AppHeader', () => {
  test('shows menu, title field and avatar in that order', async () => {
    await renderRouter('./src/app');
    const labels = header().children.map((child) =>
      typeof child === 'string' ? child : child.props.accessibilityLabel,
    );
    expect(labels).toEqual(['Menu', 'Search', 'Profile']);
    expect(screen.getByLabelText('Search')).toHaveDisplayValue('BlueShare');
  });

  test('menu button is at least 44×44 and pressing it does nothing', async () => {
    await renderRouter('./src/app');
    const menu = screen.getByRole('button', { name: 'Menu' });
    const style = StyleSheet.flatten(menu.props.style);
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
    expect(style.minHeight).toBeGreaterThanOrEqual(44);

    await fireEvent.press(menu);
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('tab', { name: 'Timeline' })).toBeSelected();
  });

  test('avatar is labeled "Profile" and has no press handler', async () => {
    await renderRouter('./src/app');
    const avatar = screen.getByLabelText('Profile');
    expect(avatar.props.onPress).toBeUndefined();
    expect(screen.getByText('👵')).toBeOnTheScreen();
  });

  test('header is the shell height plus the top inset', async () => {
    await renderRouter('./src/app');
    expect(header()).toHaveStyle({
      height: Frames['phone-portrait'].headerHeight + TEST_INSETS.top,
      paddingTop: TEST_INSETS.top,
      paddingHorizontal: 16,
      borderBottomWidth: 2,
    });
  });

  test.each(['light', 'dark'] as const)('uses the %s palette', async (scheme) => {
    setMockColorScheme(scheme);
    const colors = Colors[scheme];
    await renderRouter('./src/app');

    expect(header()).toHaveStyle({
      backgroundColor: colors.cardBg,
      borderBottomColor: colors.borderColor,
    });
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveStyle({
      backgroundColor: colors.creationBg,
      borderColor: colors.primaryBlue,
    });
    expect(screen.getByText('≡')).toHaveStyle({ color: colors.primaryBlue });
    expect(screen.getByLabelText('Search')).toHaveStyle({ borderColor: colors.primaryDark });
    expect(screen.getByLabelText('Profile')).toHaveStyle({
      backgroundColor: colors.avatarBg,
      borderColor: colors.primaryDark,
    });
  });

  test('phone landscape: shorter header and a title field capped at 300', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await renderRouter('./src/app');
    expect(header()).toHaveStyle({
      height: Frames['phone-landscape'].headerHeight + TEST_INSETS.top,
      paddingLeft: Sizes.phone.headerPaddingHorizontal + TEST_INSETS.left,
      paddingRight: Sizes.phone.headerPaddingHorizontal + TEST_INSETS.right,
    });
    expect(screen.getByLabelText('Search')).toHaveStyle({
      maxWidth: Frames['phone-landscape'].titleMaxWidth,
    });
  });

  test('tablet portrait: tablet sizes, 24 padding and every control at least 44', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await renderRouter('./src/app');
    expect(header()).toHaveStyle({
      height: Frames['tablet-portrait'].headerHeight + TEST_INSETS.top,
      paddingLeft: Sizes.tablet.headerPaddingHorizontal + TEST_INSETS.left,
    });
    const menu = StyleSheet.flatten(screen.getByRole('button', { name: 'Menu' }).props.style);
    expect(menu.minWidth).toBe(Sizes.tablet.menuButton);
    expect(menu.minHeight).toBeGreaterThanOrEqual(Layout.touchTarget);
    expect(screen.getByLabelText('Search')).toHaveStyle({
      height: Sizes.tablet.fieldHeight,
      maxWidth: Frames['tablet-portrait'].titleMaxWidth,
    });
    expect(screen.getByLabelText('Profile')).toHaveStyle({
      width: Sizes.tablet.avatar,
      height: Sizes.tablet.avatar,
    });
    expect(screen.getByText('👵')).toHaveStyle({ fontSize: Sizes.tablet.avatarEmoji });
  });
});
