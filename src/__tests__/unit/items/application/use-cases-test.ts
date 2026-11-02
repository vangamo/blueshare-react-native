import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { createTextItem } from '@/items/application/create-text-item';
import { deleteItem } from '@/items/application/delete-item';
import { listTimeline } from '@/items/application/list-timeline';
import { updateTextItem } from '@/items/application/update-text-item';
import { InvalidTextError, ItemNotFoundError } from '@/items/domain/errors';
import { migrate } from '@/items/infrastructure/migrations';
import { SqliteItemRepository } from '@/items/infrastructure/sqlite-item-repository';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

const NOW = 1_700_000_000_000;

async function setup() {
  const db = new NodeSqlDatabase();
  await migrate(db);
  const deps = {
    repository: new SqliteItemRepository(db),
    clock: fixedClock(NOW, 1),
    ids: sequentialIds(),
  };
  return {
    db,
    create: createTextItem(deps),
    list: listTimeline(deps),
    update: updateTextItem(deps),
    remove: deleteItem(deps),
  };
}

describe('createTextItem', () => {
  test('creates a text item with the common record', async () => {
    const { create, list } = await setup();
    const item = await create('  Hoy hemos jugado al parchís.  ');

    expect(item).toEqual({
      id: 'id-1',
      type: 'text',
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
      body: 'Hoy hemos jugado al parchís.',
    });
    expect(await list()).toEqual([item]);
  });

  test.each([
    ['blank', ' \n\t '],
    ['too long', 'a'.repeat(TEXT_MAX_LENGTH + 1)],
  ])('rejects %s text and stores nothing', async (_, raw) => {
    const { db, create } = await setup();
    await expect(create(raw)).rejects.toBeInstanceOf(InvalidTextError);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
    expect(await db.getAll('SELECT item_id FROM text_items')).toEqual([]);
  });
});

describe('listTimeline', () => {
  test('lists created items newest first', async () => {
    const { create, list } = await setup();
    await create('Primero');
    await create('Segundo');
    expect((await list()).map((item) => item.body)).toEqual(['Segundo', 'Primero']);
  });
});

describe('updateTextItem', () => {
  test('stores the new text with the current time and returns the item', async () => {
    const { create, update, list } = await setup();
    const item = await create('Hola');

    const updated = await update(item.id, '  Hola, abuela ');

    expect(updated).toEqual({ ...item, body: 'Hola, abuela', updatedAt: updated.updatedAt });
    expect(updated.updatedAt).toBeGreaterThan(item.updatedAt);
    expect(await list()).toEqual([updated]);
  });

  test('an unchanged text writes nothing', async () => {
    const { db, create, update } = await setup();
    const item = await create('Hola');

    expect(await update(item.id, '  Hola \n')).toEqual(item);

    expect(await db.getAll('SELECT item_id FROM items_history')).toEqual([]);
  });

  test.each([
    ['blank', ' \n'],
    ['too long', 'a'.repeat(TEXT_MAX_LENGTH + 1)],
  ])('rejects %s text with nothing stored', async (_name, raw) => {
    const { db, create, update, list } = await setup();
    const item = await create('Hola');

    await expect(update(item.id, raw)).rejects.toBeInstanceOf(InvalidTextError);

    expect(await list()).toEqual([item]);
    expect(await db.getAll('SELECT item_id FROM items_history')).toEqual([]);
  });

  test('an unknown id throws ItemNotFoundError', async () => {
    const { update } = await setup();
    await expect(update('nope', 'x')).rejects.toBeInstanceOf(ItemNotFoundError);
  });
});

describe('deleteItem', () => {
  test('uses the clock for the deletion time and hides the item', async () => {
    const { db, create, remove, list } = await setup();
    const item = await create('Hola');

    await remove(item.id);

    expect(await list()).toEqual([]);
    const row = await db.getFirst<{ deleted_at: number }>(
      'SELECT deleted_at FROM items_history WHERE item_id = ?',
      [item.id],
    );
    expect(row?.deleted_at).toBeGreaterThan(item.createdAt);
  });

  test('an unknown id throws ItemNotFoundError', async () => {
    const { remove } = await setup();
    await expect(remove('nope')).rejects.toBeInstanceOf(ItemNotFoundError);
  });
});
