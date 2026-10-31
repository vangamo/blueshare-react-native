import { renderRouter, screen } from 'expo-router/testing-library';

const SECTIONS = ['Timeline', 'Circles', 'Events'];

/**
 * Each tab label is always on screen, so the shown section is the one whose
 * name appears twice: once in the tab bar and once as the placeholder title.
 */
function expectSectionShown(section: string) {
  for (const name of SECTIONS) {
    expect(screen.getAllByText(name)).toHaveLength(name === section ? 2 : 1);
  }
  expect(screen.getByText('Coming soon.')).toBeOnTheScreen();
}

describe('app routes', () => {
  test('opens on Timeline', async () => {
    await renderRouter('./src/app');
    expect(screen).toHavePathname('/');
    expectSectionShown('Timeline');
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
