import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ItemsProvider } from '@/components/items-provider';
import { useProfile } from '@/hooks/use-profile';
import { useTimeline } from '@/hooks/use-timeline';
import { MIGRATIONS, schemaVersion } from '@/items/infrastructure/migrations';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodePhotoStore } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

function Status() {
  const timeline = useTimeline();
  const { status, profile } = useProfile();
  return (
    <Text testID="status">{`${timeline.status}|${status}|${profile?.id ?? 'none'}`}</Text>
  );
}

describe('ItemsProvider', () => {
  test('the timeline and the profile both load, and the migrations run once', async () => {
    const db = new NodeSqlDatabase();
    const transaction = jest.spyOn(db, 'transaction');
    const adapters: AppAdapters = {
      db,
      ids: sequentialIds(),
      clock: fixedClock(),
      photos: new NodePhotoStore(),
    };

    await render(
      <ItemsProvider adapters={adapters}>
        <Status />
      </ItemsProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('ready|ready|id-1'));
    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    // One transaction per migration step: a second run would add more.
    expect(transaction).toHaveBeenCalledTimes(MIGRATIONS.length);
    expect(await db.getAll('SELECT id FROM people WHERE is_me = 1')).toHaveLength(1);
  });
});
