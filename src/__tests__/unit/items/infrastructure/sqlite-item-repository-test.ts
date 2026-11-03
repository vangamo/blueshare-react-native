import { ItemNotFoundError } from '@/items/domain/errors';
import type { EventItem } from '@/items/domain/event-item';
import type { ImageItem, StoredPhoto } from '@/items/domain/image-item';
import type { TextItem } from '@/items/domain/text-item';
import { migrate } from '@/items/infrastructure/migrations';
import { SqliteItemRepository } from '@/items/infrastructure/sqlite-item-repository';
import { FailingSqlDatabase } from '@/test-utils/failing-sql-database';
import { NodeSqlDatabase } from '@/test-utils/node-sql-database';
import { bodyOf } from '@/test-utils/item-helpers';

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

    const bodies = (await repository.listTimeline()).map(bodyOf);
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

    expect((await repository.listTimeline()).map(bodyOf)).toEqual([
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

function imageItem(id: string, createdAt: number, overrides: Partial<ImageItem> = {}): ImageItem {
  return {
    id,
    type: 'image',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    photo: { file: `${id}.jpg`, width: 400, height: 300 },
    altText: 'Una playa',
    caption: 'Verano',
    ...overrides,
  };
}

async function imageHistory(db: NodeSqlDatabase, id: string) {
  return db.getAll<{
    counter: number;
    photo_file: string;
    alt_text: string | null;
    caption: string | null;
    deleted_at: number | null;
  }>(
    `SELECT h.counter, m.photo_file, m.alt_text, m.caption, h.deleted_at
     FROM items_history h JOIN image_items_history m
       ON m.item_id = h.item_id AND m.counter = h.counter
     WHERE h.item_id = ? ORDER BY h.counter`,
    [id],
  );
}

describe('SqliteItemRepository image items', () => {
  test('saves, finds and lists an image item with every field', async () => {
    const { repository } = await setup();
    const item = imageItem('img', 1000, { altText: null });
    await repository.saveImage(item);

    expect(await repository.findImage('img')).toEqual(item);
    expect(await repository.listTimeline()).toEqual([item]);
  });

  test('lists image and text items together, newest first', async () => {
    const { repository } = await setup();
    await repository.saveText(textItem('t1', 'Uno', 1000));
    await repository.saveImage(imageItem('i1', 2000));
    await repository.saveText(textItem('t2', 'Dos', 3000));

    expect((await repository.listTimeline()).map((item) => item.id)).toEqual(['t2', 'i1', 't1']);
  });

  test('findImage returns null for text items, unknown ids and deleted items', async () => {
    const { repository } = await setup();
    await repository.saveText(textItem('t', 'Uno', 1000));
    await repository.saveImage(imageItem('i', 2000));
    await repository.deleteItem('i', 3000);

    expect(await repository.findImage('t')).toBeNull();
    expect(await repository.findImage('zzz')).toBeNull();
    expect(await repository.findImage('i')).toBeNull();
  });

  test('findText returns null for an image item', async () => {
    const { repository } = await setup();
    await repository.saveImage(imageItem('i', 1000));
    expect(await repository.findText('i')).toBeNull();
  });

  test('update archives version 1 with the previous content, then updates in place', async () => {
    const { db, repository } = await setup();
    const item = imageItem('i', 1000);
    await repository.saveImage(item);
    const edited: ImageItem = {
      ...item,
      photo: { file: 'new.jpg', width: 10, height: 20 },
      altText: null,
      caption: 'Otoño',
      updatedAt: 2000,
    };

    await repository.updateImage(edited);

    expect(await repository.findImage('i')).toEqual(edited);
    expect(await imageHistory(db, 'i')).toEqual([
      { counter: 1, photo_file: 'i.jpg', alt_text: 'Una playa', caption: 'Verano', deleted_at: null },
    ]);
  });

  test('a replaced photo and then a deletion give versions 1 and 2, deletion time on 2', async () => {
    const { db, repository } = await setup();
    const item = imageItem('i', 1000);
    await repository.saveImage(item);
    await repository.updateImage({ ...item, photo: { file: 'new.jpg', width: 5, height: 5 }, updatedAt: 2000 });

    await repository.deleteItem('i', 3000);

    expect((await imageHistory(db, 'i')).map((r) => [r.counter, r.photo_file, r.deleted_at])).toEqual([
      [1, 'i.jpg', null],
      [2, 'new.jpg', 3000],
    ]);
    expect(await repository.listTimeline()).toEqual([]);
    expect(await db.getAll('SELECT item_id FROM image_items')).toEqual([]);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('a failing image insert leaves no items row', async () => {
    const { db } = await setup();
    const failing = new SqliteItemRepository(
      new FailingSqlDatabase(db, (sql) => sql.includes('INSERT INTO image_items')),
    );

    await expect(failing.saveImage(imageItem('i', 1000))).rejects.toThrow(/Injected failure/);

    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
  });

  test('a failing update leaves the item and the history unchanged', async () => {
    const { db } = await setup();
    const item = imageItem('i', 1000);
    await new SqliteItemRepository(db).saveImage(item);
    const failing = new SqliteItemRepository(
      new FailingSqlDatabase(db, (sql) => sql.includes('UPDATE image_items')),
    );

    await expect(failing.updateImage({ ...item, caption: 'Otro', updatedAt: 2000 })).rejects.toThrow(
      /Injected failure/,
    );

    expect(await new SqliteItemRepository(db).findImage('i')).toEqual(item);
    expect(await imageHistory(db, 'i')).toEqual([]);
  });

  test('an unknown id throws ItemNotFoundError', async () => {
    const { repository } = await setup();
    await expect(repository.updateImage(imageItem('zzz', 1000))).rejects.toBeInstanceOf(
      ItemNotFoundError,
    );
  });
});

const photo = (file: string): StoredPhoto => ({
  file,
  width: 400,
  height: 300,
});
const [P1, P2, P3] = [photo('p1.jpg'), { file: 'p2.png', width: 30, height: 90 }, photo('p3.jpg')];

function eventItem(id: string, createdAt: number, overrides: Partial<EventItem> = {}): EventItem {
  return {
    id,
    type: 'event',
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    title: 'Viaje',
    category: 'Familia',
    description: null,
    photos: [P1, P2],
    ...overrides,
  };
}

async function eventHistory(db: NodeSqlDatabase, id: string) {
  const versions = await db.getAll<{
    counter: number;
    title: string;
    category: string;
    description: string | null;
    deleted_at: number | null;
  }>(
    `SELECT h.counter, e.title, e.category, e.description, h.deleted_at
     FROM items_history h JOIN event_items_history e ON e.item_id = h.item_id AND e.counter = h.counter
     WHERE h.item_id = ? ORDER BY h.counter`,
    [id],
  );
  const photos = await db.getAll<{ counter: number; photo_file: string }>(
    `SELECT counter, photo_file FROM event_item_photos_history WHERE item_id = ? ORDER BY counter, position`,
    [id],
  );
  return versions.map((version) => ({
    ...version,
    photos: photos.filter((row) => row.counter === version.counter).map((row) => row.photo_file),
  }));
}

describe('SqliteItemRepository event items', () => {
  test('saves, finds and lists an event with its photos in order', async () => {
    const { repository } = await setup();
    const item = eventItem('e', 1000, {
      photos: [P3, P1, P2],
      description: 'Genial',
    });
    await repository.saveEvent(item);

    expect(await repository.findEvent('e')).toEqual(item);
    expect(await repository.listTimeline()).toEqual([item]);
  });

  test('lists events with text and image items, newest first, each with its own photos', async () => {
    const { repository } = await setup();
    const first = eventItem('e1', 1000, { photos: [P2] });
    const second = eventItem('e2', 4000, { photos: [P3, P1] });
    await repository.saveEvent(first);
    await repository.saveText(textItem('t', 'Uno', 2000));
    await repository.saveImage(imageItem('i', 3000));
    await repository.saveEvent(second);

    const items = await repository.listTimeline();
    expect(items.map((item) => item.id)).toEqual(['e2', 'i', 't', 'e1']);
    expect(items[0]).toEqual(second);
    expect(items[3]).toEqual(first);
  });

  test('the order survives reopening the database', async () => {
    const { db } = await setup();
    await new SqliteItemRepository(db).saveEvent(eventItem('e', 1000, { photos: [P3, P1, P2] }));

    const reopened = new SqliteItemRepository(db);
    expect((await reopened.findEvent('e'))?.photos).toEqual([P3, P1, P2]);
  });

  test('findEvent returns null for other types, unknown ids and deleted events', async () => {
    const { repository } = await setup();
    await repository.saveText(textItem('t', 'Uno', 1000));
    await repository.saveEvent(eventItem('e', 2000));
    await repository.deleteItem('e', 3000);

    expect(await repository.findEvent('t')).toBeNull();
    expect(await repository.findEvent('zzz')).toBeNull();
    expect(await repository.findEvent('e')).toBeNull();
    await repository.saveEvent(eventItem('e2', 4000));
    expect(await repository.findText('e2')).toBeNull();
    expect(await repository.findImage('e2')).toBeNull();
  });

  test('update rewrites the photo list in place and the item keeps its feed position', async () => {
    const { repository } = await setup();
    const item = eventItem('e', 1000);
    await repository.saveEvent(item);
    await repository.saveText(textItem('t', 'Después', 2000));
    const edited: EventItem = {
      ...item,
      photos: [P2, P3],
      category: 'Amigos',
      description: 'Nuevo',
      updatedAt: 3000,
    };

    await repository.updateEvent(edited);

    expect(await repository.findEvent('e')).toEqual(edited);
    expect((await repository.listTimeline()).map((i) => i.id)).toEqual(['t', 'e']);
  });

  test('history: a photo removed and one added, then deleted, gives versions 1 and 2 in order', async () => {
    const { db, repository } = await setup();
    const item = eventItem('e', 1000, { photos: [P1, P2] });
    await repository.saveEvent(item);
    await repository.updateEvent({
      ...item,
      photos: [P2, P3],
      updatedAt: 2000,
    });

    await repository.deleteItem('e', 3000);

    expect(await eventHistory(db, 'e')).toEqual([
      {
        counter: 1,
        title: 'Viaje',
        category: 'Familia',
        description: null,
        deleted_at: null,
        photos: ['p1.jpg', 'p2.png'],
      },
      {
        counter: 2,
        title: 'Viaje',
        category: 'Familia',
        description: null,
        deleted_at: 3000,
        photos: ['p2.png', 'p3.jpg'],
      },
    ]);
  });

  test('deletion removes the event and photo rows and keeps the history', async () => {
    const { db, repository } = await setup();
    await repository.saveEvent(eventItem('e', 1000));

    await repository.deleteItem('e', 2000);

    expect(await repository.listTimeline()).toEqual([]);
    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
    expect(await db.getAll('SELECT item_id FROM event_items')).toEqual([]);
    expect(await db.getAll('SELECT item_id FROM event_item_photos')).toEqual([]);
    expect((await eventHistory(db, 'e'))[0].photos).toEqual(['p1.jpg', 'p2.png']);
  });

  test('a failing photo insert leaves no items or event_items row', async () => {
    const { db } = await setup();
    let photoInserts = 0;
    const failing = new SqliteItemRepository(
      new FailingSqlDatabase(
        db,
        (sql) => sql.includes('INSERT INTO event_item_photos') && ++photoInserts === 2,
      ),
    );

    await expect(failing.saveEvent(eventItem('e', 1000))).rejects.toThrow(/Injected failure/);

    expect(await db.getAll('SELECT id FROM items')).toEqual([]);
    expect(await db.getAll('SELECT item_id FROM event_items')).toEqual([]);
    expect(await db.getAll('SELECT item_id FROM event_item_photos')).toEqual([]);
  });

  test('a failing update leaves the item, its photos and its history unchanged', async () => {
    const { db } = await setup();
    const item = eventItem('e', 1000);
    await new SqliteItemRepository(db).saveEvent(item);
    const failing = new SqliteItemRepository(
      new FailingSqlDatabase(db, (sql) => sql.includes('INSERT INTO event_item_photos ')),
    );

    await expect(
      failing.updateEvent({
        ...item,
        title: 'Otro',
        photos: [P3],
        updatedAt: 2000,
      }),
    ).rejects.toThrow(/Injected failure/);

    expect(await new SqliteItemRepository(db).findEvent('e')).toEqual(item);
    expect(await eventHistory(db, 'e')).toEqual([]);
  });

  test('an event row with no photos is hidden from the feed', async () => {
    const { db, repository } = await setup();
    await repository.saveText(textItem('t', 'Uno', 1000));
    await db.run(
      'INSERT INTO items (id, type, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?)',
      ['e', 'event', 2000, 2000, null],
    );
    await db.run(
      'INSERT INTO event_items (item_id, title, category, description) VALUES (?, ?, ?, ?)',
      ['e', 'Viaje', 'Familia', null],
    );

    expect((await repository.listTimeline()).map((item) => item.id)).toEqual(['t']);
    expect(await repository.findEvent('e')).toBeNull();
  });

  test('an unknown id throws ItemNotFoundError', async () => {
    const { db, repository } = await setup();
    await expect(repository.updateEvent(eventItem('zzz', 1000))).rejects.toBeInstanceOf(
      ItemNotFoundError,
    );
    expect(await db.getAll('SELECT item_id FROM items_history')).toEqual([]);
  });
});
