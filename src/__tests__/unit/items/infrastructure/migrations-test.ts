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
    expect(MIGRATIONS).toHaveLength(4);
    expect(await schemaVersion(db)).toBe(4);
    const objects = await db.getAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    expect(objects.map((o) => o.name)).toEqual([
      'event_item_photos',
      'event_item_photos_history',
      'event_items',
      'event_items_history',
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

    expect(await schemaVersion(db)).toBe(MIGRATIONS.length);
    expect(await bodies(db)).toEqual(['Uno']);
    expect(await db.getAll('SELECT body FROM text_items_history')).toEqual([{ body: 'Antes' }]);
    expect(await db.getAll('SELECT item_id FROM image_items')).toEqual([]);
  });

  test('a version 3 database with text and image items and their history upgrades keeping everything', async () => {
    const db = new NodeSqlDatabase();
    await migrate(db, MIGRATIONS.slice(0, 3));
    await insertText(db, 'a', 'Uno');
    await db.run(
      'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
      ['i', 'image', 2, 3, null],
    );
    await db.run(
      'INSERT INTO image_items (item_id, photo_file, photo_width, photo_height, alt_text, caption) VALUES (?, ?, ?, ?, ?, ?)',
      ['i', 'p2.jpg', 40, 30, 'Una playa', 'Verano'],
    );
    await db.run(
      'INSERT INTO items_history (item_id, counter, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?)',
      ['i', 1, 'image', 2, 2, null],
    );
    await db.run(
      'INSERT INTO image_items_history (item_id, counter, photo_file, photo_width, photo_height, alt_text, caption) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['i', 1, 'p1.jpg', 10, 20, null, 'Antes'],
    );
    expect(await schemaVersion(db)).toBe(3);

    await migrate(db);

    expect(await schemaVersion(db)).toBe(4);
    expect(await bodies(db)).toEqual(['Uno']);
    expect(await db.getAll('SELECT item_id, photo_file, caption FROM image_items')).toEqual([
      { item_id: 'i', photo_file: 'p2.jpg', caption: 'Verano' },
    ]);
    expect(await db.getAll('SELECT counter, photo_file, caption FROM image_items_history')).toEqual([
      { counter: 1, photo_file: 'p1.jpg', caption: 'Antes' },
    ]);
    expect(await db.getAll('SELECT item_id FROM event_items')).toEqual([]);
  });

  describe('event photo rows', () => {
    async function eventDb() {
      const db = new NodeSqlDatabase();
      await migrate(db);
      await db.run(
        'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
        ['e', 'event', 1, 1, null],
      );
      await db.run('INSERT INTO event_items (item_id, title, category, description) VALUES (?, ?, ?, ?)', [
        'e',
        'Viaje',
        'Familia',
        null,
      ]);
      return db;
    }
    const insertPhoto = (db: NodeSqlDatabase, position: number, width: number, height: number) =>
      db.run(
        'INSERT INTO event_item_photos (item_id, position, photo_file, photo_width, photo_height) VALUES (?, ?, ?, ?, ?)',
        ['e', position, `p${position}.jpg`, width, height],
      );

    test.each([
      ['a zero width', 0, 0, 10],
      ['a zero height', 0, 10, 0],
      ['a negative position', -1, 10, 10],
    ])('%s is rejected', async (_name, position, width, height) => {
      const db = await eventDb();
      await expect(insertPhoto(db, position, width, height)).rejects.toThrow(/CHECK/i);
    });

    test('two photos at one position are rejected', async () => {
      const db = await eventDb();
      await insertPhoto(db, 0, 10, 10);
      await expect(insertPhoto(db, 0, 20, 20)).rejects.toThrow(/UNIQUE|PRIMARY KEY/i);
    });

    test('a history photo row needs a matching history item row', async () => {
      const db = await eventDb();
      await expect(
        db.run(
          'INSERT INTO event_item_photos_history (item_id, counter, position, photo_file, photo_width, photo_height) VALUES (?, ?, ?, ?, ?, ?)',
          ['e', 1, 0, 'p.jpg', 10, 10],
        ),
      ).rejects.toThrow(/FOREIGN KEY/i);
    });
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
