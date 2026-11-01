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
