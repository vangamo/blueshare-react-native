import { createAppAdapters } from '@/items/infrastructure/app-adapters';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createAppAdapters in Jest', () => {
  test('gives a working node:sqlite database', async () => {
    const { db } = createAppAdapters();
    expect(await db.getFirst('SELECT 1 AS one')).toEqual({ one: 1 });
  });

  test('gives a fresh database on every call', async () => {
    const first = createAppAdapters().db;
    await first.exec('CREATE TABLE t (x INTEGER)');
    const second = createAppAdapters().db;
    expect(await second.getFirst("SELECT name FROM sqlite_master WHERE name = 't'")).toBeNull();
  });

  test('gives version 4 UUIDs and the current time', () => {
    const { ids, clock } = createAppAdapters();
    const [a, b] = [ids.newId(), ids.newId()];
    expect(a).toMatch(UUID_V4);
    expect(b).toMatch(UUID_V4);
    expect(a).not.toBe(b);
    expect(Math.abs(clock.now() - Date.now())).toBeLessThan(1000);
  });
});
