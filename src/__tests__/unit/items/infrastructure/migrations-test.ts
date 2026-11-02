import { MIGRATIONS, migrate, schemaVersion } from '@/items/infrastructure/migrations';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

const EXTRA_STEP = 'ALTER TABLE items ADD COLUMN extra TEXT';

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
  test('a fresh database ends at the latest version with the tables and index', async () => {
    const db = new NodeSqlDatabase();
    expect(await schemaVersion(db)).toBe(0);
    await migrate(db);

    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(MIGRATIONS).toHaveLength(3);
    const objects = await db.getAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    expect(objects.map((o) => o.name)).toEqual([
      'image_items',
      'image_items_history',
      'items',
      'items_history',
      'items_timeline',
      'text_items',
      'text_items_history',
    ]);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('an up-to-date database runs no step', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db);
    await insertText(db, 'a', 'Uno');
    const transaction = jest.spyOn(db, 'transaction');

    await migrate(db);

    expect(transaction).not.toHaveBeenCalled();
    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(await bodies(db)).toEqual(['Uno']);
  });

  test('an extra step runs once and keeps the existing items', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db);
    await insertText(db, 'a', 'Uno');

    await migrate(db, [...MIGRATIONS, EXTRA_STEP]);
    await migrate(db, [...MIGRATIONS, EXTRA_STEP]); // would fail with "duplicate column" if rerun

    expect(await schemaVersion(db)).toBe(MIGRATIONS.length + 1);
    expect(await bodies(db)).toEqual(['Uno']);
    expect(await db.getFirst('SELECT extra FROM items WHERE id = ?', ['a'])).toEqual({
      extra: null,
    });
  });

  test('a failing step leaves both the version and the data unchanged', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db);
    await insertText(db, 'a', 'Uno');
    const failing = `${EXTRA_STEP}; DELETE FROM text_items; SELECT * FROM missing_table;`;

    await expect(migrate(db, [...MIGRATIONS, failing])).rejects.toThrow(/missing_table/);

    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(await bodies(db)).toEqual(['Uno']);
    await expect(db.getFirst('SELECT extra FROM items')).rejects.toThrow(/no such column/);
  });

  test('a version 1 database with items is upgraded once and keeps every item', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db, MIGRATIONS.slice(0, 1));
    await insertText(db, 'a', 'Uno');
    expect(await schemaVersion(db)).toBe(1);

    await migrate(db);

    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(await bodies(db)).toEqual(['Uno']);
    expect(await db.getAll('SELECT item_id FROM items_history')).toEqual([]);
  });

  test('a version 2 database with text items and history upgrades keeping everything', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db, MIGRATIONS.slice(0, 2));
    await insertText(db, 'a', 'Uno');
    await db.run(
      'INSERT INTO items_history (item_id, counter, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['a', 1, 'text', 1, 1, null],
    );
    await db.run('INSERT INTO text_items_history (item_id, counter, body) VALUES (?, ?, ?)', ['a', 1, 'Antes']);
    expect(await schemaVersion(db)).toBe(2);

    await migrate(db);

    expect(await schemaVersion(db)).toBe(3);
    expect(await bodies(db)).toEqual(['Uno']);
    expect(await db.getAll('SELECT body FROM text_items_history')).toEqual([{ body: 'Antes' }]);
    expect(await db.getAll('SELECT item_id FROM image_items')).toEqual([]);
  });

  test.each([
    ['width', 0, 10],
    ['height', 10, 0],
  ])('an image row with a zero %s is rejected', async (_name, width, height) => {
    const db = new NodeSqlDatabase();
    await migrate(db);
    await db.run(
      'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
      ['i', 'image', 1, 1, null],
    );

    await expect(
      db.run(
        'INSERT INTO image_items (item_id, photo_file, photo_width, photo_height) VALUES (?, ?, ?, ?)',
        ['i', 'a.jpg', width, height],
      ),
    ).rejects.toThrow(/CHECK/i);
  });

  test('a history text row needs a matching history item row', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db);

    await expect(
      db.run('INSERT INTO text_items_history (item_id, counter, body) VALUES (?, ?, ?)', ['a', 1, 'x']),
    ).rejects.toThrow(/FOREIGN KEY/i);
  });
});
