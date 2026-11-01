import { renderRouter, screen } from 'expo-router/testing-library';

import { EMPTY_TIMELINE_MESSAGE } from '@/components/timeline-feed';

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
