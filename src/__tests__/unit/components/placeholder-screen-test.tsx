import { renderRouter, screen } from 'expo-router/testing-library';
import { StyleSheet } from 'react-native';

import { Frames, Sizes } from '@/constants/theme';
import { TEST_INSETS, TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';

function contentNode() {
  const parent = screen.getByText('Coming soon.').parent;
  if (!parent) throw new Error('Body has no parent');
  return parent;
}

/** The scroll view's `contentContainerStyle` (the mock keeps it on the scroll view host). */
function content() {
  const scroll = contentNode().parent;
  if (!scroll) throw new Error('Content has no scroll view');
  return StyleSheet.flatten(scroll.props.contentContainerStyle);
}

/** The section title: the content's first child (the tab label also says "Circles"). */
function title() {
  const [first] = contentNode().children;
  if (typeof first === 'string') throw new Error('Unexpected text node');
  return first;
}

describe('PlaceholderScreen', () => {
  test('phone portrait: plain padding and phone font sizes', async () => {
    await renderRouter('./src/app', { initialUrl: '/circles' });
    expect(content()).toMatchObject({ padding: Sizes.phone.contentPadding });
    expect(content().width).toBeUndefined();
    expect(title()).toHaveStyle({ fontSize: Sizes.phone.placeholderTitle });
  });

  test('phone landscape: centered 550-point column, clear of the bottom inset', async () => {
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await renderRouter('./src/app', { initialUrl: '/circles' });
    const pad = Sizes.phone.contentPadding;
    expect(content()).toMatchObject({
      width: Frames['phone-landscape'].column! + 2 * pad,
      alignSelf: 'center',
      paddingBottom: pad + TEST_INSETS.bottom,
    });
  });

  test('tablet portrait: 500-point column and tablet font sizes', async () => {
    setMockWindow(TEST_WINDOWS.tabletPortrait);
    await renderRouter('./src/app', { initialUrl: '/circles' });
    expect(content()).toMatchObject({
      padding: Sizes.tablet.contentPadding,
      width: Frames['tablet-portrait'].column! + 2 * Sizes.tablet.contentPadding,
    });
    expect(title()).toHaveStyle({ fontSize: Sizes.tablet.placeholderTitle });
    expect(screen.getByText('Coming soon.')).toHaveStyle({ fontSize: Sizes.tablet.placeholderBody });
  });
});
