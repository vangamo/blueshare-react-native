import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { EditTextDialog } from '@/components/edit-text-dialog';
import { ItemsProvider } from '@/components/items-provider';
import { useTimeline } from '@/hooks/use-timeline';
import { createItemsModule } from '@/items/application/items-module';
import type { AppAdapters } from '@/items/infrastructure/app-adapters';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

/** Adapters on a database already holding `bodies` (the first one created is oldest). */
export async function seededAdapters(
  bodies: string[],
  wrap: (db: SqlDatabase) => SqlDatabase = (db) => db,
): Promise<AppAdapters> {
  const db = new NodeSqlDatabase();
  let next = 0;
  let time = 1_700_000_000_000;
  const adapters = { db, ids: { newId: () => `id-${++next}` }, clock: { now: () => time++ } };
  const { store } = createItemsModule(adapters);
  for (const body of bodies) await store.createText(body);
  return { ...adapters, db: wrap(db) };
}

function Host({ onClosed }: { onClosed: () => void }) {
  const { items } = useTimeline();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = items.find((item) => item.id === editingId);
  return (
    <>
      {items.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${item.body}`}
          onPress={() => setEditingId(item.id)}>
          <Text testID="stored-item">{item.body}</Text>
        </Pressable>
      ))}
      {editing ? (
        <EditTextDialog
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

/** The timeline bodies, each opening the edit dialog, outside the router. */
export function EditDialogHarness({
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
