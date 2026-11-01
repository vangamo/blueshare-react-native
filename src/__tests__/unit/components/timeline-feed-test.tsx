import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { FlatList } from 'react-native';

import { EMPTY_TIMELINE_MESSAGE, LOAD_ERROR_MESSAGE } from '@/components/timeline-feed';
import { Colors, Spacing } from '@/constants/theme';
import * as appAdapters from '@/items/infrastructure/app-adapters';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { GatedSqlDatabase } from '@/test-utils/gated-sql-database';
import { journey } from '@/test-utils/timeline-journey';

/** Makes the next app render use `wrap(db)` as its database. */
function wrapNextDatabase(wrap: (db: appAdapters.AppAdapters['db']) => appAdapters.AppAdapters['db']) {
  const real = appAdapters.createAppAdapters;
  jest.spyOn(appAdapters, 'createAppAdapters').mockImplementation(() => {
    const adapters = real();
    return { ...adapters, db: wrap(adapters.db) };
  });
}

describe('TimelineFeed', () => {
  test('shows the empty message on first launch, on the main background', async () => {
    await renderRouter('./src/app');
    expect(await screen.findByText(EMPTY_TIMELINE_MESSAGE)).toHaveStyle({
      color: Colors.light.textSecondary,
    });
    expect(screen.getByTestId('timeline-feed')).toHaveStyle({
      backgroundColor: Colors.light.backgroundMain,
    });
    expect(screen.queryByText('Coming soon.')).toBeNull();
  });

  test('pads its content by 16', async () => {
    await renderRouter('./src/app');
    expect(screen.getByTestId('timeline-feed')).toHaveProp('contentContainerStyle', {
      padding: Spacing.lg,
    });
  });

  test('hides the empty message while the box is open', async () => {
    await renderRouter('./src/app');
    await screen.findByText(EMPTY_TIMELINE_MESSAGE);
    await journey.openBox();
    expect(screen.queryByText(EMPTY_TIMELINE_MESSAGE)).toBeNull();
    expect(screen.getByText('Crear nuevo elemento:')).toBeOnTheScreen();
  });

  test('shows neither the empty message nor an error while loading', async () => {
    let release = () => {};
    wrapNextDatabase((db) => {
      const gated = new GatedSqlDatabase(db);
      release = gated.hold(); // the migrations wait
      return gated;
    });
    await renderRouter('./src/app');
    expect(screen.queryByText(EMPTY_TIMELINE_MESSAGE)).toBeNull();
    expect(screen.queryByText(LOAD_ERROR_MESSAGE)).toBeNull();

    release();
    expect(await screen.findByText(EMPTY_TIMELINE_MESSAGE)).toBeOnTheScreen();
  });

  test('shows the error message when loading fails, and the other tabs still work', async () => {
    wrapNextDatabase((db) => new FailingSqlDatabase(db, (sql) => sql.includes('LEFT JOIN')));
    await renderRouter('./src/app');
    const message = await screen.findByText(LOAD_ERROR_MESSAGE);
    expect(message).toHaveProp('accessibilityLiveRegion', 'polite');
    expect(screen.queryByText(EMPTY_TIMELINE_MESSAGE)).toBeNull();

    await fireEvent.press(screen.getByRole('tab', { name: 'Events' }));
    expect(screen).toHavePathname('/events');
  });

  test('lists two creations newest first', async () => {
    await renderRouter('./src/app');
    await journey.createText('Primero');
    await journey.createText('Segundo');
    expect(journey.cardTexts()).toEqual(['Segundo', 'Primero']);
    expect(screen.queryByText(EMPTY_TIMELINE_MESSAGE)).toBeNull();
  });

  test('scrolls to the top when the box opens', async () => {
    const scrollToOffset = jest.spyOn(FlatList.prototype, 'scrollToOffset');
    await renderRouter('./src/app');
    expect(scrollToOffset).not.toHaveBeenCalled();
    await journey.openBox();
    await waitFor(() =>
      expect(scrollToOffset).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 })),
    );
  });
});
