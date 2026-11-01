import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

type Row = { id: number; name: string };

async function createDb() {
  const db = new NodeSqlDatabase();
  await db.exec(`
    CREATE TABLE parent (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER NOT NULL REFERENCES parent (id));
  `);
  return db;
}

describe('NodeSqlDatabase', () => {
  test('run, getAll and getFirst use positional parameters', async () => {
    const db = await createDb();
    await db.run('INSERT INTO parent (id, name) VALUES (?, ?)', [1, 'Uno']);
    await db.run('INSERT INTO parent (id, name) VALUES (?, ?)', [2, 'Dos']);

    expect(await db.getAll<Row>('SELECT id, name FROM parent ORDER BY id')).toEqual([
      { id: 1, name: 'Uno' },
      { id: 2, name: 'Dos' },
    ]);
    expect(await db.getFirst<Row>('SELECT id, name FROM parent WHERE id = ?', [2])).toEqual({
      id: 2,
      name: 'Dos',
    });
    expect(await db.getFirst<Row>('SELECT id, name FROM parent WHERE id = ?', [3])).toBeNull();
  });

  test('a transaction commits when work resolves', async () => {
    const db = await createDb();
    const value = await db.transaction(async (tx) => {
      await tx.run('INSERT INTO parent (id, name) VALUES (?, ?)', [1, 'Uno']);
      return 'done';
    });
    expect(value).toBe('done');
    expect(await db.getAll('SELECT id FROM parent')).toHaveLength(1);
  });

  test('a transaction rolls back when work throws', async () => {
    const db = await createDb();
    await expect(
      db.transaction(async (tx) => {
        await tx.run('INSERT INTO parent (id, name) VALUES (?, ?)', [1, 'Uno']);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(await db.getAll('SELECT id FROM parent')).toHaveLength(0);

    // The database is usable again after a rollback.
    await db.transaction((tx) => tx.run('INSERT INTO parent (id, name) VALUES (?, ?)', [2, 'Dos']));
    expect(await db.getAll('SELECT id FROM parent')).toHaveLength(1);
  });

  test('enforces foreign keys', async () => {
    const db = await createDb();
    await expect(db.run('INSERT INTO child (id, parent_id) VALUES (?, ?)', [1, 99])).rejects.toThrow(
      /FOREIGN KEY/,
    );
  });
});
