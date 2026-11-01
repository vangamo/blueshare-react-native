import { TEXT_MAX_LENGTH } from '@/constants/limits';
import { createTextItem } from '@/items/application/create-text-item';
import { listTimeline } from '@/items/application/list-timeline';
import { InvalidTextError } from '@/items/domain/errors';
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
  return { db, create: createTextItem(deps), list: listTimeline(deps) };
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
