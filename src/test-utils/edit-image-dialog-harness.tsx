import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { EditImageDialog } from '@/components/edit-image-dialog';
import { ItemsProvider } from '@/components/items-provider';
import { useTimeline } from '@/hooks/use-timeline';
import { createItemsModule } from '@/items/application/items-module';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { NodePhotoStore, writeFixturePhoto } from '@/test-utils/node-photo-store';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

/** What an image item holds when seeded, so tests can assert on it. */
export const SEEDED_IMAGE = {
  altText: 'Cuatro personas pintando',
  caption: 'Taller',
  width: 4000,
  height: 3000,
} as const;

/** Adapters on a database already holding one image item (`id-1`, photo file `id-2.png`). */
export async function seededImageAdapters(
  wrap: (db: SqlDatabase) => SqlDatabase = (db) => db,
): Promise<AppAdapters> {
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
  await store.createImage({
    photo: { uri: writeFixturePhoto(), width: SEEDED_IMAGE.width, height: SEEDED_IMAGE.height, mimeType: 'image/png' },
    altText: SEEDED_IMAGE.altText,
    caption: SEEDED_IMAGE.caption,
  });
  return { ...adapters, db: wrap(db) };
}

function Host({ onClosed }: { onClosed: () => void }) {
  const { items } = useTimeline();
  const [editingId, setEditingId] = useState<string | null>(null);
  const found = items.find((item) => item.id === editingId);
  const editing = found?.type === 'image' ? found : undefined;
  return (
    <>
      {items.map((item) =>
        item.type === 'image' ? (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel="Abrir imagen"
            onPress={() => setEditingId(item.id)}>
            <Text testID="stored-image">
              {[item.photo.file, item.altText ?? '', item.caption ?? ''].join('|')}
            </Text>
          </Pressable>
        ) : null,
      )}
      {editing ? (
        <EditImageDialog
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

/** The image items of the timeline, each opening the image dialog, outside the router. */
export function EditImageDialogHarness({
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
