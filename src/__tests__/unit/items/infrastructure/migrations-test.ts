import { MIGRATIONS, migrate, schemaVersion } from '@/items/infrastructure/migrations';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

const STEP_2 = 'ALTER TABLE items ADD COLUMN extra TEXT';

async function insertText(db: NodeSqlDatabase, id: string, body: string) {
  await db.run(
    'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
    [id, 'text', 1, 1, null],
  );
  await db.run('INSERT INTO text_items (item_id, body) VALUES (?, ?)', [id, body]);
}

async function bodies(db: NodeSqlDatabase) {
  const rows = await db.getAll<{ body: string }>('SELECT body FROM text_items ORDER BY body');
  return rows.map((row) => row.body);
}

describe('migrate', () => {
  test('a fresh database ends at version 1 with the tables and index', async () => {
    const db = new NodeSqlDatabase();
    expect(await schemaVersion(db)).toBe(0);
    await migrate(db);

    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(MIGRATIONS).toHaveLength(1);
    const objects = await db.getAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    expect(objects.map((o) => o.name)).toEqual(['items', 'items_timeline', 'text_items']);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('an up-to-date database runs no step', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db);
    await insertText(db, 'a', 'Uno');
    const transaction = jest.spyOn(db, 'transaction');

    await migrate(db);

    expect(transaction).not.toHaveBeenCalled();
    expect(await schemaVersion(db)).toBe(1);
    expect(await bodies(db)).toEqual(['Uno']);
  });

  test('an extra step runs once and keeps the existing items', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db);
    await insertText(db, 'a', 'Uno');

    await migrate(db, [...MIGRATIONS, STEP_2]);
    await migrate(db, [...MIGRATIONS, STEP_2]); // would fail with "duplicate column" if rerun

    expect(await schemaVersion(db)).toBe(2);
    expect(await bodies(db)).toEqual(['Uno']);
    expect(await db.getFirst('SELECT extra FROM items WHERE id = ?', ['a'])).toEqual({
      extra: null,
    });
  });

  test('a failing step leaves both the version and the data unchanged', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db);
    await insertText(db, 'a', 'Uno');
    const failing = `${STEP_2}; DELETE FROM text_items; SELECT * FROM missing_table;`;

    await expect(migrate(db, [...MIGRATIONS, failing])).rejects.toThrow(/missing_table/);

    expect(await schemaVersion(db)).toBe(1);
    expect(await bodies(db)).toEqual(['Uno']);
    await expect(db.getFirst('SELECT extra FROM items')).rejects.toThrow(/no such column/);
  });
});
