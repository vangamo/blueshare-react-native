import { ItemNotFoundError } from '@/items/domain/errors';
import type { TextItem } from '@/items/domain/text-item';
import { migrate } from '@/items/infrastructure/migrations';
import { SqliteItemRepository } from '@/items/infrastructure/sqlite-item-repository';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

function textItem(id: string, body: string, createdAt: number): TextItem {
  return { id, type: 'text', createdAt, updatedAt: createdAt, deletedAt: null, body };
}

async function setup() {
  const db = new NodeSqlDatabase();
  await migrate(db);
  return { db, repository: new SqliteItemRepository(db) };
}

describe('SqliteItemRepository', () => {
  test('saves a text item and lists it with every field', async () => {
    const { repository } = await setup();
    const item = textItem('id-1', 'Hola', 1000);
    await repository.saveText(item);
    expect(await repository.listTimeline()).toEqual([item]);
  });

  test('lists newest first, keeping insertion order for equal creation times', async () => {
    const { repository } = await setup();
    await repository.saveText(textItem('a', 'Primero', 1000));
    await repository.saveText(textItem('b', 'Segundo', 2000));
    await repository.saveText(textItem('c', 'Tercero', 2000));

    const bodies = (await repository.listTimeline()).map((item) => item.body);
    expect(bodies).toEqual(['Tercero', 'Segundo', 'Primero']);
  });

  test('a deleted row stays in the table but is not listed', async () => {
    const { db, repository } = await setup();
    await repository.saveText(textItem('a', 'Visible', 1000));
    await repository.saveText(textItem('b', 'Borrado', 2000));
    await db.run('UPDATE items SET deleted_at = ? WHERE id = ?', [3000, 'b']);

    expect((await repository.listTimeline()).map((item) => item.id)).toEqual(['a']);
    expect(await db.getFirst('SELECT deleted_at FROM items WHERE id = ?', ['b'])).toEqual({
      deleted_at: 3000,
    });
  });

  test('saving is all or nothing: a failing text insert leaves no item row', async () => {
    const { db } = await setup();
    const failing = new FailingSqlDatabase(db, (sql) => sql.includes('INSERT INTO text_items'));
    const repository = new SqliteItemRepository(failing);

    await expect(repository.saveText(textItem('a', 'Hola', 1000))).rejects.toThrow(
      /Injected failure/,
    );

    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
    expect(await repository.listTimeline()).toEqual([]);
  });
});

type HistoryRow = {
  counter: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  body: string;
};

function history(db: NodeSqlDatabase, id: string) {
  return db.getAll<HistoryRow>(
    `SELECT h.counter, h.created_at, h.updated_at, h.deleted_at, t.body
     FROM items_history h JOIN text_items_history t ON t.item_id = h.item_id AND t.counter = h.counter
     WHERE h.item_id = ? ORDER BY h.counter`,
    [id],
  );
}

const edited = (item: TextItem, body: string, updatedAt: number): TextItem => ({
  ...item,
  body,
  updatedAt,
});

describe('SqliteItemRepository.findText', () => {
  test('returns the live item, and null for an unknown or deleted id', async () => {
    const { repository } = await setup();
    const item = textItem('a', 'Hola', 1000);
    await repository.saveText(item);

    expect(await repository.findText('a')).toEqual(item);
    expect(await repository.findText('zzz')).toBeNull();
    await repository.deleteItem('a', 2000);
    expect(await repository.findText('a')).toBeNull();
  });
});

describe('SqliteItemRepository.updateText', () => {
  test('keeps id and creation time, and archives the previous version', async () => {
    const { db, repository } = await setup();
    const item = textItem('a', 'A', 1000);
    await repository.saveText(item);

    await repository.updateText(edited(item, 'B', 2000));

    expect(await repository.findText('a')).toEqual(edited(item, 'B', 2000));
    expect(await history(db, 'a')).toEqual([
      { counter: 1, created_at: 1000, updated_at: 1000, deleted_at: null, body: 'A' },
    ]);
  });

  test('two edits in the same millisecond get versions 1 and 2', async () => {
    const { db, repository } = await setup();
    const item = textItem('a', 'A', 1000);
    await repository.saveText(item);

    await repository.updateText(edited(item, 'B', 2000));
    await repository.updateText(edited(item, 'C', 2000));

    expect((await history(db, 'a')).map((row) => [row.counter, row.body])).toEqual([
      [1, 'A'],
      [2, 'B'],
    ]);
  });

  test('keeps the position in the timeline', async () => {
    const { repository } = await setup();
    const first = textItem('a', 'Primero', 1000);
    await repository.saveText(first);
    await repository.saveText(textItem('b', 'Segundo', 2000));

    await repository.updateText(edited(first, 'Primero editado', 3000));

    expect((await repository.listTimeline()).map((item) => item.body)).toEqual([
      'Segundo',
      'Primero editado',
    ]);
  });

  test('an unknown id throws ItemNotFoundError and writes nothing', async () => {
    const { db, repository } = await setup();
    await expect(repository.updateText(textItem('nope', 'X', 1))).rejects.toBeInstanceOf(
      ItemNotFoundError,
    );
    expect(await db.getAll('SELECT item_id FROM items_history')).toEqual([]);
  });

  test('a failing text update leaves no history row and the old text', async () => {
    const { db } = await setup();
    const item = textItem('a', 'A', 1000);
    await new SqliteItemRepository(db).saveText(item);
    const failing = new SqliteItemRepository(
      new FailingSqlDatabase(db, (sql) => sql.includes('UPDATE text_items')),
    );

    await expect(failing.updateText(edited(item, 'B', 2000))).rejects.toThrow(/Injected failure/);

    expect(await history(db, 'a')).toEqual([]);
    expect(await new SqliteItemRepository(db).findText('a')).toEqual(item);
  });
});

describe('SqliteItemRepository.deleteItem', () => {
  test('keeps every version in the history and removes the live rows', async () => {
    const { db, repository } = await setup();
    const item = textItem('a', 'A', 1000);
    await repository.saveText(item);
    await repository.updateText(edited(item, 'B', 2000));
    await repository.updateText(edited(item, 'C', 3000));

    await repository.deleteItem('a', 4000);

    expect((await history(db, 'a')).map((r) => [r.counter, r.body, r.deleted_at])).toEqual([
      [1, 'A', null],
      [2, 'B', null],
      [3, 'C', 4000],
    ]);
    expect(await repository.listTimeline()).toEqual([]);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
    expect(await db.getAll('SELECT item_id FROM text_items')).toEqual([]);
  });

  test('an unknown or already deleted id throws ItemNotFoundError', async () => {
    const { repository } = await setup();
    await repository.saveText(textItem('a', 'A', 1000));
    await repository.deleteItem('a', 2000);

    await expect(repository.deleteItem('a', 3000)).rejects.toBeInstanceOf(ItemNotFoundError);
    await expect(repository.deleteItem('zzz', 3000)).rejects.toBeInstanceOf(ItemNotFoundError);
  });

  test('a failing delete leaves no history row and keeps the item listed', async () => {
    const { db } = await setup();
    const item = textItem('a', 'A', 1000);
    await new SqliteItemRepository(db).saveText(item);
    const failing = new SqliteItemRepository(
      new FailingSqlDatabase(db, (sql) => sql.includes('DELETE FROM items')),
    );

    await expect(failing.deleteItem('a', 2000)).rejects.toThrow(/Injected failure/);

    expect(await history(db, 'a')).toEqual([]);
    expect(await new SqliteItemRepository(db).listTimeline()).toEqual([item]);
  });
});
