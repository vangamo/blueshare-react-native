import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { EditEventDialog } from '@/components/edit-event-dialog';
import { ItemsProvider } from '@/components/items-provider';
import { useTimeline } from '@/hooks/use-timeline';
import { createItemsModule } from '@/items/application/items-module';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { NodePhotoStore, writeFixturePhoto } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

/** What the seeded event holds: id `id-1`, photos `id-2.png`, `id-3.png`, `id-4.png` in order. */
export const SEEDED_EVENT = {
  title: 'Viaje a Cádiz',
  category: 'Familia',
  description: 'Lo pasamos genial',
  files: ['id-2.png', 'id-3.png', 'id-4.png'],
} as const;

/** Adapters on a database already holding one event item with three photos. */
export async function seededEventAdapters({
  wrap = (db: SqlDatabase) => db,
  description = SEEDED_EVENT.description as string | null,
} = {}): Promise<AppAdapters> {
  const db = new NodeSqlDatabase();
  let next = 0;
  let time = 1_700_000_000_000;
  const adapters = {
    db,
    ids: { newId: () => `id-${++next}` },
    clock: { now: () => time++ },
    photos: new NodePhotoStore(),
  };
  const { store } = createItemsModule(adapters);
  await store.createEvent({
    photos: [1, 2, 3].map((n) => ({
      uri: writeFixturePhoto(`seed-${n}.png`),
      width: 400,
      height: 300,
      mimeType: 'image/png',
    })),
    title: SEEDED_EVENT.title,
    category: SEEDED_EVENT.category,
    description,
  });
  return { ...adapters, db: wrap(db) };
}

function Host({ onClosed }: { onClosed: () => void }) {
  const { items } = useTimeline();
  const [editingId, setEditingId] = useState<string | null>(null);
  const found = items.find((item) => item.id === editingId);
  const editing = found?.type === 'event' ? found : undefined;
  return (
    <>
      {items.map((item) =>
        item.type === 'event' ? (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel="Abrir evento"
            onPress={() => setEditingId(item.id)}>
            <Text testID="stored-event">
              {[item.photos.map((photo) => photo.file).join(','), item.title, item.category, item.description ?? ''].join(
                '|',
              )}
            </Text>
          </Pressable>
        ) : null,
      )}
      {editing ? (
        <EditEventDialog
          key={editing.id}
          item={editing}
          onClose={() => {
            setEditingId(null);
            onClosed();
          }}
        />
      ) : null}
    </>
  );
}

/** The event items of the timeline, each opening the event dialog, outside the router. */
export function EditEventDialogHarness({
  adapters,
  onClosed = () => {},
}: {
  adapters: AppAdapters;
  onClosed?: () => void;
}) {
  return (
    <ItemsProvider adapters={adapters}>
      <Host onClosed={onClosed} />
    </ItemsProvider>
  );
}
