import { createItemsModule } from '@/items/application/items-module';
import type { TimelineStore } from '@/items/application/timeline-store';
import type { SqlDatabase } from '@/items/infrastructure/sql-database';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { fixedClock, sequentialIds } from '@/test-utils/item-test-deps';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';

let run = 0;

/** A store on `db`, as if the app had just started (its own clock and IDs). */
function storeOn(db: SqlDatabase) {
  run += 1;
  const ids = sequentialIds(`run${run}-`);
  return createItemsModule({ db, clock: fixedClock(run * 1000, 1), ids }).store;
}

/** Subscribes and resolves once the store leaves `loading`. */
function loaded(store: TimelineStore) {
  return new Promise<void>((resolve) => {
    const unsubscribe = store.subscribe(() => {
      if (store.getSnapshot().status !== 'loading') {
        unsubscribe();
        resolve();
      }
    });
  });
}

const bodies = (store: TimelineStore) => store.getSnapshot().items.map((item) => item.body);

describe('timeline store', () => {
  test('starts loading and becomes ready with the stored items', async () => {
    const db = new NodeSqlDatabase();
    const first = storeOn(db);
    await loaded(first);
    await first.createText('Uno');

    const store = storeOn(db);
    expect(store.getSnapshot()).toEqual({ status: 'loading', items: [] });
    await loaded(store);
    expect(store.getSnapshot().status).toBe('ready');
    expect(bodies(store)).toEqual(['Uno']);
  });

  test.each([
    ['migrating', (sql: string) => sql.includes('CREATE TABLE')],
    ['listing', (sql: string) => sql.includes('LEFT JOIN')],
  ])('is in error when %s fails', async (_, shouldFail) => {
    const store = storeOn(new FailingSqlDatabase(new NodeSqlDatabase(), shouldFail));
    await loaded(store);
    expect(store.getSnapshot()).toEqual({ status: 'error', items: [] });
  });

  test('createText waits for the load and puts the new item first', async () => {
    const db = new NodeSqlDatabase();
    const seed = storeOn(db);
    await seed.createText('Viejo');

    const store = storeOn(db);
    // Not subscribed yet: createText starts and waits for the load itself.
    await store.createText('Nuevo');
    expect(store.getSnapshot().status).toBe('ready');
    expect(bodies(store)).toEqual(['Nuevo', 'Viejo']);
  });

  test('notifies subscribers when an item is created', async () => {
    const store = storeOn(new NodeSqlDatabase());
    await loaded(store);
    const listener = jest.fn();
    store.subscribe(listener);
    await store.createText('Hola');
    expect(listener).toHaveBeenCalled();
    expect(bodies(store)).toEqual(['Hola']);
  });

  test('a failed createText rejects and leaves the items unchanged', async () => {
    const inner = new NodeSqlDatabase();
    const store = storeOn(
      new FailingSqlDatabase(inner, (sql) => sql.includes('INSERT INTO text_items')),
    );
    await loaded(store);
    const before = store.getSnapshot();

    await expect(store.createText('Hola')).rejects.toThrow(/Injected failure/);
    expect(store.getSnapshot()).toBe(before);
    expect(await inner.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('getSnapshot returns the same object while nothing changes', async () => {
    const store = storeOn(new NodeSqlDatabase());
    const initial = store.getSnapshot();
    expect(store.getSnapshot()).toBe(initial);
    await loaded(store);
    const ready = store.getSnapshot();
    expect(ready).not.toBe(initial);
    expect(store.getSnapshot()).toBe(ready);
  });

  describe('updateText and deleteItem', () => {
    async function threeItems(db = new NodeSqlDatabase()) {
      const store = storeOn(db);
      await store.createText('Uno');
      await store.createText('Dos');
      await store.createText('Tres');
      return { db, store };
    }
    const idOf = (store: TimelineStore, body: string) =>
      store.getSnapshot().items.find((item) => item.body === body)!.id;

    test('both wait for the first load', async () => {
      const { db } = await threeItems();
      const store = storeOn(db); // not subscribed yet
      const id = (await db.getFirst<{ id: string }>(
        "SELECT item_id AS id FROM text_items WHERE body = 'Dos'",
      ))!.id;

      await store.updateText(id, 'Dos editado');
      expect(bodies(store)).toEqual(['Tres', 'Dos editado', 'Uno']);

      const other = storeOn(db);
      await other.deleteItem(id);
      expect(bodies(other)).toEqual(['Tres', 'Uno']);
    });

    test('an edit replaces the item in place and keeps the order', async () => {
      const { store } = await threeItems();
      const listener = jest.fn();
      store.subscribe(listener);

      await store.updateText(idOf(store, 'Uno'), 'Uno editado');

      expect(bodies(store)).toEqual(['Tres', 'Dos', 'Uno editado']);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('an unchanged edit keeps the same snapshot object', async () => {
      const { store } = await threeItems();
      const before = store.getSnapshot();

      await store.updateText(idOf(store, 'Dos'), '  Dos ');

      expect(store.getSnapshot()).toBe(before);
    });

    test('a deletion removes only that item', async () => {
      const { store } = await threeItems();

      await store.deleteItem(idOf(store, 'Dos'));

      expect(bodies(store)).toEqual(['Tres', 'Uno']);
    });

    test('a failed edit or deletion rejects and leaves the snapshot object unchanged', async () => {
      const inner = new NodeSqlDatabase();
      const seeded = (await threeItems(inner)).store;
      const id = idOf(seeded, 'Dos');
      const failing = storeOn(
        new FailingSqlDatabase(inner, (sql) => /UPDATE text_items|DELETE FROM items/.test(sql)),
      );
      await loaded(failing);
      const before = failing.getSnapshot();

      await expect(failing.updateText(id, 'X')).rejects.toThrow(/Injected failure/);
      await expect(failing.deleteItem(id)).rejects.toThrow(/Injected failure/);

      expect(failing.getSnapshot()).toBe(before);
      expect(bodies(failing)).toEqual(['Tres', 'Dos', 'Uno']);
    });
  });
});
