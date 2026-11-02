import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { EMPTY_TIMELINE_MESSAGE } from '@/components/timeline-feed';
import { spyOnBackHandler } from '@/test-utils/back-handler';
import { TEST_WINDOWS, setMockWindow } from '@/test-utils/test-values';

const SECTIONS = ['Timeline', 'Circles', 'Events'];

/**
 * Each tab label is always on screen. Circles and Events show a placeholder, so
 * the shown one is the name that appears twice: in the tab bar and as its title.
 */
function expectSectionShown(section: string) {
  for (const name of SECTIONS) {
    expect(screen.getAllByText(name)).toHaveLength(name === section ? 2 : 1);
  }
  expect(screen.getByText('Coming soon.')).toBeOnTheScreen();
}

describe('app routes', () => {
  test('opens on Timeline, which shows the feed and no placeholder', async () => {
    await renderRouter('./src/app');
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('tab', { name: 'Timeline' })).toBeSelected();
    expect(screen.getByTestId('timeline-feed')).toBeOnTheScreen();
    expect(await screen.findByText(EMPTY_TIMELINE_MESSAGE)).toBeOnTheScreen();
    expect(screen.queryByText('Coming soon.')).toBeNull();
    expect(screen.getAllByText('Timeline')).toHaveLength(1);
  });

  test.each([
    ['/circles', 'Circles'],
    ['/events', 'Events'],
  ])('deep link %s shows the %s section', async (url, section) => {
    await renderRouter('./src/app', { initialUrl: url });
    expect(screen).toHavePathname(url);
    expectSectionShown(section);
  });

  test('the old /explore route shows no starter content', async () => {
    await renderRouter('./src/app', { initialUrl: '/explore' });
    // Expo Router's "unmatched route" screen may print the URL; the starter screen
    // title "Explore" and its welcome copy must not appear.
    expect(screen.queryByText('Explore')).toBeNull();
    expect(screen.queryByText(/welcome to expo/i)).toBeNull();
    expect(screen.queryByText('Coming soon.')).toBeNull();
  });
});

describe('navigation in landscape', () => {
  test.each(['phoneLandscape', 'tabletLandscape'] as const)('tabs switch sections in %s', async (window) => {
    setMockWindow(TEST_WINDOWS[window]);
    await renderRouter('./src/app');
    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));
    expect(screen).toHavePathname('/events');
    expectSectionShown('Events');
    await fireEvent.press(screen.getByRole('tab', { name: 'Circles' }));
    expect(screen).toHavePathname('/circles');
    expectSectionShown('Circles');
  });

  test('Android back returns to Timeline in landscape', async () => {
    const back = spyOnBackHandler();
    setMockWindow(TEST_WINDOWS.phoneLandscape);
    await renderRouter('./src/app');
    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));
    expect(screen).toHavePathname('/events');
    let handled = false;
    await act(async () => {
      handled = back.press();
    });
    expect(handled).toBe(true);
    expect(screen).toHavePathname('/');
    expect(screen.getByRole('tab', { name: 'Timeline' })).toBeSelected();
  });
});
